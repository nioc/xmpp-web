<template>
  <span>
    <span class="fa-stack">
      <i class="fa fa-circle fa-stack-2x" :class="backgroundClass" />
      <i class="fa fa-stack-1x fa-inverse fa-fw" :class="iconClass" />
    </span>
    <span v-if="displayLabel" class="has-margin-left-7">{{ text }}</span>
  </span>
</template>

<script>
export default {
  name: 'Presence',
  props: {
    presence: {
      type: String,
      required: true,
    },
    displayLabel: {
      type: Boolean,
      default: true,
    },
  },
  computed: {
    backgroundClass () {
      switch (this.presence) {
        case 'dnd':
          return 'has-text-danger'
        case 'away':
        case 'xa':
          return 'has-text-warning'
        case 'off':
          return 'has-text-grey-light'
        default:
          return 'has-text-success'
      }
    },
    iconClass () {
      switch (this.presence) {
        case 'dnd':
          return 'fa-ban'
        case 'away':
        case 'xa':
          return 'fa-moon'
        case 'off':
          return 'fa-exclamation'
        default:
          return 'fa-circle'
      }
    },
    text () {
      switch (this.presence) {
        case 'dnd':
          return 'Do not disturb'
        case 'away':
        case 'xa':
          return 'Away'
        case 'off':
          return 'Disconnected'
        default:
          return 'Available'
      }
    },
  },
}
</script>
