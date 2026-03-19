<template>
  <div class="modal" :class="{ show: store.generarRutinaModalVisible }">
    <div class="modal-header">
      <div class="modal-title">🤖 Generar rutina con IA</div>
      <button class="modal-close" @click="cerrar">✕</button>
    </div>

    <div style="padding:16px;overflow-y:auto;flex:1;padding-bottom:16px">

      <!-- Step 1: objetivo + días -->
      <template v-if="step === 1">
        <div class="gr-profile-chips">
          <span v-if="store.genero" class="gr-chip">
            {{ store.genero === 'hombre' ? '♂' : '♀' }} {{ store.genero }}
          </span>
          <span v-if="store.peso || store.altura" class="gr-chip">
            {{ [store.peso ? store.peso + ' kg' : '', store.altura ? store.altura + ' cm' : ''].filter(Boolean).join(' · ') }}
          </span>
          <span v-if="store.equipoPreferido.length" class="gr-chip">
            {{ store.equipoPreferido.map(e => EQUIPO_MAP[e]?.label || e).join(' · ') }}
          </span>
          <span v-if="!store.genero && !store.peso && !store.equipoPreferido.length"
            class="gr-chip gr-chip--warn">
            Completa tu perfil en Ajustes para mejores resultados
          </span>
        </div>

        <!-- Objetivo -->
        <template v-if="!modoAvanzado">
          <div class="form-label" style="margin-bottom:8px">¿Cuál es tu objetivo?</div>
          <div style="margin-bottom:16px">
            <div v-for="o in OBJETIVOS" :key="o.id"
              class="gr-objetivo-card"
              :class="{ 'gr-objetivo-card--active': objetivoSeleccionado === o.id }"
              @click="objetivoSeleccionado = o.id">
              <div style="display:flex;align-items:baseline;gap:6px;flex-wrap:wrap">
                <span class="gr-objetivo-nombre">{{ o.nombre }}</span>
                <span class="gr-objetivo-sub">({{ o.sub }})</span>
              </div>
              <div class="gr-objetivo-desc">{{ o.desc }}</div>
            </div>
          </div>

          <!-- Días -->
          <div class="form-label" style="margin-bottom:8px">Días por semana</div>
          <div class="gr-dias-btns" style="margin-bottom:20px">
            <button v-for="d in [2, 3, 4, 5]" :key="d"
              class="gr-dias-btn" :class="{ active: diasSeleccionados === d }"
              @click="diasSeleccionados = d">{{ d }}</button>
          </div>

          <button class="gr-avanzado-toggle" @click="modoAvanzado = true">
            ✏️ Personalizar solicitud
          </button>
        </template>

        <!-- Modo avanzado: texto libre -->
        <template v-else>
          <div class="form-group">
            <label class="form-label">¿Qué tipo de rutina quieres?</label>
            <textarea class="form-input gr-prompt-input" rows="4" v-model="prompt"
              placeholder="Ej: 3 rutinas para la semana, tren superior, inferior y core. 45 min cada una. Me duele la espalda baja así que evita peso muerto."></textarea>
          </div>
          <button class="gr-avanzado-toggle" style="margin-bottom:16px" @click="modoAvanzado = false; prompt = ''">
            ← Volver al selector de objetivo
          </button>
        </template>
      </template>

      <!-- Step 2: loading -->
      <template v-else-if="step === 2">
        <div class="gr-loading">
          <div class="gr-loading-spinner"></div>
          <div class="gr-loading-text">Generando tu plan de entrenamiento...</div>
          <div class="gr-loading-sub">Esto puede tardar unos segundos</div>
        </div>
      </template>

      <!-- Step 3: preview + chat -->
      <template v-else-if="step === 3">
        <div v-if="error" class="gr-error">
          {{ error }}
          <button class="btn btn-outline btn-sm" style="margin-top:12px;width:100%" @click="step = 1">
            Intentar de nuevo
          </button>
        </div>

        <template v-else>
          <div style="font-size:12px;color:var(--text3);margin-bottom:12px">
            {{ rutinasGeneradas.length }} rutina{{ rutinasGeneradas.length !== 1 ? 's' : '' }} generada{{ rutinasGeneradas.length !== 1 ? 's' : '' }} · Revisa, ajusta con IA y guarda
          </div>

          <div v-for="(r, ri) in rutinasGeneradas" :key="ri" class="gr-rutina-card">
            <!-- Header -->
            <div class="gr-rutina-header" @click="previewOpen[ri] = !previewOpen[ri]">
              <div style="flex:1;min-width:0">
                <div class="gr-rutina-nombre">{{ r.nombre }}</div>
                <div class="gr-rutina-desc">{{ r.ejercicios.length }} ejercicios · {{ r.desc }}</div>
              </div>
              <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
                <button class="gr-chat-toggle-btn" :class="{ active: r._chatOpen }"
                  @click.stop="r._chatOpen = !r._chatOpen; previewOpen[ri] = true"
                  title="Ajustar con IA">
                  ✏️
                </button>
                <button v-if="!r._guardada" class="btn btn-accent btn-sm"
                  @click.stop="guardarRutina(ri)">Guardar</button>
                <span v-else style="font-size:12px;color:#44cc88;font-weight:600">✓</span>
                <span class="gr-chevron" :style="{ transform: previewOpen[ri] ? 'rotate(90deg)' : '' }">›</span>
              </div>
            </div>

            <div v-if="previewOpen[ri]">
              <!-- Exercise list -->
              <div class="gr-ex-list">
                <div v-for="(ex, ei) in r.ejercicios" :key="ei" class="gr-ex-row">
                  <div style="flex:1;min-width:0">
                    <span class="gr-ex-nombre">{{ ex.nombre }}</span>
                    <span v-if="EQUIPO_MAP[ex.equipo]" class="ex-tag" style="margin-left:6px"
                      :style="{ background: EQUIPO_MAP[ex.equipo].bg, color: EQUIPO_MAP[ex.equipo].color }">
                      {{ EQUIPO_MAP[ex.equipo].label }}
                    </span>
                    <div v-if="ex.musculos_p?.length" style="display:flex;flex-wrap:wrap;gap:3px;margin-top:4px">
                      <span v-for="m in ex.musculos_p" :key="m" class="gr-muscle-tag gr-muscle-p">
                        {{ MUSCLE_LABELS[m] || m }}
                      </span>
                      <span v-for="m in ex.musculos_s" :key="m" class="gr-muscle-tag gr-muscle-s">
                        {{ MUSCLE_LABELS[m] || m }}
                      </span>
                    </div>
                  </div>
                  <span class="gr-ex-sets">{{ ex.series }}×{{ ex.reps }}</span>
                </div>
              </div>

              <!-- Chat panel -->
              <div v-if="r._chatOpen" class="gr-chat-panel">
                <div class="gr-chat-label">
                  Ajusta esta rutina — la IA conoce todo tu plan
                </div>

                <!-- Messages -->
                <div v-if="r._messages.length" class="gr-chat-messages" :ref="el => chatScrollRefs[ri] = el">
                  <div v-for="(msg, mi) in r._messages" :key="mi"
                    :class="['gr-msg', msg.role === 'user' ? 'gr-msg--user' : 'gr-msg--coach']">
                    <div class="gr-msg-text">{{ msg.content }}</div>
                    <!-- Action proposals -->
                    <div v-if="msg.acciones?.length && !msg._aplicado" class="gr-accion">
                      <div v-for="(ac, ai) in msg.acciones" :key="ai" class="gr-accion-preview">
                        <span v-if="ac.tipo === 'agregar'">
                          ➕ <strong>{{ ac.ejercicio?.nombre }}</strong>
                          ({{ ac.ejercicio?.series }}×{{ ac.ejercicio?.reps }})
                        </span>
                        <span v-else>
                          ✕ Quitar: <strong>{{ ac.ejercicio_nombre }}</strong>
                        </span>
                        <span v-if="ac.rutina_idx !== ri" class="gr-accion-otro">
                          en {{ rutinasGeneradas[ac.rutina_idx]?.nombre || 'otra rutina' }}
                        </span>
                      </div>
                      <button class="gr-accion-btn" @click="aplicarCambios(ri, msg.acciones, msg)">
                        Aplicar {{ msg.acciones.length > 1 ? `${msg.acciones.length} cambios` : 'cambio' }}
                      </button>
                    </div>
                    <div v-else-if="msg._aplicado" class="gr-accion-done">
                      ✓ {{ msg.acciones?.length > 1 ? 'Cambios aplicados' : 'Cambio aplicado' }}
                    </div>
                  </div>
                  <div v-if="r._chatLoading" class="gr-msg gr-msg--coach">
                    <span class="gr-dots"><span>.</span><span>.</span><span>.</span></span>
                  </div>
                </div>

                <!-- Input -->
                <div class="gr-chat-input-row">
                  <textarea class="gr-chat-input" rows="2"
                    :ref="el => chatInputRefs[ri] = el"
                    placeholder="Quita el peso muerto, agrega algo de core, ¿puedo agregar pull-ups?..."
                    @keydown.enter.prevent="enviarMensaje(ri)"></textarea>
                  <button class="gr-chat-send" :disabled="r._chatLoading"
                    @click="enviarMensaje(ri)">↑</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Agregar al plan -->
          <div class="gr-add-section">
            <div class="gr-add-label">Agregar otra rutina al plan</div>
            <div class="gr-add-row">
              <input class="form-input gr-add-input" v-model="addPrompt"
                placeholder="Ej: Agrega una rutina de piernas"
                @keydown.enter="agregarAlPlan" />
              <button class="gr-add-btn" :disabled="!addPrompt.trim() || addingRutina"
                @click="agregarAlPlan">
                <span v-if="addingRutina" class="gr-add-spinner"></span>
                <span v-else>＋</span>
              </button>
            </div>
          </div>

          <!-- Guardar como plan -->
          <div class="gr-add-section" style="margin-top:8px">
            <div class="gr-add-label">Nombre del plan (opcional)</div>
            <input class="form-input gr-add-input" style="width:100%;margin:0"
              v-model="planNombre"
              placeholder="Ej: Plan Doomsday — se agrupan todas las rutinas" />
          </div>

          <button class="btn btn-outline btn-sm" style="width:100%;margin-top:8px" @click="step = 1">
            ← Empezar de nuevo
          </button>
        </template>
      </template>

    </div>

    <div class="modal-footer" v-if="step === 1">
      <button class="btn btn-accent btn-full"
        :disabled="modoAvanzado ? !prompt.trim() : !objetivoSeleccionado"
        @click="handleGenerar">
        Generar rutina
      </button>
    </div>
    <div class="modal-footer" v-else-if="step === 3 && !error">
      <button class="btn btn-accent btn-full" @click="guardarTodas">
        {{ planNombre.trim() ? `Guardar como "${planNombre.trim()}"` : 'Guardar todas' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick } from 'vue'
import { useStore, EQUIPO_MAP, MUSCLE_LABELS } from '../store/index.js'
import { callClaude, checkClaudeError } from '../utils/claude.js'
import { actualizarMemoria } from '../utils/memoria.js'

const store = useStore()

// checkGroqError replaced by checkClaudeError from utils/claude.js

function groqErrorMsg(err) {
  if (err.message?.startsWith('límite_tokens:')) {
    return '⏳ Límite diario de tokens alcanzado.' + err.message.slice('límite_tokens:'.length)
  }
  return 'No pude generar las rutinas. Intenta de nuevo o simplifica tu solicitud.'
}

const step             = ref(1)
const prompt           = ref('')
const error            = ref('')
const rutinasGeneradas = ref([])
const previewOpen      = reactive({})
const chatScrollRefs   = reactive({})
const chatInputRefs    = reactive({})
const addPrompt        = ref('')
const addingRutina     = ref(false)
const planNombre       = ref('')

// Step 1 state
const objetivoSeleccionado = ref(null)
const diasSeleccionados    = ref(3)
const modoAvanzado         = ref(false)

const VALID_MUSCLES = ['chest','obliques','abs','biceps','triceps','front-deltoids',
  'abductors','quadriceps','calves','forearm','trapezius','upper-back','lower-back',
  'back-deltoids','gluteal','adductor','hamstring','left-soleus']

const EQUIPO_LABELS_ES = { kb: 'kettlebell', sb: 'sandbag', bb: 'barra', db: 'mancuerna', bw: 'peso corporal', band: 'bandas de resistencia', trx: 'TRX' }

const OBJETIVOS = [
  {
    id: 'carga',
    nombre: 'Mula de Carga',
    sub: 'Fuerza total',
    desc: 'Los números más altos en los movimientos base',
    instrucciones: 'Programa de fuerza con rangos de 4-6 reps en sentadilla, peso muerto y press. Progresión lineal como prioridad absoluta. Pocos ejercicios de aislamiento.',
  },
  {
    id: 'petacona',
    nombre: 'Mula Petacona',
    sub: 'Piernas y glúteos',
    desc: 'Fuerza y volumen de tren inferior',
    instrucciones: 'Sentadilla, hip thrust, peso muerto y variantes como movimientos principales. Volumen alto de tren inferior. Tren superior como complemento de mantenimiento.',
  },
  {
    id: 'agil',
    nombre: 'Mula Ágil',
    sub: 'Cuerpo atlético funcional',
    desc: 'Fuerte, móvil, no torpe',
    instrucciones: 'Movimientos compuestos funcionales. Balance push/pull/legs. Énfasis en fuerza y movilidad. Kettlebell y barra como base preferida.',
  },
  {
    id: 'imponente',
    nombre: 'Mula Imponente',
    sub: 'Tren superior potente',
    desc: 'Espalda ancha, hombros y brazos',
    instrucciones: 'Volumen alto en press, jale vertical y horizontal. Trabajo específico de hombros y brazos. Pierna como mantenimiento.',
  },
  {
    id: 'fina',
    nombre: 'Mula Fina',
    sub: 'Definición y recomposición',
    desc: 'Menos grasa, mismo músculo',
    instrucciones: 'Movimientos compuestos con rangos de hipertrofia de 10-15 reps. Densidad de entrenamiento alta. Descansos cortos. Sin volumen excesivo de aislamiento.',
  },
]

function buildPromptDesdeObjetivo() {
  const obj = OBJETIVOS.find(o => o.id === objetivoSeleccionado.value)
  if (!obj) return ''
  return `${diasSeleccionados.value} rutinas para la semana. Objetivo: ${obj.nombre} — ${obj.desc}.`
}

function getReglasObjetivo(id) {
  const reglas = {
    carga: `REGLAS DEL OBJETIVO — FUERZA TOTAL:
- Separar tren superior e inferior: nunca mezclar patrones de sentadilla o bisagra de cadera con press horizontal o jale horizontal en el mismo día
- Rangos de fuerza estrictos: 3-5 reps en el movimiento principal, hasta 6 en complementos — sin excepciones
- Máximo 1 ejercicio de aislamiento por día; el resto deben ser compuestos multiarticulares
- Cada día debe tener un movimiento principal claro como núcleo de la sesión: sentadilla, peso muerto o press — todo lo demás gira alrededor de él
- Si el usuario tiene equipo para cargar un patrón de movimiento, NUNCA usar la versión de peso corporal`,

    petacona: `REGLAS DEL OBJETIVO — PIERNAS Y GLÚTEOS:
- Máximo 2 días de tren inferior por semana independientemente de los días seleccionados; los días restantes son tren superior (no mezclar en el mismo día)
- Cada día de pierna debe incluir obligatoriamente: un patrón de sentadilla + un patrón de extensión de cadera (hip thrust o puente) + un patrón de bisagra — variar la combinación entre los días para no repetir patrones idénticos
- Rangos: 8-12 reps en compuestos, 12-15 reps en aislamiento
- Si el usuario tiene equipo para agregar carga a un ejercicio de pierna, SIEMPRE usar la versión cargada — nunca peso corporal cuando hay alternativa con carga disponible`,

    agil: `REGLAS DEL OBJETIVO — CUERPO ATLÉTICO FUNCIONAL:
- Cada día debe incluir exactamente: un patrón de empuje + un patrón de jale + un patrón de bisagra o sentadilla — sin excepciones
- Priorizar movimientos multiarticulares que activen cadenas completas y requieran estabilización de core; minimizar ejercicios de aislamiento
- Nombres de rutinas: descriptivos del contenido de la sesión — NUNCA "Rutina 1", "Día 1" o nombres genéricos; usar nombres como "Empuje y Bisagra", "Jale y Sentadilla", "Fuerza Total A"
- Rangos: 8-12 reps en compuestos principales, 10-15 en complementarios`,

    imponente: `REGLAS DEL OBJETIVO — TREN SUPERIOR POTENTE:
- Máximo 1 ejercicio de tríceps aislado por día; el volumen adicional de tríceps viene de los movimientos de press
- Máximo 1 ejercicio de bíceps aislado por día
- Priorizar elevaciones laterales sobre elevaciones frontales para generar ancho de hombro
- Incluir siempre al menos un ejercicio de hombro posterior o rotador externo por sesión de tren superior (face pull, remo al mentón, pájaro, rotación externa) para balance articular
- Días de tren inferior: mantenimiento únicamente — máximo 3 ejercicios de pierna, rangos de 10-12 reps, sin énfasis en fuerza ni volumen`,

    fina: `REGLAS DEL OBJETIVO — DEFINICIÓN Y RECOMPOSICIÓN:
- Priorizar variantes metabólicas de los patrones clásicos según el equipo disponible del usuario: peso muerto rumano sobre convencional, sentadilla goblet sobre trasera, clean and press sobre press aislado, remo con pausa sobre remo estricto
- Incluir en el campo "desc" de cada rutina: "Descanso: 45-60 seg entre series"
- Incluir al menos un par de ejercicios en superset por día — marcarlos en el nombre del ejercicio como "(A1)" y "(A2)" respectivamente
- Rangos obligatorios: 12-15 reps en todos los ejercicios — NUNCA bajar de 10
- Evitar los movimientos principales pesados de fuerza (sentadilla trasera, peso muerto convencional cargado al máximo, press pesado); buscar variantes que generen más demanda metabólica y tiempo bajo tensión`,
  }
  return reglas[id] || ''
}

function handleGenerar() {
  if (!store.geminiKey) return
  if (!modoAvanzado.value) {
    if (!objetivoSeleccionado.value) return
    prompt.value = buildPromptDesdeObjetivo()
  }
  generar()
}

async function extraerMemoriaDeChats() {
  const turns = rutinasGeneradas.value.flatMap(r =>
    (r._messages || []).filter(m => m.role === 'user' || m.role === 'assistant')
  )
  if (!turns.length) return
  const dialogo = turns.map(m => `${m.role === 'user' ? 'Atleta' : 'Entrenador'}: ${m.content}`).join('\n')
  await actualizarMemoria(store, dialogo)
}

function cerrar() {
  extraerMemoriaDeChats()
  store.generarRutinaModalVisible = false
  planNombre.value = ''
}

// ── Helper: equipo context para prompts ───────────────────────
function buildEquipoContext() {
  const customs = store.equipoCustom || []
  const stdLabels    = store.equipoPreferido.map(e => EQUIPO_LABELS_ES[e] || e)
  const customLabels = customs.map(e => e.label)
  const lista        = [...stdLabels, ...customLabels].join(', ') || 'kettlebell y sandbag'

  // Dynamic enum includes custom IDs so the AI can reference them
  const customIds  = customs.map(e => e.id).join('|')
  const equipoEnum = `kb|sb|bb|db|bw|band|trx${customIds ? '|' + customIds : ''}|`

  // Mapping: IDs go in the "equipo" JSON field only — exercise names always use the readable label
  const customMap = customs.length
    ? `\nEquipo personalizado (el ID va SOLO en el campo JSON "equipo", NUNCA en el nombre del ejercicio): ${customs.map(e => `${e.id} = "${e.label}"`).join(', ')}`
    : ''

  return { lista, equipoEnum, customMap }
}

// ── Generar plan inicial ───────────────────────────────────────
function buildPlanPrompt() {
  const genero  = store.genero || null
  const peso    = store.peso   ? `${store.peso} kg`   : null
  const altura  = store.altura ? `${store.altura} cm` : null
  const { lista, equipoEnum, customMap } = buildEquipoContext()
  const memoria = store.memoriaEntrenador

  const perfil = [
    genero  ? `- Género: ${genero}` : null,
    (peso || altura) ? `- Físico: ${[peso, altura].filter(Boolean).join(', ')}` : null,
    `- Equipo disponible: ${lista}${customMap}`,
    memoria ? `- Notas del atleta:\n${memoria}` : null,
  ].filter(Boolean).join('\n')

  const reglasObjetivo = !modoAvanzado.value && objetivoSeleccionado.value
    ? '\n\n' + getReglasObjetivo(objetivoSeleccionado.value)
    : ''

  return `Eres un entrenador que conoce bien a este atleta — directo, sin rodeos, sin suavizar problemas reales. No como un asistente corporativo.

PERFIL DEL ATLETA:
${perfil}

SOLICITUD:
${prompt.value.trim()}${reglasObjetivo}

Responde SOLO con este JSON (sin markdown, sin texto extra):
{"rutinas":[{"nombre":"string","desc":"string","ejercicios":[{"nombre":"string","series":3,"reps":"string","equipo":"${equipoEnum}","tipoMedida":"reps|time|dist","descansoRecomendado":90}]}]}

REGLAS GLOBALES (aplican siempre):
- Mínimo 4 ejercicios, máximo 7 por rutina
- EQUIPO: elegir el implemento correcto para cada patrón de movimiento basándose exclusivamente en el equipo disponible del perfil. NUNCA sugerir un implemento que el usuario no tiene. Si hay múltiples opciones para un patrón, elegir la más adecuada para el objetivo
- Si el usuario tiene equipo para cargar un patrón, NUNCA usar la versión de peso corporal cuando existe una alternativa con carga disponible
- Nunca generar rutinas de "descanso" o "día libre" — solo generar los días de entrenamiento reales
- El campo "nombre" del ejercicio usa SIEMPRE el nombre legible del implemento (ej: "Hip thrust con landmine") — NUNCA incluir IDs de equipo (cx_..., kb, sb, etc.) en el nombre del ejercicio
- El campo "equipo" del JSON usa el código ID correspondiente (kb, bb, cx_..., etc.) — ese es el único lugar donde van los IDs
- PRIORIDAD: si la SOLICITUD menciona equipo específico, úsalo aunque no esté en el perfil
- tipoMedida: "time" para isométricos/planchas, "dist" para carries, "reps" para todo lo demás
- descansoRecomendado: 60-90 para fuerza, 30-60 para metcon
- Respeta lesiones o limitaciones del perfil
- Advertencia ⚠️ en "desc": SOLO si hay algo específicamente problemático para este usuario — lesión conocida incompatible con un ejercicio, volumen excesivo real o equipo incompatible. Si no hay nada concreto, no generar advertencia
- Prohibido en cualquier campo de texto: "¡Claro!", "¡Por supuesto!", "Recuerda que", "Asegúrate de", "Es importante que", "No olvides que", "¡Excelente!", "¡Perfecto!"
- Solo el JSON, nada más`
}

async function generar() {
  if (!prompt.value.trim() || !store.geminiKey) return
  step.value  = 2
  error.value = ''
  rutinasGeneradas.value = []

  try {
    let raw = (await callClaude(store.geminiKey, {
      messages: [{ role: 'user', content: buildPlanPrompt() }],
      max_tokens: 4000,
    })).replace(/```json?|```/g, '').trim()
    const sanitized = raw.replace(/("(?:[^"\\]|\\[\s\S])*")/g, s =>
      s.replace(/\n/g, '\\n').replace(/\r/g, '').replace(/\t/g, ' '))
    const json = JSON.parse(sanitized)
    if (!Array.isArray(json.rutinas) || json.rutinas.length === 0) throw new Error('Sin rutinas')

    rutinasGeneradas.value = json.rutinas.map(r => ({
      ...r,
      _guardada: false,
      _chatOpen: false,
      _messages: [],
      _chatLoading: false,
      ejercicios: (r.ejercicios || []).map(e => ({
        ...e,
        musculos_p: [],
        musculos_s: [],
        musculos_t: [],
      })),
    }))
    previewOpen[0] = true

  } catch (err) {
    error.value = groqErrorMsg(err)
    console.error('GenerarRutina error:', err)
  }
  step.value = 3
}

