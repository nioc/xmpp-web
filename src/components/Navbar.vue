<template>
  <nav class="navbar is-primary is-fixed-top">
    <div class="navbar-brand">
      <router-link class="navbar-item" :to="{ name: 'home' }"><h1 class="has-text-weight-bold">Chat</h1></router-link>
      <a role="button" id="navbar-burger" class="navbar-burger" @click="toggleMenu" aria-label="menu" aria-expanded="false">
        <span aria-hidden="true" class="is-primary" />
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </a>
    </div>
    <div class="navbar-menu" id="navbar-menu">
      <div class="navbar-start">
        <router-link class="navbar-item" :to="{ name: 'home' }"><i class="fa fa-xmpp fa-fw" />Home</router-link>
      </div>
      <div class="navbar-end">
        <div class="navbar-item has-dropdown is-hoverable">
          <a class="navbar-link is-arrowless is-hidden-mobile"><presence :presence="user.presence" :display-label="false" /></a>
          <div class="navbar-dropdown is-right">
            <a v-for="presence in ['chat', 'away', 'dnd']" :key="presence" class="navbar-item" @click="setPresence(presence)" :class="{'is-active': presence === user.presence}"><presence :presence="presence" /></a>
          </div>
        </div>
        <div class="navbar-item has-dropdown is-hoverable">
          <a class="navbar-link is-arrowless"><avatar :jid="user.jid" :display-jid="true" :size="32" /></a>
          <div class="navbar-dropdown is-right">
            <router-link class="navbar-item" to="/profile"><i class="fa fa-user-circle fa-fw has-margin-right-7" />Profile</router-link>
            <hr class="navbar-divider">
            <router-link class="navbar-item" to="/about"><i class="fa fa-info-circle fa-fw has-margin-right-7" />About</router-link>
            <a class="navbar-item" href="https://github.com/nioc/xmpp-web/issues/new" target="_blank" rel="noreferrer"><i class="fa fa-bug fa-fw has-margin-right-7" />Bug</a>
            <hr class="navbar-divider">
            <a class="navbar-item" @click="logout()"><i class="fa fa-sign-out fa-fw has-margin-right-7" />Logout</a>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script>
import avatar from '@/components/Avatar'
import presence from '@/components/Presence'

export default {
  name: 'Navbar',
  components: {
    avatar,
    presence,
  },
  data() {
    return {
      user: {
        jid: localStorage.getItem('jid'),
        presence: 'chat'
      },
    }
  },
  methods: {
    toggleMenu (e) {
      e.target.classList.toggle('is-active')
      document.getElementById('navbar-menu').classList.toggle('is-active')
    },
    logout () {
      this.$xmpp.disconnect()
      localStorage.clear()
      this.$router.replace('/login')
    },
    setPresence(presence) {
      this.$xmpp.sendPresence({show: presence})
    },
  },
  mounted() {
    document.body.classList.add('has-navbar-fixed-top')
    this.$bus.$on('myPresence', (presence) => this.user.presence = presence)
  },
}
</script>
