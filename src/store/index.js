import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    activeChat: null,
    messages: [],
    contacts: [],
    bookmarkedRooms: [],
    joinedRooms: [],
    publicRooms: [],
    httpFileUploadMaxSize: null,
    hasNetwork: null,
    isOnline: false,
  },
  mutations: {
    // network status setter
    setNetworkStatus (state, hasNetwork) {
      state.hasNetwork = hasNetwork
    },

    // online client status setter
    setOnline (state, isOnline) {
      state.isOnline = isOnline
    },

    // active chat setter
    setActiveChat (state, payload) {
      state.activeChat = payload.activeChat
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
          state.contacts = resetUnreadCount(state.contacts)
          break
        case 'groupchat':
          state.bookmarkedRooms = resetUnreadCount(state.bookmarkedRooms)
          break
      }
    },

    // roster setter
    setRoster (state, contacts) {
      state.contacts = contacts
    },

    // MUC public rooms setter
    clearPublicRooms (state) {
      state.publicRooms = []
    },
    setPublicRoom (state, publicRoom) {
      const publicRooms = state.publicRooms.slice(0)
      const index = publicRooms.findIndex((knownRoom) => knownRoom.jid === publicRoom.jid)
      if (index === -1) {
        return state.publicRooms.push(publicRoom)
      }
      publicRooms[index] = publicRoom
      state.publicRooms = publicRooms
    },

    // MUC bookmarked rooms setter
    setBookmarkedRoom (state, room) {
      const bookmarkedRooms = state.bookmarkedRooms.slice(0)
      const index = bookmarkedRooms.findIndex((knownRoom) => knownRoom.jid === room.jid)
      if (index === -1) {
        return state.bookmarkedRooms.push(room)
      }
      bookmarkedRooms[index] = room
      state.bookmarkedRooms = bookmarkedRooms
    },
    setBookmarkedRooms (state, rooms) {
      state.bookmarkedRooms = rooms
    },

    // MUC joined rooms setter
    setJoinedRoom (state, room) {
      const joinedRooms = state.joinedRooms.slice(0)
      const index = joinedRooms.findIndex((knownRoom) => knownRoom.jid === room.jid)
      if (index === -1) {
        return state.joinedRooms.push(room)
      }
      joinedRooms[index] = room
      state.bookmarkedRooms = joinedRooms
    },
    setJoinedRooms (state, rooms) {
      state.joinedRooms = rooms
    },

    // contact presence setter
    setContactPresence (state, contactPresence) {
      const contacts = state.contacts.slice(0)
      const index = contacts.findIndex((contact) => contact.jid === contactPresence.jid)
      if (index !== -1) {
        contacts[index].presence = contactPresence.presence
        state.contacts = contacts
      }
    },

    // messages setters
    storePreviousMessages (state, newMessages) {
      let messages = state.messages.slice(0)
      messages = messages.concat(newMessages)
      const vm = this.$app
      messages.sort(function (a, b) {
        return vm.$moment(a.delay).isAfter(vm.$moment(b.delay))
      })
      state.messages = messages
    },
    storeMessage (state, payload) {
      if (payload.message.id) {
        const messages = state.messages.slice(0)
        const index = messages.findIndex((knownMessage) => knownMessage.id === payload.message.id)
        if (index !== -1) {
          // update existing message
          messages[index] = payload.message
          state.messages = messages
          return
        }
      }
      // add new message
      state.messages.push({
        id: payload.message.id,
        from: payload.message.from,
        to: payload.message.to,
        body: payload.message.body,
        delay: payload.message.delay || null,
        links: payload.message.links || null,
      })

      // order messages by date
      const messages = state.messages.slice(0)
      const vm = this.$app
      messages.sort((a, b) => {
        return vm.$moment(a.delay).isAfter(vm.$moment(b.delay))
      })
      state.messages = messages

      // handle unread messages count
      function addUnreadCount (collection) {
        const copy = collection.slice(0)
        const index = copy.findIndex((item) => item.jid === payload.message.from.bare)
        if (index !== -1) {
          if (copy[index].unreadCount === undefined) {
            copy[index].unreadCount = 1
          } else {
            copy[index].unreadCount++
          }
        }
        return copy
      }
      if (payload.message.from.bare === state.activeChat) {
        // message is in the displayed chat, do not increment counter
        return
      }
      switch (payload.type) {
        case 'chat':
          state.contacts = addUnreadCount(state.contacts)
          break
        case 'groupchat':
          state.bookmarkedRooms = addUnreadCount(state.bookmarkedRooms)
          break
      }
    },

    // HTTP file upload max size setter (XEP-0363)
    setHttpFileUploadMaxSize (state, httpFileUploadMaxSize) {
      state.httpFileUploadMaxSize = httpFileUploadMaxSize
    },
  },
  strict: process.env.NODE_ENV !== 'production',
})
