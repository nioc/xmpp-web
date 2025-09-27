import { client, xml, jid as createJid } from '@xmpp/client'
import XMPPError from '@xmpp/error'
import { nanoid } from 'nanoid'

const hasDebug = true
const hasChatState = true

const NS = {
  // rfc6121
  ROSTER: 'jabber:iq:roster',
  // rfc3920
  STANZA_ERROR: 'urn:ietf:params:xml:ns:xmpp-stanzas',
  // XEP-0045
  MUC: 'http://jabber.org/protocol/muc',
  MUC_USER: 'http://jabber.org/protocol/muc#user',
  MUC_OWNER: 'http://jabber.org/protocol/muc#owner',
  // XEP-0030
  DISCO_INFO: 'http://jabber.org/protocol/disco#info',
  DISCO_ITEMS: 'http://jabber.org/protocol/disco#items',
  // XEP-0004
  FORM: 'jabber:x:data',
  // XEP-0363
  HTTP_UPLOAD: 'urn:xmpp:http:upload:0',
  // XEP-0313
  MAM: 'urn:xmpp:mam:2',
  // XEP-0059
  RSM: 'http://jabber.org/protocol/rsm',
  // XEP-0280
  CARBONS: 'urn:xmpp:carbons:2',
  // XEP-0085
  CHAT_STATE: 'http://jabber.org/protocol/chatstates',
  // XEP-0054
  VCARD: 'vcard-temp',
  // XEP-0049
  PRIVATE: 'jabber:iq:private',
  // XEP-0048
  BOOKMARKS: 'storage:bookmarks',
  // XEP-0066
  OUT_OF_BAND_DATA: 'jabber:x:oob',
  // XEP-0359
  UNIQUE_ID: 'urn:xmpp:sid:0',
  // XEP-0156
  DISCO_CONNECTION: 'urn:xmpp:alt-connections:websocket',
  // XEP-422
  MESSAGE_FASTENING: 'urn:xmpp:fasten:0',
  // XEP-425
  MESSAGE_MODERATION: 'urn:xmpp:message-moderate:0',
  MESSAGE_RETRACTED: 'urn:xmpp:message-retract:0',
}

let xmppClient = null
let discoInfoCache = []

class XmppClient {
  constructor(config) {
    if (xmppClient) {
      xmppClient.disconnect()
    }
    this.config = config
    // declare custom events listeners
    this.callbacks = {
      'chat': [],
      'groupchat': [],
      'messageSent': [],
      'messageSentError': [],
      'messageRetracted': [],
      'presence': [],
      'authenticated': [],
      'mucCreated': [],
      'chatState': [],
      'subjectChange': [],
    }
    this.jid = {}
    this.uploadService = null
    this.xmpp = client({
      service: config.service || 'ws://localhost:5280/xmpp-websocket',
      domain: config.domain || 'localhost',
      resource: (config.resource || 'Web XMPP') + ' ' + nanoid(5),
      username: config.jid,
      password: config.password,
    })
    xmppClient = this
    // default events listeners
    if (import.meta.env.DEV && hasDebug) {
      this.xmpp.on('stanza', stanza => console.debug('0-stanza', stanza))
      this.xmpp.on('error', error => console.debug('0-error', error))
      this.xmpp.on('status', status => console.debug('0-status', status))
    }
    this.xmpp.on('stanza', this.parseStanza)
  }

  parseJid (jid) {
    let _jid = jid
    if (typeof jid === 'string') {
      _jid = createJid(jid)
    }
    return {
      resource: _jid.getResource(),
      local: _jid.getLocal(),
      domain: _jid.getDomain(),
      bare: _jid.bare().toString(),
      full: _jid.toString(),
    }
  }

