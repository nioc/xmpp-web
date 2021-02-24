<template>
  <main class="is-flex is-flex-direction-column is-justify-content-space-between is-full-height has-background-shade-4 is-relative">
    <div class="toolbar has-border-bottom-shade-3">
      <router-link v-if="!$xmpp.isAnonymous" :to="{name: 'home'}" class="button is-primary-ghost has-no-border is-shadowless" :class="{'is-hidden-tablet': jid}" title="Back to contacts"><i class="fa fa-arrow-circle-left" aria-hidden="true" /></router-link>
      <i class="fa fa-lg fa-pencil-square-o" :class="chatStateClass" aria-hidden="true" />
      <span class="is-flex is-align-items-center">
        <room-occupants v-if="isRoom" :room-jid="jid" />
        <bookmark-button v-if="isRoom && !$xmpp.isAnonymous" :jid="jid" />
        <room-configuration-button v-if="isRoom && !$xmpp.isAnonymous" :room-jid="jid" />
        <invite-guest-button v-if="isRoom" :room-jid="jid" />
        <retrieve-history-button />
      </span>
    </div>
    <div id="messages-container" class="messages-container">
      <div v-for="message in messagesWithJid" :key="message.id" class="mx-4 my-2 is-flex" :class="{'is-flex-direction-row-reverse': isUser(message.from)}">
        <avatar :jid="(isRoom && message.from.bare !== userJid.bare) ? message.from.full : message.from.bare" :display-jid="false" />
        <message :message="message" />
      </div>
    </div>
    <sendbox :is-room="isRoom" />
  </main>
</template>

<script>
import avatar from '@/components/Avatar'
import message from '@/components/Message'
import InviteGuestButton from '@/components/InviteGuestButton'
import BookmarkButton from '@/components/BookmarkButton'
import RoomConfigurationButton from '@/components/RoomConfigurationButton'
import RetrieveHistoryButton from '@/components/RetrieveHistoryButton'
import RoomOccupants from '@/components/RoomOccupants.vue'
import Sendbox from '@/components/Sendbox'
import { mapState } from 'vuex'

export default {
  name: 'Chat',
  components: {
    avatar,
    message,
    InviteGuestButton,
    BookmarkButton,
    RoomConfigurationButton,
    RetrieveHistoryButton,
    RoomOccupants,
    Sendbox,
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
      chatState: '',
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
