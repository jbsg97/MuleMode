<template>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div>
        <div class="header-title">MULE<span class="accent-dot">MODE</span></div>
        <div class="header-slogan">Carga. Avanza. Repite.</div>
        <div class="header-sub">{{ store.fechaHoy }}</div>
      </div>
      <button @click="$emit('settings')" class="settings-btn" title="Ajustes">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="8" r="4"/>
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
        </svg>
      </button>
    </div>

    <!-- Stats -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-val">{{ store.totalEntrenamientos }}</div>
        <div class="stat-lbl">Entrenamientos</div>
      </div>
      <div class="stat-card">
        <div class="stat-val">{{ store.totalVolStr }}</div>
        <div class="stat-lbl">Kg totales levantados</div>
      </div>
    </div>

    <!-- Week bar -->
    <div class="week-bar">
      <div>
        <div class="week-bar-label">Esta semana</div>
        <div class="week-bar-val">
          {{ store.semanaActual }}
          <span style="font-size:13px;color:var(--text2);font-family:'DM Sans',sans-serif">entrenos</span>
        </div>
      </div>
      <div style="text-align:right">
        <div class="week-bar-label">Racha activa</div>
        <div class="week-bar-val">
          {{ store.rachaActiva }}
          <span style="font-size:13px;color:var(--text2);font-family:'DM Sans',sans-serif">días</span>
        </div>
      </div>
    </div>

    <!-- Section title -->
    <div class="section-pad" style="display:flex;justify-content:space-between;align-items:center">
      <div class="section-title" style="margin:0">Mis rutinas</div>
      <div style="display:flex;gap:6px;align-items:center">
        <button class="btn btn-outline btn-sm" @click="toggleNuevoPlan">＋ Plan</button>
        <button v-if="store.geminiKey" class="btn btn-outline btn-sm"
          @click="store.generarRutinaModalVisible = true">
          🤖 IA
        </button>
      </div>
    </div>

    <!-- New plan inline input -->
    <div v-if="showNuevoPlan" style="padding:0 16px 12px;display:flex;gap:8px">
      <input class="form-input" style="flex:1;font-size:13px" ref="nuevoPlanInputRef"
        placeholder="Nombre del plan (ej: Plan Doomsday)"
        v-model="nuevoPlanNombre"
        @keydown.enter="confirmarNuevoPlan"
        @keydown.escape="showNuevoPlan = false" />
      <button class="btn btn-accent btn-sm" :disabled="!nuevoPlanNombre.trim()" @click="confirmarNuevoPlan">Crear</button>
    </div>

    <!-- Empty state -->
    <div v-if="store.rutinas.length === 0" class="empty">
      <div class="empty-icon">💪</div>
      <div class="empty-text">No tienes rutinas. Toca + para crear una.</div>
    </div>

    <!-- With plans: plan sections + free routines -->
    <template v-if="store.planes.length">

      <!-- Plan sections -->
      <div v-for="plan in store.planes" :key="plan.id" class="plan-section">

        <!-- Plan header (collapsible) -->
        <div class="plan-header" @click="togglePlan(plan.id)">
          <div class="plan-chevron" :style="{ transform: planCollapsed[plan.id] ? '' : 'rotate(90deg)' }">›</div>
          <template v-if="editingPlanId !== plan.id">
            <div class="plan-name">{{ plan.nombre }}</div>
            <div style="display:flex;gap:4px;flex-shrink:0" @click.stop>
              <button class="icon-btn icon-btn--edit" @click="startRename(plan)" title="Renombrar">✎</button>
              <button class="icon-btn icon-btn--delete" @click="eliminarPlan(plan.id)" title="Eliminar plan">✕</button>
            </div>
          </template>
          <template v-else>
            <input class="form-input" style="flex:1;font-size:13px;padding:6px 10px"
              v-model="editPlanName"
              @click.stop
              @keydown.enter="confirmarRename(plan.id)"
              @keydown.escape="editingPlanId = null"
              @blur="confirmarRename(plan.id)" />
          </template>
        </div>

        <!-- Plan body (collapsible) -->
        <template v-if="!planCollapsed[plan.id]">

          <!-- Routines in plan -->
          <RoutineCard
            v-for="r in rutinasDePlan(plan.id)" :key="r.id"
            :rutina="r" :inPlan="true"
            @remove-from-plan="store.quitarRutinaDePlan(r.id)" />

          <!-- Empty hint -->
          <div v-if="!rutinasDePlan(plan.id).length"
            style="padding:10px 16px;color:var(--text3);font-size:13px;font-style:italic">
            Sin rutinas en este plan.
          </div>

          <!-- Add free routine to plan -->
          <div v-if="rutinasLibres.length" style="padding:4px 16px 8px">
            <select class="form-input" style="font-size:12px;padding:7px 10px"
              @change="agregarRutinaAPlan(plan.id, $event)">
              <option value="">＋ Agregar rutina al plan...</option>
              <option v-for="r in rutinasLibres" :key="r.id" :value="r.id">{{ r.nombre }}</option>
            </select>
          </div>

          <!-- AI Analysis button -->
          <div v-if="store.geminiKey && rutinasDePlan(plan.id).length" style="padding:4px 16px 8px;display:flex;gap:6px">
            <button class="btn btn-outline btn-sm" style="flex:1"
              :disabled="planAnalysis[plan.id]?.loading || (!!planAnalysis[plan.id]?.resumen && !planAnalysis[plan.id]?._reanalizar)"
              @click="analizarPlan(plan.id)">
              <span v-if="planAnalysis[plan.id]?.loading" class="plan-ai-spinner"></span>
              <span v-else>🤖</span>
              {{ planAnalysis[plan.id]?.loading ? 'Analizando...' : 'Analizar plan con IA' }}
            </button>
            <button v-if="planAnalysis[plan.id]?.resumen && !planAnalysis[plan.id]?.loading"
              class="btn btn-outline btn-sm" style="padding:7px 10px" title="Re-analizar"
              @click="habilitarReanalizar(plan.id)">
              🔄
            </button>
          </div>

          <!-- AI Analysis results -->
          <div v-if="planAnalysis[plan.id]?.resumen" class="plan-analysis">
            <div class="plan-analysis-resumen">{{ planAnalysis[plan.id].resumen }}</div>
            <div v-for="(s, si) in planAnalysis[plan.id].sugerencias" :key="si" class="plan-sug-card">
              <div class="plan-sug-header">
                <span :class="['plan-sug-badge', sugBadgeClass(s.tipo)]">
                  {{ { agregar: '＋ Agregar', quitar: '✕ Quitar', reemplazar: '↔ Reemplazar', nueva_rutina: '✦ Nueva rutina' }[s.tipo] }}
                </span>
                <span v-if="s.tipo !== 'nueva_rutina'" class="plan-sug-rutina">{{ nombreRutina(s.rutina_id) }}</span>
              </div>

              <!-- Nueva rutina: show name + muscle targets -->
              <div v-if="s.tipo === 'nueva_rutina'" class="plan-sug-body">
                <div class="plan-sug-ex plan-sug-ex--new">{{ s.nombre_rutina }}</div>
                <div v-if="s.musculos_objetivo?.length" style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px">
                  <span v-for="m in s.musculos_objetivo" :key="m" class="muscle-tag">
                    {{ MUSCLE_LABELS[m] || m }}
                  </span>
                </div>
                <div class="plan-sug-razon">{{ s.razon }}</div>
              </div>

              <!-- Agregar / quitar / reemplazar -->
              <div v-else class="plan-sug-body">
                <div v-if="s.tipo === 'quitar' || s.tipo === 'reemplazar'" class="plan-sug-ex plan-sug-ex--old">
                  {{ s.ejercicio_nombre }}
                  <span v-if="s.tipo === 'reemplazar'" style="color:var(--text3)"> → </span>
                </div>
                <div v-if="s.tipo === 'agregar' || s.tipo === 'reemplazar'" class="plan-sug-ex plan-sug-ex--new">
                  {{ s.ejercicio_nuevo?.nombre }}
                  <span v-if="s.ejercicio_nuevo" style="color:var(--text3);font-size:11px">
                    ({{ s.ejercicio_nuevo.series }}×{{ s.ejercicio_nuevo.reps }})
                  </span>
                </div>
                <div class="plan-sug-razon">{{ s.razon }}</div>
              </div>

              <div v-if="!s._aplicado" class="plan-sug-footer">
                <button class="plan-sug-apply-btn" :disabled="s._applying" @click="aplicarSugerencia(plan.id, s)">
                  <span v-if="s._applying" class="plan-ai-spinner"></span>
                  <span v-else>{{ s.tipo === 'nueva_rutina' ? '✦ Generar rutina' : '✓ Aplicar' }}</span>
                </button>
              </div>
              <div v-else class="plan-sug-done">✓ Aplicado</div>
            </div>
          </div>

          <!-- Aggregate muscle map -->
          <div v-if="planMuscles(plan.id).length" style="padding:0 12px 4px">
            <MuscleMap :model-value="planMuscles(plan.id)" readonly />
          </div>

        </template>
      </div>

      <!-- Free routines (sin plan) -->
      <template v-if="rutinasLibres.length">
        <div class="section-pad" style="padding-top:16px">
          <div class="section-title" style="margin:0;font-size:11px">Sin plan</div>
        </div>
        <div v-for="r in rutinasLibres" :key="r.id">
          <RoutineCard :rutina="r" />
          <div style="padding:0 16px 4px">
            <select class="form-input" style="font-size:12px;padding:7px 10px"
              @change="moverAPlan(r.id, $event)">
              <option value="">Mover a plan...</option>
              <option v-for="p in store.planes" :key="p.id" :value="p.id">{{ p.nombre }}</option>
            </select>
          </div>
        </div>
      </template>

    </template>

    <!-- No plans: just show all routines -->
    <template v-else>
      <RoutineCard v-for="r in store.rutinas" :key="r.id" :rutina="r" />
    </template>

    <!-- FAB -->
    <button class="fab" @click="store.abrirNuevaRutina()">+</button>
  </div>
