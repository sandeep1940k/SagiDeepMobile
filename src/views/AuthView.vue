<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAuthWebAppUrl, SAGIDEEP_USERS_URL, login, setStoredSession, validateAuthUrl, fetchPublicIp } from '../services/userAuth.js'

const route = useRoute()
const router = useRouter()

const mode = ref(route.query.mode === 'signup' ? 'signup' : 'login')
const name = ref('')
const email = ref('')
const password = ref('')
const busy = ref(false)
/** `{ text, variant }` for inline feedback; `variant` drives green vs red styling. */
const feedback = ref(null)

function setFeedback(text, variant) {
  const trimmed = String(text ?? '').trim()
  if (!trimmed) {
    feedback.value = null
    return
  }
  feedback.value = { text: trimmed, variant: variant === 'success' ? 'success' : 'error' }
}

/** Failed signup/login: always red — never infer “success” from server text (e.g. message "Success" on duplicate email). */
function setServerError(text) {
  setFeedback(text, 'error')
}

watch(
  () => route.query.mode,
  (m) => {
    mode.value = m === 'signup' ? 'signup' : 'login'
    feedback.value = null
  },
)

const effectiveAuthUrl = computed(
  () => String(import.meta.env.VITE_USER_AUTH_URL ?? '').trim() || getAuthWebAppUrl(),
)

const configHint = computed(() => {
  const v = validateAuthUrl(effectiveAuthUrl.value)
  if (v.ok) return ''
  return v.reason
})

function safeRedirectPath() {
  const r = route.query.redirect
  const s = typeof r === 'string' ? r.trim() : ''
  if (!s.startsWith('/') || s.startsWith('//')) return '/'
  return s
}

function setMode(m) {
  const next = m === 'signup' ? 'signup' : 'login'
  if (next === mode.value) return
  mode.value = next
  feedback.value = null
  void router.replace({ name: 'auth', query: { ...route.query, mode: next } })
}

