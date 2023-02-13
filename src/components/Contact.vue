<template>
  <router-link :to="{ name: isRoom ? 'groupchat' : 'chat', params: { jid } }" class="has-unread is-relative" :title="title" exact exact-active-class="is-active">
    <!-- groupchat (room) -->
    <span v-if="isRoom" class="is-flex is-align-items-center">
      <avatar v-if="room.hasVCard" class="mr-3" :jid="jid" :display-jid="false" :size="24" />
      <span v-show="isExpanded" :class="{ 'is-italic has-text-grey': !isJoined }">{{ roomName }}</span>
      <i v-if="room.isBookmarked" v-show="isExpanded" class="fa fa-star has-text-warning ml-3" />
      <span v-show="isExpanded" class="ml-3 room-attributes" :class="isJoined ? 'has-text-grey-light': 'has-text-grey'">
        <i v-if="room.isPasswordProtected" class="fa fa-key-modern fa-fw" title="Password protected" />
        <i v-if="room.isModerated" class="fa fa-shield fa-fw" title="Is moderated" />
        <i v-if="room.isAnonymous" class="fa fa-user-secret fa-fw" title="Allow anonymous (nick)" />
        <i v-if="room.isMembersOnly" class="fa fa-users fa-fw" title="Restricted to members" />
        <i v-if="room.isPublic" class="fa fa-globe fa-fw" title="Public room" />
      </span>
    </span>
    <!-- chat -->
    <avatar v-else :jid="jid" :name="name" :display-jid="isExpanded" :size="24" :presence="presence" :status="status" />
    <!-- common -->
    <span v-if="unreadCount > 0" class="tag is-rounded is-danger" :class="isExpanded ? 'ml-3' : 'unread-count-attached'">{{ unreadCount }}</span>
  </router-link>
</template>

<script>
import avatar from '../components/Avatar.vue'

export default {
  name: 'Contact',
  components: {
    avatar,
  },
  props: {
    jid: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      default: null,
    },
    presence: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      default: null,
    },
    isRoom: {
      type: Boolean,
      default: false,
    },
    unreadCount: {
      type: Number,
      default: 0,
    },
    isExpanded: {
      type: Boolean,
      default: true,
    },
  },
  computed: {
    title () { return this.isRoom ? `${this.jid}\n${this.room.name}` : this.status ? `${this.jid} / ${this.status}` : this.jid },
    roomName () { return this.room.name && this.room.name.length > 25 ? this.room.name.substring(0, 25) + '…' : this.room.name },
    room () { return this.isRoom ? this.$store.getRoom(this.jid) : null },
    isJoined () { return this.$store.isJoined(this.jid) },
  },
}
</script>

<style scoped>
.has-unread {
  display: flex;
  align-items: center;
}
.room-attributes {
  font-size: 0.8em;
}
.unread-count-attached {
  position: absolute;
  top: 4px;
  left: 30px;
  font-size: 0.5em;
}
</style>
