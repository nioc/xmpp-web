/* eslint-disable no-console */
import * as XMPP from 'stanza'
import defaultAvatar from '@/assets/defaultAvatar'
import axios from 'axios'
const transports = window.config.transports
const resource = window.config.resource
const defaultDomain = window.config.defaultDomain
const hasHttpAutoDiscovery = window.config.hasHttpAutoDiscovery

export default {

  jid: null,
  fullJid: null,
  context: null,
  client: null,
  nick: null,
  isAnonymous: true,
  defaultDomain,

  // create XMPP client with credentials and context
  async create (jid, password, server, transportsUser, context) {
    // handle anonymous authentication
    if (jid) {
      this.isAnonymous = false
    } else {
      jid = 'anon'
    }
    // set default domain if missing
    if (!/\S+@\S+\S+/.test(jid)) {
      jid += '@' + defaultDomain
    }

    this.jid = jid
    this.context = context

    // use transports if user provided them
    if (transportsUser.bosh) {
      transports.bosh = transportsUser.bosh
    }
    if (transportsUser.websocket) {
      transports.websocket = transportsUser.websocket
    }

    // if active, try to get well-known/host-meta from domain
    const userDomain = this.jid.split('@')[1]
    if (hasHttpAutoDiscovery && userDomain !== defaultDomain) {
      try {
        const response = await axios.get('https://' + userDomain + '/.well-known/host-meta.json', { maxRedirects: 1 })
        response.data.links.forEach(link => {
          if (link.rel === 'urn:xmpp:alt-connections:xbosh' && link.href) {
            transports.bosh = link.href
          }
          if (link.rel === 'urn:xmpp:alt-connections:websocket' && link.href) {
            transports.websocket = link.href
          }
        })
      } catch (error) {
        console.warn('Auto-discovery failed:', error.message)
      }
    }

    // create Stanza client
    this.client = XMPP.createClient({
      jid,
      password,
      server,
      resource: resource || 'Web XMPP',
      transports: transports || { websocket: true, bosh: true },
    })

    // debug stanza on dev mode
    if (process.env.NODE_ENV !== 'production') {
      this.client.on('*', (name, data) => {
        switch (name) {
          case 'raw:incoming':
          // case 'raw:outgoing':
            return
        }
        console.debug(name, data)
      })
    }
  },

  // connect client to XMPP server
  connect () {
    const timeoutDuration = 5000
    let timeoutId = null
    const timeoutPromise = new Promise((resolve, reject) => {
      timeoutId = setTimeout(() => {
        clearTimeout(timeoutId)
        reject(new Error('Server unreachable'))
      }, timeoutDuration)
    })

    const connectPromise = new Promise((resolve, reject) => {
      // listen for websocket failure
      const _xmppSocket = this
      function retryWithoutWebsocket (error) {
        if (!error || error.type !== 'close') {
          return
        }
        console.error('socket not work, try bosh', transports)
        _xmppSocket.client.off('disconnected', retryWithoutWebsocket)
        transports.websocket = false
        _xmppSocket.connect()
          .then(() => {
            clearTimeout(timeoutId)
            resolve()
          })
          .catch((error) => {
            clearTimeout(timeoutId)
            reject(error)
          })
      }
      if (transports.websocket) {
        _xmppSocket.client.on('disconnected', retryWithoutWebsocket)
      }

      // listen for authentication failure
      this.client.on('auth:failed', () => {
        clearTimeout(timeoutId)
        reject(new Error('Check your credentials'))
      })

      // listen for authentication success
      this.client.on('auth:success', () => {
        // remove websocket failure listener
        this.client.off('disconnected', retryWithoutWebsocket)
        if (!this.isAnonymous) {
          localStorage.setItem('jid', this.jid)
          localStorage.setItem('auth', true)
        }
        // resolve when listen is resolved
        this.listen()
          .then(() => {
            clearTimeout(timeoutId)
            resolve()
          })
      })

      try {
        this.client.connect()
      } catch (error) {
        reject(new Error('Error during login'))
      }
    })

    return Promise.race([
      connectPromise,
      timeoutPromise,
    ])
  },

  // logic post connection (listeners)
  listen () {
    function storeMessage (xmppSocket, type, message) {
      // clean body message if it contains only a link
      if (message.links) {
        if (message.links.some((link) => link.url === message.body)) {
          message.body = ''
        }
      }
      xmppSocket.context.$store.commit('storeMessage', {
        type,
        message: {
          id: message.id,
          from: message.from ? XMPP.JID.parse(message.from) : xmppSocket.fullJid,
          to: XMPP.JID.parse(message.to),
          body: message.body,
          delay: (message.delay && message.delay.timestamp) ? message.delay.timestamp : new Date().toISOString(),
          links: message.links || null,
        },
      })
    }

    return new Promise((resolve) => {
      // handle reconnection
      this.client.on('stream:management:resumed', () => {
        this.context.$store.commit('setOnline', true)
      })

      // handle session start
      this.client.on('session:started', () => {
        // store full Jid from server
        this.fullJid = XMPP.JID.parse(this.client.jid)
        this.context.$store.commit('setOnline', true)
        resolve()

        this.client.on('disconnected', () => {
          this.context.$store.commit('setOnline', false)
        })

        // get contacts (rfc6121)
        this.client.getRoster()
          .then((rosterResult) => {
            this.context.$store.commit('setRoster', rosterResult.items)

            // send presence to contacts (rfc6121)
            this.client.sendPresence()
          })
          .catch((rosterError) => console.error('getRoster', rosterError))

        // enable carbons (XEP-0280: Message Carbons)
        this.client.enableCarbons()
          .catch((error) => console.error('carbon', error))

        // get bookmarked rooms (XEP-0048: Bookmarks)
        this.client.getBookmarks()
          .then((mucBookmarks) => {
            mucBookmarks.forEach((bookmark) => {
              const room = this.setRoomAttributes(bookmark.jid, null, bookmark.password)
              room.isBookmarked = true
              room.name = bookmark.name
              room.autoJoin = bookmark.autoJoin
              this.context.$store.commit('setKnownRoom', room)
              if (bookmark.autoJoin) {
                // handle autojoin
                this.joinRoom(bookmark.jid, null, { muc: { password: bookmark.password } })
              }
            })
            // get rooms attributes
            mucBookmarks.forEach((muc) => {
              this.client.getDiscoInfo(muc.jid, '')
                .then((mucDiscoInfoResult) => {
                  const room = this.setRoomAttributes(muc.jid, mucDiscoInfoResult, muc.password)
                  room.isBookmarked = true
                  this.context.$store.commit('setKnownRoom', room)
                })
                .catch((error) => console.error('getBookmarks/getDiscoInfo', error))
            })
          })
          .catch((error) => console.error('getBookmarks', error))

        // get HTTP file upload capacity (XEP-0363)
        this.client.getUploadService()
          .then((UploadServiceResult) => {
            if (UploadServiceResult.maxSize) {
              this.context.$store.commit('setHttpFileUploadMaxSize', UploadServiceResult.maxSize)
            }
          })
          .catch((error) => {
            console.warn(error.message)
          })
      })

      // listen for contact messages
      this.client.on('chat', (receivedMessage) => {
        storeMessage(this, 'chat', receivedMessage)
      })

      // listen for room messages
      this.client.on('groupchat', (receivedMessage) => {
        storeMessage(this, 'groupchat', receivedMessage)
      })

      // listen for room presences
      this.client.on('presence', (presence) => {
        const jid = XMPP.JID.parse(presence.from)
        const room = this.context.$store.getters.getRoom(jid.bare)
        if (room.jid) {
          if (jid.resource === '') {
            // room presence
            return
          }
          if (presence.type === 'unavailable') {
            // occupant left room
            this.context.$store.commit('removeRoomOccupant', {
              roomJid: room.jid,
              jid: jid.full,
            })
            return
          }
          this.context.$store.commit('setRoomOccupant', {
            roomJid: room.jid,
            jid: jid.full,
            presence: presence.show,
          })
        }
      })

      // listen for room joined
      this.client.on('muc:join', (receivedMUCPresence) => {
        // @TODO add participants and role handling
        const occupantJid = XMPP.JID.parse(receivedMUCPresence.from)
        // @TODO better handle nick
        if (occupantJid.resource === this.fullJid.local) {
          this.context.$store.commit('setJoinedRoom', occupantJid.bare)
        }
      })

      // listen for message sent by user (direct or carbon)
      this.client.on('message:sent', (message) => {
        if (!message.body) {
          // no body in message (probably a chat state)
          return
        }
        storeMessage(this, null, message)
      })

      // listen for contact chat state (writing, pause, ...)
      this.client.on('chat:state', message => {
        this.context.$bus.$emit('chatState', {
          jid: XMPP.JID.parse(message.from).bare,
          chatState: message.chatState,
        })
      })

      // listen for presence
      this.client.on('available', available => {
        const fullJid = XMPP.JID.parse(available.from)
        if (!available.show) {
          // set default value to 'chat'
          available.show = 'chat'
        }
        if (fullJid.bare === this.jid) {
          // user presence
          if (fullJid.full === this.fullJid.full) {
            // user presence on current resource, emit event
            this.context.$bus.$emit('myPresence', available.show)
          }
          return
        }
        // contact presence commit to store
        this.context.$store.commit('setContactPresence', { jid: fullJid.bare, presence: available.show })
      })
    })
  },

  async disconnect () {
    if (this.context && this.client) {
      try {
        await this.client.disconnect()
      } catch (error) {
        console.error('disconnect error', error)
      }
    }
  },

  async sendUrl (to, url, isMuc) {
    await this.client.sendMessage({
      from: this.fullJid.full,
      to,
      body: url,
      type: isMuc ? 'groupchat' : 'chat',
      links: [{ url }],
    })
  },

  async sendMessage (to, body, isMuc) {
    await this.client.sendMessage({
      from: this.fullJid.full,
      to,
      body,
      type: isMuc ? 'groupchat' : 'chat',
    })
  },

  setRoomAttributes (jid, mucDiscoInfoResult, password = null) {
    const room = {
      jid: jid,
      name: jid,
      description: null,
      lang: null,
      occupantsCount: null,
      password,
      isPublic: null,
      isPersistent: null,
      isPasswordProtected: null,
      isMembersOnly: null,
      isAnonymous: null,
      isModerated: null,
      isBookmarked: null,
      hasVCard: null,
      unreadCount: null,
    }
    if (mucDiscoInfoResult) {
      // get room name from identities
      if (
        Object.prototype.hasOwnProperty.call(mucDiscoInfoResult, 'identities') &&
        mucDiscoInfoResult.identities.length > 0 &&
        Object.prototype.hasOwnProperty.call(mucDiscoInfoResult.identities[0], 'name')
      ) {
        room.name = mucDiscoInfoResult.identities[0].name
      }
      // get room extensions
      if (
        mucDiscoInfoResult.extensions.length > 0 &&
        Object.prototype.hasOwnProperty.call(mucDiscoInfoResult.extensions[0], 'fields')
      ) {
        const fields = mucDiscoInfoResult.extensions[0].fields
        // description
        const description = fields.find((field) => field.name === 'muc#roominfo_description')
        if (description) {
          room.description = description.value
        }
        // lang
        const lang = fields.find((field) => field.name === 'muc#roominfo_lang')
        if (lang) {
          room.lang = lang.value
        }
        // occupants
        const occupantsCount = fields.find((field) => field.name === 'muc#roominfo_occupants')
        if (occupantsCount) {
          room.occupantsCount = parseInt(occupantsCount.value)
          room.occupantsCount = isNaN(room.occupantsCount) ? occupantsCount.value : room.occupantsCount
        }
      }
      // public or hidden
      if (mucDiscoInfoResult.features.includes('muc_public')) {
        room.isPublic = true
      }
      if (mucDiscoInfoResult.features.includes('muc_hidden')) {
        room.isPublic = false
      }
      // persistent or temporary (destroyed if the last occupant exits)
      if (mucDiscoInfoResult.features.includes('muc_persistent')) {
        room.isPersistent = true
      }
      if (mucDiscoInfoResult.features.includes('muc_temporary')) {
        room.isPersistent = false
      }
      // password protected or not
      if (mucDiscoInfoResult.features.includes('muc_passwordprotected')) {
        room.isPasswordProtected = true
      }
      if (mucDiscoInfoResult.features.includes('muc_unsecured')) {
        room.isPasswordProtected = false
      }
      // members only or open
      if (mucDiscoInfoResult.features.includes('muc_membersonly')) {
        room.isMembersOnly = true
      }
      if (mucDiscoInfoResult.features.includes('muc_open')) {
        room.isMembersOnly = false
      }
      // semi-anonymous (display nick) or non-anonymous (display jid)
      if (mucDiscoInfoResult.features.includes('muc_semianonymous')) {
        room.isAnonymous = true
      }
      if (mucDiscoInfoResult.features.includes('muc_nonanonymous')) {
        room.isAnonymous = false
      }
      // moderated or not
      if (mucDiscoInfoResult.features.includes('muc_moderated')) {
        room.isModerated = true
      }
      if (mucDiscoInfoResult.features.includes('muc_unmoderated')) {
        room.isModerated = false
      }
      // has vCard
      if (mucDiscoInfoResult.features.includes('vcard-temp')) {
        room.hasVCard = true
      }
    }
    return room
  },

  async getJidAvatar (jid) {
    try {
      const uri = localStorage.getItem('avatar-' + jid)
      if (uri) {
        return uri
      }
      if (!this.client) {
        return defaultAvatar
      }
      const vCard = await this.client.getVCard(jid)
      if (!vCard.records) {
        return defaultAvatar
      }
      const avatar = vCard.records.find((record) => record.type === 'photo')
      if (avatar && avatar.mediaType && avatar.data) {
        const uri = 'data:' + avatar.mediaType + ';base64,' + avatar.data
        localStorage.setItem('avatar-' + jid, uri)
        return uri
      }
    } catch (error) {
    }
    return defaultAvatar
  },

  async sendPresence (presence) {
    try {
      // send global presence
      await this.client.sendPresence(presence)
      // send presence to joined rooms
      this.context.$store.state.joinedRooms.forEach((roomJid) => {
        this.client.sendPresence({ to: roomJid, show: presence.show })
      })
    } catch (error) {
      console.error('sendPresence error', error)
    }
  },

  async searchHistory (jid, last = true) {
    const options = {
      with: jid,
      paging: {
        before: last,
        max: 50,
      },
    }
    try {
      const history = await this.client.searchHistory(options)
      // get messages
      const messages = []
      history.results.forEach((item) => {
        if (!item.item.message || (!item.item.message.body && !item.item.message.links)) {
          // message de not have text (stanza maybe)
          return
        }
        if (this.context.$store.state.messages.some((message) => message.id === item.item.message.id)) {
          // message already known
          return
        }
        const message = {
          id: item.item.message.id,
          delay: item.item.delay.timestamp,
          from: XMPP.JID.parse(item.item.message.from),
          to: XMPP.JID.parse(item.item.message.to),
          body: item.item.message.body || null,
          links: item.item.message.links || null,
        }
        // clean body message if it contains only a link
        if (message.links) {
          if (message.links.some((link) => link.url === message.body)) {
            message.body = ''
          }
        }
        messages.push(message)
      })
      this.context.$store.commit('storePreviousMessages', messages)
      return history.paging
    } catch (error) {
      console.error('searchHistory error', error)
    }
  },

  async joinRoom (jid, nick = null, opts = {}, _room = {}) {
    if (!this.fullJid) {
      return {
        isSuccess: false,
        message: 'User Jid is missing',
      }
    }
    if (nick === null) {
      if (this.nick !== null) {
        nick = this.nick
      } else {
        nick = this.fullJid.local
      }
    }
    try {
      await this.client.joinRoom(jid, nick, opts)
      if (_room.jid) {
        const room = Object.assign({}, _room)
        if (opts && opts.muc && opts.muc.password) {
          room.password = opts.muc.password
        }
        this.context.$store.commit('setKnownRoom', room)
      }
      return {
        isSuccess: true,
      }
    } catch (error) {
      console.error('joinRoom', error)
      return {
        isSuccess: false,
        message: this.getRoomError(error),
      }
    }
  },

  async getPublicMuc () {
    if (!this.context) {
      return []
    }
    const rooms = []

    // discoItems on server
    try {
      const serverDiscoItemsResult = await this.client.getDiscoItems(this.fullJid.domain, '')
      if (serverDiscoItemsResult.items.length === 0) {
        console.info('There is no MUC service')
        return []
      }

      // discoInfo on every service for finding MUC services
      for (const serverDiscoItem of serverDiscoItemsResult.items) {
        try {
          const serviceDiscoInfoResult = await this.client.getDiscoInfo(serverDiscoItem.jid, '')

          if (serviceDiscoInfoResult.features.includes(XMPP.Namespaces.NS_MUC)) {
            // discoItems on every MUC service for listing rooms
            try {
              const MucDiscoItemsResult = await this.client.getDiscoItems(serverDiscoItem.jid, '')

              // discoInfo on every room for getting attributes
              for (const MucDiscoItem of MucDiscoItemsResult.items) {
                const room = await this.getRoom(MucDiscoItem.jid)
                if (room.jid && room.jid !== serverDiscoItem.jid) {
                  this.context.$store.commit('setKnownRoom', room)
                  rooms.push(room)
                }
              }
            } catch (error) {
              console.warn('getDiscoItems on a MUC service error', error)
            }
          }
        } catch (error) {
          console.warn('getDiscoInfo on a service error', error)
        }
      }
    } catch (error) {
      console.error('getDiscoItems on server error', error)
    }
    return rooms
  },

  async getRoom (jid) {
    if (!this.context) {
      return {
        message: 'Missing context',
      }
    }
    try {
      const mucDiscoInfoResult = await this.client.getDiscoInfo(jid, '')
      if (mucDiscoInfoResult.features.includes(XMPP.Namespaces.NS_MUC)) {
        const room = this.setRoomAttributes(jid, mucDiscoInfoResult)
        return room
      }
    } catch (error) {
      return {
        message: this.getRoomError(error),
      }
    }
    return {
      message: 'Not a valid room',
    }
  },

  getRoomError (error) {
    if (Object.prototype.hasOwnProperty.call(error, 'error') && Object.prototype.hasOwnProperty.call(error.error, 'condition')) {
      switch (error.error.condition) {
        case 'not-authorized':
          return 'Valid password is required to join this room'
        case 'forbidden':
          return 'You have been banned from this room'
        case 'item-not-found':
          return 'This room does not exist'
        case 'not-allowed':
          return 'Room creation is restricted'
        case 'not-acceptable':
          return 'Reserved roomnick must be used'
        case 'registration-required':
          return 'You must be on the member list to join this room'
        case 'conflict':
          return 'Your nickname is already used in this room'
        case 'service-unavailable':
          return 'Maximum number of users has been reached in this room'
      }
    }
    return 'Unable to join room'
  },

  async getDiscoItems (jid, node) {
    return await this.client.getDiscoItems(jid, node)
  },

  async getDiscoInfo (jid, node) {
    return await this.client.getDiscoInfo(jid, node)
  },

  // async getUniqueRoomName (host) {
  //   return await this.client.discoverBindings(host)
  // },

  // async getServices (jid, string) {
  //   return this.client.getServices(jid, string)
  // },

  // HTTP upload (XEP-0363)
  async getUploadSlot (uploadService, uploadRequest) {
    try {
      return this.client.getUploadSlot(uploadService, uploadRequest)
    } catch (error) {
      console.error('getUploadSlot error', error)
      throw error
    }
  },

  async bookmarkRoom (isAdd, jid, autoJoin = true, nick = null) {
    try {
      const room = this.context.$store.getters.getRoom(jid)
      if (isAdd) {
        // add bookmark
        const bookmark = {
          jid,
          name: room.name,
          autoJoin,
        }
        if (room.password) {
          bookmark.password = room.password
        }
        if (nick) {
          bookmark.nick = nick
        } else if (this.nick) {
          bookmark.nick = this.nick
        }
        await this.client.addBookmark(bookmark)
        this.context.$store.commit('setKnownRoom', {
          jid,
          isBookmarked: true,
        })
        return true
      }
      // remove bookmark
      await this.client.removeBookmark(jid)
      this.context.$store.commit('setKnownRoom', {
        jid,
        isBookmarked: false,
      })
      return true
    } catch (error) {
      return false
    }
  },

  async createRoom (roomJid) {
    let timeoutId = null
    const timeoutPromise = new Promise((resolve, reject) => {
      timeoutId = setTimeout(() => {
        clearTimeout(timeoutId)
        reject(new Error('Server unreachable'))
      }, 5000)
    })

    const createRoomPromise = new Promise((resolve, reject) => {
      const _xmppSocket = this
      function roomCreationAck (presence) {
        const jid = XMPP.JID.parse(presence.from)
        if (jid.bare === roomJid) {
          if (presence.error) {
            // handle error
            this.off('presence', roomCreationAck)
            clearTimeout(timeoutId)
            return reject(new Error(_xmppSocket.getRoomError(presence)))
          }
          if (presence.muc && presence.muc.statusCodes) {
            clearTimeout(timeoutId)
            this.off('presence', roomCreationAck)
            if (presence.muc.statusCodes.includes('201')) {
              return resolve(true)
            }
            return reject(new Error('This room already exists'))
          }
        }
      }
      // listen for acknowledging
      this.client.on('presence', roomCreationAck)
    })

    // ask room creation
    await this.client.sendPresence({
      to: `${roomJid}/${this.fullJid.local}`,
      muc: {
        namespace: XMPP.Namespaces.NS_MUC,
        type: 'join',
      },
    })

    return Promise.race([
      createRoomPromise,
      timeoutPromise,
    ])
  },

  async getRoomConfig (roomJid) {
    return this.client.getRoomConfig(roomJid)
  },

  async setRoomConfig (roomJid, form) {
    return this.client.configureRoom(roomJid, form)
  },

  // Set nickname
  setNick (nick) {
    this.nick = nick
  },

}
