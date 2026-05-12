<script setup>
import { computed } from 'vue'
import { FOOTER_PROMO_SHEET_ENABLED } from '../config/config.js'
import { footerPromoSheet } from '../data/footerPromoSheet.js'
import { youtubeChannel } from '../data/youtubeChannel'

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

<template>
  <footer v-if="showFooterPromo" class="gf" role="contentinfo">
    <a
      v-if="promoUrl && promoThumbSrc"
      class="gf__promo"
      :href="promoUrl"
      target="_blank"
      rel="noopener noreferrer"
      :aria-label="promoAriaLabel"
    >
      <div class="gf__promo-top">
        <div class="gf__promo-thumb-wrap">
          <span v-if="promoNewBadgeText" class="gf__promo-new">{{ promoNewBadgeText }}</span>
          <img
            class="gf__promo-thumb"
            :src="promoThumbSrc"
            :alt="promoVideoTitle"
            width="160"
            height="90"
            loading="lazy"
            decoding="async"
          />
        </div>
        <span class="gf__promo-update" lang="en" v-text="promoButtonLabel"></span>
      </div>
      <div class="gf__promo-text">
        <span class="gf__promo-video-title">{{ promoVideoTitle }}</span>
        <span v-if="promoVideoDescription" class="gf__promo-desc">{{ promoVideoDescription }}</span>
      </div>
    </a>
  </footer>
</template>

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
  align-items: center;
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

.gf__promo-update {
  grid-column: 3;
  justify-self: end;
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

.gf__promo-text {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.gf__promo-video-title {
  width: 100%;
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  color: #eee;
  letter-spacing: 0.01em;
}

.gf__promo-desc {
  width: 100%;
  margin: 0;
  font-size: 12px;
  font-weight: 400;
  line-height: 1.4;
  color: #9a9a9a;
}
</style>