  parseStanza (stanza) {
    if (stanza.is('message')) {
      if (stanza.attrs.type === 'chat' || stanza.attrs.type === 'groupchat') {
        // parse stanza message
        if (stanza.attrs.from === xmppClient.jid.bare && stanza.attrs.to === xmppClient.jid.full) {
          // handling carbon sent/received (XEP-0280)
          let carbon = stanza.getChild('sent')
          if (!carbon) {
            carbon = stanza.getChild('received')
          }
          if (carbon) {
            const message = carbon.getChild('forwarded').getChild('message')
            if (import.meta.env.DEV && hasDebug) {
              console.debug('1a-carbon', message)
            }
            stanza = message
          }
        }
        xmppClient.parseMessage(stanza)
      } else {
        const result = stanza.getChild('result')
        if (result) {
          // parse forwarded stanza message
          const forwarded = result.getChild('forwarded')
          const message = forwarded.getChild('message')
          xmppClient.parseMessage(message)
        }
        if (stanza.attrs.type === 'error') {
          xmppClient.parseMessage(stanza)
        }
      }
    } else if (stanza.is('presence')) {
      const presence = {
        isMuc: false,
        isSelf: false,
        type: stanza.attrs.type,
      }
      presence.from = xmppClient.parseJid(stanza.attrs.from)
      if (stanza.attrs.type === 'unavailable') {
        presence.show = 'off'
        presence.show = undefined
      } else {
        presence.show = stanza.getChildText('show') || 'chat'
        presence.status = stanza.getChildText('status')
      }
      // add MUC information
      const mucPresence = stanza.getChild('x', NS.MUC_USER)
      if (mucPresence) {
        presence.isMuc = true
        mucPresence.getChildren('item').map(i => {
          if (i.attrs.role) {
            presence.mucRole = i.attrs.role
          }
          if (i.attrs.affiliation) {
            presence.mucAffiliation = i.attrs.affiliation
          }
          if (i.attrs.jid) {
            presence.mucJid = i.attrs.jid
          }
        })
        mucPresence.getChildren('status').map(status => {
          if (status.attrs.code === '110') {
            presence.isSelf = true
          }
        })
        mucPresence.getChildren('status').map(status => {
          if (status.attrs.code === '201') {
            xmppClient.callbacks.mucCreated.forEach((callback) => callback(presence))
          }
        })
      }
      if (import.meta.env.DEV && hasDebug) {
        console.debug('1-presence', presence, mucPresence)
      }
      xmppClient.callbacks.presence.forEach((callback) => callback(presence))
      // @TODO : handle muc joined
    }
  }

