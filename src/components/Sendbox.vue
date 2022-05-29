<template>
  <div class="sendbox has-border-top-shade-3">
    <form @submit.prevent="sendMessage">
      <div class="field is-flex is-align-items-center mr-3">
        <div class="control is-flex-grow-1">
          <textarea v-model="composingMessage" class="textarea has-background-shade-4 is-shadowless has-placeholder-shade-1" :placeholder="!file? 'Send message' : ''" rows="2" :disabled="fileThumbnail || fileIcon" @keyup.ctrl.enter="sendMessage" />
          <div v-if="fileThumbnail || fileIcon" class="thumbnail-container">
            <img v-if="fileThumbnail" :src="fileThumbnail" class="thumbnail">
            <i v-if="fileIcon" class="fa fa-2x" :class="fileIcon" />
            <button class="delete has-background-grey-light" title="Remove file" @click="removeFile" />
          </div>
        </div>
        <emoji-picker @emoji-picked="addEmoji" />
        <button v-if="composingMessage || file || !httpFileUploadMaxSize" type="submit" class="button is-size-4 is-primary-ghost has-no-border is-shadowless px-3" title="Send message"><i class="fa fa-paper-plane" aria-hidden="true" /></button>
        <div v-else class="file has-no-border is-size-4" title="Send a file">
          <label class="file-label">
            <input class="file-input" type="file" name="resume" @change="onFileChange">
            <span class="file-cta is-primary-ghost has-no-border is-size-4 px-3">
              <span class="file-icon mr-0">
                <i class="fa fa-paperclip is-primary-ghost is-size-4" />
              </span>
            </span>
          </label>
        </div>
      </div>
    </form>
  </div>
</template>

<script>
import EmojiPicker from '../components/EmojiPicker.vue'
import { mapState } from 'pinia'
import { useStore } from '@/store'
import axios from 'axios'
import filesize from 'filesize'

export default {
  name: 'Sendbox',
  components: {
    EmojiPicker,
  },
  props: {
    isRoom: {
      type: Boolean,
      default: false,
    },
  },
  data () {
    return {
      composingMessage: '',
      file: null,
      fileThumbnail: null,
      fileIcon: null,
    }
  },
  computed: {
    userJid () {
      return this.$xmpp.fullJid
    },
    ...mapState(useStore, [
      'activeChat',
      'httpFileUploadMaxSize',
    ]),
  },
  methods: {
    // send message
    async sendMessage () {
      try {
        if (this.file) {
          await this.postFile(this.file)
          return
        }
        await this.$xmpp.sendMessage(this.activeChat, this.composingMessage, this.isRoom)
        this.composingMessage = ''
      } catch (error) {
        console.error('send error', error)
      }
    },
    onFileChange (e) {
      const files = e.target.files || e.dataTransfer.files
      if (!files.length) {
        return
      }
      this.file = files[0]
      // check file size
      if (this.file.size > this.httpFileUploadMaxSize) {
        alert(`File is too big (${filesize(this.file.size)}, max is ${filesize(this.httpFileUploadMaxSize)})`)
        return
      }
      // handle thumbnail
      if (this.file.type.startsWith('image/')) {
        const reader = new FileReader()
        const vm = this
        reader.onload = (e) => {
          vm.fileThumbnail = e.target.result
        }
        reader.readAsDataURL(this.file)
      } else if (this.file.type.startsWith('audio/')) {
        this.fileIcon = 'fa-file-audio-o'
      } else if (this.file.type.startsWith('video/')) {
        this.fileIcon = 'fa-file-video-o'
      } else if (this.file.type.includes('pdf')) {
        this.fileIcon = 'fa-file-pdf-o'
      } else {
        this.fileIcon = 'fa-file-o'
      }
    },
    async postFile (file) {
      try {
        // reserve slot
        const httpUploadSlotResult = await this.$xmpp.getUploadSlot(this.userJid.domain, {
          filename: file.name,
          size: file.size,
          'content-type': file.type,
        })
        // upload file on returned slot
        await axios.put(httpUploadSlotResult.upload.url, file, {
          headers: {
            'Content-Type': file.type,
          },
        })
        // upload is ok, send message
        await this.$xmpp.sendUrl(this.activeChat, httpUploadSlotResult.download, this.isRoom)
        this.file = null
        this.fileThumbnail = null
        this.fileIcon = null
      } catch (error) {
        console.error('httpUpload', error)
      }
    },
    removeFile () {
      this.file = null
      this.fileThumbnail = null
      this.fileIcon = null
    },
    addEmoji (emoji) {
      this.composingMessage += emoji
    },
  },
}
</script>
