<script setup>
import { computed, unref } from 'vue'
import { RouterLink } from 'vue-router'

const props = defineProps({
  /** `{ name, email }` when signed in, or `null`. */
  session: {
    type: Object,
    default: null,
  },
})

defineEmits(['logout'])

/** Safe session: unwrap Ref, require email so junk objects do not flip UI to “signed in”. */
const activeSession = computed(() => {
  const raw = unref(props.session)
  if (raw == null || typeof raw !== 'object') return null
  const email = String(raw.email ?? '').trim()
  if (!email) return null
  const name = String(raw.name ?? '').trim() || email
  return { name, email }
})

const userInitial = computed(() => {
  const src = String(activeSession.value?.name || activeSession.value?.email || '?').trim()
  return src.charAt(0).toUpperCase()
})
</script>

<template>
  <div
    class="account-bar"
    :class="{ 'account-bar--guest-compact': !activeSession }"
    role="region"
    aria-label="Account profile"
  >
    <template v-if="!activeSession">
      <div class="account-bar__guest-main account-bar__guest-main--icon-only">
        <RouterLink class="account-bar__ring account-bar__ring--link" :to="{ name: 'profile' }" aria-label="Open profile">
          <svg class="account-bar__ring-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="12" cy="8" r="3.25" stroke="currentColor" stroke-width="1.75" />
            <path
              d="M5.25 19.25v-.75c0-2.35 2.15-4 6.75-4s6.75 1.65 6.75 4v.75"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
            />
          </svg>
        </RouterLink>
      </div>
    </template>
    <template v-else>
      <div class="account-bar__head">
        <span class="account-bar__title">Profile</span>
        <span class="account-bar__hint">Signed in</span>
      </div>
      <div class="account-bar__signed">
        <div class="account-bar__profile">
          <div class="account-bar__ring account-bar__ring--initial" aria-hidden="true">{{ userInitial }}</div>
          <div class="account-bar__meta">
            <span class="account-bar__name">{{ activeSession.name }}</span>
            <span class="account-bar__email" :title="activeSession.email">{{ activeSession.email }}</span>
          </div>
        </div>
        <button type="button" class="account-bar__btn account-bar__btn--ghost account-bar__btn--solo" @click="$emit('logout')">
          Log out
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.account-bar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px 11px;
  border-radius: 14px;
  background: rgba(28, 28, 28, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.09);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.35);
}

.account-bar__head {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.account-bar__guest-main {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.account-bar__guest-main--icon-only {
  justify-content: center;
}

/** Guest (icon-only): slightly shorter bar than signed-in card. */
.account-bar--guest-compact {
  padding: 6px 12px 7px;
  gap: 0;
}

.account-bar--guest-compact .account-bar__ring {
  width: 40px;
  height: 40px;
}

.account-bar--guest-compact .account-bar__ring-icon {
  width: 22px;
  height: 22px;
}

.account-bar__ring {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, rgba(55, 65, 78, 0.95), rgba(24, 30, 38, 0.98));
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
  color: rgba(220, 215, 205, 0.72);
}

.account-bar__ring--link {
  text-decoration: none;
  color: rgba(220, 215, 205, 0.72);
  cursor: pointer;
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
  transition:
    transform 0.12s ease,
    border-color 0.15s ease,
    background 0.15s ease;
}

.account-bar__ring--link:hover {
  border-color: rgba(255, 255, 255, 0.2);
  background: linear-gradient(145deg, rgba(62, 74, 90, 0.98), rgba(28, 36, 46, 0.99));
}

.account-bar__ring--link:active {
  transform: scale(0.97);
}

.account-bar__ring--link:focus-visible {
  outline: 2px solid rgba(62, 166, 255, 0.65);
  outline-offset: 2px;
}

.account-bar__ring-icon {
  width: 24px;
  height: 24px;
}

.account-bar__ring--initial {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #f0ebe3;
  background: linear-gradient(145deg, #4a5d72, #243040);
}

.account-bar__title {
  display: block;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #f0f0f0;
  line-height: 1.2;
}

.account-bar__hint {
  display: block;
  font-size: 12px;
  color: #b8b8b8;
  line-height: 1.3;
}

.account-bar__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 9px 12px;
  border-radius: 20px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-align: center;
  border: 1px solid transparent;
  cursor: pointer;
  white-space: nowrap;
  -webkit-tap-highlight-color: transparent;
  -webkit-appearance: none;
  appearance: none;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    transform 0.12s ease;
}

.account-bar__btn:active {
  transform: scale(0.98);
}

.account-bar__btn:focus-visible {
  outline: 2px solid rgba(62, 166, 255, 0.65);
  outline-offset: 2px;
}

.account-bar__btn--ghost {
  color: #ece8e0;
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.14);
}

.account-bar__btn--ghost:hover {
  background: rgba(255, 255, 255, 0.1);
}

.account-bar__btn--solo {
  flex: 0 0 auto;
  padding-left: 14px;
  padding-right: 14px;
}

.account-bar__signed {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.account-bar__profile {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1 1 auto;
}

.account-bar__meta {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.account-bar__name {
  font-size: 14px;
  font-weight: 600;
  color: #f1f1f1;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-bar__email {
  font-size: 11px;
  color: #999;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
