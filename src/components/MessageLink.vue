<template>
  <div>
    <img v-if="isImage" :src="url" class="thumbnail" @click="displayModal = true">
    <audio v-else-if="isAudio" :src="url" controls />
    <video v-else-if="isVideo" :src="url" controls width="300" />
    <a v-else class="button is-light is-small" :href="url" target="_blank">
      <span class="icon is-small">
        <i class="fa fa-download" />
      </span>
      <span>Download file ({{ contentType }})</span>
    </a>
    <div v-if="isImage" class="modal" :class="{'is-active': displayModal}">
      <div class="modal-background" @click="displayModal = false" />
      <div class="modal-content image-container">
        <img :src="url" alt="">
      </div>
      <button class="modal-close is-large" aria-label="close" @click="displayModal = false" />
    </div>
  </div>
</template>

<script>
import mime from "mime-types"

export default {
  name: "MessageLink",
  props: {
    url: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      isImage: false,
      isAudio: false,
      isVideo: false,
      displayModal: false,
    }
  },
  computed: {
    contentType() {
      return mime.lookup(this.url)
    },
  },
  mounted() {
    switch (this.contentType) {
      case "image/jpeg":
      case "image/gif":
      case "image/png":
      case "image/tiff":
        this.isImage = true
        break
      case "audio/mpeg":
      case "audio/mp3":
      case "audio/mp4":
      case "audio/x-wav":
      case "audio/wave":
      case "audio/wav":
        this.isAudio = true
        break
      case "video/mpeg":
      case "video/mp4":
      case "video/quicktime":
      case "video/x-ms-wmv":
      case "video/x-msvideo":
        this.isVideo = true
        break
    }
  },
}
</script>

<style scoped>
.thumbnail {
  max-height: 8em;
}
.image-container {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