</template>

<script setup>
import { ref, computed, reactive, nextTick } from 'vue'
import { useStore, MUSCLE_LABELS } from '../store/index.js'
import MuscleMap from '../components/MuscleMap.vue'
import RoutineCard from '../components/RoutineCard.vue'

defineEmits(['settings'])

const store = useStore()

// ── New plan ──────────────────────────────────────────────────
const showNuevoPlan     = ref(false)
const nuevoPlanNombre   = ref('')
const nuevoPlanInputRef = ref(null)

async function toggleNuevoPlan() {
  showNuevoPlan.value = !showNuevoPlan.value
  if (showNuevoPlan.value) {
    await nextTick()
    nuevoPlanInputRef.value?.focus()
  }
}

function confirmarNuevoPlan() {
  if (!nuevoPlanNombre.value.trim()) return
  store.crearPlan(nuevoPlanNombre.value.trim())
  nuevoPlanNombre.value = ''
  showNuevoPlan.value   = false
}

// ── Collapse plan ─────────────────────────────────────────────
const planCollapsed = reactive({})

function togglePlan(planId) {
  planCollapsed[planId] = !planCollapsed[planId]
}

// ── Rename plan ───────────────────────────────────────────────
const editingPlanId = ref(null)
const editPlanName  = ref('')

