<template>
  <span :class="{'has-jid': displayJid}">
    <figure :class="'image is-'+size+'x'+size">
      <img class="is-rounded" :src="uri" :title="jid">
      <i v-if="presence" class="fa fa-circle presence-icon" :class="presenceClass" />
    </figure>
    <span v-if="displayJid" class="ml-3">{{ jid }}</span>
  </span>
</template>

<script>
export default {
  name: 'Avatar',
  props: {
    jid: {
      type: String,
      required: true,
    },
    displayJid: {
      type: Boolean,
      default: false,
    },
    presence: {
      type: String,
      default: null,
    },
    size: {
      type: Number,
      default: 32,
    },
  },
  data () {
    return {
      uri: null,
    }
  },
  computed: {
    presenceClass () {
      switch (this.presence) {
        case 'dnd':
          return 'has-text-danger'
        case 'away':
        case 'xa':
          return 'has-text-warning'
        default:
          return 'has-text-success'
      }
    },
  },
  async mounted () {
    this.uri = await this.$xmpp.getJidAvatar(this.jid)
  },
}
</script>

<style>
.has-jid {
  display: flex;
  align-items: center;
}
.presence-icon {
  font-size: 0.7em !important;
  position: absolute;
  right: -2px;
  bottom: -4px;
}
</style>
