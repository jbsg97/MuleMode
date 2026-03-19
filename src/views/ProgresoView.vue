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

        <!-- AI Analysis Button -->
        <div v-if="store.geminiKey && weekMuscles.length > 0" style="margin-top:12px">
          <button class="btn btn-outline btn-sm" style="width:100%" :disabled="aiLoading" @click="analizarSemana">
            <span v-if="aiLoading" class="ai-spinner"></span>
            <span v-else>🤖</span>
            {{ aiLoading ? 'Analizando...' : 'Analizar semana con IA' }}
          </button>
        </div>

        <!-- AI Analysis Results -->
        <div v-if="aiAnalysis" class="ai-analysis">
          <!-- Gaps -->
          <div class="ai-section">
            <div class="ai-section-header" @click="gapsOpen = !gapsOpen">
              <span>💪 Músculos sin trabajar</span>
              <span class="ai-section-arrow">{{ gapsOpen ? '▲' : '▼' }}</span>
            </div>
            <div v-if="gapsOpen">
              <div v-if="aiAnalysis.gaps.length === 0" class="ai-empty">
                Todo cubierto esta semana, buen trabajo.
              </div>
              <div v-else v-for="gap in aiAnalysis.gaps" :key="gap.musculo" class="ai-gap-item">
                <div class="ai-gap-muscle">{{ gap.musculo }}</div>
                <div class="ai-gap-sugs">
                  <button v-for="s in gap.sugerencias" :key="s"
                    class="ai-tag ai-tag-btn" @click="abrirPicker(s)">
                    {{ s }} <span class="ai-tag-plus">＋</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Redundancies -->
          <div class="ai-section">
            <div class="ai-section-header" @click="redundanciasOpen = !redundanciasOpen">
              <span>🔄 Posibles redundancias</span>
              <span class="ai-section-arrow">{{ redundanciasOpen ? '▲' : '▼' }}</span>
            </div>
            <div v-if="redundanciasOpen">
              <div v-if="aiAnalysis.redundancias.length === 0" class="ai-empty">
                Sin redundancias detectadas, buena variedad.
              </div>
              <div v-else v-for="r in aiAnalysis.redundancias" :key="r.ejercicios.join()"
                class="ai-redundancia-item">
                <div class="ai-redundancia-label">{{ r.ejercicios.join(' + ') }}</div>
                <div class="ai-redundancia-note">{{ r.nota }}</div>
                <div class="ai-redundancia-actions">
                  <template v-for="ejNombre in r.ejercicios" :key="ejNombre">
                    <div v-for="rutina in rutinasConEjercicio(ejNombre)" :key="rutina.id"
                      class="ai-remove-row">
                      <span class="ai-remove-info">
                        <span class="ai-remove-ex">{{ ejNombre }}</span>
                        <span class="ai-remove-rutina">en {{ rutina.nombre }}</span>
                      </span>
                      <button class="ai-remove-btn"
                        @click="quitarDeRutina(rutina.id, ejNombre)">✕ Quitar</button>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Routine Picker Modal -->
      <div v-if="pickerVisible" class="picker-overlay" @click.self="pickerVisible = false">
        <div class="picker-sheet">
          <div class="picker-title">
            <span v-if="pickerGenerating">
              <span class="ai-spinner"></span> Generando con IA...
            </span>
            <span v-else>Agregar a rutina</span>
          </div>
          <div class="picker-ex-name">{{ pickerExNombre }}</div>
          <div v-if="!pickerGenerating">
            <button v-for="rutina in store.rutinas" :key="rutina.id"
              class="picker-option" @click="confirmarAgregarEjercicio(rutina.id)">
              {{ rutina.nombre }}
            </button>
            <button class="picker-option picker-option--new"
              @click="confirmarAgregarEjercicio('nueva')">
              ＋ Nueva rutina
            </button>
            <button class="picker-cancel" @click="pickerVisible = false">Cancelar</button>
          </div>
        </div>
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
import { callClaude } from '../utils/claude.js'

const store = useStore()
const selectedEx = ref('')
const aiLoading = ref(false)
const aiAnalysis = ref(null)
const gapsOpen = ref(true)
const redundanciasOpen = ref(true)
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

