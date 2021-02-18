<template>
  <button class="button has-text-primary has-no-border is-shadowless" :title="isBookmarked ? 'Unbookmark room' : 'Bookmark room'" @click="bookmarkRoom()">
    <i class="fa has-text-warning" :class="isBookmarked ? 'fa-star' : 'fa-star-o' " aria-hidden="true" />
  </button>
</template>
<script>

export default {
  props: {
    jid: {
      type: String,
      required: true,
    },
  },
  computed: {
    isBookmarked () { return this.$store.getters.isBookmarked(this.jid) },
  },
  methods: {
    async bookmarkRoom () {
      await this.$xmpp.bookmarkRoom(!this.isBookmarked, this.jid)
    },
  },
}
</script>