  parseMessage (stanza) {
    const message = {}
    const body = stanza.getChild('body')
    if (body) {
      if (import.meta.env.DEV && hasDebug) {
        console.debug('1-message', stanza)
      }
      message.body = body.getText()
      message.from = xmppClient.parseJid(stanza.attrs.from)
      message.to = xmppClient.parseJid(stanza.attrs.to || xmppClient.jid)
      message.id = stanza.attrs.id
      message.type = stanza.attrs.type
      const stanzaIdNode = stanza.getChild('stanza-id')
      if (stanzaIdNode) {
        message.stanzaId = stanzaIdNode.attrs.id
      }

      // handle links
      const extensions = stanza.getChildren('x')
      if (extensions.length > 0) {
        extensions.forEach(extension => {
          if (extension.attrs && extension.attrs.xmlns === NS.OUT_OF_BAND_DATA) {
            if (!message.links) {
              message.links = []
            }
            message.links.push({ url: extension.getChildText('url') })
          }
        })
      }

      // handle timestamp (forwarded/delay)
      const parent = stanza.parent
      if (parent && parent.name === 'forwarded') {
        const delay = parent.getChild('delay')
        message.delay = delay ? delay.attrs.stamp : null
      } else {
        const delay = stanza.getChild('delay')
        if (delay) {
          message.delay = delay ? delay.attrs.stamp : null
        }
      }
      if (!message.delay) {
        message.delay = new Date().toISOString()
      }

      xmppClient.callbacks.chat.forEach((callback) => callback(message))
    }

    // check message fasten (XEP-0422)
    const fasten = stanza.getChildrenByFilter(child => child.attrs && child.attrs.xmlns === NS.MESSAGE_FASTENING)
    if (fasten.length > 0) {
      // check MUC retracted message (XEP-0425)
      const moderation = fasten[0].getChildrenByFilter(child => child.attrs && child.attrs.xmlns === NS.MESSAGE_MODERATION)
      if (moderation.length > 0) {
        const retract = moderation[0].getChildrenByFilter(child => child.attrs && child.attrs.xmlns === NS.MESSAGE_RETRACTED)
        if (retract.length > 0) {
          const reasonNode = moderation[0].getChild('reason')
          const retracted = {
            stanzaId: fasten[0].attrs.id,
            from: stanza.attrs.from,
            reason: reasonNode ? reasonNode.getText() : null,
            by: this.parseJid(moderation[0].attrs.by),
          }
          xmppClient.callbacks.messageRetracted.forEach((callback) => callback(retracted))
        }
      }
    }

    // check subject change (part of XEP-0045)
    const subjectNode = stanza.getChild('subject')
    if (subjectNode) {
      const subject = {
        from: xmppClient.parseJid(stanza.attrs.from),
        subject: subjectNode.getText(),
      }
      xmppClient.callbacks.subjectChange.forEach((callback) => callback(subject))
    }

    // check message error
    const errorNode = stanza.getChild('error')
    if (errorNode) {
      const error = {
        messageId: stanza.attrs.id,
        type: errorNode.attrs.type,
        message: errorNode.getChildrenByFilter(child => child.attrs && child.attrs.xmlns === NS.STANZA_ERROR)
          .map(child => child.name)
          .join(', '),
      }
      xmppClient.callbacks.messageSentError.forEach((callback) => callback(error))
    }

    // check chat state
    const chatStateNodes = stanza.getChildrenByFilter(child => child.attrs && child.attrs.xmlns === NS.CHAT_STATE)
    if (chatStateNodes.length > 0) {
      const chatState = {
        jid: xmppClient.parseJid(stanza.attrs.from),
        type: stanza.attrs.type,
        chatState: chatStateNodes[0].getName(),
      }
      xmppClient.callbacks.chatState.forEach((callback) => callback(chatState))
    }

    if (import.meta.env.DEV && hasDebug) {
      console.debug('3-message parsed', message)
    }
  }

  async connect() {
    if (this.xmpp.status === 'offline') {
      this.jid = this.parseJid(await this.xmpp.start())
      xmppClient.callbacks.authenticated.forEach((callback) => callback(this.jid))
    }
    return this.jid
  }

  async disconnect() {
    this.xmpp.stop()
  }

  on(type, callback) {
    if (import.meta.env.DEV && hasDebug) {
      console.debug('XmppClient event', type)
    }
    if(this.callbacks[type]) {
      // use custom callback
      this.callbacks[type].push(callback)
      return
    }
    // use default callback
    this.xmpp.on(type, callback)
  }

  async getRoster(ver) {
    const rosterMessage =
      xml(
        'iq', { type: 'get' },
        xml(
          'query', { xmlns: NS.ROSTER, ver },
        ),
      )
    const result = await this.xmpp.iqCaller.request(rosterMessage)
    return result.getChild('query')
      .getChildren('item')
      .map(item => {
        return {
          ...item.attrs,
          groups: item.getChildren('group').map(i => i.text()),
        }
      })
  }

  async sendPresence(show, status, to) {
    const presenceMessage = xml(
      'presence', {
        to,
      },
      xml(
        'show', {},
        show,
      ),
      status ? xml('status', {},
        status,
      ) : null,
    )
    await this.xmpp.send(presenceMessage)
  }

  async sendChatState (to, type, chatState) {
    if (!hasChatState) {
      return
    }
    const states = [
      'active',
      'composing',
      'paused',
      'inactive',
      'gone',
    ]
    if (!states.includes(chatState)) {
      return
    }
    await this.xmpp.send(xml(
      'message', {
        type,
        to,
        from: this.jid.full,
      },
      xml(chatState, { xmlns: NS.CHAT_STATE }),
    ))
  }