// ── Chat de ajuste por rutina ──────────────────────────────────
function planResumen() {
  return rutinasGeneradas.value.map((r, i) =>
    `${r.nombre}: ${r.ejercicios.map(e => `${e.nombre} [${[...(e.musculos_p||[]), ...(e.musculos_s||[])].map(m => MUSCLE_LABELS[m]||m).join(', ')}]`).join(' | ')}`
  ).join('\n')
}

function buildChatSystemPrompt(rutinaIdx) {
  const r      = rutinasGeneradas.value[rutinaIdx]
  const genero = store.genero || null
  const peso   = store.peso   ? `${store.peso} kg`   : null
  const altura = store.altura ? `${store.altura} cm` : null
  const equipo = store.equipoPreferido.length
    ? store.equipoPreferido.map(e => EQUIPO_LABELS_ES[e] || e).join(', ')
    : 'kettlebell y sandbag'
  const memoria = store.memoriaEntrenador

  return `Eres el entrenador personal de este atleta. Llevan tiempo trabajando juntos — hablas directo, sin rodeos, sin suavizar problemas reales. No como un asistente corporativo.

SOLICITUD ORIGINAL DEL ATLETA (por qué se generó este plan):
"${prompt.value.trim()}"

PLAN COMPLETO DE LA SEMANA:
${planResumen()}

RUTINA QUE ESTÁ AJUSTANDO AHORA: ${r.nombre}
Ejercicios actuales: ${r.ejercicios.map(e => e.nombre).join(', ')}

PERFIL DEL ATLETA:
${[genero?`Género: ${genero}`:null, (peso||altura)?[peso,altura].filter(Boolean).join(', '):null, `Equipo: ${equipo}`, memoria?`Notas: ${memoria}`:null].filter(Boolean).join(' | ')}

Responde SOLO con este JSON (sin markdown, sin texto extra):
{"respuesta":"string","acciones":[]}

Formato de cada objeto en "acciones":
- Para agregar: {"tipo":"agregar","rutina_idx":${rutinaIdx},"ejercicio":{"nombre":"string","series":3,"reps":"string","equipo":"kb","tipoMedida":"reps","descansoRecomendado":90}}
- Para quitar: {"tipo":"quitar","rutina_idx":${rutinaIdx},"ejercicio_nombre":"nombre exacto del ejercicio"}

Reglas:
- Si el atleta hace una pregunta técnica ("¿puedo usar X?", "¿tiene sentido agregar Y?", "¿es mejor A o B?"), respóndela primero en "respuesta" y luego pregunta si quiere aplicar el cambio. No hagas cambios hasta que confirme.
- Si el atleta pide un cambio subóptimo para su perfil (equipo que no tiene, movimiento contraindicado, exceso de volumen), dilo brevemente en "respuesta" antes de aplicarlo — no después.
- Si el atleta pide 2 o más ejercicios, incluye uno por objeto en el array "acciones"
- Si el atleta pide agregar algo que ya trabaja los mismos músculos en OTRO día del plan, adviértelo en "respuesta" antes de proceder
- Si el atleta dice "sí", "dale", "ok" o confirma una propuesta tuya, incluye las acciones directamente
- Nunca valides algo incorrecto por quedar bien. La intención original del plan fue: "${prompt.value.trim()}" — úsala para juzgar si un cambio tiene sentido.
- Si el atleta menciona lesiones, molestias o preferencias en esta conversación, úsalo en respuestas posteriores sin que tenga que repetirlo.
- "respuesta" en máximo 3 oraciones — casual y directo
- Prohibido en "respuesta": "¡Claro!", "¡Por supuesto!", "Recuerda que", "Asegúrate de", "Es importante que", "No olvides que", "¡Excelente!", "¡Perfecto!"
- Si no propones ningún cambio concreto, pon acciones: []`
}

