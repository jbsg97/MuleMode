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

const props = defineProps({ ex: Object })

const store      = useStore()
const open       = ref(false)
const messages   = ref([])
const loading    = ref(false)
const messagesEl = ref(null)
const inputEl    = ref(null)

function buildContext() {
  const equipo  = props.ex.equipo ? `con ${EQUIPO_MAP[props.ex.equipo]?.label || props.ex.equipo}` : ''
  const genero  = store.genero === 'hombre' ? 'hombre' : store.genero === 'mujer' ? 'mujer' : null
  const notas   = props.ex.notas && typeof props.ex.notas === 'object'
    ? [props.ex.notas.respiracion, props.ex.notas.forma, props.ex.notas.tips].filter(Boolean).join(' ')
    : (props.ex.notas || '')
  const memoria = store.memoriaEntrenador

  return `Eres el mejor amigo de este${genero === 'mujer' ? 'a' : ''} atleta${genero ? ` (${genero})` : ''} — alguien que lleva años entrenando y sabe mucho, pero que habla como un cuate, no como un entrenador de manual. Se conocen muy bien.${memoria ? `\n\nLo que ya sabes de esta persona:\n${memoria}` : ''}\n\nAhora está entrenando "${props.ex.nombre}" ${equipo} — ${props.ex.series?.length} series de ${props.ex.reps}.${notas ? ` Notas del ejercicio: ${notas}` : ''}

Cómo hablas: casual, directo, sin rodeos. Nada de "recuerda", "asegúrate", ni frases de libro. Si algo duele o puede ser lesión, lo dices claro sin asustar. Usa lo que ya sabes de esta persona para personalizar tus respuestas.

Formato: párrafos cortos con salto de línea entre ideas. Sin markdown, sin asteriscos, sin guiones. Máximo 4 párrafos.`
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
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${store.geminiKey}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: buildContext() }, ...history],
        temperature: 0.7,
        max_tokens: 300,
      }),
    })
    const data = await res.json()
    const reply = data?.choices?.[0]?.message?.content || 'No pude responder, intenta de nuevo.'
    messages.value.push({ role: 'assistant', content: reply })
    extraerMemoria(text, reply)
  } catch {
    messages.value.push({ role: 'assistant', content: 'Error de conexión. Revisa tu key de Groq.' })
  }

  loading.value = false
  await scrollDown()
}

async function scrollDown() {
  await nextTick()
  if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
}

async function extraerMemoria(userMsg, coachReply) {
  const key = store.geminiKey
  if (!key) return
  const memoriaActual = store.memoriaEntrenador
  const prompt = `Eres un asistente que extrae hechos relevantes sobre un atleta de una conversación con su entrenador.

Memoria actual:
${memoriaActual || '(ninguna aún)'}

Nueva conversación:
Atleta: ${userMsg}
Entrenador: ${coachReply}

Extrae ÚNICAMENTE hechos nuevos no presentes en la memoria: lesiones, molestias, puntos débiles, metas, equipo, nivel, preferencias. Si hay nueva info, devuelve solo las líneas nuevas como "- [hecho] (${new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })})". Si no hay nada nuevo, responde exactamente: NADA`

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0, max_tokens: 200,
      }),
    })
    const data = await res.json()
    const nuevos = (data?.choices?.[0]?.message?.content || '').trim()
    if (nuevos && nuevos !== 'NADA') {
      store.memoriaEntrenador = [memoriaActual, nuevos].filter(Boolean).join('\n')
      store.save()
    }
  } catch { /* silencioso */ }
}
</script>
