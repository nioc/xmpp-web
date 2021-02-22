<template>
  <main class="modal-card">
    <header class="modal-card-head">
      <span class="modal-card-title has-text-weight-semibold">Room &lt;{{ roomJid }}&gt; configuration</span>
    </header>

    <section class="modal-card-body">
      <div v-for="(field, index) in fields" :key="index" class="field">
        <h3 v-if="field.type === 'fixed'" class="divider has-text-light is-dark">{{ field.value }}</h3>
        <div v-else>
          <label v-if="field.label" class="label has-text-light">{{ field.label }}</label>
          <div class="control" :title="field.description">
            <b-switch v-if="field.type === 'boolean'" v-model="field.value" />
            <label v-else-if="field.type === 'list-single'" class="radio">
              <div v-for="option in field.options" :key="option.value" class="field">
                <b-radio v-model="field.value" :native-value="option.value">
                  {{ option.label }}
                </b-radio>
              </div>
            </label>
            <input v-else v-model="field.value" class="input" :type="field.type === 'text-private' ? 'password' : 'text'" :placeholder="field.description">
          </div>
        </div>
      </div>
      <b-loading v-model="isLoading" :is-full-page="false" />
    </section>

    <footer class="modal-card-foot">
      <button class="button is-dark" @click="$emit('close')">Close</button>
      <button v-if="form.fields" class="button is-primary" @click="saveRoomConfiguration">Save</button>
      <span v-if="error" class="is-flex-grow-1 has-text-right has-text-danger">{{ error }}</span>
    </footer>
  </main>
</template>

<script>
export default {
  name: 'RoomConfiguration',
  props: {
    roomJid: {
      type: String,
      required: true,
    },
  },
  data () {
    return {
      form: {},
      isLoading: false,
      error: null,
    }
  },
  computed: {
    fields () { return this.form.fields ? this.form.fields.filter((field) => field.type !== 'hidden') : [] },
  },
  mounted () {
    this.getRoomConfiguration()
  },
  methods: {
    async getRoomConfiguration () {
      this.isLoading = true
      this.error = null
      try {
        this.form = {}
        this.form = await this.$xmpp.getRoomConfig(this.roomJid)
      } catch (error) {
        if (error.error.text) {
          this.error = error.error.text
        } else {
          this.error = 'Oups, an error occurs'
        }
      }
      this.isLoading = false
    },
    async saveRoomConfiguration () {
      this.isLoading = true
      try {
        await this.$xmpp.setRoomConfig(this.roomJid, this.form)
      } catch (error) {
        if (error.error.text) {
          this.error = error.error.text
        } else {
          this.error = 'Oups, an error occurs'
        }
      }
      this.isLoading = false
    },
  },
}
</script>
