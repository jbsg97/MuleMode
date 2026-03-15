<template>
  <div class="summary-overlay" :class="{ show: store.summaryVisible }">
    <div class="summary-icon">🏆</div>
    <div class="summary-title">{{ store.pendingRegistro?.rutinaName?.toUpperCase() }}</div>
    <div class="summary-subtitle">COMPLETADO</div>
    <div class="summary-date">{{ fechaTexto }}</div>

    <div class="summary-stats">
      <div class="summary-stat">
        <div class="summary-stat-val">{{ durMin }}</div>
        <div class="summary-stat-lbl">Minutos</div>
      </div>
      <div class="summary-stat">
        <div class="summary-stat-val">{{ seriesHechas }}</div>
        <div class="summary-stat-lbl">Series</div>
      </div>
      <div class="summary-stat">
        <div class="summary-stat-val">{{ volStr }}</div>
        <div class="summary-stat-lbl">Kg levantados</div>
      </div>
      <div class="summary-stat">
        <div class="summary-stat-val">{{ store.pendingRegistro?.ejercicios?.length ?? 0 }}</div>
        <div class="summary-stat-lbl">Ejercicios</div>
      </div>
    </div>

    <div class="pr-list">
      <div v-for="nombre in (store.pendingRegistro?.prs ?? [])" :key="nombre" class="pr-badge">
        ⭐ Nuevo récord: {{ nombre }}
      </div>
    </div>

    <button class="btn btn-accent btn-full" style="max-width:320px;width:100%" @click="store.guardarYSalir()">
      Guardar entrenamiento
    </button>
    <button class="btn btn-outline btn-full" style="max-width:320px;width:100%;margin-top:8px;color:var(--red);border-color:var(--red)"
      @click="confirmarDescartar">
      Descartar entrenamiento
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from '../store/index.js'

const store = useStore()

function confirmarDescartar() {
  if (confirm('¿Descartar este entrenamiento? Se perderá todo el progreso.')) {
    store.descartarEntrenamiento()
  }
}

const durMin = computed(() => {
  const d = store.pendingRegistro?.duracion ?? 0
  return Math.floor(d / 60)
})

const seriesHechas = computed(() => {
  const ej = store.pendingRegistro?.ejercicios ?? []
  return ej.reduce((a, e) => a + (e.series ? e.series.filter(s => s.done).length : 0), 0)
})

const volStr = computed(() => {
  const v = store.pendingRegistro?.volumen ?? 0
  return v >= 1000 ? (v / 1000).toFixed(1) + 'k' : Math.round(v)
})

const fechaTexto = computed(() => {
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const now = new Date()
  return `${dias[now.getDay()]} ${now.getDate()} de ${meses[now.getMonth()]}`
})
</script>
