<template>
  <footer v-if="showFooterChrome" class="gf" role="contentinfo">
    <PageSkeleton v-if="loading" variant="footer" />
    <a
      v-else-if="normalizedFooterPromo"
      class="gf__promo"
      :href="normalizedFooterPromo.videoLink"
      target="_blank"
      rel="noopener noreferrer"
      :aria-label="promoAriaLabelFromApi"
    >
      <div class="gf__promo-top">
        <div class="gf__promo-thumb-wrap">
          <span v-if="normalizedFooterPromo.newBadgeText" class="gf__promo-new">{{
            normalizedFooterPromo.newBadgeText
          }}</span>
          <img
            class="gf__promo-thumb"
            :src="normalizedFooterPromo.thumbnail"
            :alt="normalizedFooterPromo.title"
            width="160"
            height="90"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div class="gf__promo-meta">
          <span class="gf__promo-video-title">{{ normalizedFooterPromo.title }}</span>
          <span v-if="normalizedFooterPromo.description" class="gf__promo-desc">{{
            normalizedFooterPromo.description
          }}</span>
        </div>
        <span class="gf__promo-update" lang="en">Update</span>
      </div>
    </a>
  </footer>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import PageSkeleton from './PageSkeleton.vue'
import { FOOTER_PROMO_SHEET_ENABLED } from '../config/config.js'
import { footerPromoSheet } from '../data/footerPromoSheet.js'
import { youtubeChannel } from '../data/youtubeChannel'
import { SAGIDEEP_MOBILE_UPDATES_URL } from '../services/userAuth.js'
import { extractYoutubeVideoId } from '../utils/youtubeVideoId.js'
import {
  mergeMobileUpdatesPayload,
  pickFirstStringFromObject,
} from '../utils/mobileUpdatesPayload.js'
import {
  clearMobileUpdatesChannelFromPayload,
  syncMobileUpdatesChannelFromPayload,
} from '../data/mobileUpdatesChannelSync.js'

const mergePayload = mergeMobileUpdatesPayload
const pickFirstString = pickFirstStringFromObject

const TITLE_KEYS = [
  'title',
  'videoTitle',
  'mobileUpdateTitle',
  'name',
  'heading',
  'subject',
  'VideoTitle',
  'Title',
]

const DESC_KEYS = [
  'description',
  'videoDescription',
  'mobileUpdateDescription',
  'desc',
  'summary',
  'message',
  'body',
  'text',
  'details',
  'caption',
  'info',
  'about',
  'note',
  'content',
  'Detail',
  'Description',
]

async function fetchOEmbedTitle(watchUrl) {
  try {
    const u = `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`
    const res = await fetch(u)
    if (!res.ok) return ''
    const j = await res.json()
    return String(j.title || '').trim()
  } catch {
    return ''
  }
}

function parseIsUpdateCell(cell) {
  if (cell === true || cell === 1) return true
  const t = String(cell ?? '')
    .trim()
    .toUpperCase()
  return t === 'TRUE' || t === '1' || t === 'YES' || t === 'Y'
}


const loading = ref(true)
const mobileUpdateData = ref(null)
/** Filled when JSON has no title (or only placeholder) — uses YouTube oEmbed. */
const resolvedYoutubeTitle = ref('')

const showFooterChrome = computed(() => {
  const url = String(SAGIDEEP_MOBILE_UPDATES_URL() || '').trim()
  if (!url) return false
  return loading.value || Boolean(normalizedFooterPromo.value)
})

/**
 * Map Apps Script / sheet JSON (`mobileUpdateVideoLink`, etc.) onto the footer UI shape
 * so title, description, link, and thumbnail all resolve reliably.
 */