function startRename(plan) {
  editingPlanId.value = plan.id
  editPlanName.value  = plan.nombre
}

function confirmarRename(planId) {
  if (editPlanName.value.trim()) store.renamePlan(planId, editPlanName.value.trim())
  editingPlanId.value = null
}

// ── Delete plan ───────────────────────────────────────────────
function eliminarPlan(planId) {
  const plan  = store.planes.find(p => p.id === planId)
  if (!plan) return
  const count = store.rutinas.filter(r => r.planId === planId).length
  const msg   = count
    ? `¿Eliminar "${plan.nombre}"? Las ${count} rutina(s) quedarán sin plan.`
    : `¿Eliminar el plan "${plan.nombre}"?`
  if (confirm(msg)) store.eliminarPlan(planId)
}

// ── Move routines ─────────────────────────────────────────────
function agregarRutinaAPlan(planId, event) {
  const rutinaId = event.target.value
  if (rutinaId) store.moverRutinaAPlan(rutinaId, planId)
  event.target.value = ''
}

function moverAPlan(rutinaId, event) {
  const planId = event.target.value
  if (planId) store.moverRutinaAPlan(rutinaId, planId)
  event.target.value = ''
}

// ── Computed ──────────────────────────────────────────────────
const rutinasLibres = computed(() => store.rutinas.filter(r => !r.planId))

function rutinasDePlan(planId) {
  return store.rutinas.filter(r => r.planId === planId)
}

function nombreRutina(rutinaId) {
  return store.rutinas.find(r => r.id === rutinaId)?.nombre || rutinaId
}

function planMuscles(planId) {
  const nivelOrder = { primario: 0, secundario: 1, terciario: 2 }
  const map = {}
  store.rutinas
    .filter(r => r.planId === planId)
    .forEach(r => {
      r.ejercicios.forEach(e => {
        ;(e.musculos || []).forEach(m => {
          const muscle = typeof m === 'string' ? m : m.muscle
          const nivel  = typeof m === 'string' ? 'primario' : m.nivel
          if (!map[muscle] || nivelOrder[nivel] < nivelOrder[map[muscle]]) map[muscle] = nivel
        })
      })
    })
  return Object.entries(map).map(([muscle, nivel]) => ({ muscle, nivel }))
}

// ── AI Plan Analysis ──────────────────────────────────────────
const planAnalysis = reactive({})  // planId → { loading, resumen, sugerencias }

