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

        <div class="form-group">
          <label class="form-label">Nombre</label>
          <input class="form-input" v-model="ex.nombre" placeholder="Ej: KB swing">
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
          <label class="form-label">▶ Video <span style="color:var(--text3);font-weight:400">(YouTube, TikTok u otro — opcional)</span></label>
          <input class="form-input" type="url" placeholder="https://youtube.com/... o https://tiktok.com/..." v-model="ex.video" style="font-size:13px">
        </div>

        <div class="form-group">
          <label class="form-label">💪 Link MuscleWiki <span style="color:var(--text3);font-weight:400">(opcional)</span></label>
          <input class="form-input" type="url" placeholder="https://musclewiki.com/..." v-model="ex.musclewiki" style="font-size:13px">
        </div>

        <div>
          <label class="form-label">📝 Notas / cues <span style="color:var(--text3);font-weight:400">(opcional)</span></label>
          <textarea class="form-input" v-model="ex.notas" rows="2"
            placeholder="Ej: Exhalar al subir · No doblar la espalda · Talones pegados al suelo"
            style="resize:vertical;font-size:13px;line-height:1.4"></textarea>
        </div>

        <div style="margin-top:10px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <label class="form-label" style="margin:0">🧠 Músculos trabajados
              <span v-if="ex._detecting" style="color:var(--text3);font-size:11px;font-weight:400;margin-left:6px">⏳ detectando...</span>
              <span v-else-if="ex._autoDetected" style="color:var(--accent);font-size:11px;font-weight:400;margin-left:6px">✓ Gemini</span>
              <span v-else style="color:var(--text3);font-weight:400"> (opcional)</span>
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

const detectTimers = {}

async function detectarConGemini(nombre) {
  const key = store.geminiKey
  if (!key || nombre.trim().length < 3) return null
  const prompt = `Given the exercise "${nombre}", identify which muscle groups are worked.
Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{"primario":[],"secundario":[],"terciario":[]}
Use ONLY these muscle IDs: ${VALID_MUSCLES.join(', ')}.
Primary = >60% MVC activation, secondary = 30-60%, tertiary = <30%.`

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    )
    const data = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const json = JSON.parse(text.replace(/```json?|```/g, '').trim())
    const filter = (arr) => (arr || []).filter(m => VALID_MUSCLES.includes(m))
    return { primario: filter(json.primario), secundario: filter(json.secundario), terciario: filter(json.terciario) }
  } catch {
    return null
  }
}

function addExercise(ex = null) {
  const entry = {
    _formId: Date.now() + Math.random(),
    _showMap: false,
    _autoDetected: false,
    _detecting: false,
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
  }
  exercises.value.push(entry)
  const reactive = exercises.value[exercises.value.length - 1]

  watch(() => reactive.nombre, (val) => {
    reactive._autoDetected = false
    clearTimeout(detectTimers[reactive._formId])
    if (!store.geminiKey || val.trim().length < 3) return
    detectTimers[reactive._formId] = setTimeout(async () => {
      reactive._detecting = true
      const match = await detectarConGemini(val)
      reactive._detecting = false
      if (match && (match.primario.length || match.secundario.length)) {
        reactive.musculos = [
          ...match.primario.map(m => ({ muscle: m, nivel: 'primario' })),
          ...match.secundario.map(m => ({ muscle: m, nivel: 'secundario' })),
          ...match.terciario.map(m => ({ muscle: m, nivel: 'terciario' })),
        ]
        reactive._autoDetected = true
        reactive._showMap = true
      }
    }, 800)
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
        musclewiki: e.musclewiki || '',
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
</script>
