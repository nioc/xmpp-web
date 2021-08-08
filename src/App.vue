<template>
  <div id="app" class="is-full-height">
    <router-view name="navbar" />
    <router-view />
  </div>
</template>

<script>

export default {
  name: 'App',
  created () {
    // handle user preference for light mode
    if (localStorage.getItem('xmppWebLightMode')) {
      document.documentElement.setAttribute('data-theme', 'light')
    }
  },
  mounted () {
    // handle network status
    this.$store.commit('setNetworkStatus', window.navigator.onLine)
    window.addEventListener('offline', this.notifyConnectivity)
    window.addEventListener('online', this.notifyConnectivity)
  },
  methods: {
    // store network status
    notifyConnectivity (event) {
      this.$store.commit('setNetworkStatus', (event.type === 'online'))
    },
  },
}
</script>