// ── Picker para agregar ejercicio a rutina ─────────────────────
const pickerVisible   = ref(false)
const pickerExNombre  = ref('')
const pickerGenerating = ref(false)

const VALID_MUSCLES = ['chest','obliques','abs','biceps','triceps','front-deltoids',
  'abductors','quadriceps','calves','forearm','trapezius','upper-back','lower-back',
  'back-deltoids','gluteal','adductor','hamstring','left-soleus']

const EQUIPO_LABELS = { kb: 'kettlebell', sb: 'sandbag', bb: 'barbell', db: 'dumbbell', bw: 'bodyweight', band: 'resistance band', trx: 'TRX' }

function rutinasConEjercicio(nombreEj) {
  return store.rutinas.filter(r => r.ejercicios.some(e => e.nombre === nombreEj))
}

function abrirPicker(nombre) {
  pickerExNombre.value = nombre
  pickerVisible.value = true
}

async function generarDatosEjercicio(nombre, equipo = '') {
  const key = store.geminiKey
  if (!key) return null
  const generoCtx = store.genero === 'hombre' ? 'male athlete' : store.genero === 'mujer' ? 'female athlete' : 'athlete'
  const generoEs  = store.genero === 'hombre' ? 'hombre' : store.genero === 'mujer' ? 'mujer' : null
  const memoria   = store.memoriaEntrenador
  const EQUIPO_LABELS_EN = { kb: 'kettlebell', sb: 'sandbag', bb: 'barbell', db: 'dumbbell', bw: 'bodyweight', band: 'resistance band', trx: 'TRX' }
  const equipoStr = EQUIPO_LABELS_EN[equipo] ? ` (with ${EQUIPO_LABELS_EN[equipo]})` : ''
  const prompt = `You are an experienced strength coach who knows this athlete well.${memoria ? ` What you know about them:\n${memoria}\n` : ''} For the exercise "${nombre}"${equipoStr} performed by a ${generoCtx}, respond ONLY with valid JSON (no markdown, no extra text):
{"musculos":{"primario":[],"secundario":[],"terciario":[]},"respiracion":"string","forma":"string","tips":"string"}

Write all text fields in Spanish, casual tone. No "recuerda", no "asegúrate". Direct, specific.
- "respiracion": one sentence, when to inhale/exhale.
- "forma": 2 sentences, key technique points.
- "tips": 1-2 sentences, what to do if they don't feel the target muscle.${generoEs ? ` The user is ${generoEs}, adapt terminology as needed.` : ''}
For musculos use ONLY: ${VALID_MUSCLES.join(', ')}. Primary >60% MVC, secondary 30-60%, tertiary <30%.`

  try {
    let raw = (await callClaude(key, {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 600,
    })).replace(/```json?|```/g, '').trim()
    const sanitized = raw.replace(/("(?:[^"\\]|\\[\s\S])*")/g, s =>
      s.replace(/\n/g, '\\n').replace(/\r/g, '').replace(/\t/g, ' '))
    const json = JSON.parse(sanitized)
    const filter = (arr) => (arr || []).filter(m => VALID_MUSCLES.includes(m))
    const m = json.musculos || {}
    return {
      musculos: [
        ...filter(m.primario).map(muscle => ({ muscle, nivel: 'primario' })),
        ...filter(m.secundario).map(muscle => ({ muscle, nivel: 'secundario' })),
        ...filter(m.terciario).map(muscle => ({ muscle, nivel: 'terciario' })),
      ],
      notas: { respiracion: json.respiracion || '', forma: json.forma || '', tips: json.tips || '' },
    }
  } catch { return null }
}