const normalizedFooterPromo = computed(() => {
  const raw = mobileUpdateData.value
  if (!raw || typeof raw !== 'object') return null
  const d = mergePayload(raw)

  const videoLink = pickFirstString(d, [
    'videoLink',
    'mobileUpdateVideoLink',
    'url',
    'youtubeUrl',
    'link',
  ])
  const explicitId = pickFirstString(d, ['youtubeVideoId', 'videoId', 'id'])
  const id =
    extractYoutubeVideoId(explicitId) || extractYoutubeVideoId(videoLink)

  const hasFlag = 'isMobileUpdate' in d || 'isUpdate' in d
  if (hasFlag) {
    const flag = 'isMobileUpdate' in d ? d.isMobileUpdate : d.isUpdate
    if (!parseIsUpdateCell(flag)) return null
  }

  const href =
    videoLink ||
    (id ? `https://www.youtube.com/watch?v=${encodeURIComponent(id)}` : '')
  if (!href) return null

  let thumbnail = pickFirstString(d, [
    'thumbnail',
    'thumbnailUrl',
    'thumbUrl',
    'imageUrl',
    'poster',
  ])
  if (!thumbnail && id) {
    thumbnail = `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`
  }
  if (!thumbnail) return null

  const apiTitle = pickFirstString(d, TITLE_KEYS)
  const fromOembed = String(resolvedYoutubeTitle.value || '').trim()
  const title = apiTitle || fromOembed || 'Watch on YouTube'
  const description = pickFirstString(d, DESC_KEYS)
  const newBadgeText = pickFirstString(d, [
    'newBadgeText',
    'badgeText',
    'new_badge_text',
    'badge',
  ])

  return {
    videoLink: href,
    thumbnail,
    title,
    description,
    newBadgeText,
  }
})

const promoAriaLabelFromApi = computed(() => {
  const p = normalizedFooterPromo.value
  if (!p) return ''
  const parts = [p.newBadgeText || null, p.title, p.description, p.videoLink].filter(Boolean)
  return parts.join(' — ')
})

const loadFooterPromoFromSheet = async () => {
  const url = SAGIDEEP_MOBILE_UPDATES_URL()
  if (!url) {
    clearMobileUpdatesChannelFromPayload()
    loading.value = false
    return
  }
  resolvedYoutubeTitle.value = ''
  try {
    const response = await fetch(url, {
      method: 'POST',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    })
    const data = await response.json()
    mobileUpdateData.value = data
    syncMobileUpdatesChannelFromPayload(data)

    const d = mergePayload(data)
    const link = pickFirstString(d, [
      'videoLink',
      'mobileUpdateVideoLink',
      'url',
      'youtubeUrl',
      'link',
    ])
    const explicitId = pickFirstString(d, ['youtubeVideoId', 'videoId', 'id'])
    const vid =
      extractYoutubeVideoId(explicitId) || extractYoutubeVideoId(link)
    const watchUrl =
      link ||
      (vid ? `https://www.youtube.com/watch?v=${encodeURIComponent(vid)}` : '')
    const apiTitle = pickFirstString(d, TITLE_KEYS)
    if (watchUrl && (!apiTitle || apiTitle === 'Watch on YouTube')) {
      const t = await fetchOEmbedTitle(watchUrl)
      if (t) resolvedYoutubeTitle.value = t
    }
  } catch {
    /* network or invalid JSON */
    clearMobileUpdatesChannelFromPayload()
  } finally {
    loading.value = false
  }
}
onMounted(async () => {
  await loadFooterPromoFromSheet()
})

/** Sheet I/J/K row loaded and should drive the footer (video id + url present). */
const sheetPromoOn = computed(
  () =>
    FOOTER_PROMO_SHEET_ENABLED &&
    footerPromoSheet.ready &&
    footerPromoSheet.active &&
    Boolean(String(footerPromoSheet.videoId || '').trim()) &&
    Boolean(String(footerPromoSheet.videoUrl || '').trim()),
)

const staticPromoConfigured = computed(
  () =>
    Boolean(
      String(youtubeChannel.footerPromoVideoUrl || '').trim() &&
        String(youtubeChannel.footerPromoVideoId || '').trim(),
    ),
)

/**
 * Show footer: sheet-driven promo when the web app returns a valid row; otherwise only static promo
 * when the sheet feature is **off** (so we never show the wrong static video while the sheet is on).
 */
const showFooterPromo = computed(() => {
  if (FOOTER_PROMO_SHEET_ENABLED) return sheetPromoOn.value
  return staticPromoConfigured.value
})

const promoId = computed(() => {
  if (sheetPromoOn.value) return String(footerPromoSheet.videoId || '').trim()
  return String(youtubeChannel.footerPromoVideoId || '').trim()
})

const promoUrl = computed(() => {
  if (sheetPromoOn.value) return String(footerPromoSheet.videoUrl || '').trim()
  return String(youtubeChannel.footerPromoVideoUrl || '').trim()
})

const promoThumbSrc = computed(() => {
  const id = promoId.value
  if (!id) return ''
  return `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`
})

const promoVideoTitle = computed(() => {
  if (sheetPromoOn.value) {
    const t = String(footerPromoSheet.title || '').trim()
    return t || 'Watch on YouTube'
  }
  return String(youtubeChannel.footerPromoVideoTitle || '').trim() || 'Watch on YouTube'
})

