<template>
  <div class="modal" :class="{ show: store.rutinaModalVisible }">
    <div class="modal-header">
      <div class="modal-title">{{ store.editingRutinaId ? 'Editar rutina' : 'Nueva rutina' }}</div>
      <button class="modal-close" @click="store.rutinaModalVisible = false">✕</button>
    </div>

    <div style="padding:0 16px;overflow-y:auto;flex:1;padding-bottom:16px">
      <div class="form-group">
        <label class="form-label">Nombre de la rutina</label>
        <input class="form-input" v-model="nombre" placeholder="Ej: Día 1 — Empuje">
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div class="form-label" style="margin:0">Ejercicios</div>
        <button class="btn btn-outline btn-sm" @click="addExercise()">+ Agregar</button>
      </div>

      <div v-for="(ex, idx) in exercises" :key="ex._formId"
        style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;margin-bottom:10px">
          <div style="font-size:13px;font-weight:600;color:var(--text2)">Ejercicio {{ idx + 1 }}</div>
          <button @click="removeExercise(idx)"
            style="background:none;border:none;color:var(--red);font-size:16px;cursor:pointer">✕</button>
        </div>

        <div style="display:grid;grid-template-columns:1fr auto;gap:8px;align-items:end;margin-bottom:10px">
          <div class="form-group" style="margin:0">
            <label class="form-label">Nombre</label>
            <input class="form-input" v-model="ex.nombre" placeholder="Ej: KB swing">
          </div>
          <button v-if="store.geminiKey" type="button"
            :disabled="ex._generating || !ex.nombre.trim()"
            @click="generarConIA(ex)"
            style="height:40px;padding:0 12px;border-radius:var(--radius-sm);border:1px solid var(--accent);
                   background:transparent;color:var(--accent);font-size:12px;font-weight:600;cursor:pointer;
                   white-space:nowrap;opacity:1"
            :style="{ opacity: (ex._generating || !ex.nombre.trim()) ? '0.4' : '1' }">
            {{ ex._generating ? '⏳' : '🤖 IA' }}
          </button>
        </div>

        <div v-if="ex._iaDetected" style="font-size:11px;color:var(--accent);margin-bottom:8px">
          ✓ Músculos y notas generados por IA
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px">
          <div>
            <label class="form-label">Series</label>
            <input class="form-input" type="number" placeholder="4" v-model.number="ex.series">
          </div>
          <div>
            <label class="form-label">Reps</label>
            <input class="form-input" placeholder="10" v-model="ex.reps">
          </div>
          <div>
            <label class="form-label">Equipo</label>
            <select class="form-select" v-model="ex.equipo">
              <option v-for="[val, label] in EQUIPO_OPTIONS" :key="val" :value="val">{{ label }}</option>
            </select>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
          <div>
            <label class="form-label">Tipo de medida</label>
            <select class="form-select" v-model="ex.tipoMedida">
              <option value="reps">Repeticiones</option>
              <option value="time">Tiempo (seg)</option>
              <option value="dist">Distancia (m)</option>
            </select>
          </div>
          <div>
            <label class="form-label">Descanso entre series (seg)</label>
            <input class="form-input" type="number" min="10" max="600" step="5"
              v-model.number="ex.descansoRecomendado" placeholder="90">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">▶ Video tutorial</label>
          <div v-if="ex._busquedaVideo" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
            <a :href="ytUrl(ex._busquedaVideo)" target="_blank"
              style="display:flex;align-items:center;justify-content:center;gap:6px;padding:9px;
                     border-radius:var(--radius-sm);border:1px solid var(--border);
                     color:var(--text2);font-size:12px;font-weight:600;text-decoration:none">
              ▶ YouTube Shorts
            </a>
            <a :href="ttUrl(ex._busquedaVideo)" target="_blank"
              style="display:flex;align-items:center;justify-content:center;gap:6px;padding:9px;
                     border-radius:var(--radius-sm);border:1px solid var(--border);
                     color:var(--text2);font-size:12px;font-weight:600;text-decoration:none">
              ♪ TikTok
            </a>
          </div>
          <div v-else-if="store.geminiKey" style="font-size:11px;color:var(--text3);margin-bottom:6px">
            Usa el botón 🤖 IA para generar términos de búsqueda
          </div>
          <input class="form-input" type="url" placeholder="Pega la URL del video que encuentres (opcional)"
            v-model="ex.video" style="font-size:12px">
        </div>

        <div>
          <label class="form-label">📝 Notas / cues <span style="color:var(--text3);font-weight:400">(opcional)</span></label>
          <textarea class="form-input" v-model="ex.notas" rows="5"
            placeholder="Ej: 💨 Inhala al bajar, exhala al subir"
            style="resize:vertical;font-size:13px;line-height:1.6;white-space:pre-line"></textarea>
        </div>

        <div style="margin-top:10px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <label class="form-label" style="margin:0">🧠 Músculos trabajados
              <span style="color:var(--text3);font-weight:400"> (opcional)</span>
            </label>
            <button type="button" style="background:none;border:none;color:var(--text3);font-size:12px;cursor:pointer;padding:0"
              @click="ex._showMap = !ex._showMap">
              {{ ex._showMap ? 'Ocultar' : 'Mostrar' }}
            </button>
          </div>
          <MuscleMap v-if="ex._showMap" v-model="ex.musculos" />
        </div>
      </div>

    </div>

    <!-- Sticky footer -->
    <div class="modal-footer">
      <button class="btn btn-accent btn-full" @click="guardar">Guardar rutina</button>
      <button v-if="store.editingRutinaId" class="btn btn-danger btn-full" style="margin-top:8px" @click="eliminar">
        Eliminar rutina
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useStore, EQUIPO_OPTIONS, MUSCLE_LABELS } from '../store/index.js'
import MuscleMap from './MuscleMap.vue'

