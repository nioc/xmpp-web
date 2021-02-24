<template>
  <button v-if="!isOpen" class="button is-size-4 is-primary-ghost has-no-border is-shadowless px-3" title="Choose an emoji" @click="isOpen = true"><i class="fa fa-smile-o" aria-hidden="true" /></button>
  <aside v-else class="emojiPicker px-0">
    <b-tabs>
      <b-tab-item v-for="category in categories" :key="category" :label="category" class="is-full-height mb-5">
        <div class="is-flex is-flex-wrap-wrap is-align-content-flex-start is-full-height-scrollable">
          <a v-for="emoji in getEmojiByCategory(category)" :key="emoji.emoji" href="#" :title="emoji.description" class="emoji is-size-5 p-1" @click="sendEmojiPicked(emoji)">{{ emoji.emoji }}</a>
        </div>
      </b-tab-item>
    </b-tabs>
  </aside>
</template>

<script>
import gemoji from 'gemoji'

export default {
  name: 'EmojiPicker',
  data () {
    return {
      isOpen: false,
      activeCategory: '',
    }
  },
  computed: {
    categories () {
      return gemoji.reduce(function (acc, emoji) {
        if (!acc.includes(emoji.category)) {
          acc.push(emoji.category)
        }
        return acc
      }, [])
    },
  },
  created () {
    document.addEventListener('keyup', this.keyUp)
  },
  beforeDestroy () {
    document.removeEventListener('keyup', this.keyUp)
  },
  methods: {
    getEmojiByCategory (category) {
      return gemoji
        .filter((emoji) => emoji.category === category)
    },
    sendEmojiPicked (emoji) {
      this.$emit('emojiPicked', emoji.emoji)
      this.isOpen = false
    },
    keyUp ({ key }) {
      if (this.isOpen && (key === 'Escape' || key === 'Esc')) {
        this.isOpen = false
      }
    },
  },
}
</script>
