<template>
  <div class="main-container is-block-mobile">
    <aside class="contacts-list is-block-mobile has-background-white-bis" :class="{'is-hidden-mobile': !displayContact}">
      <contacts />
    </aside>
    <router-view />
  </div>
</template>

<script>
import contacts from '@/components/Contacts'

export default {
  name: 'Home',
  components: {
    contacts,
  },
  computed: {
    displayContact () {
      return this.$route.meta.displayContact
    },
    userJid () {
      return this.$xmpp.fullJid
    },
  },
  mounted() {
    // check if user is connected
    if (this.userJid === null) {
      // user not connected, return to login page
      localStorage.removeItem('auth')
      this.$router.replace({name: 'login', query: {redirect: this.$route.fullPath}})
    }
    // disconnect before leaving page
    window.addEventListener('beforeunload', () => {
      this.$xmpp.disconnect()
    })
  },
}
</script>

<style scoped>
.main-container {
  height: calc(100vh - 3.25rem);
  align-items: stretch;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}
.contacts-list {
  overflow-y: auto;
  flex-shrink: 0;
  height: 100%;
}
</style>
