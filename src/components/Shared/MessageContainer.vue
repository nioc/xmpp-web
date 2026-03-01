<template>
  <div class="mx-4 my-2 is-flex" :class="{ 'is-flex-direction-row-reverse': isUser(message.from) }">
    <avatar :jid="(isRoom && message.from.bare !== userJid.bare) ? message.from.full : message.from.bare" :display-jid="false" />
    <div>
      <message ref="messageHoverable" :display-nick="isRoom" />
      <reactions :class="{ 'is-pulled-right': isUser(message.from) }" :display-add-button="isHovered" />
    </div>
  </div>
</template>

<script>
import { computed, ref } from 'vue'
import { useElementHover } from '@vueuse/core'
import Avatar from './Avatar.vue'
import Message from './Message.vue'
import Reactions from './Reactions.vue'

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
  setup() {
    const messageHoverable = ref(null)
    const isHovered = useElementHover(messageHoverable, { delayEnter: 500, delayLeave: 2000 })
    return { messageHoverable, isHovered }
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
