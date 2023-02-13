import { defineStore } from 'pinia'
import { useWebNotification, useDocumentVisibility } from '@vueuse/core'

let showNotification = null

const getDefaultState = () => {
  return {
    activeChat: null,
    messages: [],
    contacts: [],
    groups: [],
    joinedRooms: [],
    knownRooms: [],
    roomsOccupants: [],
    httpFileUploadMaxSize: null,
    isOnline: false,
    presence: 'chat',
    hasNotificationsEnabled: false,
  }
}

export const useStore = defineStore('main', {
  state: () => {
    return {
      hasNetwork: null,
      ...getDefaultState(),
    }
  },

  getters: {

    publicRooms: (state) => {
      return state.knownRooms.filter((room) => room.isPublic)
    },

    bookmarkedRooms: (state) => {
      return state.knownRooms.filter((room) => room.isBookmarked)
    },

    getRoom: (state) => (jid) => {
      return state.knownRooms.find((room) => room.jid === jid) || {}
    },

    isBookmarked: (state) => (jid) => {
      return state.knownRooms.some((room) => room.jid === jid && room.isBookmarked)
    },

    isJoined: (state) => (jid) => {
      return state.joinedRooms.some((joinedRoomJid) => joinedRoomJid === jid)
    },

    getRoomOccupants: (state) => (jid) => {
      const roomOccupants = state.roomsOccupants.find((roomOccupants) => roomOccupants.roomJid === jid)
      if (roomOccupants) {
        return roomOccupants.occupants
      }
      return []
    },

    getRoomSubject: (state) => (jid) => {
      const room = state.knownRooms.find((room) => room.jid === jid)
      return (room && room.subject) ? room.subject : null
    },

    getChatState: (state) => (isRoom, jid) => {
      if (isRoom) {
        const roomOccupants = state.roomsOccupants.find((roomOccupants) => roomOccupants.roomJid === jid)
        if (roomOccupants) {
          if (roomOccupants.occupants.some(occupant => occupant.chatState === 'composing')) {
            return 'composing'
          }
          if (roomOccupants.occupants.some(occupant => occupant.chatState === 'paused')) {
            return 'paused'
          }
        }
        return 'inactive'
      }
      const contact = state.contacts.find((contact) => contact.jid === jid)
      return contact ? contact.chatState : 'inactive'
    },
  },

  actions: {

    // network status setter
    setNetworkStatus (hasNetwork) {
      this.hasNetwork = hasNetwork
    },

    // online client status setter
    setOnline (isOnline) {
      this.isOnline = isOnline
    },

    // user presence setter
    setPresence (presence) {
      this.presence = presence
    },

    // active chat setter
    setActiveChat (payload) {
      this.activeChat = payload.activeChat
      // reset unread messages count for this chat
      function resetUnreadCount (collection) {
        const copy = collection.slice(0)
        const index = copy.findIndex((item) => item.jid === payload.activeChat)
        if (index !== -1) {
          copy[index].unreadCount = 0
        }
        return copy
      }
      switch (payload.type) {
        case 'chat':
          this.contacts = resetUnreadCount(this.contacts)
          break
        case 'groupchat':
          this.knownRooms = resetUnreadCount(this.knownRooms)
          break
      }
    },

    // roster setter
    setRoster (contacts) {
      this.contacts = contacts
      contacts.forEach(contact => {
        if (contact.groups) {
          contact.groups.forEach(group => {
            if (!this.groups.includes(group)) {
              this.groups.push(group)
            }
          })
        }
      })
    },

    // MUC rooms setter
    setKnownRoom (room) {
      const rooms = this.knownRooms.slice(0)
      const index = rooms.findIndex((knownRoom) => knownRoom.jid === room.jid)
      if (index === -1) {
        // add room
        this.knownRooms.push(room)
        return
      }
      // update room
      for (const key in room) {
        if (room[key] === null && rooms[index][key] !== null) {
          continue
        }
        rooms[index][key] = room[key]
      }
      this.knownRooms = rooms
    },

    // MUC room subject setter
    setRoomSubject (roomJid, author, subject) {
      const room = this.getRoom(roomJid)
      if (room.jid) {
        this.setKnownRoom({
          ...room,
          subject: {
            author,
            subject,
          },
        })
      }
    },

    // MUC joined rooms setter
    setJoinedRoom (roomJid) {
      const index = this.joinedRooms.findIndex((knownRoomJid) => knownRoomJid === roomJid)
      if (index === -1) {
        this.joinedRooms.push(roomJid)
      }
    },

    removeJoinedRoom (roomJid) {
      this.joinedRooms = this.joinedRooms.filter(knownRoomJid => knownRoomJid !== roomJid)
    },

    // contact presence setter
    setContactPresence (contactPresence) {
      const index = this.contacts.findIndex((contact) => contact.jid === contactPresence.jid)
      if (index !== -1) {
        this.contacts[index].presence = contactPresence.presence
        this.contacts[index].status = contactPresence.status
      }
    },

    // messages setters
    storeMessage (payload) {
      if (payload.message.id) {
        const messages = this.messages.slice(0)
        const index = messages.findIndex((knownMessage) => knownMessage.id === payload.message.id)
        if (index !== -1) {
          // update existing message
          messages[index] = payload.message
          this.messages = messages
          return
        }
      }
      if (payload.message.stanzaId) {
        const messages = this.messages.slice(0)
        const index = messages.findIndex((knownMessage) => knownMessage.stanzaId === payload.message.stanzaId)
        if (index !== -1) {
          // update existing message
          messages[index] = payload.message
          this.messages = messages
          return
        }
      }
      // add new message
      this.messages.push({
        id: payload.message.id,
        stanzaId: payload.message.stanzaId,
        from: payload.message.from,
        to: payload.message.to,
        body: payload.message.body,
        delay: payload.message.delay || null,
        links: payload.message.links || null,
        status: null,
      })

      // order messages by date
      const messages = this.messages.slice(0)
      const dayjs = this.$dayjs
      messages.sort((a, b) => {
        return dayjs(a.delay).isAfter(dayjs(b.delay))
      })
      this.messages = messages

      // handle unread messages count
      function addUnreadCount (collection) {
        const copy = collection.slice(0)
        const index = copy.findIndex((item) => item.jid === payload.message.from.bare)
        if (index !== -1) {
          if (copy[index].unreadCount === undefined || copy[index].unreadCount === null) {
            copy[index].unreadCount = 1
          } else {
            copy[index].unreadCount++
          }
        }
        return copy
      }
      if (this.hasNotificationsEnabled) {
        const visibility = useDocumentVisibility()
        if (visibility.value === 'hidden' && showNotification !== null) {
          showNotification({
            body: 'You have received new message',
            renotify: false,
            tag: 'unread',
          })
        }
      }
      if (payload.message.from.bare === this.activeChat) {
        // message is in the displayed chat, do not increment counter
        return
      }
      switch (payload.type) {
        case 'chat':
          this.contacts = addUnreadCount(this.contacts)
          break
        case 'groupchat':
          this.knownRooms = addUnreadCount(this.knownRooms)
          break
      }
    },

    updateMessage (message) {
      if (!message.stanzaId) {
        return
      }
      const index = this.messages.findIndex((knownMessage) => knownMessage.stanzaId === message.stanzaId)
      if (index === -1) {
        return
      }
      this.messages[index] = {
        ...this.messages[index],
        ...message,
      }
    },

    setMessageStatus (id, code, message) {
      const index = this.messages.findIndex((knownMessage) => knownMessage.id === id)
      if (index !== -1) {
        this.messages[index].status = {
          code,
          message,
        }
      }
    },

    // HTTP file upload max size setter (XEP-0363)
    setHttpFileUploadMaxSize (httpFileUploadMaxSize) {
      this.httpFileUploadMaxSize = httpFileUploadMaxSize
    },

    setRoomOccupant ({ roomJid, jid, presence }) {
      if (!this.roomsOccupants.find((roomOccupants) => roomOccupants.roomJid === roomJid)) {
        // create room occupants list
        this.roomsOccupants.push({
          roomJid,
          occupants: [],
        })
      }
      const roomIndex = this.roomsOccupants.findIndex((roomOccupants) => roomOccupants.roomJid === roomJid)
      const occupant = {
        jid,
        presence,
      }
      const occupantIndex = this.roomsOccupants[roomIndex].occupants.findIndex((occupant) => occupant.jid === jid)
      if (occupantIndex !== -1) {
        // remove previous room occupant
        this.roomsOccupants[roomIndex].occupants[occupantIndex] = occupant
        return
      }
      // add room occupant
      this.roomsOccupants[roomIndex].occupants.push(occupant)
    },

    removeRoomOccupant ({ roomJid, jid }) {
      const roomIndex = this.roomsOccupants.findIndex((roomOccupants) => roomOccupants.roomJid === roomJid)
      if (roomIndex === -1) {
        return
      }
      const index = this.roomsOccupants[roomIndex].occupants.findIndex((occupant) => occupant.jid === jid)
      if (index !== -1) {
        this.roomsOccupants[roomIndex].occupants.splice(index, 1)
      }
    },

    // chat state setter
    setChatState ({ jid, type, chatState }) {
      if (type === 'chat') {
        const index = this.contacts.findIndex((contact) => contact.jid === jid.bare)
        if (index !== -1) {
          this.contacts[index].chatState = chatState
        }
        return
      }
      if (type === 'groupchat') {
        const roomIndex = this.roomsOccupants.findIndex((roomOccupants) => roomOccupants.roomJid === jid.bare)
        if (roomIndex === -1) {
          return
        }
        const index = this.roomsOccupants[roomIndex].occupants.findIndex((occupant) => occupant.jid === jid.full)
        if (index !== -1) {
          this.roomsOccupants[roomIndex].occupants[index].chatState = chatState
        }
      }
    },

    setNotificationStatus (hasNotificationsEnabled) {
      this.hasNotificationsEnabled = hasNotificationsEnabled
      if (hasNotificationsEnabled && showNotification === null) {
        // trigger Notifications API for requesting user permission (only one time) and intialize showNotification function
        ({ show: showNotification } = useWebNotification({
          title: window.config.name,
          icon: '/img/icons/android-chrome-192x192.png',
          dir: 'auto',
          lang: 'en',
        }))
      }
    },

    // clear state
    clear () {
      const defaultState = getDefaultState()
      Object.keys(defaultState).forEach((key) => {
        this[key] = defaultState[key]
      })
    },
  },
})
