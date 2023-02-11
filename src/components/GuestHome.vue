<template>
  <section class="hero is-full-height has-background-shade-4">
    <div class="is-flex is-justify-content-center is-full-height" style="overflow-y:auto;">
      <!-- Guest access not allowed message -->
      <div v-if="server === null" class="message is-danger is-light is-align-self-center">
        <div class="message-body has-text-danger">Anonymous access is not allowed<br>Please <router-link :to="{ name: 'login' }">login</router-link></div>
      </div>
      <!-- User nickname form -->
      <div v-else class="is-align-self-center">
        <div class="box has-background-shade-3 mx-1" style="max-width: 420px;">
          <form class="has-text-centered" @submit.prevent="join">
            <h3 class="title has-text-grey is-flex is-justify-content-center is-align-items-center"><img class="image is-48x48 is-inline mr-2" :src="logoSrc">{{ appName }}</h3>
            <p class="subtitle has-text-grey">Guest</p>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <p v-if="description" class="content has-text-grey is-size-7" v-html="description" />
            <div class="field">
              <div class="control has-icons-left">
                <input v-model="nick" autofocus class="input is-medium" type="text" name="nick" placeholder="Nickname">
                <span class="icon is-small is-left">
                  <i class="fa fa-user" />
                </span>
              </div>
            </div>
            <div class="field">
              <button type="submit" class="button is-medium is-block is-primary is-fullwidth" :disabled="!hasValidNick">
                <span class="icon" aria-hidden="true">
                  <i class="fa fa-sign-in" /></span>
                <span>Join</span>
              </button>
            </div>
            <div v-if="error" class="message is-danger">
              <div class="message-body has-text-danger">{{ error }}</div>
            </div>
          </form>
        </div>
      </div>
    </div>
    <version />
  </section>
</template>

<script>
import sanitizeHtml from 'sanitize-html'
import Version from '../components/Version.vue'

export default {
  name: 'GuestHome',
  components: {
    Version,
  },
  props: {
    requestedJid: {
      type: String,
      default: null,
    },
  },
  data () {
    return {
      nick: '',
      isLoading: false,
      error: '',
      transportsUser: {
        websocket: window.config.transports.websocket,
        bosh: window.config.transports.bosh,
      },
      server: window.config.anonymousHost,
    }
  },
  computed: {
    hasValidNick () { return this.nick.length > 2 },
    requestedFullJid () {
      if (!this.requestedJid) {
        return null
      }
      if (/\S+@\S+\S+/.test(this.requestedJid) || !this.$xmpp.defaultMuc) {
        return this.requestedJid
      }
      return `${this.requestedJid}@${this.$xmpp.defaultMuc}`
    },
    appName () {
      return (typeof window.config.name === 'string' && window.config.name !== '') ? window.config.name : 'XMPP webchat'
    },
    logoSrc () {
      return window.config.logoUrl || '/img/icons/android-chrome-192x192.png'
    },
    description () {
      return window.config.guestDescription ? sanitizeHtml(window.config.guestDescription) : null
    },
  },
  mounted () {
    // remove navbar spacing
    document.body.classList.remove('has-navbar-fixed-top')
  },
  methods: {
    async join () {
      this.isLoading = true
      try {
        await this.$xmpp.create(null, null, this.server, this.transportsUser, this)
        this.$xmpp.setNick(this.nick)
        await this.$xmpp.connect()
        this.$router.push({ name: 'guestRooms', state: { nick: this.nick, requestedJid: this.requestedFullJid } })
      } catch (error) {
        this.error = error.message
      }
      this.isLoading = false
    },
  },
}
</script>
