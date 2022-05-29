<template>
  <button class="button is-primary-ghost has-no-border is-shadowless" title="Get history" :class="{ 'is-loading': isLoadingPreviousMessages }" :disabled="isDisabled" @click="getPreviousMessages()">
    <i class="fa fa-history" aria-hidden="true" />
  </button>
</template>

<script>
import { mapState } from 'pinia'
import { useStore } from '@/store'

export default {
  name: 'RetrieveHistoryButton',
  data () {
    return {
      firstMessageId: undefined,
      isLoadingPreviousMessages: false,
    }
  },
  computed: {
    ...mapState(useStore, [
      'activeChat',
    ]),
    isDisabled () { return this.firstMessageId === null },
  },
  watch: {
    activeChat: function () {
      this.firstMessageId = undefined
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
