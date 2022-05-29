<template>
  <button class="button is-warning-ghost has-no-border is-shadowless" :title="isBookmarked ? 'Unbookmark room' : 'Bookmark room'" @click="bookmarkRoom()">
    <i class="fa" :class="isBookmarked ? 'fa-star' : 'fa-star-o' " aria-hidden="true" />
  </button>
</template>
<script>

export default {
  name: 'BookmarkButton',
  props: {
    jid: {
      type: String,
      required: true,
    },
  },
  computed: {
    isBookmarked () { return this.$store.isBookmarked(this.jid) },
  },
  methods: {
    async bookmarkRoom () {
      await this.$xmpp.bookmarkRoom(!this.isBookmarked, this.jid)
    },
  },
}
</script>
