import { createRouter, createWebHistory } from 'vue-router'
import { getPlaylistById } from '../services/playlistApi.js'
import { logPlaylistOpen } from '../services/playlistSheetLog.js'
import { getStoredSession } from '../services/userAuth.js'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/auth',
      name: 'auth',
      component: () => import('../views/AuthView.vue'),
    },
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/ProfileView.vue'),
    },
    {
      path: '/playlist/:id',
      name: 'playlist',
      component: () => import('../views/PlaylistDetailView.vue'),
    },
    {
      path: '/watch/:playlistId/:videoId',
      name: 'watch',
      component: () => import('../views/VideoPlayerView.vue'),
    },
  ],
})

/** Video playback requires a stored session; return to the same watch URL after login. */
router.beforeEach((to) => {
  if (to.name !== 'watch') return true
  if (getStoredSession()) return true
  return {
    name: 'auth',
    query: {
      mode: 'login',
      redirect: to.fullPath,
    },
  }
})

/** On playlist tap: POST ip, playlistName, time (+ playlistId) to Google Sheet via Apps Script. */
router.afterEach((to) => {
  if (to.name !== 'playlist') return
  const playlistId = String(to.params.id ?? '')
  const p = getPlaylistById(playlistId)
  void logPlaylistOpen({
    playlistId,
    playlistName: p?.name ?? playlistId,
  })
})

export default router
