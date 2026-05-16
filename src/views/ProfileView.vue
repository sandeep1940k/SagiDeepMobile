<script setup>
import { computed, onBeforeMount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { clearStoredSession, getStoredSession } from '../services/userAuth.js'
import { SAGIDEEP_TRACKING_URL } from '../services/userAuth.js'
import { fetchPublicIp } from '../services/sheetClickIpTrack.js'

const session = ref(null)

const route = useRoute()

function refresh() {
  session.value = getStoredSession()
}
onBeforeMount(async () => {
  const url = SAGIDEEP_TRACKING_URL()
  if (!url) {
    return
  }
  try {
    const ip = await fetchPublicIp();
    const response = await fetch(url, {
      method: 'POST',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      body: JSON.stringify({
        ipAddress: ip,
        activity: 'viewed_profile',
      }),
    })
    // const data = await response.json()
    console.log(response)
  } catch (error) {
    console.error(error)
  }
})
onMounted(refresh)
watch(
  () => route.fullPath,
  () => {
    if (route.name === 'profile') refresh()
  },
)

const activeSession = computed(() => {
  const raw = session.value
  if (raw == null || typeof raw !== 'object') return null
  const email = String(raw.email ?? '').trim()
  if (!email) return null
  const name = String(raw.name ?? '').trim() || email
  return { name, email }
})

function logout() {
  clearStoredSession()
  refresh()
}
</script>

<template>
  <div class="shell">
    <div class="shell__glow" aria-hidden="true" />

    <div class="profile-page">
      <h1 class="profile-page__title">Profile</h1>

      <section v-if="activeSession" class="card" aria-label="Signed-in account">
        <div class="card__row">
          <span class="card__label">Name</span>
          <span class="card__value">{{ activeSession.name }}</span>
        </div>
        <div class="card__row">
          <span class="card__label">Email</span>
          <span class="card__value card__value--email" :title="activeSession.email">{{ activeSession.email }}</span>
        </div>
        <button type="button" class="card__btn" @click="logout">Log out</button>
      </section>

      <section v-else class="card card--guest" aria-label="Guest account">
        <p class="card__guest-lead">No account is saved on this device.</p>
        <div class="guest-auth" role="group" aria-label="Account options">
          <RouterLink
            class="guest-auth__btn guest-auth__btn--secondary"
            :to="{ name: 'auth', query: { redirect: '/profile' } }"
          >
            Log in
          </RouterLink>
          <RouterLink
            class="guest-auth__btn guest-auth__btn--primary"
            :to="{ name: 'auth', query: { redirect: '/profile', mode: 'signup' } }"
          >
            Sign up
          </RouterLink>
        </div>
      </section>

      <RouterLink class="profile-page__back" to="/">← Back to home</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.shell {
  position: relative;
  min-height: 100%;
  padding: 12px 16px max(28px, env(safe-area-inset-bottom));
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

.profile-page {
  position: relative;
  z-index: 1;
}

.profile-page__title {
  margin: 0 0 16px;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #f5f2eb;
}

.card {
  padding: 16px;
  border-radius: 14px;
  background: rgba(28, 28, 28, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.09);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.35);
}

.card__row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 14px;
}

.card__row:last-of-type {
  margin-bottom: 18px;
}

.card__label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #9a9a9a;
}

.card__value {
  font-size: 15px;
  font-weight: 600;
  color: #f1f1f1;
  word-break: break-word;
}

.card__value--email {
  font-size: 13px;
  font-weight: 500;
  color: #c8c4bc;
}

.card--guest {
  padding: 18px 16px 16px;
}

.card__guest-lead {
  margin: 0 0 16px;
  font-size: 14px;
  line-height: 1.45;
  color: #b8b4ac;
}

.guest-auth {
  display: flex;
  flex-direction: row;
  gap: 10px;
  align-items: stretch;
}

.guest-auth__btn {
  flex: 1 1 0;
  min-width: 0;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 12px;
  border-radius: 12px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-decoration: none;
  text-align: center;
  border: 1px solid transparent;
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    transform 0.12s ease,
    box-shadow 0.18s ease;
  -webkit-tap-highlight-color: transparent;
}

.guest-auth__btn:active {
  transform: scale(0.98);
}

.guest-auth__btn:focus-visible {
  outline: 2px solid rgba(62, 166, 255, 0.65);
  outline-offset: 2px;
}

.guest-auth__btn--secondary {
  color: #ece8e0;
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.14);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.guest-auth__btn--secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.22);
}

.guest-auth__btn--primary {
  color: #121212;
  background: linear-gradient(180deg, #f0ebe3 0%, #d4cec5 100%);
  border-color: rgba(255, 255, 255, 0.22);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.35),
    0 2px 10px rgba(0, 0, 0, 0.35);
}

.guest-auth__btn--primary:hover {
  background: linear-gradient(180deg, #faf6ef 0%, #ded8cf 100%);
  border-color: rgba(255, 255, 255, 0.32);
}

.card__btn {
  width: 100%;
  padding: 10px 14px;
  border-radius: 20px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  color: #ece8e0;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.14);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.card__btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.card__btn:focus-visible {
  outline: 2px solid rgba(62, 166, 255, 0.65);
  outline-offset: 2px;
}

.profile-page__back {
  display: inline-block;
  margin-top: 20px;
  font-size: 14px;
  color: #9ab8d8;
  text-decoration: none;
}

.profile-page__back:hover {
  text-decoration: underline;
}

.profile-page__back:focus-visible {
  outline: 2px solid rgba(62, 166, 255, 0.65);
  outline-offset: 2px;
  border-radius: 4px;
}
</style>
