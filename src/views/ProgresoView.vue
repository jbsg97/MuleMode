<template>
  <div class="page">
    <div class="header">
      <div>
        <div class="header-title">PROGR<span class="accent-dot">ESO</span></div>
        <div class="header-sub">Tu evolución</div>
      </div>
    </div>

    <div style="padding:0 16px;margin-bottom:12px">
      <select class="ex-selector" v-model="selectedEx" @change="renderProgChart">
        <option value="">Selecciona un ejercicio</option>
        <option v-for="name in store.allExerciseNames" :key="name" :value="name">{{ name }}</option>
      </select>
    </div>

    <!-- Progress chart -->
    <div v-if="progData.length > 0" class="chart-container">
      <div class="chart-title">Peso máximo por sesión</div>
      <div class="chart-sub">Progresión a lo largo del tiempo</div>
      <div class="chart-wrap"><canvas ref="progChartEl"></canvas></div>
    </div>

    <!-- Kg table -->
    <div v-if="kgRows.length > 0" class="chart-container">
      <div class="chart-title">Registro de pesos (kg)</div>
      <div class="chart-sub">Todas las series registradas por sesión</div>
      <div>
        <div v-for="(row, i) in kgRows" :key="i" style="border-bottom:1px solid var(--border);padding:10px 0">
          <div style="font-size:12px;color:var(--text2);margin-bottom:6px">{{ row.fecha }}</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px">
            <span v-for="(s, j) in row.series" :key="j"
              style="background:var(--bg4);border-radius:6px;padding:4px 10px;font-size:13px">
              Serie {{ j + 1 }}: <strong>{{ s.peso }}kg</strong> × {{ s.reps }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Volume chart -->
    <div class="chart-container">
      <div class="chart-title">Volumen semanal</div>
      <div class="chart-sub">Series completadas por semana</div>
      <div class="chart-wrap"><canvas ref="volChartEl"></canvas></div>
    </div>

    <div v-if="store.historial.length === 0" class="empty">
      <div class="empty-icon">📈</div>
      <div class="empty-text">Completa entrenamientos para<br>ver tu progreso aquí.</div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import Chart from 'chart.js/auto'
import { useStore } from '../store/index.js'

const store = useStore()
const selectedEx = ref('')
const progData = ref([])
const kgRows = ref([])
const progChartEl = ref(null)
const volChartEl = ref(null)
let progChartInst = null
let volChartInst = null

const CHART_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { color: '#606060', font: { size: 11 } }, grid: { color: '#2a2a2a' } },
    y: { ticks: { color: '#606060', font: { size: 11 } }, grid: { color: '#2a2a2a' } },
  },
}

function renderProgChart() {
  if (!selectedEx.value) { progData.value = []; kgRows.value = []; return }
  const data = []
  const rows = []
  store.historial.slice().reverse().forEach(h => {
    const ex = h.ejercicios && h.ejercicios.find(e => e.nombre === selectedEx.value)
    if (!ex?.series) return
    const done = ex.series.filter(s => s.done && s.peso)
    const maxPeso = done.length > 0 ? Math.max(...done.map(s => parseFloat(s.peso) || 0)) : 0
    const fecha = new Date(h.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
    if (maxPeso > 0) data.push({ fecha, peso: maxPeso })
    if (done.length > 0) rows.push({ fecha, series: done.map(s => ({ peso: parseFloat(s.peso) || 0, reps: s.reps })) })
  })
  progData.value = data
  kgRows.value = rows
  nextTick(() => buildProgChart())
}

function buildProgChart() {
  if (!progChartEl.value || progData.value.length === 0) return
  if (progChartInst) progChartInst.destroy()
  progChartInst = new Chart(progChartEl.value, {
    type: 'line',
    data: {
      labels: progData.value.map(d => d.fecha),
      datasets: [{
        label: 'Kg máx',
        data: progData.value.map(d => d.peso),
        borderColor: '#e8f03a',
        backgroundColor: 'rgba(232,240,58,0.1)',
        borderWidth: 2,
        pointBackgroundColor: '#e8f03a',
        pointRadius: 4,
        tension: 0.3,
        fill: true,
      }],
    },
    options: {
      ...CHART_OPTS,
      scales: {
        ...CHART_OPTS.scales,
        y: { ...CHART_OPTS.scales.y, ticks: { ...CHART_OPTS.scales.y.ticks, callback: v => v + 'kg' } },
      },
    },
  })
}

function buildVolChart() {
  if (!volChartEl.value) return
  const weekData = {}
  store.historial.forEach(h => {
    const d = new Date(h.fecha)
    const weekStart = new Date(d); weekStart.setDate(d.getDate() - d.getDay())
    const key = weekStart.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
    const series = h.ejercicios
      ? h.ejercicios.reduce((a, e) => a + (e.series ? e.series.filter(s => s.done).length : 0), 0)
      : 0
    weekData[key] = (weekData[key] || 0) + series
  })
  const labels = Object.keys(weekData).slice(-8)
  const vals = labels.map(k => weekData[k])
  if (vals.length === 0) return
  if (volChartInst) volChartInst.destroy()
  volChartInst = new Chart(volChartEl.value, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Series',
        data: vals,
        backgroundColor: 'rgba(232,240,58,0.7)',
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: CHART_OPTS,
  })
}

onMounted(() => {
  buildVolChart()
  if (selectedEx.value) renderProgChart()
})

onBeforeUnmount(() => {
  if (progChartInst) progChartInst.destroy()
  if (volChartInst) volChartInst.destroy()
})

// Rebuild vol chart if historial changes
watch(() => store.historial.length, () => {
  nextTick(buildVolChart)
})
</script>
