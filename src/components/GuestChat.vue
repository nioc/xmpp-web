<template>
  <section class="is-full-height">
    <div class="is-justify-content-center is-full-height">
      <chat v-if="displayChat" :jid="jid" :is-room="true" class="is-flex-grow-1" />
    </div>
  </section>
</template>

<script>
import Chat from '@/components/Chat.vue'
export default {
  name: 'Guest',
  components: {
    Chat,
  },
  props: {
    jid: {
      type: String,
      default: null,
    },
  },
  computed: {
    displayChat () { return this.jid !== null && this.$xmpp.nick !== null },
  },
  created () {
    if (this.$xmpp.nick === null) {
      this.$router.back()
    }
  },
  mounted () {
    // remove navbar spacing
    document.body.classList.remove('has-navbar-fixed-top')
  },
}
</script>
