<template>
  <div class="coach-chat">
    <button class="coach-chat-toggle" @click="open = !open">
      {{ open ? '▲ Cerrar entrenador' : '🎙 Consultar al entrenador' }}
    </button>
    <div v-if="open">
      <div v-if="messages.length" class="chat-messages" ref="messagesEl">
        <div v-for="(msg, i) in messages" :key="i"
          :class="['chat-bubble', msg.role === 'user' ? 'chat-bubble--user' : 'chat-bubble--coach']">
          <div v-if="msg.role === 'assistant'" class="chat-bubble-label">Entrenador</div>
          {{ msg.content }}
        </div>
        <div v-if="loading" class="chat-bubble chat-bubble--coach chat-bubble--loading">
          <span class="chat-dots"><span>.</span><span>.</span><span>.</span></span>
        </div>
      </div>
      <div class="chat-input-row">
        <textarea class="chat-input" rows="2" ref="inputEl"
          placeholder="Ej: me duele la espalda, qué agarre uso, cómo activo más el glúteo..."
          @keydown.enter.prevent="send"></textarea>
        <button class="chat-send-btn" :disabled="loading" @click="send">↑</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { useStore, EQUIPO_MAP } from '../store/index.js'
import { callClaude } from '../utils/claude.js'
import { actualizarMemoria } from '../utils/memoria.js'

const props = defineProps({ ex: Object })

const store      = useStore()
const open       = ref(false)
const messages   = ref([])
const loading    = ref(false)
const messagesEl = ref(null)
const inputEl    = ref(null)

function buildContext() {
  const equipo  = props.ex.equipo ? (EQUIPO_MAP[props.ex.equipo]?.label || props.ex.equipo) : null
  const genero  = store.genero === 'hombre' ? 'hombre' : store.genero === 'mujer' ? 'mujer' : null
  const notas   = props.ex.notas && typeof props.ex.notas === 'object'
    ? [props.ex.notas.respiracion, props.ex.notas.forma, props.ex.notas.tips].filter(Boolean).join(' ')
    : (props.ex.notas || '')
  const memoria = store.memoriaEntrenador

  const perfil = [
    genero                        ? `Género: ${genero}`                                                                   : null,
    store.peso                    ? `Peso: ${store.peso} kg`                                                              : null,
    store.altura                  ? `Altura: ${store.altura} cm`                                                          : null,
    store.equipoPreferido?.length ? `Equipo: ${store.equipoPreferido.map(e => EQUIPO_MAP[e]?.label || e).join(', ')}`     : null,
  ].filter(Boolean).join(' · ')

  return `Eres el entrenador personal de este usuario. Llevas tiempo trabajando con él${genero === 'mujer' ? 'a' : ''}, conoces su historial y hablas como alguien de confianza — no como un asistente corporativo.
${perfil ? `\nPerfil: ${perfil}` : ''}${memoria ? `\nContexto del atleta:\n${memoria}` : ''}

Ejercicio actual: "${props.ex.nombre}"${equipo ? ` con ${equipo}` : ''} — ${props.ex.series} series de ${props.ex.reps}.${notas ? `\nNotas técnicas: ${notas}` : ''}

Reglas de respuesta:
- Directo y sin rodeos. Si algo no es óptimo o huele a lesión, lo dices sin suavizarlo.
- Nunca valides algo incorrecto por quedar bien. La honestidad vale más que la validación.
- Corto por defecto. Solo te extiendes cuando el tema realmente lo justifica.
- Sin listas a menos que sean imprescindibles. Párrafos cortos, máximo 3.
- Prohibido: "¡Claro!", "¡Por supuesto!", "Excelente pregunta", "Recuerda que", "Asegúrate de", "Es importante que".
- Trata al usuario como un adulto capaz de manejar información real sin versiones simplificadas.
- Si el usuario menciona lesiones, molestias, preferencias o historial en esta conversación, úsalo en respuestas posteriores sin que tenga que repetirlo.
- Sin markdown, sin asteriscos, sin guiones de lista.`
}

async function send() {
  const text = inputEl.value?.value?.trim()
  if (!text || loading.value) return

  messages.value.push({ role: 'user', content: text })
  inputEl.value.value = ''
  loading.value = true
  await scrollDown()

  const history = messages.value.slice(-8).map(m => ({ role: m.role, content: m.content }))

  try {
    const reply = await callClaude(store.geminiKey, {
      system: buildContext(),
      messages: history,
      max_tokens: 300,
    })
    messages.value.push({ role: 'assistant', content: reply || 'No pude responder, intenta de nuevo.' })
    extraerMemoria(text, reply)
  } catch {
    messages.value.push({ role: 'assistant', content: 'Error de conexión. Revisa tu API key de Groq.' })
  }

  loading.value = false
  await scrollDown()
}

async function scrollDown() {
  await nextTick()
  if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
}

async function extraerMemoria(userMsg, coachReply) {
  await actualizarMemoria(store, `Atleta: ${userMsg}\nEntrenador: ${coachReply}`)
}
</script>
