<template>
  <button class="button is-primary-ghost has-no-border is-shadowless" title="Guest invitation link" @click="getInviteLink()">
    <i class="fa-solid fa-share-nodes" aria-hidden="true" />
  </button>
</template>

<script>
import Modal from './../components/Modal.vue'

export default {
  name: 'InviteGuestButton',
  inject: [
    'jid',
  ],
  methods: {
    getInviteLink () {
      const link = window.location.origin + window.location.pathname + this.$router.resolve({ name: 'guest', query: { join: this.jid } }).href
      this.$oruga.modal.open({
        component: Modal,
        trapFocus: true,
        props: {
          title: 'Guest invitation link',
          message: `<p>You can provide the following link to anyone (without registration):</p><p class="is-family-code is-select-all is-size-7">${link}</p>`,
        },
      })
    },
  },
}
</script>
