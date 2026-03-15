<template>
  <div style="padding:0 0 100px">
    <!-- Header -->
    <div class="workout-header">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <div class="workout-title">{{ store.workout?.rutinaName?.toUpperCase() }}</div>
          <div class="workout-timer">{{ store.wkTimerStr }}</div>
        </div>
        <button class="btn btn-outline btn-sm" @click="$emit('finish')">Terminar</button>
      </div>
    </div>

    <!-- Exercises -->
    <div v-if="store.workout">
      <div v-for="(ex, ei) in store.workout.ejercicios" :key="ei" class="exercise-block">
        <div class="ex-block-header" @click="toggleExBlock(ei)">
          <div>
            <div class="ex-block-name">
              {{ ex.nombre }}
              <span v-if="equipoMap[ex.equipo]" class="ex-tag" style="margin-left:6px"
                :style="{ background: equipoMap[ex.equipo].bg, color: equipoMap[ex.equipo].color }">
                {{ equipoMap[ex.equipo].label }}
              </span>
            </div>
            <div class="ex-block-detail">{{ ex.series.length }} series · {{ ex.reps }}</div>
          </div>
          <div style="display:flex;gap:6px;align-items:center;flex-shrink:0">
            <button v-if="ex.musculos && ex.musculos.length" class="ex-video-btn"
              @click.stop="showMap[ei] = !showMap[ei]">
              🧠 {{ showMap[ei] ? 'Ocultar' : 'Músculos' }}
            </button>
            <button class="ex-video-btn" @click.stop="store.abrirVideo(ex.id, ex.nombre)">▶ Video</button>
          </div>
        </div>

        <div v-if="!collapsed[ei]">
          <table class="series-table">
            <tr>
              <th>Serie</th>
              <th>{{ ex.equipo === 'band' ? 'Color' : 'Kg' }}</th>
              <th>{{ ex.tipoMedida === 'time' ? 'Seg' : ex.tipoMedida === 'dist' ? 'Metros' : 'Reps' }}</th>
              <th>✓</th>
            </tr>
            <tr v-for="(s, si) in ex.series" :key="si" :id="`serie-row-${ei}-${si}`">
              <td style="color:var(--text2);font-size:13px">{{ s.idx }}</td>
              <td>
                <input v-if="ex.equipo === 'band'"
                  class="series-input" type="text" placeholder="Color"
                  :value="s.peso"
                  @input="store.updateSerie(ei, si, 'peso', $event.target.value)"
                  style="width:64px">
                <input v-else
                  class="series-input" type="number"
                  :placeholder="store.getLastPeso(ex.nombre, si) ? store.getLastPeso(ex.nombre, si) + 'kg' : '—'"
                  :value="s.peso"
                  @input="store.updateSerie(ei, si, 'peso', $event.target.value)"
                  min="0" step="0.5">
              </td>
              <td>
                <input class="series-input"
                  :type="ex.tipoMedida === 'time' || ex.tipoMedida === 'dist' ? 'number' : 'text'"
                  :placeholder="ex.tipoMedida === 'time' ? 'seg' : ex.tipoMedida === 'dist' ? 'm' : s.reps"
                  :value="s.reps"
                  @input="store.updateSerie(ei, si, 'reps', $event.target.value)"
                  style="width:56px">
              </td>
              <td>
                <div class="series-check" :class="{ done: s.done }" @click="store.toggleSerie(ei, si)">✓</div>
              </td>
            </tr>
          </table>
          <button class="add-serie-btn" @click="store.addSerie(ei)">+ Serie extra</button>
          <MuscleMap v-if="showMap[ei]" :model-value="ex.musculos || []" readonly style="padding:8px 0" />

          <div v-if="ex.descansoRecomendado" class="ex-cues">
            <span>😴 {{ ex.descansoRecomendado }}s descanso</span>
          </div>
          <template v-if="ex.notas">
            <template v-if="typeof ex.notas === 'object'">
              <div v-if="ex.notas.respiracion" class="ex-cues">
                <div class="ex-cues-label">Respiración</div>
                {{ ex.notas.respiracion }}
              </div>
              <div v-if="ex.notas.forma" class="ex-cues">
                <div class="ex-cues-label">Forma correcta</div>
                {{ ex.notas.forma }}
              </div>
              <div v-if="ex.notas.tips" class="ex-cues">
                <div class="ex-cues-label">Si no lo sientes</div>
                {{ ex.notas.tips }}
              </div>
            </template>
            <div v-else class="ex-cues">{{ ex.notas }}</div>
          </template>

          <!-- Chat entrenador -->
          <div v-if="store.geminiKey" class="coach-chat">
            <button class="coach-chat-toggle" @click="toggleChat(ei)">
              {{ chats[ei]?.open ? '▲ Cerrar entrenador' : '🎙 Consultar al entrenador' }}
            </button>
            <div v-if="chats[ei]?.open">
              <div v-if="chats[ei].messages.length" class="chat-messages" :ref="el => chatRefs[ei] = el">
                <div v-for="(msg, mi) in chats[ei].messages" :key="mi"
                  :class="['chat-bubble', msg.role === 'user' ? 'chat-bubble--user' : 'chat-bubble--coach']">
                  <div v-if="msg.role === 'assistant'" class="chat-bubble-label">Entrenador</div>
                  {{ msg.content }}
                </div>
                <div v-if="chats[ei].loading" class="chat-bubble chat-bubble--coach chat-bubble--loading">
                  <span class="chat-dots"><span>.</span><span>.</span><span>.</span></span>
                </div>
              </div>
              <div class="chat-input-row">
                <textarea class="chat-input" rows="2"
                  v-model="chats[ei].input"
                  placeholder="Ej: me duele la espalda, qué agarre uso, cómo activo más el glúteo..."
                  @keydown.enter.prevent="sendMessage(ei, ex)"></textarea>
                <button class="chat-send-btn"
                  :disabled="!chats[ei].input.trim() || chats[ei].loading"
                  @click="sendMessage(ei, ex)">↑</button>
              </div>
            </div>
          </div>

          <textarea class="notes-area" placeholder="Notas del ejercicio..."
            :value="ex.notaSession || ''"
            @change="store.updateExNota(ei, $event.target.value)"></textarea>
        </div>
      </div>
    </div>

    <div style="padding:16px">
      <button class="btn btn-accent btn-full" @click="$emit('finish')">✓ Guardar entrenamiento</button>
    </div>
  </div>
