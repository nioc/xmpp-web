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
        <presence-controller :is-navbar-item="true" />
        <div class="navbar-item has-dropdown is-hoverable">
          <a class="navbar-link is-arrowless"><avatar :jid="userJid" :display-jid="true" :size="32" /></a>
          <div class="navbar-dropdown is-right">
            <router-link class="navbar-item" :to="{ name: 'about' }" active-class="is-active"><i class="fa fa-info-circle fa-fw mr-3" />About</router-link>
            <router-link class="navbar-item" :to="{ name: 'profile' }" active-class="is-active"><i class="fa fa-user fa-fw mr-3" />Profile</router-link>
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
import PresenceController from '../components/PresenceController.vue'
import { mapState } from 'pinia'
import { useStore } from '@/store'
import { bugs } from '../../package.json'

export default {
  name: 'Navbar',
  components: {
    avatar,
    PresenceController,
  },
  data () {
    return {
      userJid: localStorage.getItem('barejid'),
      bugUrl: bugs.url,
    }
  },
  computed: {
    ...mapState(useStore, [
      'activeChat',
    ]),
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
      sessionStorage.clear()
      this.$router.replace('/login')
    },
  },
}
</script>
