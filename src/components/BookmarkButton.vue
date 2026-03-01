<template>
  <button class="button is-warning-ghost has-no-border is-shadowless" :title="isBookmarked ? 'Unbookmark room' : 'Bookmark room'" @click="bookmarkRoom()">
    <i class="fa-star" :class="isBookmarked ? 'fa-solid' : 'fa-regular' " aria-hidden="true" />
  </button>
</template>
<script>

export default {
  name: 'BookmarkButton',
  inject: [
    'jid',
  ],
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