async function enviarMensaje(rutinaIdx) {
  const r   = rutinasGeneradas.value[rutinaIdx]
  const el  = chatInputRefs[rutinaIdx]
  const txt = el?.value?.trim()
  if (!txt || r._chatLoading) return

  r._messages.push({ role: 'user', content: txt, accion: null })
  el.value = ''
  r._chatLoading = true
  await scrollChat(rutinaIdx)

  const history = r._messages.slice(-10).map(m => ({ role: m.role, content: m.content }))

  try {
    let raw = (await callClaude(store.geminiKey, {
      system: buildChatSystemPrompt(rutinaIdx),
      messages: history,
      max_tokens: 500,
    })).replace(/```json?|```/g, '').trim()
    const sanitized = raw.replace(/("(?:[^"\\]|\\[\s\S])*")/g, s =>
      s.replace(/\n/g, '\\n').replace(/\r/g, '').replace(/\t/g, ' '))

    let respuesta = 'No pude responder, intenta de nuevo.'
    let acciones = []
    try {
      const json = JSON.parse(sanitized)
      respuesta = json.respuesta || respuesta
      acciones = (json.acciones || []).filter(a => a?.tipo)
    } catch {
      respuesta = raw
    }

    r._messages.push({ role: 'assistant', content: respuesta, acciones })
  } catch (err) {
    r._messages.push({ role: 'assistant', content: err.message || 'Error de conexión. Revisa tu API key de Groq.', accion: null })
  }

  r._chatLoading = false
  await scrollChat(rutinaIdx)
}

