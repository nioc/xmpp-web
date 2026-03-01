<template>
  <button class="button is-primary-ghost has-no-border is-shadowless" title="Configure room" @click="openConfigurationModal()">
    <i class="fa-solid fa-screwdriver-wrench" aria-hidden="true" />
  </button>
</template>

<script>
import RoomConfiguration from './RoomConfiguration.vue'

export default {
  name: 'RoomConfigurationButton',
  inject: [
    'jid',
  ],
  methods: {
    openConfigurationModal () {
      this.$oruga.modal.open({
        component: RoomConfiguration,
        hasModalCard: true,
        trapFocus: true,
        props: { roomJid: this.jid },
      })
    },
  },
}
</script>
