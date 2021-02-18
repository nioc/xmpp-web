<template>
  <main class="is-growing chat-container has-background-shade-4">
    <div class="toolbar has-border-bottom-shade-3">
      <router-link v-if="!$xmpp.isAnonymous" :to="{name: 'home'}" class="button has-text-primary has-no-border is-shadowless" :class="{'is-hidden-tablet': jid}" title="Back to contacts"><i class="fa fa-arrow-circle-left" aria-hidden="true" /></router-link>
      <i class="fa fa-lg fa-pencil-square-o" :class="chatStateClass" aria-hidden="true" />
      <span class="is-flex is-align-items-center">
        <bookmark-button v-if="isRoom && !$xmpp.isAnonymous" :jid="jid" />
        <button class="button has-text-primary has-no-border is-shadowless" title="Get history" :class="{'is-loading': isLoadingPreviousMessages}" @click="getPreviousMessages()"><i class="fa fa-history" aria-hidden="true" /></button>
      </span>
    </div>
    <div id="messages-container" class="messages-container">
      <div v-for="message in messagesWithJid" :key="message.id" class="message-container is-flex" :class="{'is-row-reverse': isUser(message.from)}">
        <avatar :jid="(isRoom && message.from.bare !== userJid.bare) ? message.from.full : message.from.bare" :display-jid="false" />
        <span class="message-text has-background-shade-1 has-margin-left-7 has-margin-right-7" style="">
          <span>{{ message.body }}</span>
          <message-link v-for="link in message.links" :key="link.url" :url="link.url" class="is-clickable" />
          <div v-if="message.delay" class="content is-italic has-text-weight-light is-small" :title="message.delay | moment()">{{ message.delay | moment("from") }}</div>
        </span>
      </div>
    </div>
    <div class="sendbox has-border-top-shade-3">
      <form @submit.prevent="sendMessage">
        <div class="field">
          <div class="control">
            <textarea v-model="composingMessage" class="textarea has-background-shade-4 is-shadowless has-placeholder-shade-1" :placeholder="!file? 'Send message' : ''" rows="2" :disabled="fileThumbnail || fileIcon" @keyup.ctrl.enter="sendMessage" />
            <div v-if="fileThumbnail || fileIcon" class="thumbnail-container">
              <img v-if="fileThumbnail" :src="fileThumbnail" class="thumbnail">
              <i v-if="fileIcon" class="fa fa-2x" :class="fileIcon" />
              <button class="delete has-background-grey-light" title="Remove file" @click="removeFile" />
            </div>
          </div>
          <button v-if="composingMessage || file || !httpFileUploadMaxSize" type="submit" class="button fixed-right-button has-text-primary has-no-border is-shadowless" title="Send message"><i class="fa fa-paper-plane" aria-hidden="true" /></button>
          <div v-else class="file fixed-right-button has-no-border" title="Send a file">
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
import BookmarkButton from '@/components/BookmarkButton'
import { mapState } from 'vuex'
import axios from 'axios'
import filesize from 'filesize'

