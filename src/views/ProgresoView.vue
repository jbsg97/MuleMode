<template>
  <div class="page">
    <div class="header">
      <div>
        <div class="header-title">PROGR<span class="accent-dot">ESO</span></div>
        <div class="header-sub">Tu evolución</div>
      </div>
    </div>

    <!-- Empty state global -->
    <div v-if="store.historial.length === 0" class="empty" style="padding-top:80px">
      <div class="empty-icon">📈</div>
      <div class="empty-text">Completa tu primer entrenamiento<br>para ver tu progreso aquí.</div>
    </div>

    <template v-else>

      <!-- ── Stats del mes ─────────────────────────────── -->
      <div class="prog-month-chips">
        <div class="prog-chip">
          <div class="prog-chip-val">{{ mesStats.entrenamientos }}</div>
          <div class="prog-chip-lbl">Entrenos este mes</div>
        </div>
        <div class="prog-chip">
          <div class="prog-chip-val">{{ mesStats.volStr }}</div>
          <div class="prog-chip-lbl">Kg este mes</div>
        </div>
        <div class="prog-chip">
          <div class="prog-chip-val">{{ mesStats.prs }}</div>
          <div class="prog-chip-lbl">PRs este mes</div>
        </div>
      </div>

      <!-- ── Músculos de la semana ──────────────────────── -->
      <div class="card" style="margin:0 16px 12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <div class="chart-title" style="margin:0">Músculos esta semana</div>
          <div style="display:flex;align-items:center;gap:6px">
            <button class="week-nav-btn" @click="weekOffset--">‹</button>
            <span style="font-size:11px;color:var(--text3);min-width:90px;text-align:center">{{ weekLabel }}</span>
            <button class="week-nav-btn" :disabled="weekOffset >= 0" @click="weekOffset++">›</button>
          </div>
        </div>
        <div v-if="weekMuscles.length === 0" style="font-size:13px;color:var(--text3);text-align:center;padding:24px 0">
          Sin entrenamientos esta semana
        </div>
        <MuscleMap v-else :model-value="weekMuscles" readonly />
      </div>

      <!-- ── Records personales ─────────────────────────── -->
      <div class="card" style="margin:0 16px 12px">
        <div class="chart-title" style="margin-bottom:12px">🏆 Records personales</div>
        <div v-if="prs.length === 0" style="font-size:13px;color:var(--text3);text-align:center;padding:12px 0">
          Aún no hay records. ¡Empieza a levantar!
        </div>
        <div v-else>
          <div v-for="pr in prs" :key="pr.nombre" class="pr-row">
            <div class="pr-row-name">{{ pr.nombre }}</div>
            <div style="text-align:right;flex-shrink:0">
              <div class="pr-row-val">
                {{ pr.equipo === 'band' ? pr.peso : pr.peso + ' kg' }}
                <span v-if="pr.equipo !== 'band' && pr.rm > pr.peso" class="pr-row-rm">
                  ≈ {{ Math.round(pr.rm) }} kg 1RM
                </span>
              </div>
              <div class="pr-row-date">{{ formatDate(pr.fecha) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Análisis por ejercicio ──────────────────────── -->
      <div style="padding:0 16px;margin-bottom:12px">
        <select class="ex-selector" v-model="selectedEx" @change="onExChange">
          <option value="">— Analizar un ejercicio —</option>
          <option v-for="name in store.allExerciseNames" :key="name" :value="name">{{ name }}</option>
        </select>
      </div>

      <div v-if="selectedEx && progData.length > 0" class="card" style="margin:0 16px 12px">
        <!-- Trend + 1RM badge -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div>
            <div class="chart-title" style="margin-bottom:2px">{{ selectedEx }}</div>
            <div v-if="trend" :class="['trend-badge', 'trend-' + trend.dir]">
              {{ trend.icon }} {{ trend.label }}
            </div>
          </div>
          <div v-if="bestRM" style="text-align:right">
            <div style="font-family:'Bebas Neue',sans-serif;font-size:26px;color:var(--accent);line-height:1">
              {{ Math.round(bestRM) }} kg
            </div>
            <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em">1RM estimado</div>
          </div>
        </div>
        <div class="chart-title" style="font-size:12px;margin-bottom:4px">Peso máximo por sesión</div>
        <div class="chart-wrap"><canvas ref="progChartEl"></canvas></div>
      </div>

      <div v-else-if="selectedEx" style="margin:0 16px 12px;font-size:13px;color:var(--text3);text-align:center;padding:16px">
        No hay series con peso registradas para "{{ selectedEx }}"
      </div>

      <!-- ── Volumen semanal en kg ────────────────────────── -->
      <div class="card" style="margin:0 16px 12px">
        <div class="chart-title">Volumen semanal</div>
        <div class="chart-sub">Kg totales levantados por semana</div>
        <div class="chart-wrap"><canvas ref="volChartEl"></canvas></div>
      </div>

    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import Chart from 'chart.js/auto'
import { useStore } from '../store/index.js'
import MuscleMap from '../components/MuscleMap.vue'

const store = useStore()
const selectedEx = ref('')
const progData = ref([])
const progChartEl = ref(null)
const volChartEl = ref(null)
let progChartInst = null
let volChartInst = null

// ── Stats del mes ──────────────────────────────────────────────
const mesStats = computed(() => {
  const now = new Date()
  const mes = now.getMonth()
  const anio = now.getFullYear()
  const delMes = store.historial.filter(h => {
    const d = new Date(h.fecha)
    return d.getMonth() === mes && d.getFullYear() === anio
  })
  const vol = delMes.reduce((a, h) => a + (h.volumen || 0), 0)
  const prs = delMes.reduce((a, h) => a + (h.prs ? h.prs.length : 0), 0)
  return {
    entrenamientos: delMes.length,
    volStr: vol >= 1000 ? (vol / 1000).toFixed(1) + 'k' : Math.round(vol).toString(),
    prs,
  }
})

// ── Músculos de la semana ──────────────────────────────────────
const weekOffset = ref(0) // 0 = semana actual, -1 = semana pasada, etc.

const weekRange = computed(() => {
  const today = new Date()
  const dow = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1) + weekOffset.value * 7)
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return { start: monday, end: sunday }
})

