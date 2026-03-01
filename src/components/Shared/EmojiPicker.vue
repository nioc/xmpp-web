<template>
  <button v-if="!isOpen" :class="buttonClass" :title="buttonTitle" @click="isOpen = true"><i class="fa-regular fa-smile" aria-hidden="true" /></button>
  <aside v-else class="emojiPicker px-0">
    <o-tabs>
      <o-tab-item v-for="category in categories" :key="category" :label="category" class="is-full-height mb-5">
        <div class="is-flex is-flex-wrap-wrap is-align-content-flex-start is-full-height-scrollable">
          <a v-for="emoji in getEmojiByCategory(category)" :key="emoji.emoji" href="#" :title="emoji.description" class="emoji is-size-5 p-1" @click.prevent="sendEmojiPicked(emoji)">{{ emoji.emoji }}</a>
        </div>
      </o-tab-item>
    </o-tabs>
  </aside>
</template>

<script>
import { gemoji } from 'gemoji'

export default {
  name: 'EmojiPicker',
  props: {
    buttonClass: {
      type: String,
      default: 'button is-size-4 is-primary-ghost has-no-border is-shadowless px-3',
    },
    buttonTitle: {
      type: String,
      default: 'Choose an emoji',
    },
  },
  emits: [
    'emoji-picked',
  ],
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
  beforeUnmount () {
    document.removeEventListener('keyup', this.keyUp)
  },
  methods: {
    getEmojiByCategory (category) {
      return gemoji
        .filter((emoji) => emoji.category === category)
    },
    sendEmojiPicked (emoji) {
      this.$emit('emoji-picked', emoji.emoji)
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