  async sendMessage (to, type, body, url = undefined) {
    const id = nanoid()
    await this.xmpp.send(xml(
      'message', {
        type,
        to,
        from: this.jid.full,
        id,
      },
      xml(
        'body', {},
        url ? url : body,
      ),
      hasChatState ? xml('active', { xmlns: NS.CHAT_STATE }) : null,
      url ? xml(
        'x', { xmlns: NS.OUT_OF_BAND_DATA },
        xml(
          'url', {},
          url,
        ),
      ) : null,
      xml(
        'origin-id', {
          xmlns: NS.UNIQUE_ID,
          id,
        },
      ),
    ))
    const sentMessage = {
      type,
      to: this.parseJid(to),
      from: this.jid,
      id,
      body,
      delay: new Date().toISOString(),
    }
    if (url) {
      sentMessage.links = [{ url }]
    }
    if (import.meta.env.DEV && hasDebug) {
      console.debug('1-message sent', sentMessage)
    }
    xmppClient.callbacks.messageSent.forEach((callback) => callback(sentMessage))
  }

  // enabling carbon (XEP-0280)
  async enableCarbons () {
    const carbonsMessage =
      xml(
        'iq', { type: 'set' },
        xml(
          'enable', { xmlns: NS.CARBONS },
        ),
      )
    const result = await this.xmpp.iqCaller.request(carbonsMessage)
    return result.attrs.type === 'result'
  }

  // Bookmarks (XEP-0048)
  async getBookmarks() {
    const bookmarkRequest =
    xml(
      'iq', { type: 'get' },
      xml(
        'query', { xmlns: NS.PRIVATE } ,
        xml(
          'storage', { xmlns: NS.BOOKMARKS },
        ),
      ),
    )
    const result = await this.xmpp.iqCaller.request(bookmarkRequest)
    const bookmarks = []
    result.getChildren('query')
      .forEach(q => q.getChildren('storage')
        .forEach(s => s.getChildren('conference')
          .forEach(conference => {
            const bookmark = conference.attrs
            if (conference.children) {
              conference.children.forEach(attr => {
                bookmark[attr.name] = attr.children[0]
              })
            }
            if (typeof bookmark.autojoin !== 'boolean') {
              bookmark.autojoin = bookmark.autojoin === 'true'
            }
            const nick = conference.getChildText('nick')
            if (nick) {
              bookmark.nick = nick
            }
            const password = conference.getChildText('password')
            if (password) {
              bookmark.password = password
            }
            bookmarks.push(bookmark)
          }),
        ),
      )
    return bookmarks
  }

  async setBookmarks(bookmarks) {
    const setBookmarkRequest =
    xml(
      'iq', { type: 'set' },
      xml(
        'query', { xmlns: NS.PRIVATE } ,
        xml(
          'storage', { xmlns: NS.BOOKMARKS },
          bookmarks.map(b => xml(
            'conference', {
              jid: b.jid,
              autojoin: b.autojoin,
              name: b.name,
            },
            b.nick ? xml(
              'nick', {}, b.nick,
            ) : null,
            b.password ? xml(
              'password', {}, b.password,
            ) : null,
          ),
          ),
        ),
      ),
    )
    await this.xmpp.iqCaller.request(setBookmarkRequest)
  }

  async addBookmark(bookmark) {
    const bookmarks = await this.getBookmarks()
    bookmarks.push({
      jid: bookmark.jid,
      autojoin: bookmark.autojoin,
      name: bookmark.name,
      nick: bookmark.nick,
      password: bookmark.password,
    })
    await this.setBookmarks(bookmarks)
  }

  async removeBookmark(jid) {
    const bookmarks = (await this.getBookmarks())
      .filter(bookmark => bookmark.jid !== jid)
    await this.setBookmarks(bookmarks)
  }