function aplicarCambios(rutinaIdx, acciones, msg) {
  acciones.forEach(accion => {
    const targetIdx = accion.rutina_idx ?? rutinaIdx
    const target    = rutinasGeneradas.value[targetIdx]
    if (!target) return

    if (accion.tipo === 'agregar' && accion.ejercicio) {
      target.ejercicios.push({ ...accion.ejercicio, musculos_p: [], musculos_s: [], musculos_t: [] })
    } else if (accion.tipo === 'quitar' && accion.ejercicio_nombre) {
      target.ejercicios = target.ejercicios.filter(e =>
        e.nombre.toLowerCase() !== accion.ejercicio_nombre.toLowerCase())
    }
    target.desc = `${target.ejercicios.length} ejercicios`
  })
  msg._aplicado = true
}

async function scrollChat(ri) {
  await nextTick()
  const el = chatScrollRefs[ri]
  if (el) el.scrollTop = el.scrollHeight
}

// ── Agregar rutina al plan existente ──────────────────────────
async function agregarAlPlan() {
  if (!addPrompt.value.trim() || addingRutina.value || !store.geminiKey) return
  addingRutina.value = true

  const genero  = store.genero || null
  const { lista: equipo, equipoEnum, customMap } = buildEquipoContext()
  const memoria = store.memoriaEntrenador

  const perfil = [
    genero ? `Género: ${genero}` : null,
    store.peso || store.altura ? [store.peso ? store.peso+' kg':null, store.altura ? store.altura+' cm':null].filter(Boolean).join(', ') : null,
    `Equipo: ${equipo}${customMap}`,
    memoria ? `Notas: ${memoria}` : null,
  ].filter(Boolean).join(' | ')

  const planActual = planResumen()

  const prompt_ia = `Eres un entrenador experto. El atleta ya tiene este plan generado y quiere agregar una rutina más.

PLAN ACTUAL:
${planActual}

PERFIL: ${perfil}

SOLICITUD: ${addPrompt.value.trim()}

Diseña UNA sola rutina nueva que complemente el plan sin repetir los mismos grupos musculares.
Responde SOLO con este JSON (sin markdown, sin texto extra):
{"nombre":"string","desc":"string","ejercicios":[{"nombre":"string","series":3,"reps":"string","equipo":"${equipoEnum}","tipoMedida":"reps|time|dist","descansoRecomendado":90}]}

Reglas: mínimo 4 ejercicios, máximo 7. PRIORIDAD: si la SOLICITUD menciona equipo específico, úsalo aunque no esté en el perfil. Solo el JSON, nada más.`

  try {
    let raw = (await callClaude(store.geminiKey, {
      messages: [{ role: 'user', content: prompt_ia }],
      max_tokens: 1500,
    })).replace(/```json?|```/g, '').trim()
    const sanitized = raw.replace(/("(?:[^"\\]|\\[\s\S])*")/g, s =>
      s.replace(/\n/g, '\\n').replace(/\r/g, '').replace(/\t/g, ' '))
    const json = JSON.parse(sanitized)
    if (!json.nombre || !json.ejercicios) throw new Error('Respuesta inválida')

    const nueva = {
      ...json,
      _guardada: false,
      _chatOpen: false,
      _messages: [],
      _chatLoading: false,
      ejercicios: (json.ejercicios || []).map(e => ({
        ...e,
        musculos_p: [],
        musculos_s: [],
        musculos_t: [],
      })),
    }

    const newIdx = rutinasGeneradas.value.length
    rutinasGeneradas.value.push(nueva)
    previewOpen[newIdx] = true
    addPrompt.value = ''

    await nextTick()
    // Scroll to new routine
    const lastCard = document.querySelector('.gr-rutina-card:last-child')
    lastCard?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  } catch (err) {
    store.showToast('No pude generar la rutina. Intenta de nuevo.')
    console.error('agregarAlPlan error:', err)
  }

  addingRutina.value = false
}

