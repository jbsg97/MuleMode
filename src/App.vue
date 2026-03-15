<template>
  <!-- Verificando sesión -->
  <div v-if="!store.authChecked" class="auth-loading">
    <span class="auth-spinner"></span>
  </div>

  <!-- Sin sesión → pantalla de login -->
  <LoginScreen v-else-if="!store.uid" />

  <!-- Con sesión → app completa -->
  <div v-else>
    <RutinasView v-if="currentPage === 'rutinas'" @settings="settingsVisible = true" />
    <HistorialView v-else-if="currentPage === 'historial'" />
    <ProgresoView v-else-if="currentPage === 'progreso'" />
    <WorkoutView v-else-if="currentPage === 'workout'" @finish="onWorkoutFinish" />

    <BottomNav v-if="currentPage !== 'workout'" :current="currentPage"
      @navigate="currentPage = $event" />

    <RestTimerOverlay />
    <SummaryOverlay />
    <VideoModal />
    <RutinaModal />
    <SettingsModal :visible="settingsVisible" @close="settingsVisible = false" />

    <div class="toast" :class="{ show: store.toastVisible }">{{ store.toastMessage }}</div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase.js'
import { useStore } from './store/index.js'
import LoginScreen from './components/LoginScreen.vue'
import RutinasView from './views/RutinasView.vue'
import WorkoutView from './views/WorkoutView.vue'
import HistorialView from './views/HistorialView.vue'
import ProgresoView from './views/ProgresoView.vue'
import BottomNav from './components/BottomNav.vue'
import RestTimerOverlay from './components/RestTimerOverlay.vue'
import SummaryOverlay from './components/SummaryOverlay.vue'
import VideoModal from './components/VideoModal.vue'
import RutinaModal from './components/RutinaModal.vue'
import SettingsModal from './components/SettingsModal.vue'

const store          = useStore()
const currentPage    = ref('rutinas')
const settingsVisible = ref(false)

watch(() => store.workout, (newVal, oldVal) => {
  if (newVal) {
    currentPage.value = 'workout'
  } else if (oldVal && !newVal) {
    currentPage.value = 'rutinas'
  }
})

function onWorkoutFinish() {
  store.terminarEntrenamiento()
}

onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      await store.load(user.uid)
    } else {
      store.uid = null
    }
    store.authChecked = true
  })
})
</script>

<style>
.auth-loading {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg1);
}

.auth-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
