<template>
  <div v-if="hasAuthConfirmed" class="is-flex-tablet is-block-mobile is-full-height">
    <aside class="is-full-height-scrollable is-block-mobile is-flex-shrink-0 has-background-shade-3 is-flex is-flex-direction-column is-justify-content-space-between" :class="{ 'is-hidden-mobile': !displayContact }">
      <contacts />
      <version />
    </aside>
    <router-view class="is-flex-grow-1" />
  </div>
</template>

<script>
import contacts from '../components/Contacts.vue'
import Version from '../components/Version.vue'

export default {
  name: 'Home',
  components: {
    contacts,
    Version,
  },
  props: {
    jid: {
      type: String,
      default: null,
    },
  },
  data () {
    return {
      hasAuthConfirmed: false,
    }
  },
  computed: {
    displayContact () {
      return this.$route.meta.displayContact
    },
    userJid () {
      return this.$xmpp.fullJid
    },
  },
  // watch network status for resuming session
  watch: {
    jid: function resetActiveChat () {
      if (this.jid === null) {
        this.$store.setActiveChat({
          activeChat: null,
        })
      }
    },
  },
  created () {
    // check if user is connected
    if (this.userJid === null) {
      // user not connected, return to login page
      localStorage.removeItem('auth')
      return this.$router.replace({ name: 'login', query: { redirect: this.$route.fullPath } })
    }
    this.hasAuthConfirmed = true
    // disconnect before leaving page
    window.addEventListener('beforeunload', async () => {
      await this.$xmpp.disconnect()
    })
  },
}
</script>
