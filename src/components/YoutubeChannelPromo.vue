<script setup>
import { computed, ref, toRef } from 'vue'
import { FOOTER_PROMO_SHEET_ENABLED } from '../config/footerPromoSheetUrl.js'
import { footerPromoSheet } from '../data/footerPromoSheet.js'
import { useYoutubeChannelRuntimeStats } from '../composables/useYoutubeRuntimeStats'
import { formatSubscribersDisplayLine } from '../utils/subscribersDisplay.js'

const props = defineProps({
  /** Channel title as shown on YouTube */
  displayName: { type: String, required: true },
  /** Handle without @ */
  handle: { type: String, required: true },
  /** Main channel URL */
  channelUrl: { type: String, required: true },
  /** YouTube channel avatar URL (e.g. yt3.googleusercontent.com) */
  avatarUrl: { type: String, default: '' },
  /** Shown under @handle when set; no YouTube API needed (e.g. copy from your channel page). */
  manualStatsLine: { type: String, default: '' },
})

const avatarLoadError = ref(false)

const avatarLetter = computed(() => props.displayName.trim().charAt(0).toUpperCase())

const showAvatarImage = computed(
  () => Boolean(props.avatarUrl?.trim()) && !avatarLoadError.value,
)

const handleWithAt = computed(() => `@${props.handle.replace(/^@/, '')}`)

/** “Mobile Update” column C — shown on home when sheet fetch finished (even if footer video promo is off). */
const sheetSubscribersLine = computed(() => {
  if (!FOOTER_PROMO_SHEET_ENABLED || !footerPromoSheet.ready) return ''
  return String(footerPromoSheet.subscribersLine || '').trim()
})

const apiStatsEnabled = computed(
  () => !String(props.manualStatsLine || '').trim() && !sheetSubscribersLine.value,
)
const { loading: statsLoading, line: statsLine } = useYoutubeChannelRuntimeStats(
  toRef(props, 'handle'),
  { enabled: apiStatsEnabled },
)

const displayStatsLine = computed(() => {
  if (sheetSubscribersLine.value) return formatSubscribersDisplayLine(sheetSubscribersLine.value)
  return String(props.manualStatsLine || '').trim() || statsLine.value
})

const subscribeUrl = computed(() => {
  const base = props.channelUrl.split('?')[0]
  return `${base}?sub_confirmation=1`
})

function handleAvatarError() {
  avatarLoadError.value = true
}
</script>

<template>
  <div class="yt-promo">
    <a class="yt-promo__profile" :href="channelUrl" target="_blank" rel="noopener noreferrer">
      <div class="yt-promo__avatar">
        <img
          v-if="showAvatarImage"
          :src="avatarUrl"
          :alt="`${displayName} channel`"
          class="yt-promo__avatar-img"
          loading="lazy"
          decoding="async"
          referrerpolicy="no-referrer"
          @error="handleAvatarError"
        />
        <span v-else class="yt-promo__avatar-fallback" aria-hidden="true">{{ avatarLetter }}</span>
      </div>
      <div class="yt-promo__text">
        <span class="yt-promo__name">{{ displayName }}</span>
        <span class="yt-promo__handle">{{ handleWithAt }}</span>
        <span v-if="displayStatsLine" class="yt-promo__stats">{{ displayStatsLine }}</span>
        <span v-else-if="statsLoading" class="yt-promo__hint">Loading stats…</span>
        <span v-else class="yt-promo__hint">Official channel · YouTube</span>
      </div>
    </a>
    <a class="yt-promo__subscribe" :href="subscribeUrl" target="_blank" rel="noopener noreferrer">
      Subscribe
    </a>
  </div>
</template>

<style scoped>
.yt-promo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.yt-promo__profile {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: inherit;
  -webkit-tap-highlight-color: transparent;
}

.yt-promo__profile:focus-visible {
  outline: 2px solid rgba(62, 166, 255, 0.5);
  outline-offset: 3px;
  border-radius: 10px;
}

.yt-promo__avatar {
  flex-shrink: 0;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(145deg, #5c1a28, #2a1218);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
}

.yt-promo__avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.yt-promo__avatar-fallback {
  line-height: 1;
}

.yt-promo__text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: flex-start;
}

.yt-promo__name {
  font-size: 16px;
  font-weight: 600;
  color: #f1f1f1;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.yt-promo__handle {
  font-size: 13px;
  color: #aaa;
  line-height: 1.2;
}

.yt-promo__hint {
  font-size: 12px;
  color: rgba(170, 170, 170, 0.75);
  margin-top: 2px;
}

.yt-promo__stats {
  font-size: 12px;
  color: #aaa;
  margin-top: 2px;
  line-height: 1.35;
  font-variant-numeric: tabular-nums;
}

.yt-promo__subscribe {
  flex-shrink: 0;
  padding: 9px 14px;
  border-radius: 18px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0;
  text-decoration: none;
  color: #fff;
  background: #ff0000;
  border: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s ease, transform 0.12s ease;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
}

.yt-promo__subscribe:hover {
  background: #cc0000;
}

.yt-promo__subscribe:active {
  transform: scale(0.97);
}

.yt-promo__subscribe:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
}
</style>
