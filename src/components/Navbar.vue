<template>
  <nav class="navbar is-shade-2 is-fixed-top">
    <div class="navbar-brand">
      <router-link class="navbar-item" :to="{ name: 'home' }"><h1 class="has-text-weight-bold"><i class="fa fa-xmpp fa-fw" /><span class="ml-3 is-hidden-mobile">Home</span></h1></router-link>
      <span class="navbar-item is-hidden-tablet">{{ activeChat }}</span>
      <a id="navbar-burger" role="button" class="navbar-burger" aria-label="menu" aria-expanded="false" @click="toggleMenu">
        <span aria-hidden="true" class="is-primary" />
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </a>
    </div>
    <div id="navbar-menu" class="navbar-menu">
      <div class="navbar-end">
        <div class="navbar-item has-dropdown is-hoverable">
          <a class="navbar-link is-arrowless">
            <presence v-if="isOnline" :presence="presence" :display-label="false" />
            <presence v-else presence="off" :display-label="false" />
          </a>
          <div v-if="isOnline" class="navbar-dropdown is-right">
            <a v-for="presenceOption in ['chat', 'away', 'dnd']" :key="presenceOption" class="navbar-item" :class="{ 'is-active': presenceOption === presence }" @click="setPresence(presenceOption)"><presence :presence="presenceOption" /></a>
          </div>
        </div>
        <div class="navbar-item has-dropdown is-hoverable">
          <a class="navbar-link is-arrowless"><avatar :jid="userJid" :display-jid="true" :size="32" /></a>
          <div class="navbar-dropdown is-right">
            <router-link class="navbar-item" :to="{ name: 'about' }" active-class="is-active"><i class="fa fa-info-circle fa-fw mr-3" />About</router-link>
            <a class="navbar-item" :href="bugUrl" target="_blank" rel="noreferrer"><i class="fa fa-bug fa-fw mr-3" />Bug</a>
            <hr class="navbar-divider">
            <a class="navbar-item" @click="logout()"><i class="fa fa-sign-out fa-fw mr-3" />Logout</a>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script>
import avatar from '../components/Avatar.vue'
import presence from '../components/Presence.vue'
import { mapState } from 'pinia'
import { useStore } from '@/store'
import { bugs } from '../../package.json'

export default {
  name: 'Navbar',
  components: {
    avatar,
    presence,
  },
  data () {
    return {
      userJid: localStorage.getItem('barejid'),
      bugUrl: bugs.url,
    }
  },
  computed: {
    ...mapState(useStore, ['isOnline', 'activeChat', 'presence']),
  },
  mounted () {
    document.body.classList.add('has-navbar-fixed-top')
  },
  methods: {
    toggleMenu (e) {
      e.target.classList.toggle('is-active')
      document.getElementById('navbar-menu').classList.toggle('is-active')
    },
    async logout () {
      await this.$xmpp.disconnect()
      this.$store.clear()
      localStorage.clear()
      this.$router.replace('/login')
    },
    setPresence (presence) {
      this.$xmpp.sendPresence({ show: presence })
    },
  },
}
</script>