export default {
  name: 'Chat',
  components: {
    avatar,
    messageLink,
    BookmarkButton,
  },
  beforeRouteEnter (to, from, next) {
    next(vm => {
      vm.previousRoute = from
    })
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
  data () {
    return {
      composingMessage: '',
      firstMessageId: null,
      chatState: '',
      isLoadingPreviousMessages: false,
      file: null,
      fileThumbnail: null,
      fileIcon: null,
      previousRoute: null,
    }
  },
  computed: {
    userJid () {
      return this.$xmpp.fullJid
    },
    userNick () {
      return this.$xmpp.nick
    },
    messagesWithJid () {
      return this.messages.filter((message) => (message.from.bare === this.jid || message.to.bare === this.jid))
    },
    chatStateClass () {
      switch (this.chatState) {
        case 'composing':
          return 'has-text-grey-light'
        case 'paused':
          return 'has-text-shade-3'
        default:
          return 'has-text-shade-4'
      }
    },
    ...mapState([
      'activeChat',
      'messages',
      'httpFileUploadMaxSize',
    ]),
  },
  // watch route param to force component update
  watch: {
    jid: 'handleRoute',
    messagesWithJid: 'scrollToLastMessage',
  },
  mounted () {
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
      return jid.bare === this.userJid.bare || jid.resource === this.userJid.local || jid.resource === this.userNick
    },
    // ask for messages archive (update messages in store)
    async getPreviousMessages () {
      this.isLoadingPreviousMessages = true
      const paging = await this.$xmpp.searchHistory(this.activeChat, this.firstMessageId)
      if (paging) {
        // store first displayed message
        this.firstMessageId = paging.first
      }
      this.isLoadingPreviousMessages = false
    },
    // send message
    async sendMessage () {
      try {
        if (this.file) {
          await this.postFile(this.file)
          return
        }
        await this.$xmpp.sendMessage(this.activeChat, this.composingMessage, this.isRoom)
        this.composingMessage = ''
      } catch (error) {
        console.error('send error', error)
      }
    },
    onFileChange (e) {
      const files = e.target.files || e.dataTransfer.files
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
        const reader = new FileReader()
        const vm = this
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
    async postFile (file) {
      try {
        // reserve slot
        const httpUploadSlotResult = await this.$xmpp.getUploadSlot(this.userJid.domain, {
          name: file.name,
          size: file.size,
          mediaType: file.type,
        })
        // upload file on returned slot
        await axios.put(httpUploadSlotResult.upload.url, file, {
          headers: {
            'Content-Type': file.type,
          },
        })
        // upload is ok, send message
        await this.$xmpp.sendUrl(this.activeChat, httpUploadSlotResult.download, this.isRoom)
        this.file = null
        this.fileThumbnail = null
        this.fileIcon = null
      } catch (error) {
        console.error('httpUpload', error)
      }
    },
    removeFile () {
      this.file = null
      this.fileThumbnail = null
      this.fileIcon = null
    },
    // handle route on mount (commit active chat, reset chatState and first message, join room if not already)
    async handleRoute () {
      if (!this.userJid) {
        // $xmpp is not loaded
        return
      }
      this.$store.commit('setActiveChat', {
        type: this.isRoom ? 'groupchat' : 'chat',
        activeChat: this.jid,
      })
      this.chatState = ''
      this.firstMessageId = null
      this.file = null
      this.fileThumbnail = null
      this.fileIcon = null
      if (this.isRoom && !this.$store.getters.isJoined(this.jid)) {
        // user was not in this room, he have to join before
        let room = this.$store.getters.getRoom(this.jid)
        const options = { }
        if (!room || !room.jid) {
          // room is not known, request more info
          room = await this.$xmpp.getRoom(this.jid)
          if (!room.jid) {
            // handle room error
            await this.$buefy.dialog.alert({
              title: 'Error',
              message: room.message || 'Unable to join room',
              type: 'is-danger',
            })
            return this.abortChat()
          }
        }
        if (room.jid && room.isPasswordProtected) {
          // room is protected, asking password
          const { result } = await this.$buefy.dialog.prompt({
            title: 'Room protected',
            message: '<span class="icon mr-2"><i class="fa fa-key-modern" /></i></span><span>Please enter password</span>',
            trapFocus: true,
            inputAttrs: {
              placeholder: 'Password',
              type: 'password',
              value: room.password || '',
            },
          })
          options.muc = {
            password: result,
          }
          if (result === false) {
            return this.abortChat()
          }
        }
        const result = await this.$xmpp.joinRoom(this.jid, null, options, room)
        if (!result.isSuccess) {
          await this.$buefy.dialog.alert({
            title: 'Error',
            message: result.message || 'Unable to join room',
            type: 'is-danger',
          })
          return this.abortChat()
        }
      }
      this.scrollToLastMessage()
    },
    abortChat () {
      // choose valid path for navigation
      if (this.previousRoute && this.previousRoute.query.redirect === this.$route.fullPath) {
        if (this.$xmpp.isAnonymous) {
          return this.$router.push({ name: 'gest' })
        }
        return this.$router.push({ name: 'home' })
      }
      return this.$router.back()
    },
    // scroll to last message (called when messages changes)
    scrollToLastMessage () {
      this.$nextTick(() => {
        const messagesContainer = document.getElementById('messages-container')
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
  padding: 0.5em 0.3em;
  height: 3em;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.message-container {
  margin: 0.5em 1em;
}
.message-text {
  white-space: pre-wrap;
  border-radius: 3px 9px 9px 9px !important;
  padding: 0 0.75em;
  margin: 0 0.75em;
}
.is-row-reverse {
  flex-direction: row-reverse;
}
.is-row-reverse .message-text {
  border-radius: 9px 3px 9px 9px !important;
}
.sendbox {
  position: relative;
}
.sendbox textarea {
  resize: none;
  border: none;
  padding-right: 5em;
}
.sendbox .thumbnail-container {
  position: absolute;
  top: 1em;
  left: 1em;
}
.sendbox .thumbnail {
  max-height: 2.5em;
}
.sendbox .delete {
  margin-left: -7px;
  margin-top: -13px;
}
.sendbox .fixed-right-button {
  position: absolute;
  right: 0;
  top: calc(50% - 1.25em);
  font-size: 1.5rem !important;
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