// Shared Groq error handler — throws with a user-friendly message
function checkGroqError(data) {
  if (!data?.error) return
  const { code, type, message } = data.error
  if (code === 'rate_limit_exceeded' || type === 'tokens') {
    const match = message?.match(/try again in ([^\\.]+)/i)
    const espera = match ? ` Intenta de nuevo en ${match[1]}.` : ' Intenta más tarde.'
    throw new Error(`límite_tokens:${espera}`)
  }
  throw new Error(message || 'Error desconocido de la API')
}

function groqToast(err) {
  if (err.message?.startsWith('límite_tokens:')) {
    store.showToast('⏳ Límite diario de tokens alcanzado.' + err.message.slice('límite_tokens:'.length))
  } else {
    store.showToast('Error de conexión con la IA. Revisa tu key de Groq.')
  }
}

const VALID_MUSCLES = ['chest','obliques','abs','biceps','triceps','front-deltoids',
  'abductors','quadriceps','calves','forearm','trapezius','upper-back','lower-back',
  'back-deltoids','gluteal','adductor','hamstring','left-soleus']

const EQUIPO_LABELS_ES = { kb:'kettlebell', sb:'sandbag', bb:'barra', db:'mancuerna', bw:'peso corporal', band:'bandas', trx:'TRX' }

function sugBadgeClass(tipo) {
  return { agregar: 'plan-sug-badge--agregar', quitar: 'plan-sug-badge--quitar', reemplazar: 'plan-sug-badge--reemplazar', nueva_rutina: 'plan-sug-badge--nueva' }[tipo] || ''
}

function buildAnalysisPrompt(planId) {
  const plan    = store.planes.find(p => p.id === planId)
  const rutinas = rutinasDePlan(planId)
  const equipo  = store.equipoPreferido.length
    ? store.equipoPreferido.map(e => EQUIPO_LABELS_ES[e] || e).join(', ')
    : 'kettlebell y sandbag'
  const perfil  = [
    store.genero  ? `Género: ${store.genero}` : null,
    store.peso    ? `Peso: ${store.peso} kg`  : null,
    store.altura  ? `Altura: ${store.altura} cm` : null,
    `Equipo preferido: ${equipo}`,
    store.memoriaEntrenador ? `Notas: ${store.memoriaEntrenador}` : null,
  ].filter(Boolean).join(' | ')

  // Compact: only primary muscles to minimise token usage
  const rutinasTxt = rutinas.map(r => {
    const ejerciciosTxt = r.ejercicios.map(e => {
      const prim = (e.musculos || [])
        .filter(m => (typeof m === 'string' ? 'primario' : m.nivel) === 'primario')
        .map(m => MUSCLE_LABELS[typeof m === 'string' ? m : m.muscle] || (typeof m === 'string' ? m : m.muscle))
        .join(', ')
      return `  - ${e.nombre} (${e.series}×${e.reps})${prim ? ': ' + prim : ''}`
    }).join('\n')
    return `${r.nombre} [id:${r.id}]:\n${ejerciciosTxt}`
  }).join('\n\n')

  const diasSemana   = store.diasSemana || 4
  const numRutinas   = rutinas.length
  const totalEjs     = rutinas.reduce((a, r) => a + r.ejercicios.length, 0)

  // Major muscle groups — plan is "complete" when most are covered
  const MAJOR_MUSCLES = ['chest', 'upper-back', 'back-deltoids', 'front-deltoids', 'gluteal', 'quadriceps', 'hamstring', 'abs']
  const coveredByData = new Set(
    rutinas.flatMap(r => r.ejercicios.flatMap(e =>
      (e.musculos || []).map(m => typeof m === 'string' ? m : m.muscle)
    ))
  )
  const majorCovered = MAJOR_MUSCLES.filter(m => coveredByData.has(m)).length
  // Plan is "mature" if it has enough routines and exercises, even if muscle data is incomplete
  const planMaduro   = numRutinas >= Math.max(3, diasSemana - 1) && totalEjs >= 16
  const planCompleto = planMaduro || majorCovered >= 6

  // Changes applied in previous analyses (B: context for re-analysis)
  const historial    = planAnalysis[planId]?._historial || []
  const historialTxt = historial.length
    ? `\nCAMBIOS YA APLICADOS POR EL ATLETA (no revertir ni contradecir):\n${historial.map(h => `- ${h}`).join('\n')}`
    : ''

  const modoAnalisis = planCompleto
    ? `El plan ya tiene ${numRutinas} rutinas y cubre los principales grupos musculares. Enfócate en CALIDAD: balance push/pull, volumen por grupo, ejercicios redundantes o poco eficientes. NO sugieras más rutinas. Sé conservador — si el plan está bien, dilo.`
    : `El plan está incompleto. Identifica grupos musculares principales ausentes y sugiere cómo completarlo.`

  return `Eres un coach de fuerza. Analiza este plan de entrenamiento.

PLAN: ${plan?.nombre}
PERFIL: ${perfil}
DÍAS DE ENTRENAMIENTO POR SEMANA: ${diasSemana} — el plan ya tiene ${numRutinas} rutina(s)

RUTINAS (el nombre indica el enfoque aunque los datos de músculos no estén completos):
${rutinasTxt}
${historialTxt}

MODO DE ANÁLISIS: ${modoAnalisis}

Responde SOLO con este JSON (sin markdown, sin texto extra):
{"resumen":"string (2-3 líneas, casual, directo — si el plan está bien dilo claramente)","sugerencias":[...]}

Cada sugerencia es UNO de estos formatos:
- Modificar ejercicio: {"rutina_id":"id exacto","tipo":"agregar|quitar|reemplazar","ejercicio_nombre":"nombre exacto (solo quitar/reemplazar)","ejercicio_nuevo":{"nombre":"string","series":3,"reps":"string","equipo":"kb|sb|bb|db|bw|band|trx|","tipoMedida":"reps|time|dist","descansoRecomendado":90},"razon":"1 línea"}
- Nueva rutina (solo si falta región corporal completa): {"tipo":"nueva_rutina","nombre_rutina":"string","musculos_objetivo":["muscle_id"],"razon":"1 línea"}

Reglas estrictas:
- Máximo 3 sugerencias, solo las más impactantes
- Si el plan está completo y equilibrado, devuelve "sugerencias": [] y explícalo en el resumen
- "nueva_rutina" PROHIBIDO si el plan ya tiene ${diasSemana} o más rutinas, o si hay rutinas que ya cubren esa región por nombre
- Muscle IDs válidos: ${VALID_MUSCLES.join(', ')}
- Usa el equipo preferido del atleta
- Solo el JSON, nada más`
}

