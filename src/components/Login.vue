<template>
  <section class="hero is-fullheight">
    <div class="hero-body">
      <div class="container has-text-centered">
        <div class="column is-4 is-offset-4">
          <div class="box has-background-shade-3">
            <form @submit.prevent="login">
              <h3 class="title has-text-grey">{{ appName }}</h3>
              <p class="subtitle has-text-grey">Login</p>
              <div class="field">
                <div class="control has-icons-left">
                  <input v-model="credentials.jid" class="input is-medium" type="text" name="jid" :placeholder="jidPlaceholder">
                  <span class="icon is-small is-left">
                    <i class="fa fa-user" />
                  </span>
                </div>
              </div>
              <div class="field">
                <div class="control has-icons-left">
                  <input v-model="credentials.password" class="input is-medium" type="password" name="password" placeholder="Password">
                  <span class="icon is-small is-left">
                    <i class="fa fa-lock" />
                  </span>
                </div>
              </div>
              <div class="field has-text-left pl-3">
                <o-checkbox v-model="credentials.remember" type="is-primary" class="has-text-grey-light">
                  Store my password in browser
                </o-checkbox>
              </div>
              <o-collapse v-if="isTransportsUserAllowed" class="card has-background-shade-3 mb-3" :open="false" aria-id="connection-settings">
                <template #trigger="props">
                  <div role="button" aria-controls="connection-settings" class="card-header">
                    <p class="card-header-title has-text-grey-light"><span class="fa fa-cog fa-fw mr-3" aria-hidden="true" />Connection settings</p>
                    <a class="card-header-icon has-text-grey-light">
                      <span class="fa fa-fw mr-3" :class="[props.open ? 'fa-caret-down': 'fa-caret-up']" aria-hidden="true" />
                    </a>
                  </div>
                </template>
                <div class="card-content">
                  <div class="field">
                    <div class="control">
                      <input v-model="transportsUser.websocket" class="input" type="url" name="websocket" placeholder="wss://chat.domain.ltd/xmpp-websocket" title="Websocket url">
                    </div>
                  </div>
                </div>
              </o-collapse>
              <div class="field">
                <button type="submit" class="button is-block is-primary is-medium is-fullwidth" :class="{ 'is-loading': isLoading }" :disabled="isDisabled"><span class="fa fa-sign-in fa-fw mr-3" aria-hidden="true" />Login</button>
              </div>
              <div v-if="error" class="message is-danger">
                <div class="message-body has-text-danger">{{ error }}</div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { mapState } from 'pinia'
import { useStore } from '@/store'

export default {
  name: 'Login',
  data () {
    return {
      credentials: {
        jid: '',
        password: '',
        remember: false,
      },
      transportsUser: {
        websocket: window.config.transports.websocket,
      },
      isLoading: false,
      error: '',
      isTransportsUserAllowed: window.config.isTransportsUserAllowed,
    }
  },
  computed: {
    isDisabled () {
      return this.isLoading || !this.credentials.jid || !this.credentials.password || !this.hasNetwork
    },
    jidPlaceholder () {
      return (typeof window.config.defaultDomain === 'string' && window.config.defaultDomain !== '') ? `username@${window.config.defaultDomain}` : 'username@domain.ltd'
    },
    appName () {
      return (typeof window.config.name === 'string' && window.config.name !== '') ? window.config.name : 'XMPP webchat'
    },
    ...mapState(useStore, ['hasNetwork']),
  },
  mounted () {
    // remove navbar spacing
    document.body.classList.remove('has-navbar-fixed-top')
    // get stored credentials
    const jid = localStorage.getItem('jid')
    if (jid) {
      this.credentials.jid = jid
    }
    const password = localStorage.getItem('p')
    if (password) {
      // auto login
      const reverse = (value) => value.split('').reverse().join('')
      this.credentials.password = reverse(atob(reverse(password)))
      this.login()
    }
  },
  methods: {
    async login () {
      this.error = ''
      const reverse = (value) => value.split('').reverse().join('')
      // check credentials are set
      if (this.credentials.jid === '' || this.credentials.password === '') {
        return
      }
      // call the auth service
      this.isLoading = true
      try {
        await this.$xmpp.create(this.credentials.jid, this.credentials.password, null, this.transportsUser, this)
        await this.$xmpp.connect()
        // authentication succeeded, route to requested page or default
        if (this.credentials.remember) {
          localStorage.setItem('p', reverse(btoa(reverse(this.credentials.password))))
        }
        if (this.$route.query.redirect !== undefined) {
          return this.$router.push(this.$route.query.redirect)
        }
        this.$router.push('/')
      } catch (error) {
        // authentication failed, display error
        this.error = error.message
      }
      // remove loading status
      this.isLoading = false
    },
  },
}
</script>