async function onSubmit() {
  feedback.value = null
  const hint = validateAuthUrl(effectiveAuthUrl.value)
  if (!hint.ok) {
    setFeedback(hint.reason, 'error')
    return
  }
  busy.value = true
  const ip = await fetchPublicIp();
  try {
    if (mode.value === 'signup') {
      const response = await fetch(SAGIDEEP_USERS_URL(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'signup',
          name: name.value,
          email: email.value,
          password: password.value,
          ip,
        }),
      })
      const data = await response.json()
      if (data.success) {
        setStoredSession({name: name.value, email: email.value})
        setFeedback(data.message, 'success')
        await new Promise((r) => setTimeout(r, 1400))
        await router.push('/')
        return
      }
      setServerError(data.message || 'Could not sign up.')
    } else {
      const response = await fetch(SAGIDEEP_USERS_URL(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: email.value,
          password: password.value,
        }),
      })
      const data = await response.json()
      if (data.success) {
        setStoredSession(data.user)
        setFeedback(data.message, 'success')
        await new Promise((r) => setTimeout(r, 1400))
        await router.push('/')
        return
      }
      setServerError(data.message || 'Could not log in.')
    }
  } catch {
    setServerError('Could not reach the server. Please try again.')
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="auth">
    <div class="auth__glow" aria-hidden="true" />
    <div class="auth__card">
      <h1 class="auth__title">SagiDeep</h1>
      <div class="auth__segment" role="tablist" aria-label="Log in or sign up">
        <button
          type="button"
          class="auth__segment-btn"
          role="tab"
          :aria-selected="mode === 'login'"
          :class="{ 'auth__segment-btn--active': mode === 'login' }"
          @click="setMode('login')"
        >
          Log in
        </button>
        <button
          type="button"
          class="auth__segment-btn"
          role="tab"
          :aria-selected="mode === 'signup'"
          :class="{ 'auth__segment-btn--active': mode === 'signup' }"
          @click="setMode('signup')"
        >
          Sign up
        </button>
      </div>
      <p class="auth__subtitle">
        {{
          mode === 'login' ? 'Welcome back — enter your details.' : 'Create your account to continue.'
        }}
      </p>

      <p v-if="configHint" class="auth__warn" role="status">{{ configHint }}</p>
      <p
        v-else-if="feedback"
        class="auth__banner"
        :class="feedback.variant === 'success' ? 'auth__banner--success' : 'auth__banner--error'"
        :role="feedback.variant === 'success' ? 'status' : 'alert'"
      >
        {{ feedback.text }}
      </p>

      <form class="auth__form" @submit.prevent="onSubmit">
        <label v-if="mode === 'signup'" class="auth__field">
          <span class="auth__label">Name</span>
          <input
            v-model="name"
            class="auth__input"
            type="text"
            name="name"
            autocomplete="name"
            required
            maxlength="120"
          />
        </label>
        <label class="auth__field">
          <span class="auth__label">Email</span>
          <input
            v-model="email"
            class="auth__input"
            type="email"
            name="email"
            autocomplete="email"
            required
            maxlength="200"
          />
        </label>
        <label class="auth__field">
          <span class="auth__label">Password</span>
          <input
            v-model="password"
            class="auth__input"
            type="password"
            name="password"
            autocomplete="current-password"
            required
            maxlength="200"
          />
        </label>
        <button class="auth__submit" type="submit" :disabled="busy">
          {{ busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account' }}
        </button>
      </form>

      <RouterLink class="auth__back" :to="{ name: 'home' }">← Back to home</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.auth {
  position: relative;
  min-height: 100%;
  padding: max(24px, env(safe-area-inset-top)) 20px max(32px, env(safe-area-inset-bottom));
  max-width: 420px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  background: radial-gradient(ellipse 120% 80% at 50% -20%, rgba(154, 27, 47, 0.14), transparent 55%),
    linear-gradient(180deg, #0f0f0f 0%, #0a0a0a 50%, #0c0c0c 100%);
  color: #e8e4dc;
}

.auth__glow {
  pointer-events: none;
  position: fixed;
  inset: 0;
  max-width: 480px;
  margin: 0 auto;
  background: radial-gradient(circle at 80% 15%, rgba(201, 162, 39, 0.05), transparent 42%),
    radial-gradient(circle at 12% 55%, rgba(154, 27, 47, 0.06), transparent 38%);
  z-index: 0;
}

.auth__card {
  position: relative;
  z-index: 1;
  width: 100%;
  padding: 28px 22px 24px;
  border-radius: 16px;
  background: rgba(18, 18, 18, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
}

.auth__title {
  margin: 0 0 16px;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #f5f2ea;
}

.auth__segment {
  display: flex;
  padding: 4px;
  margin-bottom: 14px;
  border-radius: 22px;
  background: rgba(0, 0, 0, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.1);
  gap: 4px;
}

.auth__segment-btn {
  flex: 1 1 0;
  padding: 10px 14px;
  border: none;
  border-radius: 18px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #9a9690;
  background: transparent;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition:
    color 0.15s ease,
    background 0.15s ease,
    box-shadow 0.15s ease;
}

.auth__segment-btn:hover {
  color: #d4d0c8;
}

.auth__segment-btn:focus-visible {
  outline: 2px solid rgba(62, 166, 255, 0.55);
  outline-offset: 2px;
}

.auth__segment-btn--active {
  color: #1a1508;
  background: linear-gradient(180deg, #ecd489 0%, #c9a227 55%, #a88620 100%);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
}

.auth__subtitle {
  margin: 0 0 20px;
  font-size: 13px;
  line-height: 1.45;
  color: #8a8680;
}

.auth__warn,
.auth__banner {
  margin: 0 0 16px;
  padding: 10px 12px;
  font-size: 13px;
  line-height: 1.4;
  border-radius: 10px;
}

.auth__warn {
  background: rgba(201, 162, 39, 0.12);
  border: 1px solid rgba(201, 162, 39, 0.25);
  color: #e8d9a8;
}

.auth__banner--error {
  background: rgba(154, 27, 47, 0.15);
  border: 1px solid rgba(154, 27, 47, 0.35);
  color: #f0c8ce;
}

.auth__banner--success {
  background: rgba(34, 160, 95, 0.14);
  border: 1px solid rgba(72, 200, 130, 0.42);
  color: #c8f0dc;
}

.auth__form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.auth__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.auth__label {
  font-size: 12px;
  font-weight: 600;
  color: #b8b4ac;
}

.auth__input {
  width: 100%;
  padding: 12px 14px;
  font-size: 16px;
  color: #f1f1f1;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  outline: none;
}

.auth__input:focus {
  border-color: rgba(201, 162, 39, 0.45);
  box-shadow: 0 0 0 1px rgba(201, 162, 39, 0.2);
}

.auth__submit {
  margin-top: 6px;
  padding: 14px 18px;
  font-family: inherit;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #1a1508;
  background: linear-gradient(180deg, #ecd489 0%, #c9a227 55%, #a88620 100%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  cursor: pointer;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.35);
  transition:
    filter 0.15s ease,
    transform 0.12s ease;
}

.auth__submit:hover:not(:disabled) {
  filter: brightness(1.06);
}

.auth__submit:active:not(:disabled) {
  transform: scale(0.99);
}

.auth__submit:focus-visible {
  outline: 2px solid rgba(62, 166, 255, 0.55);
  outline-offset: 3px;
}

.auth__submit:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
}

.auth__back {
  display: block;
  margin-top: 20px;
  text-align: center;
  font-size: 14px;
  color: #9a9a9a;
  text-decoration: none;
}

.auth__back:hover {
  color: #c9c5bd;
}
</style>
