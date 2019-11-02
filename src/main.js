import Vue from 'vue'
import App from './App'
import router from './router'
import Buefy from 'buefy'
import '@/assets/styles.scss'
import 'fork-awesome/css/fork-awesome.min.css'
import store from '@/store'
import xmppSocket from './services/XmppSocket'
import Moment from 'vue-moment'
import './registerServiceWorker'

Vue.config.productionTip = false
Vue.use(Buefy)
Vue.use(Moment)

Vue.prototype.$xmpp = xmppSocket
Vue.prototype.$bus = new Vue()

let app = new Vue({
  router,
  store,
  render: h => h(App),
}).$mount('#app')

store.$app = app
