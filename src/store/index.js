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
  },
  mutations: {
    // active chat setter
    setActiveChat (state, payload) {
      state.activeChat = payload.activeChat
      // reset unread messages count for this chat
      function resetUnreadCount (collection) {
        let copy = collection.slice(0)
        let index = copy.findIndex((item) => item.jid === payload.activeChat)
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
      let publicRooms = state.publicRooms.slice(0)
      let index = publicRooms.findIndex((knownRoom) => knownRoom.jid === publicRoom.jid)
      if (index === -1) {
        return state.publicRooms.push(publicRoom)
      }
      publicRooms[index] = publicRoom
      state.publicRooms = publicRooms
    },

    // MUC bookmarked rooms setter
    setBookmarkedRoom (state, room) {
      let bookmarkedRooms = state.bookmarkedRooms.slice(0)
      let index = bookmarkedRooms.findIndex((knownRoom) => knownRoom.jid === room.jid)
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
      let joinedRooms = state.joinedRooms.slice(0)
      let index = joinedRooms.findIndex((knownRoom) => knownRoom.jid === room.jid)
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
      let contacts = state.contacts.slice(0)
      let index = contacts.findIndex((contact) => contact.jid === contactPresence.jid)
      if (index !== -1) {
        contacts[index].presence = contactPresence.presence
        state.contacts = contacts
      }
    },

    // messages setters
    storePreviousMessages (state, newMessages) {
      let messages = state.messages.slice(0)
      messages = messages.concat(newMessages)
      messages.sort(function (a, b) {
        return a.delay > b.delay
      })
      state.messages = messages
    },
    storeMessage (state, payload) {
      if (payload.message.id) {
        let messages = state.messages.slice(0)
        let index = messages.findIndex((knownMessage) => knownMessage.id === payload.message.id)
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
      })

      // order messages by date
      let messages = state.messages.slice(0)
      messages.sort((a, b) => {
        return a.delay > b.delay
      })
      state.messages = messages

      // handle unread messages count
      function addUnreadCount (collection) {
        let copy = collection.slice(0)
        let index = copy.findIndex((item) => item.jid === payload.message.from.bare)
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
  },
  strict: process.env.NODE_ENV !== 'production',
})
