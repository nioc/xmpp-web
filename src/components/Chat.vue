<template>
  <main class="is-growing chat-container has-background-light">
    <div class="toolbar">
      <router-link :to="{name: 'home'}" class="button has-text-primary" :class="{'is-hidden-tablet': jid}" title="Back to contacts"><i class="fa fa-arrow-circle-left has-margin-right-7" aria-hidden="true" />Contacts</router-link>
      <i class="fa fa-2x fa-pencil-square-o" :class="chatStateClass" aria-hidden="true" />
      <button class="button has-text-primary" title="Get previous messages" :class="{'is-loading': isLoadingPreviousMessages}" @click="getPreviousMessages()"><i class="fa fa-history has-margin-right-7" aria-hidden="true" />Load history</button>
    </div>
    <div id="messages-container" class="messages-container">
      <div v-for="message in messagesWithJid" :key="message.id" class="message-container is-flex" :class="{'is-row-reverse': isUser(message.from)}">
        <avatar :jid="(isRoom && message.from.bare !== userJid.bare) ? message.from.full : message.from.bare" :display-jid="false" />
        <span class="message-text has-margin-left-7 has-margin-right-7" style="">
          <span>{{ message.body }}</span>
          <message-link v-for="link in message.links" :key="link.url" :url="link.url" />
          <div v-if="message.delay" class="content is-italic has-text-weight-light is-small" :title="message.delay | moment()">{{ message.delay | moment("from") }}</div>
        </span>
      </div>
    </div>
    <div class="sendbox">
      <form @submit.prevent="sendMessage">
        <div class="field">
          <div class="control">
            <textarea v-model="composingMessage" class="textarea" placeholder="Send message" rows="3" :disabled="fileThumbnail || fileIcon" @keyup.ctrl.enter="sendMessage" />
            <div v-if="fileThumbnail || fileIcon" class="thumbnail-container">
              <img v-if="fileThumbnail" :src="fileThumbnail" class="thumbnail">
              <i v-if="fileIcon" class="fa fa-5x" :class="fileIcon" />
              <button class="delete" title="Remove file" @click="removeFile" />
            </div>
          </div>
          <button v-if="composingMessage || file || !httpFileUploadMaxSize" type="submit" class="button fixed-right-button has-text-primary" title="Send message"><i class="fa fa-paper-plane" aria-hidden="true" /></button>
          <div v-else class="file fixed-right-button">
            <label class="file-label">
              <input class="file-input" type="file" name="resume" @change="onFileChange">
              <span class="file-cta">
                <span class="file-icon">
                  <i class="fa fa-paperclip has-text-primary" />
                </span>
              </span>
            </label>
          </div>
        </div>
      </form>
    </div>
  </main>
</template>

<script>
import avatar from '@/components/Avatar'
import messageLink from '@/components/MessageLink'
import {mapState} from 'vuex'
import axios from 'axios'
import filesize from 'filesize'

export default {
  name: 'Chat',
  components: {
    avatar,
    messageLink,
  },
  props: {
    jid: {
      type: String,
      default: null,
    },
    isRoom: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      composingMessage: '',
      firstMessageId: null,
      chatState: '',
      isLoadingPreviousMessages: false,
      file: null,
      fileThumbnail: null,
      fileIcon: null,
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
    ...mapState(['activeChat', 'messages', 'joinedRooms', 'httpFileUploadMaxSize']),
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
      if (this.file) {
        this.postFile(this.file)
        return
      }
      this.$xmpp.sendMessage(this.activeChat, this.composingMessage, this.isRoom)
      this.composingMessage = ''
    },
    onFileChange(e) {
      var files = e.target.files || e.dataTransfer.files
      if (!files.length) {
        return
      }
      this.file = files[0]
      // check file size
      if (this.file.size > this.httpFileUploadMaxSize) {
        alert(`File is too big (${filesize(this.file.size)}, max is ${filesize(this.httpFileUploadMaxSize)})`)
        return
      }
      // handle thumbnail
      if (this.file.type.startsWith('image/')) {
        var reader = new FileReader()
        var vm = this
        reader.onload = (e) => {
            vm.fileThumbnail = e.target.result
        }
        reader.readAsDataURL(this.file)
      } else if (this.file.type.startsWith('audio/')) {
        this.fileIcon = 'fa-file-audio-o'
      } else if (this.file.type.startsWith('video/')) {
        this.fileIcon = 'fa-file-video-o'
      } else if (this.file.type.includes('pdf')) {
        this.fileIcon = 'fa-file-pdf-o'
      } else {
        this.fileIcon = 'fa-file-o'
      }
    },
    postFile(file) {
      // reserve slot
      this.$xmpp.getUploadSlot('nioc.eu', {
        name: file.name,
        size: file.size,
        mediaType: file.type,
      })
      .then((httpUploadSlotResult) => {
        // upload file on returned slot
        axios.put(httpUploadSlotResult.upload.url, file, {
            headers: {
              'Content-Type': file.type,
            },
          })
        .then(() => {
          // upload is ok, send message
          this.$xmpp.sendUrl(this.activeChat, httpUploadSlotResult.download, this.isRoom)
          this.file = null
          this.fileThumbnail = null
          this.fileIcon = null
        })
        .catch((uploadError) => console.error('uploadError', uploadError))
      })
      .catch((httpUploadSlotError) => console.error('httpUploadSlot', httpUploadSlotError))
    },
    removeFile() {
      this.file = null
      this.fileThumbnail = null
      this.fileIcon = null
    },
    // handle route on mount (commit active chat, reset chatState and first message, join room if not already)
    handleRoute () {
      this.$store.commit('setActiveChat', {
        type: this.isRoom ? 'groupchat' : 'chat',
        activeChat: this.jid,
      })
      this.chatState = ''
      this.firstMessageId = null
      this.file = null
      this.fileThumbnail = null
      this.fileIcon = null
      if (this.isRoom && this.joinedRooms.findIndex((joinedRoom) => joinedRoom.jid === this.jid) === -1) {
        this.$xmpp.joinRoom(this.jid)
      }
      this.scrollToLastMessage()
    },
    // scroll to last message (called when messages changes)
    scrollToLastMessage () {
      this.$nextTick( () => {
        var messagesContainer = document.getElementById("messages-container")
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight + 5000
        }
      })
    },
  },
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
.sendbox .thumbnail-container {
  position: absolute;
  top: 1em;
  left: 1em;
}
.sendbox .thumbnail {
  max-height: 4.5em;
}
.sendbox .delete {
  margin-left: -7px;
  margin-top: -13px;
}
.sendbox .fixed-right-button {
  position: absolute;
  right: 1.2em;
  top: calc(50% - 1.25em);
  background-color: transparent;
  border: none !important;
  font-size: 1.5rem !important;
}
.sendbox .fixed-right-button:hover {
  background-color: #eeeeee;
}
.sendbox .fixed-right-button .fa {
  font-size: 1.5rem !important;
}
.sendbox .fixed-right-button .file-cta {
  background-color: transparent;
  border: none !important;
}
.sendbox .fixed-right-button .file-icon {
  margin-right: 0;
}
</style>
