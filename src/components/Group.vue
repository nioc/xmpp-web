<template>
  <div>
    <a class="is-flex is-align-items-center is-justify-content-space-between" @click="isOpened = !isOpened"><span>{{ group }}</span><i class="fa fa-fw" :class="isOpened ? 'fa-caret-down' : 'fa-caret-up'" /></a>
    <ul v-if="isOpened">
      <li v-for="contact in contactsInGroup" :key="contact.jid">
        <contact :jid="contact.jid" :is-room="false" :name="contact.name" :presence="contact.presence" :status="contact.status" :unread-count="contact.unreadCount" />
      </li>
    </ul>
  </div>
</template>

<script>
import contact from '../components/Contact.vue'
import { mapState } from 'pinia'
import { useStore } from '@/store'

export default {
  name: 'Group',
  components: {
    contact,
  },
  props: {
    group: {
      type: String,
      required: true,
    },
  },
  data () {
    return {
      isOpened: false,
    }
  },
  computed: {
    ...mapState(useStore, [
      'contacts',
    ]),
    contactsInGroup () {
      return this.contacts
        .filter((contact) => contact.groups.includes(this.group))
    },
  },
}
</script>