function habilitarReanalizar(planId) {
  if (!planAnalysis[planId]) return
  const pendientes = (planAnalysis[planId].sugerencias || []).filter(s => !s._aplicado).length
  if (pendientes > 0 && !confirm(`Hay ${pendientes} sugerencia(s) sin aplicar. ¿Re-analizar de todas formas?`)) return
  planAnalysis[planId]._reanalizar = true
}

async function analizarPlan(planId) {
  if (!store.geminiKey) return
  // A: prevent re-analyze while results are showing (unless _reanalizar flag is set)
  if (planAnalysis[planId]?.resumen && !planAnalysis[planId]?._reanalizar) return

  const prevHistorial = planAnalysis[planId]?._historial || []
  if (!planAnalysis[planId]) planAnalysis[planId] = {}
  planAnalysis[planId].loading    = true
  planAnalysis[planId]._reanalizar = false
  planAnalysis[planId].resumen    = ''
  planAnalysis[planId].sugerencias = []

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${store.geminiKey}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: buildAnalysisPrompt(planId) }],
        temperature: 0.4,
        max_tokens: 1200,
      }),
    })
    const data = await res.json()
    checkGroqError(data)
    let raw = (data?.choices?.[0]?.message?.content || '').replace(/```json?|```/g, '').trim()
    const sanitized = raw.replace(/("(?:[^"\\]|\\[\s\S])*")/g, s =>
      s.replace(/\n/g, '\\n').replace(/\r/g, '').replace(/\t/g, ' '))
    const json = JSON.parse(sanitized)

    const diasSemana = store.diasSemana || 4
    const numRutinas = rutinasDePlan(planId).length
    let sugerencias  = (json.sugerencias || []).map(s => ({ ...s, _aplicado: false, _applying: false }))
    if (numRutinas >= diasSemana) {
      sugerencias = sugerencias.filter(s => s.tipo !== 'nueva_rutina')
    }

    planAnalysis[planId].resumen     = json.resumen || ''
    planAnalysis[planId].sugerencias = sugerencias
    planAnalysis[planId]._historial  = prevHistorial
  } catch (err) {
    console.error('analizarPlan error:', err)
    groqToast(err)
  }

  planAnalysis[planId].loading = false
}