const promoVideoDescription = computed(() => {
  if (sheetPromoOn.value) return String(footerPromoSheet.description || '').trim()
  return String(youtubeChannel.footerPromoVideoDescription || '').trim()
})

/** Strip invisible chars / NBSP so the pill never renders “empty” text. */
function footerPromoButtonText(raw) {
  const s = String(raw ?? '')
    .replace(/[\u200b\u200c\u200d\ufeff]/g, '')
    .replace(/\u00a0/g, ' ')
    .trim()
  return s.length > 0 ? s : 'Update'
}

const promoButtonLabel = computed(() => footerPromoButtonText(youtubeChannel.footerPromoButtonLabel))

const promoNewBadgeText = computed(() => {
  const raw = youtubeChannel.footerPromoNewBadgeText
  const base = raw === undefined || raw === null ? 'NEW' : String(raw)
  return base
    .replace(/[\u200b\u200c\u200d\ufeff]/g, '')
    .replace(/\u00a0/g, ' ')
    .trim()
})

const promoAriaLabel = computed(() => {
  const parts = [
    promoNewBadgeText.value || null,
    `${promoButtonLabel.value} on YouTube`,
    promoVideoTitle.value,
    promoVideoDescription.value,
    promoUrl.value,
  ].filter(Boolean)
  return parts.join(' — ')
})
</script>



<style scoped>
.gf {
  flex-shrink: 0;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  padding: 10px 14px max(12px, env(safe-area-inset-bottom));
  box-sizing: border-box;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(180deg, rgba(18, 18, 18, 0.92) 0%, #121212 100%);
  color: #aaa;
}

.gf__promo {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
  margin: 0;
  padding: 8px 10px;
  border-radius: 10px;
  text-decoration: none;
  color: inherit;
  background: linear-gradient(180deg, #222 0%, #1a1a1a 100%);
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.04) inset, 0 1px 6px rgba(0, 0, 0, 0.35);
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.gf__promo:hover {
  background: #252525;
  border-color: rgba(46, 180, 90, 0.4);
}

.gf__promo:focus-visible {
  outline: 2px solid rgba(201, 162, 39, 0.55);
  outline-offset: 2px;
}

.gf__promo-top {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: start;
  gap: 10px;
  width: 100%;
}

.gf__promo-thumb-wrap {
  position: relative;
  grid-column: 1;
  width: 118px;
  aspect-ratio: 16 / 9;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #0a0a0a;
}

@keyframes gf-promo-new-zoom {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.14);
  }
}

.gf__promo-new {
  position: absolute;
  top: 5px;
  left: 5px;
  z-index: 2;
  padding: 3px 7px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.12em;
  line-height: 1;
  text-transform: uppercase;
  color: #1a1205;
  font-family: system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  background: linear-gradient(145deg, #ffe082 0%, #ffb300 45%, #ff8f00 100%);
  border: 1px solid rgba(255, 255, 255, 0.35);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.55) inset,
    0 2px 8px rgba(0, 0, 0, 0.55);
  pointer-events: none;
  transform-origin: top left;
  animation: gf-promo-new-zoom 1.15s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .gf__promo-new {
    animation: none;
  }
}

.gf__promo-thumb {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.gf__promo-meta {
  grid-column: 2;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding-top: 1px;
}

.gf__promo-update {
  grid-column: 3;
  justify-self: end;
  align-self: start;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 5.5rem;
  min-height: 36px;
  padding: 0 16px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: normal;
  white-space: nowrap;
  font-family: system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  color: #fff;
  -webkit-text-fill-color: #fff;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.4);
  background: #2e7d32;
  border: 1px solid rgba(0, 0, 0, 0.22);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.18) inset,
    0 1px 2px rgba(0, 0, 0, 0.35);
  pointer-events: none;
}

.gf__promo:hover .gf__promo-update {
  background: #388e3c;
}

.gf__promo:active .gf__promo-update {
  background: #1b5e20;
}

.gf__promo-video-title {
  width: 100%;
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  color: #eee;
  letter-spacing: 0.01em;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  overflow: hidden;
}

.gf__promo-desc {
  width: 100%;
  margin: 0;
  font-size: 12px;
  font-weight: 400;
  line-height: 1.4;
  color: #9a9a9a;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
  line-clamp: 4;
  overflow: hidden;
}
</style>
