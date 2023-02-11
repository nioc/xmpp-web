<template>
  <section class="is-full-height has-background-shade-3">
    <div class="is-flex is-justify-content-center is-full-height" style="overflow-y:auto;">
      <div v-if="displayRoomsList" class="container is-flex is-flex-direction-column">
        <div class="field has-addons mt-5">
          <div class="control is-expanded has-icons-left">
            <input v-model="search.text" class="input" type="text" name="room" placeholder="Search a room" title="Filter rooms by name or description">
            <span class="icon is-small is-left">
              <i class="fa fa-search" />
            </span>
          </div>
          <div class="control has-icons-left">
            <span class="select">
              <select v-model="search.language" title="Filter rooms by language">
                <option value="" />
                <option v-for="language in roomsLanguages" :key="language">{{ language }}</option>
              </select>
              <span class="icon is-small is-left">
                <i class="fa fa-globe-e" />
              </span>
            </span>
          </div>
        </div>
        <div class="is-flex is-justify-content-center is-flex-grow-1">
          <ul class="is-align-self-center columns is-multiline">
            <li v-for="room in filteredPublicRooms" :key="room.jid" class="column">
              <div class="card is-width-min-400">
                <header class="card-header">
                  <span class="card-header-title">
                    <span v-if="room.isPinned" class="icon has-text-danger mr-2" title="Pinned room">
                      <i class="fa fa-map-pin" />
                    </span>
                    <span v-if="room.lang" class="has-text-weight-light" title="Language">[{{ room.lang }}]</span>
                  </span>
                  <span class="px-4 py-3">
                    <span v-if="room.isPasswordProtected" class="icon" title="This room is password protected">
                      <i class="fa fa-key-modern" />
                    </span>
                    <span v-if="room.occupantsCount" title="Occupants">
                      <span class="icon mr-1 ml-2">
                        <i class="fa fa-users" />
                      </span>
                      <span>{{ room.occupantsCount }}</span>
                    </span>
                  </span>
                </header>
                <div class="card-content">
                  <div class="media">
                    <avatar v-if="room.hasVCard" class="media-left" :jid="room.jid" :display-jid="false" :size="48" />
                    <div class="media-content">
                      <div class="title is-5">{{ room.name }}</div>
                      <div class="subtitle is-6">{{ room.jid }}</div>
                    </div>
                  </div>
                  <small class="content">{{ room.description }}</small>
                </div>
                <footer class="card-footer">
                  <router-link :to="{ name: 'guestInRoom', params: { jid: room.jid } }" class="card-footer-item" title="Join the room">
                    <span class="icon">
                      <i class="fa fa-sign-in" /></span>
                    <span>Join</span>
                  </router-link>
                </footer>
              </div>
            </li>
          </ul>
        </div>
        <version />
      </div>
    </div>
  </section>
</template>

<script>
import avatar from '../components/Avatar.vue'
import Modal from '../components/Modal.vue'
import Version from '../components/Version.vue'
import { mapState } from 'pinia'
import { useStore } from '@/store'

export default {
  name: 'GuestRooms',
  components: {
    avatar,
    Version,
  },
  data () {
    return {
      isLoading: false,
      search: {
        text: '',
        language: '',
      },
      transportsUser: {
        websocket: window.config.transports.websocket,
        bosh: window.config.transports.bosh,
      },
      server: window.config.anonymousHost,
      nick: null,
      requestedJid: null,
    }
  },
  computed: {
    displayRoomsList () { return !this.isLoading && this.publicRooms.length > 0 },
    roomsLanguages () {
      return [...new Set(this.publicRooms.map((room) => room.lang))]
        .filter(lang => lang !== '')
    },
    filteredPublicRooms () {
      const pinnedRooms = window.config.pinnedMucs || []
      const searchText = this.search.text.toLowerCase()
      const searchLanguage = this.search.language
      return this.publicRooms
        .filter((room) => (searchText === '' || room.name.toLowerCase().indexOf(searchText) > -1 || room.description.toLowerCase().indexOf(searchText) > -1) && (searchLanguage === '' || room.lang === searchLanguage))
        .map((room) => {
          return {
            ...room,
            isPinned: pinnedRooms.includes(room.jid),
          }
        })
        .sort((a, b) => {
          if (a.isPinned !== b.isPinned) {
            return a.isPinned ? -1 : 1
          }
          return a.name.toLowerCase() > b.name.toLowerCase()
        })
    },
    ...mapState(useStore, ['publicRooms']),
  },
  async created () {
    if (history.state) {
      this.requestedJid = history.state.requestedJid
      this.nick = history.state.nick
    }
    if (!this.nick || !this.$xmpp.jid) {
      // no nick or xmpp not initialized (may be refresh page / F5) return to guest home
      this.$router.push({ name: 'guest' })
      return
    }
    this.isLoading = true
    try {
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
          await new Promise((resolve) =>
            this.$oruga.modal.open({
              component: Modal,
              trapFocus: true,
              props: {
                title: 'Error',
                message: requestedRoom.message || 'Unable to join room',
                type: 'is-danger',
              },
              onClose: () => resolve(false),
            }),
          )
        }
      }
    } catch (error) {
      console.error(error.message)
    }
    this.isLoading = false
  },
  mounted () {
    // remove navbar spacing
    document.body.classList.remove('has-navbar-fixed-top')
  },
  methods: {
    openRoom (jid) {
      this.$router.push({ name: 'guestInRoom', params: { jid } })
    },
  },
}
</script>