async function aplicarSugerencia(planId, sug) {
  sug._applying = true

  if (sug.tipo === 'nueva_rutina') {
    await aplicarNuevaRutina(planId, sug)

  } else if (sug.tipo === 'quitar') {
    store.quitarEjercicioDeRutina(sug.rutina_id, sug.ejercicio_nombre)
    store.showToast(`✓ "${sug.ejercicio_nombre}" eliminado`)
    sug._aplicado = true
    pushHistorial(planId, `Eliminado "${sug.ejercicio_nombre}" de ${nombreRutina(sug.rutina_id)}`)

  } else if (sug.tipo === 'agregar' || sug.tipo === 'reemplazar') {
    const spec = sug.ejercicio_nuevo
    const ejercicio = {
      id: 'e' + Date.now(),
      nombre: spec.nombre,
      series: parseInt(spec.series) || 3,
      reps: spec.reps || '10',
      equipo: spec.equipo || '',
      tipoMedida: spec.tipoMedida || 'reps',
      descansoRecomendado: parseInt(spec.descansoRecomendado) || 90,
      notas: { respiracion: '', forma: '', tips: '' },
      musculos: [],
    }
    if (sug.tipo === 'reemplazar' && sug.ejercicio_nombre) {
      store.quitarEjercicioDeRutina(sug.rutina_id, sug.ejercicio_nombre)
      pushHistorial(planId, `Reemplazado "${sug.ejercicio_nombre}" por "${spec.nombre}" en ${nombreRutina(sug.rutina_id)}`)
    } else {
      pushHistorial(planId, `Agregado "${spec.nombre}" a ${nombreRutina(sug.rutina_id)}`)
    }
    store.agregarEjercicioARutina(sug.rutina_id, ejercicio)
    store.showToast(`✓ "${spec.nombre}" agregado`)
    sug._aplicado = true
    if (store.geminiKey) generarNotasBackground(sug.rutina_id, ejercicio)
  }

  sug._applying = false
}

function pushHistorial(planId, entrada) {
  if (!planAnalysis[planId]) planAnalysis[planId] = {}
  if (!planAnalysis[planId]._historial) planAnalysis[planId]._historial = []
  planAnalysis[planId]._historial.push(entrada)
}

async function aplicarNuevaRutina(planId, sug) {
  const plan    = store.planes.find(p => p.id === planId)
  const equipo  = store.equipoPreferido.length
    ? store.equipoPreferido.map(e => EQUIPO_LABELS_ES[e] || e).join(', ')
    : 'kettlebell y sandbag'
  const planResumenTxt = rutinasDePlan(planId)
    .map(r => `${r.nombre}: ${r.ejercicios.map(e => e.nombre).join(', ')}`)
    .join('\n')
  const musculosTxt = (sug.musculos_objetivo || [])
    .map(m => MUSCLE_LABELS[m] || m).join(', ')

  const promptIA = `Eres un entrenador experto. El atleta tiene este plan y necesita una rutina nueva para completarlo.

PLAN ACTUAL "${plan?.nombre}":
${planResumenTxt}

MÚSCULOS A TRABAJAR EN LA NUEVA RUTINA: ${musculosTxt}
NOMBRE DE LA RUTINA: ${sug.nombre_rutina}
EQUIPO: ${equipo}
${store.genero ? `GÉNERO: ${store.genero}` : ''}
${store.memoriaEntrenador ? `NOTAS: ${store.memoriaEntrenador}` : ''}

Diseña UNA rutina enfocada en los músculos indicados, sin repetir los mismos ejercicios del plan.

Responde SOLO con este JSON (sin markdown):
{"nombre":"string","desc":"string","ejercicios":[{"nombre":"string","series":3,"reps":"string","equipo":"kb|sb|bb|db|bw|band|trx|","tipoMedida":"reps|time|dist","descansoRecomendado":90}]}

Mínimo 4 ejercicios, máximo 6. Solo el JSON.`

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${store.geminiKey}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: promptIA }],
        temperature: 0.5,
        max_tokens: 1500,
      }),
    })
    const data = await res.json()
    let raw = (data?.choices?.[0]?.message?.content || '').replace(/```json?|```/g, '').trim()
    const sanitized = raw.replace(/("(?:[^"\\]|\\[\s\S])*")/g, s =>
      s.replace(/\n/g, '\\n').replace(/\r/g, '').replace(/\t/g, ' '))
    const json = JSON.parse(sanitized)
    if (!json.nombre || !json.ejercicios) throw new Error('Respuesta inválida')

    const ejercicios = json.ejercicios.map((e, i) => ({
      id: `e${Date.now()}_${i}`,
      nombre: e.nombre,
      series: parseInt(e.series) || 3,
      reps: e.reps || '10',
      equipo: e.equipo || '',
      tipoMedida: e.tipoMedida || 'reps',
      descansoRecomendado: parseInt(e.descansoRecomendado) || 90,
      notas: { respiracion: '', forma: '', tips: '' },
      musculos: [],
    }))

    const rutinaId = `r${Date.now()}`
    store.rutinas.push({ id: rutinaId, nombre: json.nombre, desc: json.desc || '', ejercicios, planId })
    store.save()

    if (store.geminiKey) generarNotasBackgroundBatch(rutinaId, ejercicios)

    store.showToast(`✓ Rutina "${json.nombre}" agregada al plan`)
    pushHistorial(planId, `Nueva rutina "${json.nombre}" agregada al plan (cubre: ${(sug.musculos_objetivo || []).map(m => MUSCLE_LABELS[m] || m).join(', ')})`)
    sug._aplicado = true
  } catch (err) {
    console.error('aplicarNuevaRutina error:', err)
    groqToast(err)
  }
}

