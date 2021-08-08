<template>
  <b-switch v-model="isDarkMode" type="is-black" size="is-small" :title="isDarkMode ? 'Click for deactivating dark mode' : 'Click for activate dark mode'" @input="setDarkMode"><span v-if="hasLabel" class="has-text-grey-light">Dark mode</span></b-switch>
</template>

<script>
const localStorageKey = 'xmppWebLightMode'
export default {
  name: 'LightModeSwitch',
  props: {
    hasLabel: {
      type: Boolean,
      default: true,
    },
  },
  data () {
    return {
      isDarkMode: true,
    }
  },
  created () {
    if (localStorage.getItem(localStorageKey)) {
      this.isDarkMode = false
    }
  },
  methods: {
    setDarkMode (value) {
      this.isDarkMode = value
      if (this.isDarkMode) {
        document.documentElement.removeAttribute('data-theme')
        localStorage.removeItem(localStorageKey)
      } else {
        document.documentElement.setAttribute('data-theme', 'light')
        localStorage.setItem(localStorageKey, '1')
      }
    },
  },
}
</script>

<style>
.switch:not(.has-left-label) .control-label:empty {
  padding-right: 0;
}
.switch {
  margin-right: 0 !important;
}
</style>
