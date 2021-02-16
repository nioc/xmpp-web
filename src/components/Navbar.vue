<template>
  <nav class="navbar is-shade-2 is-fixed-top">
    <div class="navbar-brand">
      <router-link class="navbar-item is-hidden-mobile" :to="{name: 'home'}"><h1 class="has-text-weight-bold"><i class="fa fa-xmpp fa-fw has-margin-right-7" />Home</h1></router-link>
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
            <presence v-if="isOnline" :presence="user.presence" :display-label="false" />
            <presence v-else presence="off" :display-label="false" />
          </a>
          <div v-if="isOnline" class="navbar-dropdown is-right">
            <a v-for="presence in ['chat', 'away', 'dnd']" :key="presence" class="navbar-item" :class="{'is-active': presence === user.presence}" @click="setPresence(presence)"><presence :presence="presence" /></a>
          </div>
        </div>
        <div class="navbar-item has-dropdown is-hoverable">
          <a class="navbar-link is-arrowless"><avatar :jid="user.jid" :display-jid="true" :size="32" /></a>
          <div class="navbar-dropdown is-right">
            <router-link class="navbar-item" to="/profile"><i class="fa fa-user-circle fa-fw has-margin-right-7" />Profile</router-link>
            <hr class="navbar-divider">
            <router-link class="navbar-item" :to="{name: 'about'}" active-class="is-active"><i class="fa fa-info-circle fa-fw has-margin-right-7" />About</router-link>
            <a class="navbar-item" :href="bugUrl" target="_blank" rel="noreferrer"><i class="fa fa-bug fa-fw has-margin-right-7" />Bug</a>
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
import { mapState } from 'vuex'
import { bugs } from '../../package.json'

export default {
  name: 'Navbar',
  components: {
    avatar,
    presence,
  },
  data () {
    return {
      user: {
        jid: localStorage.getItem('jid'),
        presence: 'chat',
      },
      bugUrl: bugs.url,
    }
  },
  computed: {
    ...mapState(['isOnline', 'activeChat']),
  },
  mounted () {
    document.body.classList.add('has-navbar-fixed-top')
    this.$bus.$on('myPresence', (presence) => {
      this.user.presence = presence
      return this.user.presence
    })
  },
  methods: {
    toggleMenu (e) {
      e.target.classList.toggle('is-active')
      document.getElementById('navbar-menu').classList.toggle('is-active')
    },
    async logout () {
      await this.$xmpp.disconnect()
      localStorage.clear()
      this.$router.replace('/login')
    },
    setPresence (presence) {
      this.$xmpp.sendPresence({ show: presence })
    },
  },
}
</script>
