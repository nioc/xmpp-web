<template>
  <span :class="{ 'has-jid': displayJid }">
    <figure :class="'image is-'+size+'x'+size">
      <img class="is-rounded" :style="style" :src="uri" :title="title">
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
    status: {
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
      style: null,
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
    title () {
      if (this.status !== null) {
        return `${this.jid} / ${this.status}`
      }
      return this.jid
    },
  },
  watch: {
    jid: 'getJidAvatar',
  },
  created () {
    this.getJidAvatar()
  },
  methods: {
    async getJidAvatar () {
      const avatar = await this.$xmpp.getJidAvatar(this.jid)
      this.uri = avatar.uri
      if (avatar.isDefault) {
        const angle = this.jid
          .split('')
          .reduce((acc, letter) => {
            return acc + letter.charCodeAt(0)
          }, 0) % 360
        this.style = `filter: hue-rotate(${angle}deg);`
      }
    },
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