async function confirmarAgregarEjercicio(rutinaId) {
  pickerGenerating.value = true
  const nombre = pickerExNombre.value

  const equipoPref = store.equipoPreferido || []
  const autoEquipo = nombre.toLowerCase().startsWith('kb') ? 'kb'
    : nombre.toLowerCase().startsWith('sb') ? 'sb'
    : equipoPref.length === 1 ? equipoPref[0]
    : ''

  const ejercicio = {
    id: 'e' + Date.now(),
    nombre,
    series: 3,
    reps: '10',
    equipo: autoEquipo,
    tipoMedida: 'reps',
    notas: { respiracion: '', forma: '', tips: '' },
    descansoRecomendado: 90,
    musculos: [],
  }

  const generado = await generarDatosEjercicio(nombre, autoEquipo)
  if (generado) {
    ejercicio.musculos = generado.musculos
    ejercicio.notas    = generado.notas
  }

  if (rutinaId === 'nueva') {
    store.crearRutinaConEjercicio(ejercicio)
    store.showToast(`✓ ${nombre} agregado en nueva rutina`)
  } else {
    store.agregarEjercicioARutina(rutinaId, ejercicio)
    const rutinaNombre = store.rutinas.find(r => r.id === rutinaId)?.nombre || ''
    store.showToast(`✓ ${nombre} agregado a "${rutinaNombre}"`)
  }

  pickerGenerating.value = false
  pickerVisible.value = false
}

function quitarDeRutina(rutinaId, ejercicioNombre) {
  if (!confirm(`¿Quitar "${ejercicioNombre}" de esta rutina?`)) return
  store.quitarEjercicioDeRutina(rutinaId, ejercicioNombre)
  store.showToast(`✓ "${ejercicioNombre}" eliminado de la rutina`)
}

// ── Análisis IA de la semana ───────────────────────────────────
const weekExercises = computed(() => {
  const { start, end } = weekRange.value
  const map = {}
  store.historial
    .filter(h => { const d = new Date(h.fecha); return d >= start && d <= end })
    .forEach(h => {
      ;(h.ejercicios || []).forEach(e => {
        if (!map[e.nombre]) map[e.nombre] = new Set()
        ;(e.musculos || []).forEach(m => {
          const muscle = typeof m === 'string' ? m : m.muscle
          map[e.nombre].add(muscle)
        })
      })
    })
  return Object.entries(map).map(([nombre, musculos]) => ({ nombre, musculos: [...musculos] }))
})

async function analizarSemana() {
  if (!store.geminiKey || aiLoading.value) return
  aiLoading.value = true
  aiAnalysis.value = null

  const musculos = weekMuscles.value.map(m => `${m.muscle} (${m.nivel})`).join(', ')
  const ejercicios = weekExercises.value
    .map(e => `${e.nombre}${e.musculos.length ? ` [${e.musculos.join(', ')}]` : ''}`)
    .join('\n')
  const genero = store.genero === 'hombre' ? 'hombre' : store.genero === 'mujer' ? 'mujer' : null
  const memoria = store.memoriaEntrenador
  const equipoPref = store.equipoPreferido || []
  const EQUIPO_NOMBRES = { kb: 'kettlebell', sb: 'sandbag', bb: 'barra', db: 'mancuerna', bw: 'peso corporal', band: 'bandas de resistencia', trx: 'TRX' }
  const equipoStr = equipoPref.length
    ? `El atleta prefiere entrenar con: ${equipoPref.map(e => EQUIPO_NOMBRES[e] || e).join(', ')}. Prioriza estos equipos en las sugerencias de ejercicios.`
    : 'El atleta usa kettlebell y sandbag.'

  const prompt = `Eres un entrenador que conoce bien a este atleta — directo, sin rodeos, sin suavizar problemas reales. No como un asistente corporativo.${genero ? ` Atleta: ${genero}.` : ''}${memoria ? `\n\nLo que sabes del atleta:\n${memoria}` : ''}

${equipoStr}

Ejercicios realizados esta semana:
${ejercicios || '(ninguno)'}

Músculos trabajados: ${musculos || '(ninguno)'}

Analiza y responde SOLO con este JSON (sin markdown, sin texto extra):
{
  "gaps": [
    { "musculo": "nombre del grupo muscular", "sugerencias": ["ejercicio 1", "ejercicio 2"] }
  ],
  "redundancias": [
    { "ejercicios": ["ejercicio A", "ejercicio B"], "nota": "explicación breve de por qué son redundantes y cuál quitar" }
  ]
}

Reglas:
- gaps: grupos musculares importantes NO trabajados esta semana (máx 4). Sugiere 2-3 ejercicios usando el equipo preferido del atleta.
- redundancias: pares/grupos de ejercicios que trabajan los mismos músculos primarios (máx 3).
- Si no hay gaps ni redundancias reales, devuelve arrays vacíos — no inventes problemas donde no los hay.
- Nunca valides algo incorrecto por quedar bien. Si la semana está desequilibrada o hay sobreentrenamiento evidente, dilo directamente en las notas de redundancia o en el campo "musculo" de gaps.
- Prohibido en cualquier campo de texto: "¡Claro!", "¡Por supuesto!", "Recuerda que", "Asegúrate de", "Es importante que", "No olvides que", "¡Excelente!", "¡Perfecto!"
- Solo devuelve el JSON, nada más.`

  try {
    let raw = (await callClaude(store.geminiKey, {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 600,
    })).replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const parsed = JSON.parse(raw)
    aiAnalysis.value = {
      gaps: Array.isArray(parsed.gaps) ? parsed.gaps : [],
      redundancias: Array.isArray(parsed.redundancias) ? parsed.redundancias : [],
    }
  } catch {
    aiAnalysis.value = { gaps: [], redundancias: [], error: true }
  }

  aiLoading.value = false
}

