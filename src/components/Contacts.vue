<template>
  <aside class="section px-5">
    <div class="menu">
      <p class="menu-label">Contacts</p>
      <ul class="menu-list">
        <li v-for="contact in contacts" :key="contact.jid">
          <contact :jid="contact.jid" :is-room="false" :name="contact.name" :presence="contact.presence" :status="contact.status" :unread-count="contact.unreadCount" />
        </li>
      </ul>
      <p class="menu-label">Rooms</p>
      <ul class="menu-list">
        <li v-for="room in displayedRooms" :key="room.jid">
          <contact :jid="room.jid" :is-room="true" :unread-count="room.unreadCount" />
        </li>
        <li>
          <router-link active-class="is-active" :to="{ name: 'public muc' }" title="Join a room"><i class="fa fa-sign-in fa-fw mr-3" />Public rooms</router-link>
        </li>
        <li>
          <form class="field has-addons" @submit.prevent="joinRoomByJid">
            <div class="control is-flex-grow-1">
              <input v-model="roomJid" class="input is-dark" type="text" :placeholder="roomPlaceholder" title="Enter a room jid for joining">
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
        <li>
          <router-link :to="{ name: 'room creation' }" class="button is-fullwidth is-dark" title="Create a room">
            <span class="icon">
              <i class="fa fa-plus-square" />
            </span>
            <span>Create a room</span>
          </router-link>
        </li>
      </ul>
    </div>
  </aside>
</template>

<script>
import contact from '../components/Contact.vue'
import { mapState } from 'pinia'
import { useStore } from '@/store'

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
    ...mapState(useStore, [
      'contacts',
      'knownRooms',
    ]),
    displayedRooms () {
      return this.knownRooms
        .filter((room) => room.isBookmarked || this.$store.isJoined(room.jid))
    },
    roomPlaceholder () { return this.$xmpp.defaultMuc ? `room@${this.$xmpp.defaultMuc}` : `room@conference.${this.$xmpp.defaultDomain}` },
    isValidRoomJid () { return this.$xmpp.defaultMuc ? this.roomJid.length > 2 : /\S+@\S+\S+/.test(this.roomJid) },
  },
  methods: {
    joinRoomByJid () {
      if (this.roomJid === '') {
        return
      }
      if (!/\S+@\S+\S+/.test(this.roomJid)) {
        if (!this.$xmpp.defaultMuc) {
          return
        }
        this.roomJid = this.roomJid + '@' + this.$xmpp.defaultMuc
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