  // Service Discovery (XEP-0030)
  async getDiscoInfo(to) {
    if (to === undefined) {
      to = this.jid.domain
    }
    if (Object.hasOwnProperty.call(discoInfoCache, to)) {
      return discoInfoCache[to]
    }
    const discoInfoMessage =
      xml(
        'iq', { type: 'get', from: xmppClient.jid.full, to },
        xml(
          'query', { xmlns: NS.DISCO_INFO },
        ),
      )
    const result = await this.xmpp.iqCaller.request(discoInfoMessage)

    // Service Discovery Extensions (XEP-0128)
    const discoInfo = {
      identities: result.getChild('query').getChildren('identity').map(identity => identity.attrs),
      features: result.getChild('query').getChildren('feature').map(feature => feature.attrs.var),
      extensions: result.getChild('query').getChildren('x').map(x => {
        return { fields: x.getChildren('field').map(field => {
          return {
            name: field.attrs.var,
            label: field.attrs.label,
            type: field.attrs.type,
            value: field.getChildText('value'),
          }
        }) }
      }),
    }
    if (import.meta.env.DEV && hasDebug) {
      console.debug('0-getDiscoInfo', to, result, discoInfo)
    }
    // cache result for further request
    discoInfoCache[to] = discoInfo
    return discoInfo
  }

  async getDiscoItems(to) {
    if (to === undefined) {
      to = this.jid.domain
    }
    const discoItemsMessage =
      xml(
        'iq', { type: 'get', from: xmppClient.jid.full, to },
        xml(
          'query', { xmlns: NS.DISCO_ITEMS },
        ),
      )
    const result = await this.xmpp.iqCaller.request(discoItemsMessage)
    if (import.meta.env.DEV && hasDebug) {
      console.debug('0-getDiscoItems', to, result)
    }
    return {
      items: result.getChild('query').getChildren('item').map(i => i.attrs),
    }
  }

  // get HTTP file upload capacity (XEP-0363)
  async getUploadService() {
    // get info from main domain
    this.uploadService = this.jid.domain
    const discoInfo = await this.getDiscoInfo()
    let maxSize = this.getMaxFileSize(discoInfo)
    if (maxSize === undefined) {
      // main domain does not advertise upload service, get components (items)
      const discoItems = await this.getDiscoItems()
      for (let i = 0; i < discoItems.items.length; i++) {
        try {
          const discoInfo = await this.getDiscoInfo(discoItems.items[i].jid)
          maxSize = this.getMaxFileSize(discoInfo)
          if (maxSize) {
            this.uploadService = discoItems.items[i].jid
            break
          }
        } catch (error) {
          console.warn(error.message)
        }
      }
    }
    return {
      maxSize,
    }
  }

  getMaxFileSize (discoInfo) {
    if (discoInfo.features.includes(NS.HTTP_UPLOAD)) {
      for (let i = 0; i < discoInfo.extensions.length; i++) {
        const extension = discoInfo.extensions[i]
        if (extension.fields.map(field => field.value).includes(NS.HTTP_UPLOAD)) {
          const maxFileSizeField = extension.fields.filter(field => field.name === 'max-file-size')
          if (maxFileSizeField.length > 0) {
            return parseInt(maxFileSizeField[0].value, 10)
          }
        }
      }
    }
    return undefined
  }

  async getUploadSlot(to, request) {
    if (to === undefined || to === null) {
      to = this.uploadService
    }
    const slotRequestMessage =
      xml(
        'iq', { type: 'get', from: xmppClient.jid.full, to },
        xml(
          'request', { xmlns: NS.HTTP_UPLOAD, ...request },
        ),
      )
    const result = await this.xmpp.iqCaller.request(slotRequestMessage)
    const upload = {
      url: result.getChildrenByFilter(child => child.name === 'put', true)[0].attrs.url,
      header: result.getChildrenByFilter(child => child.name === "header", true)[0].children[0]
    }
    const download = result.getChildrenByFilter(child => child.name === 'get', true)[0].attrs.url
    return {
      upload,
      download,
    }
  }

  // vcard-temp (XEP-0054)
  getVCardAttributes () {
    return [
      {
        id: 'PHOTO',
        label: '',
        placeholder: '',
        type: 'avatar',
      },
      {
        id: 'FN',
        label: 'Full name',
        placeholder: 'John Doe',
        type: 'input',
      },
      {
        id: 'NICKNAME',
        label: 'Nickname',
        placeholder: 'Jo',
        type: 'input',
      },
      {
        id: 'URL',
        label: 'URL',
        placeholder: 'https://mywebsite.ltd',
        type: 'input',
      },
      {
        id: 'BDAY',
        label: 'Birthday',
        placeholder: '1986-08-23',
        type: 'input',
      },
      {
        id: 'ROLE',
        label: 'Role',
        placeholder: 'Executive',
        type: 'input',
      },
      {
        id: 'TITLE',
        label: 'Title',
        placeholder: 'V.P. Research and Development',
        type: 'input',
      },
    ]
  }

