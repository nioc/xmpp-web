<template>
  <span class="px-4 py-1 is-flex is-align-items-center is-flex-shrink-5" style="overflow-x: auto;overflow-y: hidden;">
    <avatar v-for="occupant in occupants" :key="occupant.jid" :jid="occupant.jid" :display-jid="false" :presence="occupant.presence" :size="24" style="margin-left: -5px;" />
  </span>
</template>

<script>
import avatar from '../components/Avatar.vue'
export default {
  name: 'RoomOccupants',
  components: {
    avatar,
  },
  props: {
    roomJid: {
      type: String,
      required: true,
    },
  },
  computed: {
    occupants () { return this.$store.getRoomOccupants(this.roomJid) },
  },
}
</script>