const weekLabel = computed(() => {
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  const { start, end } = weekRange.value
  const s = `${start.getDate()} ${meses[start.getMonth()]}`
  const e = `${end.getDate()} ${meses[end.getMonth()]}`
  return weekOffset.value === 0 ? 'Esta semana' : `${s} – ${e}`
})

const weekMuscles = computed(() => {
  const { start, end } = weekRange.value
  const nivelOrder = { primario: 0, secundario: 1, terciario: 2 }
  const map = {}
  store.historial
    .filter(h => { const d = new Date(h.fecha); return d >= start && d <= end })
    .forEach(h => {
      ;(h.ejercicios || []).forEach(e => {
        ;(e.musculos || []).forEach(m => {
          const muscle = typeof m === 'string' ? m : m.muscle
          const nivel  = typeof m === 'string' ? 'primario' : m.nivel
          if (!map[muscle] || nivelOrder[nivel] < nivelOrder[map[muscle]]) map[muscle] = nivel
        })
      })
    })
  return Object.entries(map).map(([muscle, nivel]) => ({ muscle, nivel }))
})

// ── Records personales ─────────────────────────────────────────
const prs = computed(() => {
  const best = {}
  store.historial.forEach(h => {
    h.ejercicios && h.ejercicios.forEach(e => {
      const done = (e.series || []).filter(s => s.done)
      done.forEach(s => {
        const peso = parseFloat(s.peso) || 0
        const reps = parseFloat(s.reps) || 0
        if (peso <= 0) return
        const rm = peso * (1 + reps / 30)
        if (!best[e.nombre] || rm > best[e.nombre].rm) {
          best[e.nombre] = { peso, reps, fecha: h.fecha, rm, equipo: e.equipo || '' }
        }
      })
    })
  })
  return Object.entries(best)
    .map(([nombre, d]) => ({ nombre, ...d }))
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
})

