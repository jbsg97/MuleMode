<template>
  <div class="page">
    <div class="header">
      <div>
        <div class="header-title">HISTOR<span class="accent-dot">IAL</span></div>
        <div class="header-sub">Todos tus entrenamientos</div>
      </div>
    </div>

    <div v-if="store.historial.length === 0" class="empty">
      <div class="empty-icon">📋</div>
      <div class="empty-text">Aún no tienes entrenamientos registrados.<br>¡Empieza tu primera sesión!</div>
    </div>

    <div v-else>
      <div v-for="h in store.historial" :key="h.id" class="history-item">
        <div style="display:flex;justify-content:space-between;align-items:flex-start"
          @click="toggleDetail(h.id)">
          <div style="flex:1;min-width:0">
            <div class="history-date">{{ formatDate(h.fecha) }}</div>
            <div class="history-name">
              {{ h.rutinaName }}
              <span v-if="h.prs && h.prs.length" class="history-pr-tag" style="margin-left:8px">
                ⭐ {{ h.prs.length }} PR
              </span>
            </div>
            <div class="history-chips">
              <div class="history-chip">⏱ <span>{{ formatDur(h.duracion) }}</span></div>
              <div class="history-chip">📦 <span>{{ seriesDone(h) }} series</span></div>
              <div v-if="volStr(h)" class="history-chip">⚡ <span>{{ volStr(h) }} kg</span></div>
            </div>
          </div>
          <button class="icon-btn icon-btn--delete" @click.stop="confirmarBorrar(h.id)" title="Eliminar">
            🗑
          </button>
        </div>

        <div v-if="openDetails[h.id]" class="history-detail open">
          <!-- Mapa muscular combinado de la sesión -->
          <div v-if="sessionMuscles(h).length" style="padding:8px 0 4px">
            <div style="font-size:11px;color:var(--text3);letter-spacing:0.5px;text-transform:uppercase;margin-bottom:6px">Músculos trabajados</div>
            <MuscleMap :model-value="sessionMuscles(h)" readonly />
          </div>
          <template v-for="e in h.ejercicios" :key="e.nombre">
            <template v-if="doneSeries(e).length > 0">
              <div class="history-ex-name">
                {{ e.nombre }}
                <span v-if="e.pr && e.pr.length" class="history-pr-tag">⭐ PR</span>
              </div>
              <table class="history-series-table">
                <tbody>
                  <tr v-for="(s, i) in doneSeries(e)" :key="i">
                    <td>Serie {{ s.idx || i + 1 }}</td>
                    <td>{{ s.peso || '—' }} {{ e.equipo !== 'band' ? 'kg' : '' }}</td>
                    <td>{{ s.reps || '—' }} {{ medLabel(e) }}</td>
                    <td>✓</td>
                  </tr>
                </tbody>
              </table>
              <div class="history-ex-footer">
              {{ exFooter(e) }}{{ e.notas ? ` · "${e.notas}"` : '' }}
              <span v-if="e.descansoSeg" style="color:var(--text3)"> · 😴 {{ e.descansoSeg }}s descanso</span>
            </div>
            </template>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { useStore } from '../store/index.js'
import MuscleMap from '../components/MuscleMap.vue'

const store = useStore()
const openDetails = reactive({})

function toggleDetail(id) {
  openDetails[id] = !openDetails[id]
}

function confirmarBorrar(id) {
  if (confirm('¿Eliminar este entrenamiento del historial?')) {
    store.eliminarHistorial(id)
  }
}

function formatDate(fecha) {
  const d = new Date(fecha)
  const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return `${dias[d.getDay()]} ${d.getDate()} ${meses[d.getMonth()]} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatDur(duracion) {
  return duracion ? `${Math.floor(duracion / 60)}min` : '—'
}

function seriesDone(h) {
  return h.ejercicios ? h.ejercicios.reduce((a, e) => a + (e.series ? e.series.filter(s => s.done).length : 0), 0) : 0
}

function volStr(h) {
  const vol = h.volumen != null ? h.volumen
    : (h.ejercicios ? h.ejercicios.reduce((a, e) =>
        a + (e.series || []).filter(s => s.done).reduce((b, s) =>
          b + (parseFloat(s.peso) || 0) * (parseFloat(s.reps) || 0), 0), 0) : 0)
  if (vol <= 0) return ''
  return vol >= 1000 ? (vol / 1000).toFixed(1) + 'k' : Math.round(vol).toString()
}

function doneSeries(e) {
  return (e.series || []).filter(s => s.done)
}

function medLabel(e) {
  if (e.tipoMedida === 'time') return 'seg'
  if (e.tipoMedida === 'dist') return 'm'
  return 'reps'
}

function sessionMuscles(h) {
  const nivelOrder = { primario: 0, secundario: 1, terciario: 2 }
  const map = {}
  ;(h.ejercicios || []).forEach(e => {
    (e.musculos || []).forEach(m => {
      const muscle = typeof m === 'string' ? m : m.muscle
      const nivel  = typeof m === 'string' ? 'primario' : m.nivel
      if (!map[muscle] || nivelOrder[nivel] < nivelOrder[map[muscle]]) map[muscle] = nivel
    })
  })
  return Object.entries(map).map(([muscle, nivel]) => ({ muscle, nivel }))
}

function exFooter(e) {
  const isBand = e.equipo === 'band'
  const done = doneSeries(e)
  if (isBand) return `${done.length} series`
  const nums = done.map(s => parseFloat(s.peso) || 0).filter(p => p > 0)
  if (nums.length === 0) return `${done.length} series`
  const max = Math.max(...nums)
  const vol = done.reduce((a, s) => a + (parseFloat(s.peso) || 0) * (parseFloat(s.reps) || 0), 0)
  return `${max}kg máx${vol > 0 ? ' · ' + Math.round(vol) + 'kg vol' : ''}`
}
</script>
