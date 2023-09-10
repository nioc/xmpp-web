<template>
  <aside class="section pb-2" :class="isExpanded ? 'p-5' : 'py-5 px-1'">
    <div class="menu">
      <p v-if="groups.length > 0" class="menu-label"><i class="fa fa-user mr-3" :class="isExpanded ? 'fa-lg' : 'fa-2x fa-fw pl-4'" /><span v-show="isExpanded">Contacts</span></p>
      <ul id="contactsList" class="menu-list">
        <li v-for="contact in contacts" :key="contact.jid">
          <contact :jid="contact.jid" :is-room="false" :name="contact.name" :is-expanded="isExpanded" :presence="contact.presence" :status="contact.status" :unread-count="contact.unreadCount" />
        </li>
      </ul>
      <p v-if="groups.length > 0" v-show="isExpanded" class="menu-label"><i class="fa fa-address-book mr-3" :class="isExpanded ? 'fa-lg' : 'fa-2x fa-fw pl-4'" /><span>Groups</span></p>
      <ul v-show="isExpanded" id="groupsList" class="menu-list">
        <li v-for="group in groups" :key="group">
          <group :group="group" />
        </li>
      </ul>
      <p class="menu-label"><i class="fa fa-users mr-3" :class="isExpanded ? 'fa-lg' : 'fa-2x fa-fw pl-3'" /><span v-show="isExpanded">Rooms</span></p>
      <ul id="roomsList" class="menu-list">
        <li v-for="room in displayedRooms" :key="room.jid">
          <contact :jid="room.jid" :is-room="true" :unread-count="room.unreadCount" :is-expanded="isExpanded" />
        </li>
        <li v-show="isExpanded">
          <router-link active-class="is-active" :to="{ name: 'public muc' }" title="Join a room"><i class="fa fa-sign-in fa-fw mr-3" />Public rooms</router-link>
        </li>
        <li v-show="isExpanded">
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
        <li v-show="isExpanded">
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
import group from '../components/Group.vue'
import { mapState } from 'pinia'
import { useStore } from '@/store'

export default {
  name: 'Contacts',
  components: {
    contact,
    group,
  },
  props: {
    isExpanded: {
      type: Boolean,
      default: true,
    },
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
      'groups',
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
