<template>
  <main class="is-growing section">
    <h2 class="title">Public rooms</h2>
    <table class="table is-hoverable is-fullwidth center-table">
      <thead>
        <tr>
          <th class="has-text-centered">Room name</th>
          <th class="has-text-centered">Occupants</th>
          <th class="has-text-centered">Password protected</th>
          <th class="has-text-centered">Moderated</th>
          <th class="has-text-centered">Semi-Anonymous</th>
          <th class="has-text-centered">Members-Only</th>
          <th class="has-text-centered">Visibility</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="room in publicRooms" :key="room.jid" class="is-clickable" @click="openRoom(room.jid)">
          <td class="has-text-centered" :title="getRoomTitle(room)">{{ room.name }}</td>
          <td class="has-text-centered">{{ room.occupantsCount }}</td>
          <td class="has-text-centered"><i v-if="room.isPasswordProtected" class="fa fa-key-modern fa-fw" title="Password protected" /></td>
          <td class="has-text-centered"><i v-if="room.isModerated" class="fa fa-shield fa-fw" title="Is moderated" /></td>
          <td class="has-text-centered"><i v-if="room.isAnonymous" class="fa fa-user-secret fa-fw" title="Allow anonymous (nick)" /></td>
          <td class="has-text-centered"><i v-if="room.isMembersOnly" class="fa fa-users fa-fw" title="Restricted to members" /></td>
          <td class="has-text-centered"><i v-if="room.isPublic" class="fa fa-globe fa-fw" title="Public room" /></td>
        </tr>
      </tbody>
    </table>
  </main>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'RoomsList',
  computed: {
    ...mapState(['publicRooms']),
  },
  async mounted () {
    try {
      await this.$xmpp.getPublicMuc()
    } catch (error) {
      console.error('getPublicMuc error', error)
    }
  },
  methods: {
    openRoom (jid) {
      this.$router.push({ name: 'groupchat', params: { jid } })
    },
    getRoomTitle (room) {
      let title = ''
      if (room.lang) {
        title = `[${room.lang}] `
      }
      if (room.description) {
        title = title + room.description
      }
      return title === '' ? null : title
    },
  },
}
</script>
