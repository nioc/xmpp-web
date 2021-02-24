<template>
  <button class="button is-primary-ghost has-no-border is-shadowless" title="Get history" :class="{'is-loading': isLoadingPreviousMessages}" @click="getPreviousMessages()">
    <i class="fa fa-history" aria-hidden="true" />
  </button>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'RetrieveHistoryButton',
  data () {
    return {
      firstMessageId: null,
      isLoadingPreviousMessages: false,
    }
  },
  computed: {
    ...mapState([
      'activeChat',
    ]),
  },
  watch: {
    activeChat: function () {
      this.firstMessageId = null
    },
  },
  methods: {
    // ask for messages archive (update messages in store)
    async getPreviousMessages () {
      this.isLoadingPreviousMessages = true
      const paging = await this.$xmpp.searchHistory(this.activeChat, this.firstMessageId)
      if (paging) {
        // store first displayed message
        this.firstMessageId = paging.first
      }
      this.isLoadingPreviousMessages = false
    },
  },
}
</script>
