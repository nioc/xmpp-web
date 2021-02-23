<template>
  <aside class="section">
    <div class="menu">
      <p class="menu-label">Contacts</p>
      <ul class="menu-list">
        <li v-for="contact in contacts" :key="contact.jid">
          <contact :jid="contact.jid" :is-room="false" :presence="contact.presence" :unread-count="contact.unreadCount" />
        </li>
      </ul>
      <p class="menu-label">Rooms</p>
      <ul class="menu-list">
        <li v-for="room in displayedRooms" :key="room.jid">
          <contact :jid="room.jid" :is-room="true" :unread-count="room.unreadCount" />
        </li>
        <li>
          <router-link active-class="is-active" :to="{name: 'public muc'}" title="Join a room"><i class="fa fa-sign-in fa-fw mr-3" />Public rooms</router-link>
        </li>
        <li>
          <form class="field has-addons" @submit.prevent="joinRoomByJid">
            <div class="control is-flex-grow-1">
              <input v-model="roomJid" class="input is-dark" type="text" :placeholder="`room@conference.${$xmpp.defaultDomain}`" title="Enter full room Jid">
            </div>
            <div class="control" title="Join this room">
              <button type="submit" class="button is-dark" :disabled="!isValidRoomJid">
                <span class="icon">
                  <i class="fa fa-sign-in" />
                </span>
              </button>
            </div>
          </form>
        </li>
      </ul>
    </div>
  </aside>
</template>

<script>
import contact from '@/components/Contact'
import { mapState } from 'vuex'

export default {
  name: 'Contacts',
  components: {
    contact,
  },
  data () {
    return {
      roomJid: '',
    }
  },
  computed: {
    ...mapState([
      'contacts',
      'knownRooms',
    ]),
    displayedRooms () {
      return this.knownRooms
        .filter((room) => room.isBookmarked || this.$store.getters.isJoined(room.jid))
    },
    isValidRoomJid () { return /\S+@\S+\S+/.test(this.roomJid) },
  },
  methods: {
    joinRoomByJid () {
      if (this.roomJid === '') {
        return
      }
      if (this.$route.name !== 'groupchat' || (!this.$route.params.jid || this.$route.params.jid !== this.roomJid)) {
        this.$router.push({ name: 'groupchat', params: { jid: this.roomJid } })
      }
      this.roomJid = ''
    },
  },
}
</script>

<style scoped>
.menu-list a {
  min-height: 40px;
}
</style>