// ── Guardar ────────────────────────────────────────────────────
function toRutinaEjercicios(r) {
  return r.ejercicios.map(e => ({
    id: 'e' + Date.now() + Math.random(),
    nombre: e.nombre,
    series: parseInt(e.series) || 3,
    reps: e.reps || '10',
    equipo: e.equipo || '',
    tipoMedida: e.tipoMedida || 'reps',
    descansoRecomendado: parseInt(e.descansoRecomendado) || 90,
    notas: { respiracion: '', forma: '', tips: '', progresion: '' },
    musculos: [],
  }))
}

function guardarRutina(ri) {
  const r = rutinasGeneradas.value[ri]
  const ejercicios = toRutinaEjercicios(r)
  const muscles = [...new Set(ejercicios.flatMap(e => e.musculos.map(m => m.muscle)))]
  const autoDesc = muscles.slice(0, 4).map(m => MUSCLE_LABELS[m] || m).join(' · ')
  store.guardarRutina(r.nombre, autoDesc || r.desc, ejercicios)
  store.rutinaModalVisible = false
  r._guardada = true
  if (store.geminiKey) generarNotasBackground(r.nombre, r.ejercicios)
}

function guardarTodas() {
  const nombre = planNombre.value.trim()
  if (nombre) {
    const planId = store.crearPlan(nombre)
    let seq = 0
    rutinasGeneradas.value.forEach(r => {
      if (!r._guardada) {
        const ejercicios = toRutinaEjercicios(r)
        store.rutinas.push({ id: `r${Date.now()}_${seq++}`, nombre: r.nombre, desc: r.desc, ejercicios, planId })
        r._guardada = true
        if (store.geminiKey) generarNotasBackground(r.nombre, r.ejercicios)
      } else {
        // Already saved individually – move to plan
        const saved = store.rutinas.slice().reverse().find(rt => rt.nombre === r.nombre)
        if (saved) store.moverRutinaAPlan(saved.id, planId)
      }
    })
    store.save()
    store.showToast(`Plan "${nombre}" guardado ✓`)
  } else {
    rutinasGeneradas.value.forEach((_, i) => {
      if (!rutinasGeneradas.value[i]._guardada) guardarRutina(i)
    })
  }
  cerrar()
}

