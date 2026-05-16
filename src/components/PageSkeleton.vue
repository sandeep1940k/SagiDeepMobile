<script setup>
/**
 * Neutral loading placeholders (shimmer) for list / hero / compact footer layouts.
 */
const props = defineProps({
  /** `list` — playlist-style rows; `playlist` — hero + rows; `footer` — compact strip; `watch` — player + meta */
  variant: {
    type: String,
    default: 'list',
    validator: (v) => ['list', 'playlist', 'footer', 'watch'].includes(v),
  },
  /** List-style row count (not used for `footer`). */
  rows: { type: Number, default: 6 },
})
</script>

<template>
  <div class="ps" :class="`ps--${variant}`" role="status" aria-live="polite" aria-busy="true">
    <span class="ps__vh">Loading…</span>

    <template v-if="variant === 'footer'">
      <div class="ps__footer-row">
        <div class="ps__sk ps__footer-thumb" />
        <div class="ps__footer-meta">
          <div class="ps__sk ps__line ps__line--md" />
          <div class="ps__sk ps__line ps__line--sm" />
        </div>
        <div class="ps__sk ps__footer-pill" />
      </div>
    </template>

    <template v-else-if="variant === 'playlist'">
      <div class="ps__hero">
        <div class="ps__sk ps__hero-thumb" />
        <div class="ps__hero-text">
          <div class="ps__sk ps__line ps__line--lg" />
          <div class="ps__sk ps__line ps__line--md" />
          <div class="ps__sk ps__line ps__line--sm" />
        </div>
      </div>
      <div class="ps__section-label ps__sk ps__line ps__line--xs" />
      <ul class="ps__list" :aria-rowcount="rows">
        <li v-for="n in rows" :key="n" class="ps__row">
          <div class="ps__sk ps__row-thumb" />
          <div class="ps__row-text">
            <div class="ps__sk ps__line ps__line--md" />
            <div class="ps__sk ps__line ps__line--sm" />
          </div>
        </li>
      </ul>
    </template>

    <template v-else-if="variant === 'watch'">
      <div class="ps__sk ps__watch-player" />
      <div class="ps__watch-meta">
        <div class="ps__sk ps__line ps__line--lg" />
        <div class="ps__watch-creator">
          <div class="ps__sk ps__avatar" />
          <div class="ps__creator-lines">
            <div class="ps__sk ps__line ps__line--md" />
            <div class="ps__sk ps__line ps__line--sm" />
            <div class="ps__sk ps__line ps__line--sm" />
          </div>
          <div class="ps__sk ps__sub-pill" />
        </div>
      </div>
    </template>

    <template v-else>
      <div class="ps__head">
        <div class="ps__sk ps__line ps__line--xs" />
        <div class="ps__sk ps__line ps__line--sm" />
      </div>
      <ul class="ps__list" :aria-rowcount="rows">
        <li v-for="n in rows" :key="n" class="ps__row">
          <div class="ps__sk ps__row-thumb" />
          <div class="ps__row-text">
            <div class="ps__sk ps__line ps__line--md" />
            <div class="ps__sk ps__line ps__line--sm" />
          </div>
        </li>
      </ul>
    </template>
  </div>
</template>

<style scoped>
.ps {
  --ps-base: rgba(255, 255, 255, 0.07);
  --ps-shine: rgba(255, 255, 255, 0.14);
  width: 100%;
  box-sizing: border-box;
}

.ps__vh {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@keyframes ps-shimmer {
  0% {
    background-position: 130% 0;
  }
  100% {
    background-position: -130% 0;
  }
}

.ps__sk {
  background: linear-gradient(
    105deg,
    var(--ps-base) 0%,
    var(--ps-base) 40%,
    var(--ps-shine) 50%,
    var(--ps-base) 60%,
    var(--ps-base) 100%
  );
  background-size: 220% 100%;
  animation: ps-shimmer 1.35s ease-in-out infinite;
  border-radius: 8px;
}

@media (prefers-reduced-motion: reduce) {
  .ps__sk {
    animation: none;
    background: var(--ps-base);
  }
}

.ps__line {
  height: 12px;
  width: 100%;
  border-radius: 6px;
}

.ps__line--xs {
  width: 72px;
  height: 11px;
}
.ps__line--sm {
  width: 88%;
  height: 11px;
}
.ps__line--md {
  width: 96%;
  height: 13px;
}
.ps__line--lg {
  width: 100%;
  height: 18px;
  border-radius: 8px;
}

.ps__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 0 4px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  gap: 12px;
}

.ps__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ps__row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 4px;
}

.ps__row-thumb {
  width: 112px;
  height: 63px;
  flex-shrink: 0;
  border-radius: 8px;
}

.ps__row-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* playlist */
.ps--playlist .ps__hero {
  display: flex;
  gap: 14px;
  margin-bottom: 18px;
  align-items: flex-start;
}

.ps__hero-thumb {
  width: 120px;
  height: 120px;
  flex-shrink: 0;
  border-radius: 12px;
}

.ps__hero-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 4px;
}

.ps__section-label {
  width: 64px;
  margin-bottom: 8px;
}

/* footer */
.ps--footer {
  padding: 0;
}

.ps__footer-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: start;
  gap: 10px;
  width: 100%;
}

.ps__footer-thumb {
  width: 118px;
  aspect-ratio: 16 / 9;
  border-radius: 6px;
}

.ps__footer-meta {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 2px;
}

.ps__footer-pill {
  width: 5.5rem;
  height: 36px;
  border-radius: 999px;
  justify-self: end;
}

/* watch */
.ps--watch .ps__watch-player {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 10px;
  margin-bottom: 14px;
}

.ps__watch-meta {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ps__watch-creator {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ps__avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  flex-shrink: 0;
}

.ps__creator-lines {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ps__sub-pill {
  width: 96px;
  height: 34px;
  border-radius: 999px;
  flex-shrink: 0;
}
</style>
