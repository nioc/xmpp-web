import { XmppClient as XMPP, NS } from './XmppClient'
import defaultAvatar from '../assets/defaultAvatar'

const transports = window.config.transports
const resource = window.config.resource
const defaultDomain = window.config.defaultDomain
const defaultMuc = window.config.defaultMuc
const connectTimeout = window.config.connectTimeout

function logError (error, defaultLevel) {
  const args = Array.prototype.slice.call(arguments, 2)
  if (['XMPPError', 'StanzaError'].includes(error.name)) {
    console.warn(error.name, ...args.filter(arg => !(arg instanceof Error)))
    return
  }
  if (defaultLevel === 'error') {
    console.error(...args)
  } else {
    console.warn(...args)
  }
}

export default {

  jid: null,
  fullJid: null,
  context: null,
  client: null,
  nick: null,
  isAnonymous: true,
  defaultDomain,
  defaultMuc,

  // create XMPP client with credentials and context
  async create (jid, password, domain, transportsUser, context) {
    // handle anonymous authentication
    if (jid) {
      this.isAnonymous = false
    } else {
      jid = 'anon'
    }

    // set domain from user jid or by default
    const jidParts = jid.split('@')
    if (jidParts.length > 1) {
      jid = jidParts[0]
      domain = jidParts[1]
    }
    if (!domain) {
      domain = defaultDomain
    }

    this.jid = jid
    this.context = context

    // use transports if user provided them
    if (transportsUser.websocket) {
      transports.websocket = transportsUser.websocket
    }

    // create XMPP client
    this.client = new XMPP({
      service: transports.websocket,
      domain,
      resource: resource || 'Web XMPP',
      jid,
      password,
    })

  },

  // connect client to XMPP server
  connect () {
    const timeoutDuration = connectTimeout || 5000
    let timeoutId = null
    const timeoutPromise = new Promise((resolve, reject) => {
      timeoutId = setTimeout(() => {
        clearTimeout(timeoutId)
        reject(new Error('Server unreachable'))
      }, timeoutDuration)
    })

    const connectPromise = new Promise((resolve, reject) => {

      // listen for XMPP error
      this.client.on('error', (error) => {
        console.error('XMPP error', error.message)
      })

      // listen for authentication success
      this.client.on('authenticated', (jid) => {
        if (!this.isAnonymous) {
          localStorage.setItem('barejid', jid.bare)
          localStorage.setItem('jid', this.jid)
          localStorage.setItem('auth', true)
        }
        // resolve when listen is resolved
        clearTimeout(timeoutId)
        this.fullJid = jid
        this.context.$store.setOnline(true)
        this.listen()
        resolve()
      })

      this.client.connect()
        .catch((error) => {
          // listen for authentication failure
          if (error.name === 'SASLError') {
            clearTimeout(timeoutId)
            return reject(new Error('Check your credentials'))
          }
          reject(new Error('Error during login'))
        })
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
      xmppSocket.context.$store.storeMessage({
        type,
        message,
      })
    }



    this.client.on('online', () => {
      console.info('XMPP online')
      this.context.$store.setOnline(true)
    })
    this.client.on('status', (status) => {
      if (status === 'close' || status === 'disconnect') {
        if (this.context.$store.isOnline) {
          console.warn('XMPP connection is closed')
          this.context.$store.setOnline(false)
        }
      }
    })

    // get contacts (rfc6121)
    this.client.getRoster()
      .then((rosterResult) => {
        this.context.$store.setRoster(rosterResult)

        // send presence to contacts (rfc6121)
        this.client.sendPresence()
      })
      .catch((rosterError) => logError(rosterError, 'error', 'getRoster', rosterError.message, rosterError))

    this.client.getDiscoInfo()
      .catch((discoInfoError) => logError(discoInfoError, 'error', 'getDiscoInfo', discoInfoError.message, discoInfoError))

    // enable carbons (XEP-0280: Message Carbons)
    this.client.enableCarbons()
      .catch((error) => logError(error, 'error', 'carbon', error.message, error))

    // get bookmarked rooms (XEP-0048: Bookmarks)
    this.client.getBookmarks()
      .then((mucBookmarks) => {
        mucBookmarks.forEach((bookmark) => {
          const room = this.setRoomAttributes(bookmark.jid, null, bookmark.password)
          room.isBookmarked = true
          room.name = bookmark.name
          room.autojoin = bookmark.autojoin
          // @TODO handle nick
          this.context.$store.setKnownRoom(room)
          if (bookmark.autojoin) {
            // handle autojoin
            this.joinRoom(bookmark.jid, null, { muc: { password: bookmark.password } })
          }
        })
        // get rooms attributes
        mucBookmarks.forEach((muc) => {
          this.client.getDiscoInfo(muc.jid)
            .then((mucDiscoInfoResult) => {
              const room = this.setRoomAttributes(muc.jid, mucDiscoInfoResult, muc.password)
              room.isBookmarked = true
              this.context.$store.setKnownRoom(room)
            })
            .catch((error) => logError(error, 'error', 'getBookmarks/getDiscoInfo', error.message, error))
        })
      })
      .catch((error) => logError(error, 'error', 'getBookmarks', error.message, error))

    // get HTTP file upload capacity (XEP-0363)
    this.client.getUploadService()
      .then((UploadServiceResult) => {
        if (UploadServiceResult.maxSize) {
          this.context.$store.setHttpFileUploadMaxSize(UploadServiceResult.maxSize)
        }
      })
      .catch((error) => {
        console.warn(error.message)
      })

    // listen for contact/room messages
    this.client.on('chat', (receivedMessage) => {
      storeMessage(this, receivedMessage.type, receivedMessage)
    })

    // listen for message sent by user (direct or carbon)
    this.client.on('messageSent', (message) => {
      if (!message.body && !message.url) {
        // no body in message (probably a chat state)
        return
      }
      storeMessage(this, message.type, message)
    })

    // listen for contact chat state (writing, pause, ...)
    this.client.on('chatState', chatState => {
      this.context.$store.setChatState(chatState)
    })

    // listen for room creation
    this.client.on('mucCreated', async (presence) => {
      let room = {
        jid: presence.from.bare,
      }
      this.context.$store.setKnownRoom(room)
      // get room information
      try {
        const mucDiscoInfoResult = await this.client.getDiscoInfo(room.jid)
        room = this.setRoomAttributes(room.jid, mucDiscoInfoResult, null)
        this.context.$store.setKnownRoom(room)
      } catch (error) {
        logError(error, 'error', 'presence/getDiscoInfo', error.message, error)
      }
    })

    // listen for presence
    this.client.on('presence', async (presence) => {
      const fullJid = presence.from
      if (fullJid.bare === this.fullJid.bare) {
        // user presence
        if (fullJid.full === this.fullJid.full) {
          // user presence on current resource, emit event
          this.context.$store.setPresence(presence.show)
        }
        return
      }
      // check if it is a MUC presence
      if (presence.isMuc) {
        if (fullJid.resource === '') {
          // room presence
          return
        }
        if (presence.isSelf) {
          if (presence.type === 'unavailable') {
            this.context.$store.removeJoinedRoom(fullJid.bare)
          } else {
            this.context.$store.setJoinedRoom(fullJid.bare)
          }
        }
        if (presence.type === 'unavailable') {
          // occupant left room
          this.context.$store.removeRoomOccupant({
            roomJid: fullJid.bare,
            jid: fullJid.full,
          })
          return
        }
        this.context.$store.setRoomOccupant({
          roomJid: fullJid.bare,
          jid: fullJid.full,
          presence: presence.show,
        })
        return
      }
      // contact presence commit to store
      this.context.$store.setContactPresence({ jid: fullJid.bare, presence: presence.show, status: presence.status })
    })

    // listen for retracted messages
    this.client.on('messageRetracted', (retracted) => {
      const index = this.context.$store.messages.findIndex((message) => message.from.bare === retracted.from && message.stanzaId === retracted.stanzaId)
      if (index === -1) {
        // original message is not found (unknown or retracted sent by a third party)
        return
      }
      this.context.$store.updateMessage({
        stanzaId: retracted.stanzaId,
        // replace body and links
        body: `Moderated by ${retracted.by.resource}` + (retracted.reason ? ` (${retracted.reason})` : ''),
        links: [],
        status: {
          code: 'moderated',
          message: retracted.reason,
        },
      })
    })

    // listen for room subject change
    this.client.on('subjectChange', (subjectChange) => {
      if (subjectChange.from && subjectChange.from.bare && subjectChange.subject) {
        this.context.$store.setRoomSubject (subjectChange.from.bare, subjectChange.from.resource, subjectChange.subject)
      }
    })

    // listen for sent message errors
    this.client.on('messageSentError', (error) => {
      switch (error.type) {
        case 'cancel':
          this.context.$store.setMessageStatus(error.messageId, 'error', error.message)
          break
      }
    })
  },

  async disconnect () {
    if (this.context && this.client) {
      try {
        await this.client.disconnect()
      } catch (error) {
        logError(error, 'error', 'disconnect error', error.message, error)
      }
    }
  },

  async sendUrl (to, url, isMuc) {
    await this.client.sendMessage(to, isMuc ? 'groupchat' : 'chat', url, url)
  },

  async sendMessage (to, body, isMuc) {
    await this.client.sendMessage(to, isMuc ? 'groupchat' : 'chat', body)
  },

  async sendChatState (to, isMuc, chatState) {
    await this.client.sendChatState(to, isMuc ? 'groupchat' : 'chat', chatState)
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
        return { uri, isDefault: false }
      }
      if (!this.client) {
        return { uri: defaultAvatar, isDefault: true }
      }
      const vCard = await this.client.getVCard(jid)
      if (!vCard.records) {
        return { uri: defaultAvatar, isDefault: true }
      }
      const avatar = vCard.records.find((record) => record.type === 'photo')
      if (avatar && avatar.data) {
        const uri = 'data:' + avatar.mediaType + ';base64,' + avatar.data
        localStorage.setItem('avatar-' + jid, uri)
        return { uri, isDefault: false }
      }
    } catch (error) {
      logError(error, 'warn', 'getJidAvatar error', jid, error.message)
    }
    return { uri: defaultAvatar, isDefault: true }
  },

  async sendPresence (presence) {
    try {
      // send global presence
      await this.client.sendPresence(presence.show)
      // send presence to joined rooms
      this.context.$store.joinedRooms.forEach((roomJid) => {
        this.client.sendPresence(presence.show, undefined, roomJid)
      })
    } catch (error) {
      logError(error, 'error', 'sendPresence error', error.message, error)
    }
  },

  async searchHistory (jid, last = true) {
    try {
      const history = await this.client.searchHistory(jid, last, 10)
      return history.paging
    } catch (error) {
      logError(error, 'error', 'searchHistory error', error.message, error)
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
        this.context.$store.setKnownRoom(room)
      }
      return {
        isSuccess: true,
      }
    } catch (error) {
      logError(error, 'error', 'joinRoom', error.message, error)
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
      const serverDiscoItemsResult = await this.client.getDiscoItems(this.fullJid.domain)
      if (serverDiscoItemsResult.items.length === 0) {
        console.info('There is no MUC service')
        return []
      }

      // discoInfo on every service for finding MUC services
      for (const serverDiscoItem of serverDiscoItemsResult.items) {
        try {
          const serviceDiscoInfoResult = await this.client.getDiscoInfo(serverDiscoItem.jid)

          if (serviceDiscoInfoResult.features.includes(NS.MUC)) {
            // discoItems on every MUC service for listing rooms
            try {
              const MucDiscoItemsResult = await this.client.getDiscoItems(serverDiscoItem.jid)

              // discoInfo on every room for getting attributes
              for (const MucDiscoItem of MucDiscoItemsResult.items) {
                const room = await this.getRoom(MucDiscoItem.jid)
                if (room.jid && room.jid !== serverDiscoItem.jid) {
                  this.context.$store.setKnownRoom(room)
                  rooms.push(room)
                }
              }
            } catch (error) {
              console.warn(`getDiscoItems on MUC service ${serverDiscoItem.jid} error:`, error.message)
            }
          }
        } catch (error) {
          logError(error, 'warn', `getDiscoInfo on service ${serverDiscoItem.jid} error: `, error.message)
        }
      }
    } catch (error) {
      logError(error, 'error', 'getDiscoItems on server error', error.message, error)
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
      const mucDiscoInfoResult = await this.client.getDiscoInfo(jid)
      if (mucDiscoInfoResult.features.includes(NS.MUC)) {
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
    if (Object.prototype.hasOwnProperty.call(error, 'message')) {
      switch (error.message) {
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

  // HTTP upload (XEP-0363)
  async getUploadSlot (uploadService, uploadRequest) {
    try {
      return this.client.getUploadSlot(uploadService, uploadRequest)
    } catch (error) {
      logError(error, 'error', 'getUploadSlot error', error.message, error)
      throw error
    }
  },

  async bookmarkRoom (isAdd, jid, autojoin = true, nick = null) {
    try {
      const room = this.context.$store.getRoom(jid)
      if (isAdd) {
        // add bookmark
        const bookmark = {
          jid,
          name: room.name,
          autojoin,
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
        this.context.$store.setKnownRoom({
          jid,
          isBookmarked: true,
        })
        return true
      }
      // remove bookmark
      await this.client.removeBookmark(jid)
      this.context.$store.setKnownRoom({
        jid,
        isBookmarked: false,
      })
      return true
    } catch (error) {
      return false
    }
  },

  async createRoom (roomJid) {
    return this.client.joinRoom(roomJid, this.fullJid.local, {})
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