// ── Notas en background ────────────────────────────────────────
async function generarNotasBackground(rutinaName, ejercicios) {
  const key = store.geminiKey
  if (!key || !ejercicios.length) return

  const EQUIPO_EN = { kb:'kettlebell', sb:'sandbag', bb:'barbell', db:'dumbbell', bw:'bodyweight', band:'resistance band', trx:'TRX' }
  const genero = store.genero || null

  const lista = ejercicios.map(e =>
    `- ${e.nombre}${EQUIPO_EN[e.equipo] ? ` (${EQUIPO_EN[e.equipo]})` : ''}`
  ).join('\n')

  const prompt = `You are a strength coach. For each exercise, generate muscles worked and training cues in Spanish (casual friendly tone, no "recuerda", no "asegúrate").${genero ? ` User is ${genero}.` : ''}

Exercises:
${lista}

Valid muscle IDs: ${VALID_MUSCLES.join(', ')}
Primary = >60% MVC, secondary = 30-60%, tertiary = <30%.

Respond ONLY with a JSON array (no markdown, no extra text):
[{"nombre":"exact name as given","musculos_p":["muscle"],"musculos_s":["muscle"],"musculos_t":[],"respiracion":"one sentence when to inhale/exhale","forma":"2 sentences key technique points","tips":"1 sentence if they don't feel the target muscle","progresion":"1-2 sentences golden rule: when to add reps vs weight and by how much"}]`

  try {
    let raw = (await callClaude(key, {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
    })).replace(/```json?|```/g, '').trim()
    const sanitized = raw.replace(/("(?:[^"\\]|\\[\s\S])*")/g, s =>
      s.replace(/\n/g, '\\n').replace(/\r/g, '').replace(/\t/g, ' '))
    const resultados = JSON.parse(sanitized)

    const rutina = store.rutinas.slice().reverse().find(r => r.nombre === rutinaName)
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
    store.showToast(`✓ Músculos y notas generados para "${rutinaName}"`)
  } catch (err) {
    console.error('generarNotas error:', err)
  }
}
</script>

