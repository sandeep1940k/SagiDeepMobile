<script setup>
import { computed } from 'vue'
import YoutubeChannelPromo from './YoutubeChannelPromo.vue'
import { FOOTER_PROMO_SHEET_ENABLED } from '../config/config.js'
import { youtubeChannel } from '../data/youtubeChannel'

/** Same rule as the old toast: sheet column K drives the stats line when sheet promo is on. */
const channelManualStatsLine = computed(() =>
  FOOTER_PROMO_SHEET_ENABLED ? '' : youtubeChannel.manualStatsLine,
)
</script>

<template>
  <div class="channel-subscribe-bar" role="region" aria-label="Subscribe on YouTube">
    <div class="channel-subscribe-bar__inner">
      <YoutubeChannelPromo
        :display-name="youtubeChannel.displayName"
        :handle="youtubeChannel.handle"
        :channel-url="youtubeChannel.url"
        :avatar-url="youtubeChannel.avatarUrl"
        :manual-stats-line="channelManualStatsLine"
      />
    </div>
  </div>
</template>

<style scoped>
.channel-subscribe-bar {
  flex-shrink: 0;
  width: 100%;
  padding: 10px 14px 6px;
  box-sizing: border-box;
  background: #121212;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.channel-subscribe-bar__inner {
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
}
</style>
