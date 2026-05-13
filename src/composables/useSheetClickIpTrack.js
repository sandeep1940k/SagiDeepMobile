import { onMounted, onBeforeUnmount } from 'vue'
import { SHEET_IP_TRACK_ENABLED } from '../config/config.js'
import { reportSheetClickIpTrack } from '../services/sheetClickIpTrack.js'

/**
 * Track like standalone HTML: once when the shell mounts (≈ page load) and on every tap (`pointerdown`).
 */
export function useSheetClickIpTrack() {
  function onPointerDown() {
    void reportSheetClickIpTrack()
  }

  onMounted(() => {
    if (!SHEET_IP_TRACK_ENABLED) return
    void reportSheetClickIpTrack()
    window.addEventListener('pointerdown', onPointerDown, { capture: true })
  })

  onBeforeUnmount(() => {
    window.removeEventListener('pointerdown', onPointerDown, { capture: true })
  })
}
