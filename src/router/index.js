import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
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

export default router
