<template>
  <main v-if="isLoaded" class="is-full-height-scrollable section">
    <label class="is-inline-block field is-relative is-clickable" title="Click to edit your avatar">
      <input ref="avatar" class="file-input" type="file" accept="image/*" @change="selectAvatar">
      <span class="image is-128x128">
        <img v-if="profile.PHOTO" class="is-rounded" :src="profile.PHOTO">
        <img v-else class="is-rounded" :src="defaultAvatar">
      </span>
    </label>

    <div v-for="field in fields" :key="field.id" class="field">
      <label class="label has-text-light">{{ field.label }}</label>
      <div class="control">
        <input v-model="profile[field.id]" class="input" type="text" :placeholder="field.placeholder">
      </div>
    </div>

    <div class="field">
      <div class="control">
        <button class="button is-primary" :disabled="isProcessing" @click="save">
          <span class="icon"><i class="fa fa-save" /></span><span>Save</span>
        </button>
      </div>
      <p class="help is-danger">{{ error }}</p>
    </div>
  </main>

  <main v-else class="is-relative section">
    <o-loading class="is-full-height-scrollable section" :active="true" :full-page="false" icon="circle-o-notch" icon-size="large" />
  </main>
</template>

<script>
import defaultAvatar from '../assets/defaultAvatar'

export default {
  name: 'Profile',
  components: {
  },
  data () {
    return {
      isLoaded: false,
      isProcessing: false,
      profile: {},
      fields: this.$xmpp.client.getVCardAttributes().filter(attribute => attribute.type === 'input'),
      defaultAvatar,
      error: null,
    }
  },
  computed: {
  },
  async created () {
    this.profile = await this.$xmpp.getProfile()
    this.isLoaded = true
  },
  methods: {
    async save() {
      this.error = null
      try {
        await this.$xmpp.updateProfile(this.profile)
      } catch (error) {
        this.error = `Error during profile update: ${error.message}`
      }
    },
    selectAvatar () {
      this.isProcessing = true
      const reader = new FileReader()
      reader.onload = () => {
        // check image
        const parts = reader.result.split(',')
        const type = /data:(.*);base64/.exec(parts[0])
        if (type && type.length > 1 && parts.length > 1) {
          this.profile.PHOTO = reader.result
        }
        this.isProcessing = false
      }
      try {
        reader.readAsDataURL(this.$refs.avatar.files[0])
      } catch (error) {
        console.error(error.message)
      }
    },
  },
}
</script>
