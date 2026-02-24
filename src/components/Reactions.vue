<template>
  <div v-if="message.reactions.length" class="mx-3">
    <span v-for="(users, reaction) in reactionsByValue" :key="reaction" :title="displayNick ? users.join('\n') : null">{{ reaction }}</span>
  </div>
</template>

<script>

export default {
  name: 'Reactions',
  props: {
    message: {
      type: Object,
      required: true,
    },
    displayNick: {
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
}
</script>