function formatDate(fecha) {
  const d = new Date(fecha)
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`
}

// ── Análisis por ejercicio ─────────────────────────────────────
const trend = computed(() => {
  if (!selectedEx.value) return null
  const rms = []
  store.historial.slice().reverse().forEach(h => {
    const ex = h.ejercicios && h.ejercicios.find(e => e.nombre === selectedEx.value)
    if (!ex?.series) return
    const done = ex.series.filter(s => s.done && s.peso)
    if (done.length === 0) return
    const maxRM = Math.max(...done.map(s => {
      const p = parseFloat(s.peso) || 0
      const r = parseFloat(s.reps) || 0
      return p > 0 ? p * (1 + r / 30) : 0
    }))
    if (maxRM > 0) rms.push(maxRM)
  })
  if (rms.length < 3) return null
  const recent = rms.slice(-2).reduce((a, b) => a + b, 0) / 2
  const older = rms.slice(0, rms.length - 2).reduce((a, b) => a + b, 0) / (rms.length - 2)
  const delta = (recent - older) / older
  if (delta > 0.025) return { dir: 'up', icon: '↑', label: 'Mejorando' }
  if (delta < -0.025) return { dir: 'down', icon: '↓', label: 'Declinando' }
  return { dir: 'stable', icon: '→', label: 'Estable' }
})

const bestRM = computed(() => {
  const pr = prs.value.find(p => p.nombre === selectedEx.value)
  return pr ? pr.rm : null
})

function onExChange() {
  if (!selectedEx.value) { progData.value = []; return }
  const data = []
  store.historial.slice().reverse().forEach(h => {
    const ex = h.ejercicios && h.ejercicios.find(e => e.nombre === selectedEx.value)
    if (!ex?.series) return
    const done = ex.series.filter(s => s.done && s.peso)
    const maxPeso = done.length > 0 ? Math.max(...done.map(s => parseFloat(s.peso) || 0)) : 0
    const fecha = new Date(h.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
    if (maxPeso > 0) data.push({ fecha, peso: maxPeso })
  })
  progData.value = data
  nextTick(buildProgChart)
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
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#606060', font: { size: 11 } }, grid: { color: '#2a2a2a' } },
        y: { ticks: { color: '#606060', font: { size: 11 }, callback: v => v + 'kg' }, grid: { color: '#2a2a2a' } },
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
    const vol = h.volumen != null ? h.volumen
      : (h.ejercicios ? h.ejercicios.reduce((a, e) =>
          a + (e.series || []).filter(s => s.done).reduce((b, s) =>
            b + (parseFloat(s.peso) || 0) * (parseFloat(s.reps) || 0), 0), 0) : 0)
    weekData[key] = (weekData[key] || 0) + vol
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
        label: 'Kg',
        data: vals,
        backgroundColor: 'rgba(232,240,58,0.7)',
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#606060', font: { size: 11 } }, grid: { color: '#2a2a2a' } },
        y: {
          ticks: {
            color: '#606060', font: { size: 11 },
            callback: v => v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v + 'kg',
          },
          grid: { color: '#2a2a2a' },
        },
      },
    },
  })
}

onMounted(() => { nextTick(buildVolChart) })
onBeforeUnmount(() => {
  if (progChartInst) progChartInst.destroy()
  if (volChartInst) volChartInst.destroy()
})
watch(() => store.historial.length, () => { nextTick(buildVolChart) })
</script>

<style scoped>
/* Month stats chips */
.prog-month-chips {
  display: flex;
  gap: 8px;
  margin: 0 16px 12px;
}
.prog-chip {
  flex: 1;
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 12px 10px;
  text-align: center;
}
.prog-chip-val {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 24px;
  color: var(--accent);
  line-height: 1;
}
.prog-chip-lbl {
  font-size: 9px;
  color: var(--text3);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-top: 3px;
}

/* Week nav */
.week-nav-btn {
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text2);
  font-size: 18px;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  line-height: 1;
  padding: 0;
}
.week-nav-btn:disabled { opacity: 0.3; cursor: default; }

/* PRs */
.pr-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 9px 0;
  border-bottom: 1px solid var(--border);
}
.pr-row:last-child { border-bottom: none; }
.pr-row-name {
  font-size: 13px;
  font-weight: 500;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-right: 8px;
}
.pr-row-val {
  font-size: 14px;
  font-weight: 700;
  color: var(--accent);
  line-height: 1.2;
}
.pr-row-rm {
  font-size: 11px;
  font-weight: 400;
  color: var(--text3);
}
.pr-row-date {
  font-size: 10px;
  color: var(--text3);
  margin-top: 2px;
}

/* Trend badge */
.trend-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 9px;
  border-radius: 20px;
  letter-spacing: 0.04em;
}
.trend-up   { background: rgba(68, 204, 136, 0.15); color: #44cc88; }
.trend-down { background: rgba(255, 68, 68, 0.15);  color: #ff4444; }
.trend-stable { background: rgba(160,160,160,0.15); color: #a0a0a0; }
</style>
