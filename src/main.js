import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import Oruga from '@oruga-ui/oruga-next'
import { bulmaConfig } from '@oruga-ui/theme-bulma'
import '@oruga-ui/oruga-next/dist/oruga.css'
import './assets/styles.scss'
import 'fork-awesome/css/fork-awesome.min.css'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useStore } from './store'
import xmppSocket from './services/XmppSocket'
import { registerSW } from 'virtual:pwa-register'
import router from './router'

registerSW({ immediate: true })
dayjs.extend(relativeTime)

const pinia = createPinia()
const app = createApp(App)

app.use(Oruga, { ...bulmaConfig, iconPack: 'fa' })
app.config.globalProperties.$xmpp = xmppSocket
app.config.globalProperties.$dayjs = dayjs

pinia.use(() => {
  return { $dayjs: dayjs }
} )
app.use(pinia)
app.use(router)

const store = useStore()
app.config.globalProperties.$store = store

app.mount('#body')
