<template>
  <div class="mx-4 my-2 is-flex" :class="{ 'is-flex-direction-row-reverse': isUser(message.from) }">
    <avatar :jid="(isRoom && message.from.bare !== userJid.bare) ? message.from.full : message.from.bare" :display-jid="false" />
    <div>
      <message :display-nick="isRoom" />
      <reactions :class="{ 'is-pulled-right': isUser(message.from) }" />
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import Avatar from '../components/Avatar.vue'
import Message from '../components/Message.vue'
import Reactions from '../components/Reactions.vue'

export default {
  name: 'Chat',
  components: {
    Avatar,
    Message,
    Reactions,
  },
  inject: [
    'jid',
    'isRoom',
  ],
  provide() {
    return {
      message: computed(() => this.message),
    }
  },
  props: {
    message: {
      type: Object,
      required: true,
    },
  },
  computed: {
    userJid () {
      return this.$xmpp.fullJid
    },
  },
  methods: {
    // check if a jid is current user (including MUC nick)
    isUser (jid) {
      return jid.bare === this.userJid.bare || jid.resource === this.userJid.local || jid.resource === this.$xmpp.nick
    },
  },
}
</script>
