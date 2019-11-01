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
                  <input class="input is-medium" type="text" name="jid" placeholder="username@domain.ltd" v-model="credentials.jid">
                  <span class="icon is-small is-left">
                    <i class="fa fa-user" />
                  </span>
                </div>
              </div>
              <div class="field">
                <div class="control has-icons-left">
                  <input class="input is-medium" type="password" name="password" placeholder="Password" v-model="credentials.password">
                  <span class="icon is-small is-left">
                    <i class="fa fa-lock" />
                  </span>
                </div>
              </div>
              <div class="field">
                <button type="submit" class="button is-block is-primary is-medium is-fullwidth" :class="{ 'is-loading': isLoading }" :disabled="isDisabled"><span class="fa fa-sign-in fa-fw has-margin-right-7" aria-hidden="true" />Login</button>
              </div>
              <div class="message is-danger" v-if="error">
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
export default {
  name: 'Login',
  data() {
    return {
      credentials: {
        jid: '',
        password: '',
      },
      isLoading: false,
      error: '',
    };
  },
  computed: {
    isDisabled () {
      return this.isLoading || !this.credentials.jid || !this.credentials.password
    }
  },
  methods: {
    login () {
      // check credentials are set
      if (this.credentials.jid === '' || this.credentials.password === '') {
        return
      }
      // call the auth service
      this.isLoading = true
      this.$xmpp.connect(this.credentials.jid, this.credentials.password, this)
      .then(() => {
        // authentication succeeded, route to requested page or default
        if(this.$route.query.redirect != null){
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
    }
  },
  mounted() {
    // remove navbar spacing
    document.body.classList.remove('has-navbar-fixed-top')
  },
}
</script>
