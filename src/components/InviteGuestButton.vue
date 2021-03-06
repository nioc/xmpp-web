<template>
  <button class="button is-primary-ghost has-no-border is-shadowless" title="Guest invitation link" @click="getInviteLink()">
    <i class="fa fa-share-alt" aria-hidden="true" />
  </button>
</template>

<script>
export default {
  props: {
    roomJid: {
      type: String,
      required: true,
    },
  },
  methods: {
    getInviteLink () {
      const link = window.location.origin + window.location.pathname + this.$router.resolve({ name: 'gest', query: { join: this.roomJid } }).href
      this.$buefy.dialog.alert({
        title: 'Guest invitation link',
        message: `<p>You can provide the following link to anyone (without registration):</p><p class="is-family-code is-select-all is-size-7">${link}</p>`,
      })
    },
  },
}
</script>