</template>

<script setup>
import { reactive, nextTick } from 'vue'
import { useStore, EQUIPO_MAP } from '../store/index.js'
import MuscleMap from '../components/MuscleMap.vue'

defineEmits(['finish'])

const store     = useStore()
const equipoMap = EQUIPO_MAP
const collapsed = reactive({})
const showMap   = reactive({})
const chats     = reactive({})
const chatRefs  = reactive({})

function toggleExBlock(ei) {
  collapsed[ei] = !collapsed[ei]
}

function toggleChat(ei) {
  if (!chats[ei]) chats[ei] = { open: false, messages: [], input: '', loading: false }
  chats[ei].open = !chats[ei].open
}

function buildContext(ex) {
  const equipo = ex.equipo ? `con ${EQUIPO_MAP[ex.equipo]?.label || ex.equipo}` : ''
  const genero = store.genero === 'hombre' ? 'hombre' : store.genero === 'mujer' ? 'mujer' : null
  const notas  = ex.notas && typeof ex.notas === 'object'
    ? [ex.notas.respiracion, ex.notas.forma, ex.notas.tips].filter(Boolean).join(' ')
    : (ex.notas || '')
  return `Eres un entrenador personal con más de 15 años de experiencia. Conoces bien a este atleta${genero ? ` (${genero})` : ''} y tienes su confianza. Ahora mismo está en medio de su entrenamiento haciendo "${ex.nombre}" ${equipo} — ${ex.series?.length} series de ${ex.reps}.${notas ? ` Ya le diste estos cues antes: ${notas}` : ''}

Tu forma de hablar: directa, calmada, segura. Usas "tú". Nunca dices "recuerda" ni "asegúrate" ni frases de manual. Hablas como alguien que ha visto este problema mil veces y sabe exactamente qué decir. Si algo no tiene solución fácil o podría ser una lesión, lo dices con honestidad sin alarmarlo.

Formato: párrafos cortos separados por salto de línea. Sin markdown, sin asteriscos, sin guiones como listas. Máximo 4 párrafos.`
}

async function sendMessage(ei, ex) {
  if (!chats[ei]) chats[ei] = { open: true, messages: [], input: '', loading: false }
  const text = chats[ei].input.trim()
  if (!text || chats[ei].loading) return

  chats[ei].messages.push({ role: 'user', content: text })
  chats[ei].input   = ''
  chats[ei].loading = true
  await scrollChat(ei)

  const history = chats[ei].messages.slice(-8).map(m => ({ role: m.role, content: m.content }))

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${store.geminiKey}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: buildContext(ex) }, ...history],
        temperature: 0.7,
        max_tokens: 300,
      }),
    })
    const data = await res.json()
    const reply = data?.choices?.[0]?.message?.content || 'No pude responder, intenta de nuevo.'
    chats[ei].messages.push({ role: 'assistant', content: reply })
  } catch {
    chats[ei].messages.push({ role: 'assistant', content: 'Error de conexión. Revisa tu key de Groq.' })
  }

  chats[ei].loading = false
  await scrollChat(ei)
}

async function scrollChat(ei) {
  await nextTick()
  const el = chatRefs[ei]
  if (el) el.scrollTop = el.scrollHeight
}
</script>
