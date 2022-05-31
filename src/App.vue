<template>
  <div id="app" class="is-full-height">
    <router-view name="navbar" />
    <router-view />
  </div>
</template>

<script>

import { mapActions } from 'pinia'
import { useStore } from '@/store'

export default {
  name: 'App',
  mounted () {
    if (typeof window.config.name === 'string' && window.config.name !== '') {
      document.title = window.config.name
    }
    // handle network status
    this.setNetworkStatus(window.navigator.onLine)
    window.addEventListener('offline', this.notifyConnectivity)
    window.addEventListener('online', this.notifyConnectivity)
  },
  methods: {
    ...mapActions(useStore, ['setNetworkStatus']),
    notifyConnectivity (event) {
      this.setNetworkStatus(event.type === 'online')
    },
  },
}
</script>