<style scoped>
.gr-profile-chips { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:16px; }
.gr-chip {
  background: rgba(232,240,58,0.08);
  border: 1px solid rgba(232,240,58,0.3);
  color: var(--accent);
  font-size: 11px; font-weight:600;
  padding: 4px 10px; border-radius:20px; text-transform:capitalize;
}
.gr-chip--warn { background:rgba(255,153,0,0.08); border-color:rgba(255,153,0,0.3); color:#ff9900; }

.gr-prompt-input { resize:none; font-size:14px; line-height:1.6; min-height:100px; }

/* Objetivo cards */
.gr-objetivo-card {
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 12px 14px;
  cursor: pointer;
  margin-bottom: 8px;
  transition: border-color 0.15s, background 0.15s;
}
.gr-objetivo-card:active { border-color: var(--accent); }
.gr-objetivo-card--active {
  border-color: var(--accent);
  background: rgba(232,240,58,0.06);
}
.gr-objetivo-nombre {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 17px;
  color: var(--text1);
  letter-spacing: 0.04em;
  line-height: 1;
}
.gr-objetivo-sub {
  font-size: 11px;
  color: var(--accent);
  font-weight: 600;
}
.gr-objetivo-desc {
  font-size: 12px;
  color: var(--text3);
  margin-top: 5px;
}

/* Días */
.gr-dias-btns { display: flex; gap: 8px; }
.gr-dias-btn {
  flex: 1;
  height: 44px;
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text3);
  font-family: 'Bebas Neue', sans-serif;
  font-size: 22px;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}
.gr-dias-btn.active {
  border-color: var(--accent);
  color: var(--accent);
  background: rgba(232,240,58,0.06);
}

/* Modo avanzado toggle */
.gr-avanzado-toggle {
  background: none;
  border: none;
  color: var(--text3);
  font-size: 12px;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
  text-underline-offset: 3px;
  display: block;
  margin-bottom: 16px;
}

