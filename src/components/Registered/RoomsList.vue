<template>
  <main class="section">
    <h2 class="title">Public rooms</h2>
    <div class="field has-addons">
      <div class="control is-expanded has-icons-left">
        <input v-model="search" class="input" type="text" name="room" placeholder="Search a room" title="Filter rooms by name or description">
        <span class="icon is-small is-left">
          <i class="fa-solid fa-magnifying-glass" />
        </span>
      </div>
    </div>
    <table class="table is-hoverable is-fullwidth center-table">
      <thead>
        <tr>
          <th style="width: 32px;" />
          <th class="has-text-centered">Room name</th>
          <th class="has-text-centered">Occupants</th>
          <th class="has-text-centered">Password protected</th>
          <th class="has-text-centered">Moderated</th>
          <th class="has-text-centered">Semi-Anonymous</th>
          <th class="has-text-centered">Members-Only</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="room in filteredPublicRooms" :key="room.jid" class="is-clickable" :title="getRoomTitle(room)" @click="openRoom(room.jid)">
          <td><avatar v-if="room.hasVCard" :jid="room.jid" :size="32" /></td>
          <td class="has-text-centered">{{ room.name }}</td>
          <td class="has-text-centered">{{ room.occupantsCount }}</td>
          <td class="has-text-centered"><i v-if="room.isPasswordProtected" class="fa-solid fa-key fa-fw" title="Password protected" /></td>
          <td class="has-text-centered"><i v-if="room.isModerated" class="fa-solid fa-microphone-lines-slash fa-fw" title="Is moderated" /></td>
          <td class="has-text-centered"><i v-if="room.isAnonymous" class="fa-solid fa-user-secret fa-fw" title="Allow anonymous (nick)" /></td>
          <td class="has-text-centered"><i v-if="room.isMembersOnly" class="fa-solid fa-user-lock fa-fw" title="Restricted to members" /></td>
        </tr>
      </tbody>
    </table>
  </main>
</template>

<script>
import { mapState } from 'pinia'
import { useStore } from '@/store'
import Avatar from '../Shared/Avatar.vue'

export default {
  name: 'RoomsList',
  components: {
    Avatar,
  },
  data () {
    return {
      search: '',
    }
  },
  computed: {
    filteredPublicRooms () {
      const searchText = this.search.toLowerCase()
      return this.publicRooms
        .filter((room) => (searchText === '' || room.name.toLowerCase().indexOf(searchText) > -1 || room.description.toLowerCase().indexOf(searchText) > -1))
    },
    ...mapState(useStore, ['publicRooms']),
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
