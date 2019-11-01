<template>
  <main class="is-growing chat-container has-background-light">
    <div class="toolbar">
      <router-link :to="{ name: 'home' }" class="button has-text-primary" :class="{'is-hidden-tablet' : jid}" title="Back to contacts"><i class="fa fa-arrow-circle-left has-margin-right-7" aria-hidden="true" />Contacts</router-link>
      <i class="fa fa-2x fa-pencil-square-o" :class="chatStateClass" aria-hidden="true" />
      <button class="button has-text-primary" @click="getPreviousMessages()" title="Get previous messages" :class="{ 'is-loading': isLoadingPreviousMessages }"><i class="fa fa-history has-margin-right-7" aria-hidden="true" />Load history</button>
    </div>
    <div class="messages-container" id="messages-container">
      <div v-for="message in messagesWithJid" :key="message.id" class="message-container is-flex" :class="{'is-row-reverse': isUser(message.from) }">
        <avatar :jid="(isRoom && message.from.bare !== userJid.bare) ? message.from.full : message.from.bare" :display-jid="false" />
        <span class="message-text has-margin-left-7 has-margin-right-7" style="">
          <span>{{ message.body }}</span>
          <div class="content is-italic has-text-weight-light is-small" v-if="message.delay" :title="message.delay | moment()">{{ message.delay | moment("from") }}</div>
        </span>
      </div>
    </div>
    <div class="sendbox">
      <form @submit.prevent="sendMessage">
        <div class="field">
          <div class="control">
            <textarea class="textarea" placeholder="Send message" rows="3" v-model="composingMessage" @keyup.ctrl.enter="sendMessage" />
          </div>
          <button type="submit" class="button has-text-primary"><i class="fa fa-paper-plane" aria-hidden="true" /></button>
        </div>
      </form>
    </div>
  </main>
</template>

<script>
import avatar from '@/components/Avatar'
import { mapState } from 'vuex'

export default {
  name: 'Chat',
  components: {
    avatar
  },
  props: {
    jid: {
      type: String,
      default: null
    },
    isRoom: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      composingMessage: '',
      firstMessageId: null,
      chatState: '',
      isLoadingPreviousMessages: false,
    }
  },
  computed: {
    userJid () {
      return this.$xmpp.fullJid
    },
    messagesWithJid () {
      return this.messages.filter((message) => (message.from.bare === this.jid || message.to.bare === this.jid))
    },
    chatStateClass () {
      switch (this.chatState) {
        case 'composing':
          return 'has-text-grey-light'
        case 'paused':
          return 'has-text-grey-lighter'
        default:
          return 'has-text-light'
      }
    },
    ...mapState(['activeChat', 'messages', 'joinedRooms'])
  },
  methods: {
    // check if a jid is current user (including MUC nick)
    isUser (jid) {
      return jid.bare === this.userJid.bare || jid.resource === this.userJid.local
    },
    // ask for messages archive (update messages in store)
    getPreviousMessages() {
      this.isLoadingPreviousMessages = true
      this.$xmpp.searchHistory(this.activeChat, this.firstMessageId)
      .then(data => {
        // store first displayed message
        this.firstMessageId = data.first
      })
      .finally(() => {
        this.isLoadingPreviousMessages = false
      })
    },
    // send message
    sendMessage() {
      this.$xmpp.sendMessage(this.activeChat, this.composingMessage, this.isRoom)
      this.composingMessage = ''
    },
    // handle route on mount (commit active chat, reset chatState and first message, join room if not already)
    handleRoute () {
      this.$store.commit('setActiveChat', {
        type: this.isRoom ? 'groupchat' : 'chat',
        activeChat: this.jid
      })
      this.chatState = ''
      this.firstMessageId = null
      if (this.isRoom && this.joinedRooms.findIndex((joinedRoom) => joinedRoom.jid === this.jid) === -1) {
        this.$xmpp.joinRoom(this.jid)
      }
    },
    // scroll to last message (called when messages changes)
    scrollToLastMessage () {
      this.$nextTick( () => {
        var messagesContainer = document.getElementById("messages-container")
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight
        }
      })
    }
  },
  // watch route param to force component update
  watch: {
    jid: 'handleRoute',
    messagesWithJid: 'scrollToLastMessage',
  },
  mounted() {
    // handle route prop
    this.handleRoute()
    // listen for chat states
    this.$bus.$on('chatState', (data) => {
      if (data.jid === this.activeChat) {
        this.chatState = data.chatState
      }
    })
  }
}
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow-y: auto;
  height: 100%;
}
.messages-container {
  overflow-y: auto;
  scroll-behavior: smooth;
  flex-grow: 1;
}
.toolbar {
  position: relative;
  margin: 1em;
  min-height: 2.5em;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.message-container {
  margin: 0.5em 1em;
}
.message-text {
  background-color: #167df0;
  white-space: pre-wrap;
  border-radius: 3px 9px 9px 9px !important;
  color: #fff;
  padding: 0 0.75em;
  margin: 0 0.75em;
}
.is-row-reverse {
  flex-direction: row-reverse;
}
.is-row-reverse .message-text {
  border-radius: 9px 3px 9px 9px !important;
  background-color: #7096C2;
}
.sendbox {
  position: relative;
}
.sendbox textarea {
  resize: none;
  border-color: #dbdbdb;
  box-shadow: inset 0 0.0625em 0.125em rgba(10, 10, 10, 0.05);
  padding-right: 5em;
}
.sendbox .button {
  position: absolute;
  right: 1.2em;
  top: calc(50% - 1.25em);
  background-color: transparent !important;
  border: none;
}
</style>