.gr-loading { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:60px 20px; gap:16px; }
.gr-loading-spinner { width:40px; height:40px; border:3px solid var(--border); border-top-color:var(--accent); border-radius:50%; animation:gr-spin 0.8s linear infinite; }
@keyframes gr-spin { to { transform:rotate(360deg); } }
.gr-loading-text { font-family:'Bebas Neue',sans-serif; font-size:20px; color:var(--text1); letter-spacing:0.05em; }
.gr-loading-sub { font-size:12px; color:var(--text3); }

.gr-error { background:rgba(255,68,68,0.08); border:1px solid rgba(255,68,68,0.3); border-radius:var(--radius-sm); color:#ff6666; font-size:13px; padding:14px; text-align:center; line-height:1.5; }

.gr-rutina-card { background:var(--bg3); border:1px solid var(--border); border-radius:var(--radius-sm); margin-bottom:10px; overflow:hidden; }
.gr-rutina-header { display:flex; justify-content:space-between; align-items:center; padding:12px 14px; cursor:pointer; gap:8px; }
.gr-rutina-nombre { font-family:'Bebas Neue',sans-serif; font-size:16px; color:var(--text1); letter-spacing:0.04em; }
.gr-rutina-desc { font-size:11px; color:var(--text3); margin-top:2px; }
.gr-chevron { color:var(--text3); font-size:20px; transition:transform 0.2s; line-height:1; }

.gr-chat-toggle-btn {
  background:none; border:1px solid var(--border); border-radius:8px;
  font-size:14px; width:30px; height:30px; cursor:pointer;
  display:flex; align-items:center; justify-content:center;
  transition: border-color 0.15s;
}
.gr-chat-toggle-btn.active { border-color:var(--accent); background:rgba(232,240,58,0.08); }

.gr-ex-list { border-top:1px solid var(--border); }
.gr-ex-row { display:flex; align-items:flex-start; justify-content:space-between; padding:9px 14px; border-bottom:1px solid var(--border); gap:8px; }
.gr-ex-row:last-child { border-bottom:none; }
.gr-ex-nombre { font-size:13px; font-weight:500; color:var(--text1); }
.gr-ex-sets { font-family:'Bebas Neue',sans-serif; font-size:15px; font-weight:700; color:var(--accent); flex-shrink:0; letter-spacing:0.03em; }
.gr-muscle-tag { font-size:10px; padding:1px 7px; border-radius:20px; }
.gr-muscle-p { background:#ff4d4d18; color:#ff4d4d; border:1px solid #ff4d4d40; }
.gr-muscle-s { background:#ff990018; color:#ff9900; border:1px solid #ff990040; }

/* Chat panel */
.gr-chat-panel {
  border-top: 1px solid var(--border);
  background: var(--bg2);
  padding: 12px;
}
.gr-chat-label {
  font-size: 10px;
  color: var(--text3);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 10px;
  text-align: center;
}
.gr-chat-messages {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 260px;
  overflow-y: auto;
  margin-bottom: 10px;
}
.gr-msg { max-width: 88%; padding: 8px 11px; border-radius: 12px; font-size: 13px; line-height: 1.5; }
.gr-msg--user { align-self:flex-end; background:rgba(232,240,58,0.12); color:var(--text1); border-radius:12px 12px 3px 12px; }
.gr-msg--coach { align-self:flex-start; background:var(--bg3); color:var(--text1); border-radius:12px 12px 12px 3px; }
.gr-msg-text { white-space: pre-line; }

.gr-accion {
  margin-top: 8px;
  background: rgba(232,240,58,0.06);
  border: 1px solid rgba(232,240,58,0.2);
  border-radius: 8px;
  padding: 8px 10px;
}
.gr-accion-preview {
  font-size: 12px;
  color: var(--text2);
  margin-bottom: 6px;
  line-height: 1.4;
}
.gr-accion-otro { font-size: 11px; color: var(--text3); display:block; margin-top:2px; }
.gr-accion-btn {
  background: var(--accent);
  border: none;
  border-radius: 6px;
  color: #000;
  font-size: 12px;
  font-weight: 700;
  padding: 5px 12px;
  cursor: pointer;
  width: 100%;
}
.gr-accion-done { font-size:11px; color:#44cc88; margin-top:6px; }

.gr-dots span { animation: gr-blink 1.2s infinite; font-size:18px; }
.gr-dots span:nth-child(2) { animation-delay:0.2s; }
.gr-dots span:nth-child(3) { animation-delay:0.4s; }
@keyframes gr-blink { 0%,80%,100%{opacity:0} 40%{opacity:1} }

.gr-chat-input-row {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}
.gr-chat-input {
  flex: 1;
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: 10px;
  color: var(--text1);
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  padding: 8px 10px;
  resize: none;
  line-height: 1.4;
}
.gr-chat-send {
  background: var(--accent);
  border: none;
  border-radius: 10px;
  color: #000;
  font-size: 16px;
  font-weight: 700;
  width: 36px;
  height: 36px;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.gr-chat-send:disabled { opacity: 0.4; }

/* Add to plan */
.gr-add-section {
  margin-top: 12px;
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 12px;
}
.gr-add-label {
  font-size: 11px;
  color: var(--text3);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  margin-bottom: 8px;
}
.gr-add-row { display: flex; gap: 8px; align-items: center; }
.gr-add-input { flex: 1; margin: 0; font-size: 13px; }
.gr-add-btn {
  background: var(--accent);
  border: none;
  border-radius: var(--radius-sm);
  color: #000;
  font-size: 18px;
  font-weight: 700;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.gr-add-btn:disabled { opacity: 0.4; cursor: default; }
.gr-add-spinner {
  width: 16px; height: 16px;
  border: 2px solid rgba(0,0,0,0.3);
  border-top-color: #000;
  border-radius: 50%;
  animation: gr-spin 0.7s linear infinite;
}
</style>
