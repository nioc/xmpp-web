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
        <li v-for="room in bookmarkedRooms" :key="room.jid">
          <contact :jid="room.jid" :room="room" :is-room="true" :unread-count="room.unreadCount" />
        </li>
        <li>
          <router-link class="button is-primary is-light" :to="{name: 'public muc'}" title="Join a room"><i class="fa fa-sign-in fa-fw has-margin-right-7" />Join a room</router-link>
        </li>
      </ul>
    </div>
  </aside>
</template>

<script>
import contact from '@/components/Contact'
import {mapState} from 'vuex'

export default {
  name: 'Contacts',
  components: {
    contact,
  },
  computed: {
    ...mapState(['contacts', 'bookmarkedRooms']),
  },
}
</script>

<style scoped>
.menu-list a {
  min-height: 40px;
}
</style>
