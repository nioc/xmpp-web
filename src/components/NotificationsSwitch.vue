<template>
  <div v-if="isNotificationsSupported">
    <o-switch v-model="hasNotificationsEnabledSwitch" title="Allow the browser to send you notifications when you miss messages" class="has-no-wrap"><span class="icon mr-1"><i class="fa fa-bell-ringing fa-fw" aria-hidden="true" /></span>Notifications</o-switch>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { useStore } from '@/store'
import { useWebNotification } from '@vueuse/core'

const lsNotificationKey = 'hasNotificationsEnabled'

export default {
  name: 'NotificationsSwitch',
  setup() {
    const { isSupported } = useWebNotification()
    return { isNotificationsSupported: isSupported }
  },
  computed: {
    ...mapState(useStore, [
      'hasNotificationsEnabled',
    ]),
    hasNotificationsEnabledSwitch: {
      get() {
        return this.hasNotificationsEnabled
      },
      set(hasNotificationsEnabled) {
        if (hasNotificationsEnabled) {
          localStorage.setItem(lsNotificationKey, hasNotificationsEnabled)
        } else {
          localStorage.removeItem(lsNotificationKey)
        }
        this.setNotificationStatus(hasNotificationsEnabled)
      },
    },
  },
  mounted () {
    const hasNotificationsEnabled = localStorage.getItem(lsNotificationKey)
    if (hasNotificationsEnabled) {
      this.setNotificationStatus(hasNotificationsEnabled)
    }
  },
  methods: {
    ...mapActions(useStore, ['setNotificationStatus']),
  },
}
</script>