async function generarNotasBackgroundBatch(rutinaId, ejercicios) {
  const key    = store.geminiKey
  const genero = store.genero || null
  const EQUIPO_EN = { kb:'kettlebell', sb:'sandbag', bb:'barbell', db:'dumbbell', bw:'bodyweight', band:'resistance band', trx:'TRX' }
  const lista = ejercicios.map(e => `- ${e.nombre}${EQUIPO_EN[e.equipo] ? ` (${EQUIPO_EN[e.equipo]})` : ''}`).join('\n')

  const prompt = `You are a strength coach. For each exercise, generate muscles and cues in Spanish (casual, no "recuerda", no "asegúrate").${genero ? ` User is ${genero}.` : ''}

Exercises:
${lista}

Valid muscle IDs: ${VALID_MUSCLES.join(', ')}
Primary >60% MVC, secondary 30-60%, tertiary <30%.

Respond ONLY with a JSON array (no markdown):
[{"nombre":"exact name","musculos_p":["id"],"musculos_s":["id"],"musculos_t":[],"respiracion":"1 sentence","forma":"2 sentences technique","tips":"1 sentence if they don't feel it","progresion":"1-2 sentences golden rule: when to add reps vs weight and by how much"}]`

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], temperature: 0, max_tokens: 2000 }),
    })
    const data = await res.json()
    let raw = (data?.choices?.[0]?.message?.content || '').replace(/```json?|```/g, '').trim()
    const sanitized = raw.replace(/("(?:[^"\\]|\\[\s\S])*")/g, s =>
      s.replace(/\n/g, '\\n').replace(/\r/g, '').replace(/\t/g, ' '))
    const resultados = JSON.parse(sanitized)

    const rutina = store.rutinas.find(r => r.id === rutinaId)
    if (!rutina) return
    resultados.forEach(n => {
      const ex = rutina.ejercicios.find(e => e.nombre === n.nombre)
      if (!ex) return
      ex.notas = { respiracion: n.respiracion || '', forma: n.forma || '', tips: n.tips || '', progresion: n.progresion || '' }
      ex.musculos = [
        ...(n.musculos_p || []).filter(m => VALID_MUSCLES.includes(m)).map(m => ({ muscle: m, nivel: 'primario' })),
        ...(n.musculos_s || []).filter(m => VALID_MUSCLES.includes(m)).map(m => ({ muscle: m, nivel: 'secundario' })),
        ...(n.musculos_t || []).filter(m => VALID_MUSCLES.includes(m)).map(m => ({ muscle: m, nivel: 'terciario' })),
      ]
    })
    store.save()
  } catch (err) {
    console.error('generarNotasBackgroundBatch error:', err)
  }
}

