<script setup>
import PlaylistRow from '../components/PlaylistRow.vue'
import YoutubeChannelPromo from '../components/YoutubeChannelPromo.vue'
import { FOOTER_PROMO_SHEET_ENABLED } from '../config/footerPromoSheetUrl.js'
import { playlistsIndex } from '../data/playlists'
import { youtubeChannel } from '../data/youtubeChannel'

/** When the Mobile Update sheet is on, subscriber text comes from column C — do not pass static manual line. */
const channelManualStatsLine = FOOTER_PROMO_SHEET_ENABLED ? '' : youtubeChannel.manualStatsLine
</script>

<template>
  <div class="shell">
    <div class="shell__glow" aria-hidden="true" />
    <header class="hero" aria-label="YouTube channel">
      <YoutubeChannelPromo
        :display-name="youtubeChannel.displayName"
        :handle="youtubeChannel.handle"
        :channel-url="youtubeChannel.url"
        :avatar-url="youtubeChannel.avatarUrl"
        :manual-stats-line="channelManualStatsLine"
      />
    </header>

    <section class="vault" aria-label="Playlists">
      <div class="vault__head">
        <h2 class="vault__label">Playlists</h2>
        <span class="vault__count">{{
          playlistsIndex.length === 1 ? '1 list' : `${playlistsIndex.length} lists`
        }}</span>
      </div>
      <ul class="vault__list">
        <li v-for="p in playlistsIndex" :key="p.id" class="vault__item">
          <PlaylistRow
            :playlist-id="p.id"
            :title="p.name"
            :video-count="p.videoCount"
            :variant="p.variant"
            :cover-src="p.listCoverImg"
            :coming-soon="p.isComingSoon"
            :is-paid="p.isPaid"
            :paid-amount="p.amount"
          />
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.shell {
  position: relative;
  min-height: 100%;
  padding: max(20px, env(safe-area-inset-top)) 16px max(28px, env(safe-area-inset-bottom));
  max-width: 480px;
  margin: 0 auto;
  box-sizing: border-box;
  background: radial-gradient(ellipse 120% 80% at 50% -20%, rgba(154, 27, 47, 0.14), transparent 55%),
    linear-gradient(180deg, #0f0f0f 0%, #0a0a0a 50%, #0c0c0c 100%);
  color: #e8e4dc;
}

.shell__glow {
  pointer-events: none;
  position: fixed;
  inset: 0;
  max-width: 480px;
  margin: 0 auto;
  background: radial-gradient(circle at 80% 15%, rgba(201, 162, 39, 0.05), transparent 42%),
    radial-gradient(circle at 12% 55%, rgba(154, 27, 47, 0.06), transparent 38%);
  z-index: 0;
}

.hero,
.vault {
  position: relative;
  z-index: 1;
}

.hero {
  margin-bottom: 22px;
}

.vault__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 10px;
  padding: 0 4px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.vault__label {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: none;
  color: #f1f1f1;
}

.vault__count {
  font-size: 13px;
  color: #aaa;
  font-variant-numeric: tabular-nums;
}

.vault__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.vault__item {
  margin: 0;
}
</style>
