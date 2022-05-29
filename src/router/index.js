import { createRouter, createWebHashHistory } from 'vue-router'
import Chat from '../components/Chat.vue'
import Navbar from '../components/Navbar.vue'
import Login from '../components/Login.vue'
import Home from '../components/Home.vue'
import RoomsList from '../components/RoomsList.vue'
import RoomCreation from '../components/RoomCreation.vue'
import About from '../components/About.vue'
import GuestHome from '../components/GuestHome.vue'
import GuestRooms from '../components/GuestRooms.vue'
import GuestChat from '../components/GuestChat.vue'

const routes = [
  {
    // redirect unknown path to homepage
    path: '/:pathMatch(.*)*',
    redirect: { name: 'home' },
  },
]

if (window.config.hasRegisteredAccess) {
  // set registered user routes
  routes.push(
    {
      // home page containing child components for chats and MUC
      name: 'home',
      path: '/',
      components: {
        navbar: Navbar,
        default: Home,
      },
      props: {
        default: true,
        navbar: false,
      },
      meta: {
        requiresAuth: true,
        displayContact: true,
      },
      children: [
        {
          // chat component
          name: 'chat',
          path: 'contacts/:jid',
          component: Chat,
          props: true,
          meta: {
            requiresAuth: true,
            displayContact: false,
          },
        },
        {
          // public MUC component
          name: 'public muc',
          path: 'rooms/discover',
          component: RoomsList,
          meta: {
            requiresAuth: true,
            displayContact: false,
          },
        },
        {
          // room creation
          name: 'room creation',
          path: 'rooms/new',
          component: RoomCreation,
          meta: {
            requiresAuth: true,
            displayContact: false,
          },
        },
        {
          // MUC component
          name: 'groupchat',
          path: 'rooms/:jid',
          component: Chat,
          props: (route) => ({
            jid: route.params.jid,
            isRoom: true,
          }),
          meta: {
            requiresAuth: true,
            displayContact: false,
          },
        },
        {
          // about component
          name: 'about',
          path: 'about',
          component: About,
          meta: {
            requiresAuth: true,
            displayContact: false,
          },
        },
      ],
    },
    {
      // login page
      name: 'login',
      path: '/login',
      component: Login,
    },
  )
}

if (window.config.hasGuestAccess) {
  // set guest user routes
  routes.push(
    {
      // guest home
      name: 'guest',
      path: '/guest',
      component: GuestHome,
      props: (route) => ({
        requestedJid: route.query.join,
      }),
      meta: {
        requiresAuth: false,
      },
    },
    {
      // guest rooms
      name: 'guestRooms',
      path: '/guest/rooms',
      component: GuestRooms,
      props: (route) => ({
        requestedJid: route.params.requestedJid,
        nick: route.params.nick,
      }),
      meta: {
        requiresAuth: false,
      },
    },
    {
      // guest access room
      name: 'guestInRoom',
      path: '/guest/:jid',
      component: GuestChat,
      props: (route) => ({
        jid: route.params.jid,
      }),
      meta: {
        requiresAuth: false,
      },
    },
  )
  if (!window.config.hasRegisteredAccess) {
    // set default home if registered access is disabled
    routes.push(
      {
        name: 'home',
        path: '/',
        component: GuestHome,
        props: (route) => ({
          requestedJid: route.query.join,
        }),
        meta: {
          requiresAuth: false,
        },
      },
    )
  }
}

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  // check if route require authentication
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (localStorage.getItem('auth') === null) {
      // user is not authenticated, route to login page
      return next({
        name: 'login',
        query: { redirect: to.fullPath },
      })
    }
    // valid auth, route to requested path
    return next()
  }
  // no auth required, route to requested path
  return next()
})

export default router