// Reset analysis when week changes
watch(weekOffset, () => { aiAnalysis.value = null })

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

/* AI Analysis */
.ai-spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  vertical-align: middle;
  margin-right: 4px;
}
@keyframes spin { to { transform: rotate(360deg); } }

.ai-analysis {
  margin-top: 12px;
  border-top: 1px solid var(--border);
  padding-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ai-section {
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}
.ai-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  user-select: none;
}
.ai-section-arrow { color: var(--text3); font-size: 10px; }

.ai-empty {
  padding: 10px 12px;
  font-size: 12px;
  color: var(--text3);
}

.ai-gap-item {
  padding: 8px 12px;
  border-top: 1px solid var(--border);
}
.ai-gap-muscle {
  font-size: 12px;
  font-weight: 600;
  color: var(--accent);
  margin-bottom: 5px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.ai-gap-sugs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.ai-tag-btn {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 3px 10px;
  font-size: 11px;
  color: var(--text2);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: border-color 0.15s;
}
.ai-tag-btn:hover { border-color: var(--accent); color: var(--accent); }
.ai-tag-plus { font-size: 14px; color: var(--accent); line-height: 1; }

.ai-redundancia-item {
  padding: 8px 12px;
  border-top: 1px solid var(--border);
}
.ai-redundancia-label {
  font-size: 12px;
  font-weight: 600;
  color: #ff9900;
  margin-bottom: 3px;
}
.ai-redundancia-note {
  font-size: 12px;
  color: var(--text2);
  line-height: 1.4;
  margin-bottom: 8px;
}
.ai-redundancia-actions { display: flex; flex-direction: column; gap: 5px; }
.ai-remove-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 6px 10px;
}
.ai-remove-info { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.ai-remove-ex { font-size: 12px; font-weight: 600; color: var(--text1); }
.ai-remove-rutina { font-size: 10px; color: var(--text3); }
.ai-remove-btn {
  background: none;
  border: 1px solid var(--red);
  border-radius: 6px;
  color: var(--red);
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  cursor: pointer;
  flex-shrink: 0;
  margin-left: 8px;
}

/* Picker overlay */
.picker-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  z-index: 200;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.picker-sheet {
  background: var(--bg2);
  border-radius: 20px 20px 0 0;
  width: 100%;
  max-width: 480px;
  padding: 20px 16px 32px;
  border-top: 1px solid var(--border);
}
.picker-title {
  font-size: 12px;
  color: var(--text3);
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.picker-ex-name {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 20px;
  color: var(--accent);
  text-align: center;
  margin-bottom: 16px;
}
.picker-option {
  display: block;
  width: 100%;
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text1);
  font-size: 14px;
  font-weight: 500;
  padding: 13px 16px;
  text-align: left;
  cursor: pointer;
  margin-bottom: 8px;
}
.picker-option--new {
  color: var(--accent);
  border-color: var(--accent);
}
.picker-cancel {
  display: block;
  width: 100%;
  background: none;
  border: none;
  color: var(--text3);
  font-size: 14px;
  padding: 12px;
  cursor: pointer;
  margin-top: 4px;
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
