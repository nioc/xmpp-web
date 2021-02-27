<template>
  <main class="section">
    <form class="field has-addons" @submit.prevent="createRoom">
      <div class="control has-icons-left is-flex-grow-1">
        <input v-model="roomJid" autofocus class="input" type="text" :placeholder="roomPlaceholder" title="Enter room Jid">
        <span class="icon is-small is-left">
          <i class="fa fa-tag" />
        </span>
      </div>
      <div class="control">
        <button type="submit" class="button is-primary" :class="{'is-loading': isLoading}" :disabled="!hasValidJid">
          <span class="icon">
            <i class="fa fa-plus-square" /></span>
          <span>Create</span>
        </button>
      </div>
    </form>
    <div v-if="error" class="message is-danger">
      <div class="message-body has-text-danger">{{ error }}</div>
    </div>
  </main>
</template>

<script>
import RoomConfiguration from '@/components/RoomConfiguration'

export default {
  name: 'RoomCreation',
  data () {
    return {
      error: '',
      roomJid: '',
      isLoading: false,
    }
  },
  computed: {
    roomPlaceholder () { return this.$xmpp.defaultMuc ? `room@${this.$xmpp.defaultMuc}` : `room@conference.${this.$xmpp.defaultDomain}` },
    hasValidJid () { return this.$xmpp.defaultMuc ? this.roomJid.length > 2 : /\S+@\S+\S+/.test(this.roomJid) },
  },
  methods: {
    async createRoom () {
      if (!/\S+@\S+\S+/.test(this.roomJid)) {
        if (!this.$xmpp.defaultMuc) {
          return
        }
        this.roomJid = this.roomJid + '@' + this.$xmpp.defaultMuc
      }
      this.isLoading = true
      try {
        this.error = ''
        const result = await this.$xmpp.createRoom(this.roomJid)
        if (result) {
          const modal = this.$buefy.modal.open({
            parent: this,
            component: RoomConfiguration,
            hasModalCard: true,
            trapFocus: true,
            props: {
              roomJid: this.roomJid,
              hasCancelButton: false,
            },
            canCancel: false,
          })
          modal.$on('saved', () => {
            this.$router.push({ name: 'groupchat', params: { jid: this.roomJid } })
          })
        }
      } catch (error) {
        this.error = error.message
      }
      this.isLoading = false
    },
  },
}
</script>