const VALID_MUSCLES = ['chest','obliques','abs','biceps','triceps','front-deltoids',
  'abductors','quadriceps','calves','forearm','trapezius','upper-back','lower-back',
  'back-deltoids','gluteal','adductor','hamstring','left-soleus']

const EQUIPO_LABELS = { kb: 'kettlebell', sb: 'sandbag', bb: 'barbell', db: 'dumbbell', bw: 'bodyweight', band: 'resistance band', trx: 'TRX' }

const store = useStore()
const nombre = ref('')
const exercises = ref([])

watch(() => store.rutinaModalVisible, (visible) => {
  if (!visible) return
  const r = store.editingRutinaId ? store.rutinas.find(x => x.id === store.editingRutinaId) : null
  nombre.value = r?.nombre || ''
  exercises.value = []
  if (r) {
    r.ejercicios.forEach(e => addExercise(e))
  } else {
    addExercise()
  }
})

async function generarConIA(ex) {
  const key = store.geminiKey
  if (!key || !ex.nombre.trim()) return

  const equipoStr = EQUIPO_LABELS[ex.equipo] ? ` (with ${EQUIPO_LABELS[ex.equipo]})` : ''
  const generoCtx = store.genero === 'hombre' ? 'male athlete' : store.genero === 'mujer' ? 'female athlete' : 'athlete'
  const generoEs  = store.genero === 'hombre' ? 'hombre' : store.genero === 'mujer' ? 'mujer' : null
  const generoTip = generoEs ? ` El usuario es ${generoEs}, adapta terminología, enfasis muscular y cualquier variación relevante por género.` : ''

  const prompt = `You are an experienced strength coach. For the exercise "${ex.nombre}"${equipoStr} performed by a ${generoCtx}, respond ONLY with valid JSON (no markdown, no extra text):
{
  "musculos": {"primario":[],"secundario":[],"terciario":[]},
  "notas": "string",
  "busqueda_video": "string"
}

For "notas": write in Spanish using "tú", as a real experienced coach who knows this athlete. Use | as separator between lines (NOT line breaks). Write 4 lines covering: breathing timing, 2 technique points, and what to do if they don't feel the muscle. Rules: no emojis, no bullet points, no headers, no template phrasing like "recuerda" or "asegúrate" — just direct, specific, natural coaching cues that sound different every time. Each line should feel handwritten, not generated.${generoTip}

For "busqueda_video": a specific search query in Spanish, example format: Como hacer peso muerto correctamente para hombre. Include equipment if relevant. Must be a plain string value with no special characters.

For musculos use ONLY these IDs: ${VALID_MUSCLES.join(', ')}.
Primary >60% MVC, secondary 30-60%, tertiary <30%.`

  ex._generating = true
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
        max_tokens: 900,
      }),
    })
    const data = await res.json()
    const text = data?.choices?.[0]?.message?.content || ''
    const raw = text.replace(/```json?|```/g, '').trim()

    let json
    try {
      // Fix literal control chars inside JSON string values before parsing
      const sanitized = raw.replace(/("(?:[^"\\]|\\[\s\S])*")/g, s =>
        s.replace(/\n/g, '\\n').replace(/\r/g, '').replace(/\t/g, ' ')
      )
      json = JSON.parse(sanitized)
    } catch {
      // Fallback: extract each field with regex
      const str = (key) => { const m = raw.match(new RegExp(`"${key}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*?)"`)); return m?.[1] || '' }
      const obj = (key) => { try { const m = raw.match(new RegExp(`"${key}"\\s*:(\\s*\\{[^}]+\\})`)); return m ? JSON.parse(m[1]) : {} } catch { return {} } }
      const m = obj('musculos')
      json = { musculos: m, notas: str('notas'), busqueda_video: str('busqueda_video') }
    }

    const filter = (arr) => (arr || []).filter(m => VALID_MUSCLES.includes(m))
    const m = json.musculos || {}
    ex.musculos = [
      ...filter(m.primario).map(muscle => ({ muscle, nivel: 'primario' })),
      ...filter(m.secundario).map(muscle => ({ muscle, nivel: 'secundario' })),
      ...filter(m.terciario).map(muscle => ({ muscle, nivel: 'terciario' })),
    ]
    if (json.notas) ex.notas = json.notas.replace(/\s*\|\s*/g, '\n')
    if (json.busqueda_video) ex._busquedaVideo = json.busqueda_video
    ex._iaDetected = true
    ex._showMap = true
    store.showToast('✓ IA generó músculos, notas y búsqueda de video')
  } catch (err) {
    console.error('Groq error:', err)
    store.showToast('Error IA: ' + (err?.message || 'revisa la consola'))
  }
  ex._generating = false
}

