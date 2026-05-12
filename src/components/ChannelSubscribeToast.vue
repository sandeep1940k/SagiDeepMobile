<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import YoutubeChannelPromo from './YoutubeChannelPromo.vue'
import { FOOTER_PROMO_SHEET_ENABLED } from '../config/config.js'
import { youtubeChannel } from '../data/youtubeChannel'

/** All timing is re-rolled each cycle (no fixed schedule). */

/** Delay before the promo appears (“come”). */
const ENTER_DELAY_MIN_MS = 180
const ENTER_DELAY_MAX_MS = 3400

/** Slide-in animation length after it mounts (still random per open). */
const ENTER_ANIM_MIN_MS = 200
const ENTER_ANIM_MAX_MS = 780

/** How long it stays on screen before auto-close (“wait”). */
const VISIBLE_MIN_MS = 3200
const VISIBLE_MAX_MS = 28000

/** Slide-out animation length when closing (“close”). */
const LEAVE_ANIM_MIN_MS = 140
const LEAVE_ANIM_MAX_MS = 820

const DRAG_DISMISS_PX = 56

const route = useRoute()

const showChrome = computed(() => route.name !== 'watch' && route.name !== 'auth')

const visible = ref(false)
const dragY = ref(false)
const dragging = ref(false)
/** After auto- or drag-dismiss while still on a chrome route, skip re-scheduling until user leaves chrome and returns. */
const dismissedWhileOnChrome = ref(false)

let startY = 0
let enterTimer = null
let autoTimer = null
let moveHandler = null
let upHandler = null

const channelManualStatsLine = computed(() =>
  FOOTER_PROMO_SHEET_ENABLED ? '' : youtubeChannel.manualStatsLine,
)

const enterTransitionMs = ref(340)
const leaveTransitionMs = ref(280)

const toastChromeStyle = computed(() => ({
  '--toast-enter-ms': `${enterTransitionMs.value}ms`,
  '--toast-leave-ms': `${leaveTransitionMs.value}ms`,
}))

const sheetStyle = computed(() => ({
  transform: `translateY(${dragY.value}px)`,
  transition: dragging.value ? 'none' : 'transform 0.22s ease-out',
}))

function randomIntInclusive(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1))
}

function clearTimers() {
  if (enterTimer != null) {
    clearTimeout(enterTimer)
    enterTimer = null
  }
  if (autoTimer != null) {
    clearTimeout(autoTimer)
    autoTimer = null
  }
}

function detachDragListeners() {
  if (moveHandler) {
    window.removeEventListener('pointermove', moveHandler)
    window.removeEventListener('pointerup', upHandler)
    window.removeEventListener('pointercancel', upHandler)
    moveHandler = null
    upHandler = null
  }
}

function dismiss(reason = 'route') {
  if (reason === 'auto' || reason === 'user') {
    leaveTransitionMs.value = randomIntInclusive(LEAVE_ANIM_MIN_MS, LEAVE_ANIM_MAX_MS)
  }
  clearTimers()
  detachDragListeners()
  dragging.value = false
  dragY.value = 0
  visible.value = false
  if (reason === 'auto' || reason === 'user') {
    dismissedWhileOnChrome.value = true
  }
}

function scheduleAutoDismiss(visibleDurationMs) {
  if (autoTimer != null) clearTimeout(autoTimer)
  autoTimer = window.setTimeout(() => {
    autoTimer = null
    dismiss('auto')
  }, visibleDurationMs)
}

function tryShow() {
  clearTimers()
  if (!showChrome.value || dismissedWhileOnChrome.value) return
  const enterDelay = randomIntInclusive(ENTER_DELAY_MIN_MS, ENTER_DELAY_MAX_MS)
  enterTimer = window.setTimeout(() => {
    enterTimer = null
    if (!showChrome.value || dismissedWhileOnChrome.value) return
    enterTransitionMs.value = randomIntInclusive(ENTER_ANIM_MIN_MS, ENTER_ANIM_MAX_MS)
    const dwellMs = randomIntInclusive(VISIBLE_MIN_MS, VISIBLE_MAX_MS)
    visible.value = true
    scheduleAutoDismiss(dwellMs)
  }, enterDelay)
}

watch(
  showChrome,
  (on) => {
    if (!on) {
      dismiss('route')
      dismissedWhileOnChrome.value = false
      return
    }
    dismissedWhileOnChrome.value = false
    tryShow()
  },
  { immediate: true },
)

function onSheetPointerDown(e) {
  if (!visible.value) return
  if (e.pointerType === 'mouse' && e.button !== 0) return
  if (e.target.closest('a')) return
  dragging.value = true
  startY = e.clientY
  dragY.value = 0

  moveHandler = (ev) => {
    if (!dragging.value) return
    const dy = ev.clientY - startY
    dragY.value = dy < 0 ? dy : 0
  }
  upHandler = () => {
    if (!dragging.value) return
    dragging.value = false
    detachDragListeners()
    if (dragY.value < -DRAG_DISMISS_PX) {
      dismiss('user')
    } else {
      dragY.value = 0
    }
  }
  window.addEventListener('pointermove', moveHandler)
  window.addEventListener('pointerup', upHandler)
  window.addEventListener('pointercancel', upHandler)
}

onUnmounted(() => {
  clearTimers()
  detachDragListeners()
})
</script>

<template>
  <Teleport to="body">
    <Transition name="channel-toast">
      <div
        v-if="showChrome && visible"
        class="channel-toast"
        :style="toastChromeStyle"
        role="region"
        aria-label="Subscribe on YouTube"
      >
        <div
          class="channel-toast__sheet"
          :style="sheetStyle"
          @pointerdown="onSheetPointerDown"
        >
          <YoutubeChannelPromo
            :display-name="youtubeChannel.displayName"
            :handle="youtubeChannel.handle"
            :channel-url="youtubeChannel.url"
            :avatar-url="youtubeChannel.avatarUrl"
            :manual-stats-line="channelManualStatsLine"
          />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.channel-toast {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  z-index: 200;
  display: flex;
  justify-content: center;
  padding: max(10px, env(safe-area-inset-top)) 16px 0;
  pointer-events: none;
}

.channel-toast__sheet {
  width: 100%;
  max-width: 480px;
  pointer-events: auto;
  touch-action: manipulation;
}

.channel-toast-enter-active {
  transition:
    transform var(--toast-enter-ms, 340ms) cubic-bezier(0.22, 1, 0.36, 1),
    opacity calc(var(--toast-enter-ms, 340ms) * 0.82) ease;
}

.channel-toast-leave-active {
  transition:
    transform var(--toast-leave-ms, 280ms) cubic-bezier(0.32, 0.72, 0.42, 1),
    opacity calc(var(--toast-leave-ms, 280ms) * 0.9) ease;
}

.channel-toast-enter-from,
.channel-toast-leave-to {
  opacity: 0;
  transform: translateY(calc(-100% - 20px));
}

@media (prefers-reduced-motion: reduce) {
  .channel-toast-enter-active,
  .channel-toast-leave-active {
    transition-duration: 0.08s;
  }
}
</style>