  async getVCard(to) {
    const getVCardMessage =
    xml(
      'iq', { type: 'get', from: xmppClient.jid.full, to },
      xml(
        'vCard', { xmlns: NS.VCARD },
      ),
    )
    const result = await this.xmpp.iqCaller.request(getVCardMessage)
    const attributes = this.getVCardAttributes()
      .reduce((attributes, attribute) => {
        attributes[attribute.id] = attribute
        return attributes
      }, {})
    const records = result.getChild('vCard').children.map(record => {
      const r = {
        name: record.name,
      }
      const dataType = attributes[record.name] ? attributes[record.name].type : null
      switch (dataType) {
        case 'avatar':
          r.data = record.getChild('BINVAL') ? record.getChild('BINVAL').children[0] : null
          r.mediaType = record.getChild('TYPE') ? record.getChild('TYPE').children[0] : 'image/png'
          break
        case 'input':
          r.value = record.getText()
          break
        default:
          Object.assign(r, record)
          break
      }
      return r
    })
    return { records }
  }

  async setVCard (newVCard) {
    // get original
    const getVCardMessage =
    xml(
      'iq', { type: 'get', from: xmppClient.jid.full },
      xml(
        'vCard', { xmlns: NS.VCARD },
      ),
    )
    const vCard = (await this.xmpp.iqCaller.request(getVCardMessage)).getChild('vCard')
    // update handled records
    // photo record
    let type = null
    let binVal = null
    if (newVCard.PHOTO) {
      const parts = newVCard.PHOTO.split(',')
      type = /data:(.*);base64/.exec(parts[0])[1]
      binVal = parts[1]
    }
    const updatedRecords = [
      xml(
        'PHOTO', {},
        xml(
          'TYPE', {}, type,
        ),
        xml(
          'BINVAL', {}, binVal,
        ),
      ),
      // other handled records
      ...this.getVCardAttributes()
        .filter(attribute => attribute.id !== 'PHOTO')
        .map(attribute => {
          return xml(
            attribute.id, {}, newVCard[attribute.id],
          )
        }),
    ]
    const handledAttributes = this.getVCardAttributes()
      .map(attribute => attribute.id)
    vCard.children = vCard.children
      // remove previous records to update
      .filter(record => !handledAttributes.includes(record.name))
      // add updated records
      .concat(updatedRecords)
    // prepare and send iq message
    const setVCardMessage =
    xml(
      'iq', {
        type: 'set',
      },
      vCard,
    )
    const result = await this.xmpp.iqCaller.request(setVCardMessage)
    if (result.attrs.type !== 'result') {
      throw new Error('Error during vCard update')
    }
  }

  // Message Archive Management (XEP-0313)
  async searchHistory(jid, last, max = 50) {
    const queryArchiveMessage =
    xml(
      'iq', { type: 'set' },
      xml(
        'query', { xmlns: NS.MAM },
        xml('x', { xmlns: NS.FORM, type: 'submit' },
          xml('field', { var: 'FORM_TYPE', type: 'hidden' },
            xml('value', {}, NS.MAM),
          ),
          xml('field', { var: 'with' },
            xml('value', {}, jid),
          ),
        ),
        xml('set', { xmlns: NS.RSM },
          xml('max', {}, max),
          xml('before', {}, last),
        ),
      ),
    )
    const result = await this.xmpp.iqCaller.request(queryArchiveMessage)
    const paging = {}
    if (result.attrs.type === 'result') {
      const set = result.getChild('fin').getChild('set')
      paging.first = set.getChildText('first')
      paging.last = set.getChildText('last')
      paging.count = set.getChildText('count')
    }
    return {
      paging,
    }
  }