function addExercise(ex = null) {
  exercises.value.push({
    _formId: Date.now() + Math.random(),
    _showMap: false,
    _iaDetected: false,
    _generating: false,
    _busquedaVideo: '',
    id: ex?.id || ('e' + Date.now() + Math.random()),
    nombre: ex?.nombre || '',
    series: ex?.series || 3,
    reps: ex?.reps || '10',
    equipo: ex?.equipo || '',
    tipoMedida: ex?.tipoMedida || 'reps',
    video: ex ? (store.videos[ex.id] || ex.video || '') : '',
    musclewiki: ex?.musclewiki || '',
    notas: ex?.notas || '',
    descansoRecomendado: ex?.descansoRecomendado || 90,
    musculos: ex?.musculos || [],
  })
}

function removeExercise(idx) {
  exercises.value.splice(idx, 1)
}

function guardar() {
  if (!nombre.value.trim()) { store.showToast('Ingresa un nombre para la rutina'); return }
  const ejercicios = exercises.value
    .filter(e => e.nombre.trim())
    .map(e => {
      if (e.video) store.videos[e.id] = e.video
      else delete store.videos[e.id]
      return {
        id: e.id,
        nombre: e.nombre.trim(),
        series: parseInt(e.series) || 3,
        reps: e.reps || '10',
        equipo: e.equipo,
        tipoMedida: e.tipoMedida || 'reps',
        notas: e.notas || '',
        descansoRecomendado: parseInt(e.descansoRecomendado) || 90,
        musculos: e.musculos || [],
      }
    })
  if (ejercicios.length === 0) { store.showToast('Agrega al menos un ejercicio'); return }
  const muscles = [...new Set(ejercicios.flatMap(e => (e.musculos || []).map(m => typeof m === 'string' ? m : m.muscle)))]
  const autoDesc = muscles.map(m => MUSCLE_LABELS[m] || m).join(' · ')
  store.guardarRutina(nombre.value.trim(), autoDesc, ejercicios)
}

function eliminar() {
  if (confirm('¿Eliminar esta rutina?')) store.eliminarRutinaActual()
}

function ytUrl(q) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q + ' shorts')}`
}
function ttUrl(q) {
  return `https://www.tiktok.com/search?q=${encodeURIComponent(q)}`
}
</script>
