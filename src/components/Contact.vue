<template>
  <router-link :to="{name: isRoom ? 'groupchat' : 'chat', params: {jid}}" class="has-unread" :title="jid" exact exact-active-class="is-active">
    <span v-if="isRoom">
      <i class="fa fa-star has-text-warning has-margin-right-7" />
      <span>{{ room.name }}</span>
      <span class="has-text-grey-light has-margin-left-7 room-attributes">
        <i v-if="room.isPasswordProtected" class="fa fa-key-modern fa-fw" title="Password protected" />
        <i v-if="room.isModerated" class="fa fa-shield fa-fw" title="Is moderated" />
        <i v-if="room.isAnonymous" class="fa fa-user-secret fa-fw" title="Allow anonymous (nick)" />
        <i v-if="room.isMembersOnly" class="fa fa-users fa-fw" title="Restricted to members" />
        <i v-if="room.isPublic" class="fa fa-globe fa-fw" title="Public room" />
      </span>
    </span>
    <avatar v-else :jid="jid" :display-jid="true" :size="24" :presence="presence" />
    <span v-if="unreadCount > 0" class="tag has-margin-left-7 is-rounded is-danger">{{ unreadCount }}</span>
  </router-link>
</template>

<script>
import avatar from '@/components/Avatar'

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
    presence: {
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
    room: {
      type: Object,
      default: () => {},
    },
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
</style>
