<template>
  <div class="mx-3">
    <button v-for="[reaction, users] in reactionsByValue" :key="reaction" :title="users.join('\n')" class="reaction button" :class="{ 'is-me': includeUser(users) }" :data-emoji="reaction" @click="() => toggleReaction(reaction)">{{ reaction }} {{ users.length }}</button>
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
    reactions () {
      return this.$store.getMessageReactions(this.isRoom, this.isRoom ? this.message.stanzaId : this.message.id)
    },
    userReactions () {
      return this.reactions
        .filter((userReaction) => userReaction.from === this.$xmpp.fullJid.local)
        .reduce((acc, { reactions }) => {
          reactions.forEach((reaction) => {
            acc.push(reaction)
          })
          return acc
        }, [])
    },
    reactionsByValue () {
      const map = new Map()
      this.reactions
        .forEach(({ reactions, from }) => {
          reactions.forEach((reaction) => {
            if (!map.has(reaction)) {
              map.set(reaction, [])
            }
            map.get(reaction).push(from)
          })
        })
      return map
    },
  },
  methods: {
    includeUser (users) {
      return users.includes(this.$xmpp.fullJid.local)
    },
    addReaction (reaction) {
      if (this.userReactions.includes(reaction)) {
        return
      }
      this.$xmpp.sendReactions(this.jid, this.isRoom, this.message, [...this.userReactions, reaction])
    },
    toggleReaction (reaction) {
      const userReactions = this.userReactions.slice()
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