  // Multi-User Chat (XEP-0045)
  async joinRoom(jid, nick, opts) {
    if (nick === null) {
      nick = xmppClient.jid.local
    }
    const roomPresenceMessage = xml(
      'presence', {
        to: `${jid}/${nick}`,
      },
      xml(
        'x', { xmlns: NS.MUC },
        opts && opts.muc && opts.muc.password ? xml(
          'password', null, opts.muc.password,
        ) : null,
      ),
    )

    const timeoutDuration = 2000
    let timeoutId = null
    const timeoutPromise = new Promise((resolve, reject) => {
      timeoutId = setTimeout(() => {
        clearTimeout(timeoutId)
        reject(new Error('Server unreachable'))
      }, timeoutDuration)
    })
    const joinPromise = new Promise((resolve, reject) => {
      function roomJoinAck (stanza) {
        if (import.meta.env.DEV && hasDebug) {
          console.debug('0-stanza, joined room?', stanza)
        }
        if (stanza.is('presence') && stanza.attrs.from === `${jid}/${nick}`) {
          // stanza is a presence from the joined room
          const mucPresence = stanza.getChild('x', NS.MUC_USER)
          if (import.meta.env.DEV && hasDebug) {
            console.debug('1-presence joined room muc', mucPresence)
          }
          if (mucPresence) {
            if (mucPresence.getChildren('status').some(status => status.attrs.code === '110')) {
              // it is our presence, remove the listener and resolve
              this.removeListener('stanza', roomJoinAck)
              clearTimeout(timeoutId)
              resolve(stanza)
              return
            }
          }
          if (stanza.attrs.type === 'error') {
            // there was an issue, remove the listener and reject with XMPP error
            this.removeListener('stanza', roomJoinAck)
            clearTimeout(timeoutId)
            reject(XMPPError.fromElement(stanza.getChild('error')))
          }
        }
      }
      this.xmpp.on('stanza', roomJoinAck)
      this.xmpp.send(roomPresenceMessage)
        .catch(reject)
    })
    return Promise.race([
      joinPromise,
      timeoutPromise,
    ])
  }

  async leaveRoom(jid, nick) {
    const presenceMessage = xml(
      'presence', {
        to: `${jid}/${nick}`,
        type: 'unavailable',
      },
    )
    await this.xmpp.send(presenceMessage)
  }

  async getRoomConfig(roomJid) {
    const getRoomConfigMessage =
    xml(
      'iq', {
        type: 'get',
        to: roomJid,
      },
      xml(
        'query', { xmlns: NS.MUC_OWNER },
      ),
    )
    const result = await this.xmpp.iqCaller.request(getRoomConfigMessage)
    const form = result.getChild('query').getChild('x')
    const config = {
      title: form.getChildText('title'),
      instructions: form.getChildText('instructions'),
      fields: form.getChildren('field').map(field => {
        const f = {
          name: field.attrs.var,
          label: field.attrs.label,
          type: field.attrs.type,
          value: field.getChildText('value'),
          description: field.getChildText('desc'),
        }
        switch (f.type) {
          case 'boolean':
            f.value = f.value === '1'
            break
          case 'list-single':
            f.options = field.getChildren('option').map(option => {
              return {
                value: option.getChildText('value'),
                label: option.attrs.label,
              }
            })
            break
        }
        return f
      }),
    }
    if (import.meta.env.DEV && hasDebug) {
      console.debug('0-getConfig', roomJid, result, form, config)
    }
    return config
  }

  async configureRoom(roomJid, form) {
    const setRoomConfigMessage =
    xml(
      'iq', {
        type: 'set',
        to: roomJid,
      },
      xml(
        'query', { xmlns: NS.MUC_OWNER },
        xml(
          'x', { xmlns: NS.FORM, type: 'submit' },
          form.fields.map(field => {
            return xml(
              'field', {
                var: field.name,
              },
              xml('value', {}, field.type === 'boolean' ? field.value ? '1' : '0' : field.value),
            )
          }),
        ),
      ),
    )
    await this.xmpp.iqCaller.request(setRoomConfigMessage)
  }

}

export { XmppClient, NS }
