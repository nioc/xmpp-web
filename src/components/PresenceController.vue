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
          <o-switch v-model="isAutoPresence" title="You will be seen away when the browser is not active" @change="setAutoPresence">Set away when inactive</o-switch>
        </div>
        <notifications-switch :class="[isNavbarItem ? 'navbar-item' : 'dropdown-item']" />
      </div>
    </div>
  </div>
</template>

<script>
import presence from '../components/Presence.vue'
import NotificationsSwitch from '../components/NotificationsSwitch.vue'
import { mapState } from 'pinia'
import { useStore } from '@/store'

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
