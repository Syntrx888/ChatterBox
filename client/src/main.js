import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import './style.css'

const routes = [
  { path: '/', component: () => import('./views/LoadingView.vue') },
  { path: '/auth', component: () => import('./views/AuthView.vue') },
  { path: '/chat', component: () => import('./views/ChatView.vue'), meta: { requiresAuth: true } },
  { path: '/admin', component: () => import('./views/AdminView.vue') },
  { path: '/members', component: () => import('./views/MembersView.vue'), meta: { requiresAuth: true } },
  { path: '/settings', component: () => import('./views/SettingsView.vue'), meta: { requiresAuth: true } }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  
  if (to.meta.requiresAuth && !token) {
    next('/auth')
  } else if (to.path === '/auth' && token) {
    next('/chat')
  } else {
    next()
  }
})

const app = createApp(App)
app.use(router)
app.mount('#app')