async function generarNotasBackground(rutinaId, ejercicio) {
  const key    = store.geminiKey
  const genero = store.genero || null
  const EQUIPO_EN = { kb:'kettlebell', sb:'sandbag', bb:'barbell', db:'dumbbell', bw:'bodyweight', band:'resistance band', trx:'TRX' }
  const equipoStr = EQUIPO_EN[ejercicio.equipo] ? ` (${EQUIPO_EN[ejercicio.equipo]})` : ''

  const prompt = `You are an experienced strength coach. For the exercise "${ejercicio.nombre}"${equipoStr}${genero ? ` performed by a ${genero}` : ''}, respond ONLY with valid JSON (no markdown):
{"musculos":{"primario":[],"secundario":[],"terciario":[]},"respiracion":"string","forma":"string","tips":"string","progresion":"string"}

All text in Spanish, casual tone. No "recuerda", no "asegúrate".
- respiracion: when to inhale/exhale (1 sentence)
- forma: 2 key technique points
- tips: what to do if they don't feel the target muscle (1-2 sentences)
- progresion: golden rule for this exercise — when to add reps vs weight and by how much (1-2 sentences)
Valid muscle IDs: ${VALID_MUSCLES.join(', ')}. Primary >60% MVC, secondary 30-60%, tertiary <30%.`

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], temperature: 0, max_tokens: 500 }),
    })
    const data = await res.json()
    let raw = (data?.choices?.[0]?.message?.content || '').replace(/```json?|```/g, '').trim()
    const sanitized = raw.replace(/("(?:[^"\\]|\\[\s\S])*")/g, s =>
      s.replace(/\n/g, '\\n').replace(/\r/g, '').replace(/\t/g, ' '))
    const json = JSON.parse(sanitized)
    const filter = arr => (arr || []).filter(m => VALID_MUSCLES.includes(m))
    const m = json.musculos || {}

    const rutina = store.rutinas.find(r => r.id === rutinaId)
    const ex     = rutina?.ejercicios.find(e => e.id === ejercicio.id)
    if (!ex) return

    ex.notas   = { respiracion: json.respiracion || '', forma: json.forma || '', tips: json.tips || '', progresion: json.progresion || '' }
    ex.musculos = [
      ...filter(m.primario).map(muscle  => ({ muscle, nivel: 'primario' })),
      ...filter(m.secundario).map(muscle => ({ muscle, nivel: 'secundario' })),
      ...filter(m.terciario).map(muscle  => ({ muscle, nivel: 'terciario' })),
    ]
    store.save()
  } catch (err) {
    console.error('generarNotasBackground error:', err)
  }
}
</script>

<style scoped>
.plan-section {
  margin: 0 16px 16px;
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.plan-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: var(--bg3);
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  user-select: none;
}
.plan-header:active { background: var(--bg4); }

.plan-chevron {
  font-size: 20px;
  color: var(--text3);
  transition: transform 0.2s;
  flex-shrink: 0;
  line-height: 1;
}

.plan-name {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 18px;
  color: var(--accent);
  letter-spacing: 0.06em;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Override routine-card margin inside plan sections */
.plan-section :deep(.routine-card) {
  margin: 0;
  border-radius: 0;
  border-left: none;
  border-right: none;
  border-top: none;
}
.plan-section :deep(.routine-card:last-of-type) {
  border-bottom: 1px solid var(--border);
}

/* AI Analysis */
.plan-ai-spinner {
  display: inline-block;
  width: 12px; height: 12px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: plan-spin 0.7s linear infinite;
}
@keyframes plan-spin { to { transform: rotate(360deg); } }

.plan-analysis {
  margin: 4px 12px 8px;
  border: 1px solid rgba(232,240,58,0.15);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.plan-analysis-resumen {
  padding: 10px 12px;
  font-size: 13px;
  color: var(--text2);
  line-height: 1.5;
  background: rgba(232,240,58,0.04);
  border-bottom: 1px solid rgba(232,240,58,0.1);
}

.plan-sug-card {
  border-bottom: 1px solid var(--border);
  padding: 10px 12px;
}
.plan-sug-card:last-child { border-bottom: none; }

.plan-sug-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.plan-sug-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
  letter-spacing: 0.04em;
  flex-shrink: 0;
}
.plan-sug-badge--agregar   { background: rgba(68,204,136,0.15); color: #44cc88; border: 1px solid rgba(68,204,136,0.3); }
.plan-sug-badge--quitar    { background: rgba(255,68,68,0.12);  color: #ff6666; border: 1px solid rgba(255,68,68,0.3); }
.plan-sug-badge--reemplazar{ background: rgba(68,136,255,0.12); color: #6699ff; border: 1px solid rgba(68,136,255,0.3); }
.plan-sug-badge--nueva     { background: rgba(232,240,58,0.12); color: var(--accent); border: 1px solid rgba(232,240,58,0.3); }

.plan-sug-rutina {
  font-size: 11px;
  color: var(--text3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.plan-sug-body { margin-bottom: 8px; }

.plan-sug-ex { font-size: 13px; font-weight: 500; line-height: 1.4; }
.plan-sug-ex--old { color: var(--text2); text-decoration: line-through; opacity: 0.7; }
.plan-sug-ex--new { color: var(--text1); }

.plan-sug-razon {
  font-size: 12px;
  color: var(--text3);
  margin-top: 4px;
  line-height: 1.4;
}

.plan-sug-footer { display: flex; justify-content: flex-end; }

.plan-sug-apply-btn {
  background: var(--accent);
  border: none;
  border-radius: 6px;
  color: #000;
  font-size: 12px;
  font-weight: 700;
  padding: 5px 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 80px;
  justify-content: center;
}
.plan-sug-apply-btn:disabled { opacity: 0.5; }

.plan-sug-done {
  font-size: 12px;
  color: #44cc88;
  font-weight: 600;
  text-align: right;
}
</style>
