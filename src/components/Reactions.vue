<template>
  <div v-if="message.reactions.length" class="mx-3">
    <button v-for="(users, reaction) in reactionsByValue" :key="reaction" :title="users.join('\n')" class="reaction button" :class="{ 'is-me': includeUser(users) }" @click="() => toggleReaction(reaction)">{{ reaction }} {{ users.length }}</button>
    <emoji-picker button-class="reaction button px-3" button-title="Add reaction" @emoji-picked="addReaction" />
  </div>
</template>

<script>
import EmojiPicker from '../components/EmojiPicker.vue'
export default {
  name: 'Reactions',
  components: {
    EmojiPicker,
  },
  props: {
    message: {
      type: Object,
      required: true,
    },
    jid: {
      type: String,
      default: null,
    },
    isRoom: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    reactionsByValue () {
      return this.message.reactions.reduce((acc, { reaction, from }) => {
        if (!acc[reaction]) {
          acc[reaction] = []
        }
        acc[reaction].push(from)
        return acc
      }, {})
    },
  },
  methods: {
    includeUser (users) {
      return users.includes(this.$xmpp.fullJid.local)
    },
    addReaction (emoji) {
      const userReactions = this.message.reactions
        .filter((userReaction) => userReaction.from === this.$xmpp.fullJid.local)
        .map((userReaction) => userReaction.reaction)
      if (userReactions.includes(emoji)) {
        return
      }
      userReactions.push(emoji)
      this.$xmpp.sendReactions(this.jid, this.isRoom, this.message, userReactions)
    },
    toggleReaction (reaction) {
      const userReactions = this.message.reactions
        .filter((userReaction) => userReaction.from === this.$xmpp.fullJid.local)
        .map((userReaction) => userReaction.reaction)
      const reactionIndex = userReactions
        .findIndex((userReaction) => userReaction === reaction)
      // update user reactions
      if (reactionIndex === -1) {
        userReactions.push(reaction)
      } else {
        userReactions.splice(reactionIndex, 1)
      }
      this.$xmpp.sendReactions(this.jid, this.isRoom, this.message, userReactions)
    },
  },
}
</script>
