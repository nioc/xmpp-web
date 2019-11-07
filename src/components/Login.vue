<template>
  <section class="hero is-light is-fullheight">
    <div class="hero-body">
      <div class="container has-text-centered">
        <div class="column is-4 is-offset-4">
          <div class="box">
            <form @submit.prevent="login">
              <h3 class="title has-text-grey">XMPP webchat</h3>
              <p class="subtitle has-text-grey">Login</p>
              <div class="field">
                <div class="control has-icons-left">
                  <input v-model="credentials.jid" class="input is-medium" type="text" name="jid" placeholder="username@domain.ltd">
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
              <div class="field has-text-left has-padding-left-7">
                <b-checkbox v-model="credentials.remember" type="is-danger" :class="{'has-text-danger': credentials.remember}">
                  {{ rememberLabel }}
                </b-checkbox>
              </div>
              <div class="field">
                <button type="submit" class="button is-block is-primary is-medium is-fullwidth" :class="{'is-loading': isLoading}" :disabled="isDisabled"><span class="fa fa-sign-in fa-fw has-margin-right-7" aria-hidden="true" />Login</button>
              </div>
              <div v-if="error" class="message is-danger">
                <div class="message-body">{{ error }}</div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import {mapState} from 'vuex'

export default {
  name: 'Login',
  data() {
    return {
      credentials: {
        jid: '',
        password: '',
        remember: false,
      },
      isLoading: false,
      error: '',
    }
  },
  computed: {
    isDisabled () {
      return this.isLoading || !this.credentials.jid || !this.credentials.password || !this.hasNetwork
    },
    rememberLabel () {
      return this.credentials.remember ? 'Store my password in browser, I accept the risk' : 'Do not store my password'
    },
    ...mapState(['hasNetwork']),    
  },
  mounted() {
    // remove navbar spacing
    document.body.classList.remove('has-navbar-fixed-top')
    // get stored credentials
    let jid = localStorage.getItem('jid')
    if (jid) {
      this.credentials.jid = jid
    }
    let password = localStorage.getItem('p')
    if (password) {
      // auto login
      let reverse = (value) => value.split('').reverse().join('')
      this.credentials.password = reverse(atob(reverse(password)))
      this.login()
    }
  },
  methods: {
    login () {
      let reverse = (value) => value.split('').reverse().join('')
      // check credentials are set
      if (this.credentials.jid === '' || this.credentials.password === '') {
        return
      }
      // call the auth service
      this.isLoading = true
      this.$xmpp.create(this.credentials.jid, this.credentials.password, this)
      this.$xmpp.connect()
      .then(() => {
        // authentication succeeded, route to requested page or default
        if (this.credentials.remember) {
          localStorage.setItem('p', reverse(btoa(reverse(this.credentials.password))))
        }
        if(this.$route.query.redirect !== undefined){
          return this.$router.push(this.$route.query.redirect)
        }
        this.$router.push('/')
      })
      .catch((error) => {
        // authentication failed, display error
        return this.error = error
      })
      .finally(() => {
        // remove loading status
        this.isLoading = false
      })
    },
  },
}
</script>
