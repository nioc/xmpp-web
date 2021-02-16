<template>
  <section class="is-fullheight is-guest">
    <div class="main-container is-justify-content-center">
      <!-- Guest access not allowed message -->
      <div v-if="server === null" class="message is-danger is-light is-align-self-center">
        <div class="message-body has-text-danger">Anonymous access is not allowed<br>Please <router-link :to="{name: 'login'}">login</router-link></div>
      </div>
      <!-- User nickname form -->
      <div v-else-if="!isRegistered" class="is-align-items-center is-align-self-center">
        <form @submit.prevent="join">
          <div class="field has-addons">
            <div class="control has-icons-left">
              <input v-model="nick" class="input" type="text" name="nick" placeholder="Nickname">
              <span class="icon is-small is-left">
                <i class="fa fa-user" />
              </span>
            </div>
            <div class="control">
              <button type="submit" class="button is-primary" :disabled="!hasValidNick">
                <span class="icon">
                  <i class="fa fa-sign-in" /></span>
                <span>Join</span>
              </button>
            </div>
          </div>
        </form>
        <div v-if="error" class="message is-danger is-light mt-4">
          <div class="message-body has-text-danger">{{ error }}</div>
        </div>
      </div>
      <!-- Rooms list -->
      <div v-if="displayRoomsList" class="container is-flex is-flex-direction-column">
        <div class="field mt-5">
          <div class="control has-icons-left">
            <input v-model="search" class="input" type="text" name="room" placeholder="Room name" title="Filter rooms by name">
            <span class="icon is-small is-left">
              <i class="fa fa-comments" />
            </span>
          </div>
        </div>
        <div class="is-flex is-justify-content-center is-flex-grow-1">
          <ul class="is-align-self-center columns is-multiline is-mobile">
            <li v-for="room in filteredPublicRooms" :key="room.jid" class="column">
              <router-link :to="{name: 'gestInRoom', params: {jid: room.jid}}" class="button is-primary" :title="`Join '${room.jid}' room\n${room.description}`" @click="openRoom(room.jid)">
                <span v-if="room.isPasswordProtected" class="icon">
                  <i class="fa fa-key-modern" />
                </span>
                <span><span v-if="room.lang" class="has-text-weight-light">[{{ room.lang }}] </span>{{ room.name }}</span>
                <span v-if="room.occupantsCount">
                  <span class="icon ml-2">
                    <i class="fa fa-users" />
                  </span>
                  <span>{{ room.occupantsCount }}</span>
                </span>
              </router-link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { mapState } from 'vuex'
export default {
  name: 'GuestHome',
  props: {
    requestedJid: {
      type: String,
      default: null,
    },
  },
  data () {
    return {
      nick: '',
      isRegistered: false,
      isLoading: false,
      search: '',
      error: '',
      transportsUser: {
        websocket: window.config.transports.websocket,
        bosh: window.config.transports.bosh,
      },
      server: window.config.anonymousHost,
    }
  },
  computed: {
    hasValidNick () { return this.nick.length > 2 },
    displayRoomsList () { return this.isRegistered && !this.isLoading && this.publicRooms.length > 0 },
    filteredPublicRooms () {
      return this.publicRooms
        .filter((room) => room.name.toLowerCase().indexOf(this.search.toLowerCase()) > -1)
    },
    ...mapState(['publicRooms']),
  },
  mounted () {
    // remove navbar spacing
    document.body.classList.remove('has-navbar-fixed-top')
  },
  methods: {
    async join () {
      this.isLoading = true
      try {
        await this.$xmpp.create(null, null, this.server, this.transportsUser, this)
        this.$xmpp.setNick(this.nick)
        await this.$xmpp.connect()
        this.isRegistered = true
        // get public rooms
        const rooms = await this.$xmpp.getPublicMuc()
        // if room jid provided, check if exists and join it
        if (this.requestedJid) {
          if (rooms.find((room) => room.jid === this.requestedJid)) {
            // join public room
            return this.openRoom(this.requestedJid)
          }
          // check if room exist as private
          const requestedRoom = await this.$xmpp.getRoom(this.requestedJid)
          if (requestedRoom.jid) {
            // join private room
            return this.openRoom(this.requestedJid)
          }
          if (requestedRoom.message) {
            this.$buefy.dialog.alert({
              title: 'Error',
              message: requestedRoom.message || 'Unable to join room',
              type: 'is-danger',
            })
          }
        }
      } catch (error) {
        this.error = error.message
      }
      this.isLoading = false
    },
    openRoom (jid) {
      this.$router.push({ name: 'gestInRoom', params: { jid } })
    },
  },
}
</script>
