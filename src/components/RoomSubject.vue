<template>
  <div v-if="isDiplayed && roomSubject" class="message is-small is-shade-1 has-background-shade-2 m-3" title="Room subject">
    <div class="message-header">
      <p>{{ roomJid }}</p>
      <button class="delete" aria-label="delete" title="Dismiss" @click="isDiplayed = false" />
    </div>
    <div class="message-body is-flex py-3 px-1">
      <div class="icon is-medium is-flex-shrink-0">
        <i class="fa fa-2x fa-info-circle" />
      </div>
      <div class="is-flex is-flex-direction-column">
        <!-- eslint-disable-next-line vue/no-v-html -->
        <span style="white-space: pre-wrap;" v-html="subject" />
        <span class="content is-italic has-text-weight-light is-small">{{ roomSubject.author }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import sanitizeHtml from 'sanitize-html'
export default {
  name: 'RoomSubject',
  props: {
    roomJid: {
      type: String,
      required: true,
    },
  },
  data () {
    return {
      isDiplayed: true,
    }
  },
  computed: {
    roomSubject () {
      return this.$store.getRoomSubject(this.roomJid)
    },
    subject () {
      return sanitizeHtml(this.roomSubject.subject)
        .replace(/(.*)((?:https?|mailto):\/\/[a-z0-9/:%_+.,#?!@&=-]+)(.*)/g, '$1<a href="$2" target="_blank" rel="noreferrer">$2</a>$3')
    },
  },
}
</script>
