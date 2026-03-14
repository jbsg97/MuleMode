<template>
  <div class="login-screen">
    <div class="login-card">
      <div class="login-logo">M</div>
      <h1 class="login-title">MuleMode</h1>
      <p class="login-slogan">Carga. Avanza. Repite.</p>

      <button class="login-btn" @click="loginWithGoogle" :disabled="loading">
        <svg v-if="!loading" width="20" height="20" viewBox="0 0 48 48" style="flex-shrink:0">
          <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.7 2.5 30.2 0 24 0 14.6 0 6.6 5.4 2.5 13.3l7.8 6C12.3 13.1 17.7 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17z"/>
          <path fill="#FBBC05" d="M10.3 28.7A14.6 14.6 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A24 24 0 0 0 0 24c0 3.8.9 7.4 2.5 10.6l7.8-5.9z"/>
          <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2 1.4-4.6 2.2-7.7 2.2-6.3 0-11.6-4.2-13.7-9.9l-7.8 6C6.6 42.6 14.6 48 24 48z"/>
        </svg>
        <span v-if="loading" class="login-spinner"></span>
        {{ loading ? 'Entrando…' : 'Continuar con Google' }}
      </button>

      <p v-if="error" class="login-error">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '../firebase.js'

const loading = ref(false)
const error   = ref('')

async function loginWithGoogle() {
  loading.value = true
  error.value   = ''
  try {
    await signInWithPopup(auth, googleProvider)
    // onAuthStateChanged en App.vue maneja el resto
  } catch (e) {
    error.value = 'No se pudo iniciar sesión. Inténtalo de nuevo.'
    console.error(e)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-screen {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg1);
  padding: 24px;
}

.login-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  max-width: 320px;
  width: 100%;
}

.login-logo {
  width: 72px;
  height: 72px;
  border-radius: 20px;
  background: var(--accent);
  color: #111;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}

.login-title {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 2.6rem;
  letter-spacing: 2px;
  color: var(--text1);
  margin: 0;
}

.login-slogan {
  font-size: 0.85rem;
  color: var(--text3);
  letter-spacing: 1px;
  margin: 0 0 20px;
}

.login-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: 12px;
  color: var(--text1);
  font-size: 0.95rem;
  font-family: inherit;
  padding: 13px 22px;
  cursor: pointer;
  width: 100%;
  justify-content: center;
  transition: border-color 0.15s, background 0.15s;
}

.login-btn:active:not(:disabled) {
  background: var(--bg2);
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: default;
}

.login-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

@keyframes spin { to { transform: rotate(360deg); } }

.login-error {
  font-size: 0.82rem;
  color: var(--red);
  text-align: center;
  margin: 0;
}
</style>
