import { createApp } from 'vue'
import { Capacitor } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'
import './style.css'
import App from './App.vue'
import router from './router'
import { loadPlaylistsFromApi } from './services/playlistApi.js'
import { loadFooterPromoFromSheet } from './data/footerPromoSheet.js'

const app = createApp(App).use(router)
app.mount('#app')
void loadPlaylistsFromApi()
void loadFooterPromoFromSheet()

// Android hardware back: follow WebView history (same stack Vue Router uses via History API).
if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
  CapacitorApp.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back()
    } else {
      CapacitorApp.minimizeApp()
    }
  })
}
