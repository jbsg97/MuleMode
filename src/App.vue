<template>
  <div>
    <!-- Main views -->
    <RutinasView v-if="currentPage === 'rutinas'" />
    <HistorialView v-else-if="currentPage === 'historial'" />
    <ProgresoView v-else-if="currentPage === 'progreso'" />
    <WorkoutView v-else-if="currentPage === 'workout'" @finish="onWorkoutFinish" />

    <!-- Bottom nav (hidden during workout) -->
    <BottomNav v-if="currentPage !== 'workout'" :current="currentPage" @navigate="currentPage = $event" />

    <!-- Global overlays & modals -->
    <RestTimerOverlay />
    <SummaryOverlay />
    <VideoModal />
    <RutinaModal />

    <!-- Toast -->
    <div class="toast" :class="{ show: store.toastVisible }">{{ store.toastMessage }}</div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useStore } from './store/index.js'
import RutinasView from './views/RutinasView.vue'
import WorkoutView from './views/WorkoutView.vue'
import HistorialView from './views/HistorialView.vue'
import ProgresoView from './views/ProgresoView.vue'
import BottomNav from './components/BottomNav.vue'
import RestTimerOverlay from './components/RestTimerOverlay.vue'
import SummaryOverlay from './components/SummaryOverlay.vue'
import VideoModal from './components/VideoModal.vue'
import RutinaModal from './components/RutinaModal.vue'

const store = useStore()
const currentPage = ref('rutinas')

// Navigate to workout when one starts
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

onMounted(async () => {
  await store.load()
})
</script>
