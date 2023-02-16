<template>
  <div class="is-hoverable" :class="[{ 'is-right': isRight }, isNavbarItem ? 'navbar-item has-dropdown' : 'dropdown']">
    <a :class="[isNavbarItem ? 'navbar-link is-arrowless' : 'dropdown-trigger']">
      <presence v-if="isOnline" :presence="presence" :display-label="false" />
      <presence v-else presence="off" :display-label="false" />
    </a>
    <div id="dropdown-menu" :class="{ 'dropdown-menu': !isNavbarItem }" role="menu">
      <div v-if="isOnline" :class="[isNavbarItem ? 'navbar-dropdown is-right' : 'dropdown-content']">
        <a v-for="presenceOption in ['chat', 'away', 'dnd']" :key="presenceOption" :class="[{ 'is-active': presenceOption === presence }, isNavbarItem ? 'navbar-item' : 'dropdown-item']" @click="setPresence(presenceOption)"><presence :presence="presenceOption" /></a>
        <hr :class="[isNavbarItem ? 'navbar-divider' : 'dropdown-divider']">
        <div :class="[isNavbarItem ? 'navbar-item' : 'dropdown-item']">
          <o-switch v-model="isAutoPresence" title="You will be seen away when the browser is not active" class="has-no-wrap" @change="setAutoPresence"><span class="icon mr-1"><i class="fa fa-moon-o fa-fw" aria-hidden="true" /></span>Set away when inactive</o-switch>
        </div>
        <notifications-switch :class="[isNavbarItem ? 'navbar-item' : 'dropdown-item']" />
        <div :class="[isNavbarItem ? 'navbar-item' : 'dropdown-item']">
          <o-switch v-model="isSendingTypingChatStatesSwitch" title="Notify your partner(s) that you are typing or paused" class="has-no-wrap"><span class="icon mr-1"><i class="fa fa-pencil-square-o fa-fw" aria-hidden="true" /></span>Send typing states</o-switch>
        </div>
        <div :class="[isNavbarItem ? 'navbar-item' : 'dropdown-item']">
          <o-switch v-model="isSendingInactiveChatStatesSwitch" title="Notify your partner(s) that you are not looking the conversation" class="has-no-wrap"><span class="icon mr-1"><i class="fa fa-eye-slash fa-fw" aria-hidden="true" /></span>Send inactive chat states</o-switch>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import presence from '../components/Presence.vue'
import NotificationsSwitch from '../components/NotificationsSwitch.vue'
import { mapState, mapWritableState } from 'pinia'
import { useStore } from '@/store'

const lsNotTypingChatStatesKey = 'isNotSendingTypingChatStates'
const lsInactiveChatStatesKey = 'isSendingInactiveChatStates'

export default {
  name: 'PresenceController',
  components: {
    presence,
    NotificationsSwitch,
  },
  props: {
    isNavbarItem: {
      type: Boolean,
      default: false,
    },
    isRight: {
      type: Boolean,
      default: false,
    },
  },
  data () {
    return {
      isAutoPresence: false,
    }
  },
  computed: {
    ...mapState(useStore, [
      'isOnline',
      'presence',
    ]),
    ...mapWritableState(useStore, [
      'isSendingTypingChatStates',
      'isSendingInactiveChatStates',
    ]),
    isSendingTypingChatStatesSwitch: {
      get() {
        return this.isSendingTypingChatStates
      },
      set(isSendingTypingChatStates) {
        if (!isSendingTypingChatStates) {
          localStorage.setItem(lsNotTypingChatStatesKey, true)
        } else {
          localStorage.removeItem(lsNotTypingChatStatesKey)
        }
        this.isSendingTypingChatStates = isSendingTypingChatStates
      },
    },
    isSendingInactiveChatStatesSwitch: {
      get() {
        return this.isSendingInactiveChatStates
      },
      set(isSendingInactiveChatStates) {
        if (isSendingInactiveChatStates) {
          localStorage.setItem(lsInactiveChatStatesKey, true)
        } else {
          localStorage.removeItem(lsInactiveChatStatesKey)
        }
        this.isSendingInactiveChatStates = isSendingInactiveChatStates
      },
    },
  },
  mounted () {
    this.isSendingTypingChatStates = localStorage.getItem(lsNotTypingChatStatesKey) === null
    this.isSendingInactiveChatStates = localStorage.getItem(lsInactiveChatStatesKey) !== null
  },
  methods: {
    setPresence (presence) {
      this.$xmpp.sendPresence({ show: presence })
    },
    setAutoPresence () {
      if (this.isAutoPresence) {
        window.addEventListener('blur', this.sendAutoPresence)
        window.addEventListener('focus', this.sendAutoPresence)
      } else {
        window.removeEventListener('blur', this.sendAutoPresence)
        window.removeEventListener('focus', this.sendAutoPresence)
      }
    },
    sendAutoPresence (event) {
      if (this.$xmpp.client) {
        this.setPresence(event.type === 'blur' ? 'away' : 'chat')
      }
    },
  },
}
</script>
