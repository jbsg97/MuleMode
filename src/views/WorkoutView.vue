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
          <div style="flex:1;min-width:0">
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
            <button class="ex-video-btn" @click.stop="toggleEdit(ei)">
              {{ editing[ei] ? '✓ Listo' : '✎ Editar' }}
            </button>
          </div>
        </div>

        <!-- Inline edit panel -->
        <div v-if="editing[ei]" class="ex-edit-panel">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
            <div style="grid-column:1/-1">
              <label class="ex-edit-label">Nombre</label>
              <input class="series-input" style="width:100%;box-sizing:border-box"
                :value="ex.nombre"
                @change="store.updateWorkoutExercise(ei, { nombre: $event.target.value })">
            </div>
            <div>
              <label class="ex-edit-label">Reps objetivo</label>
              <input class="series-input" style="width:100%;box-sizing:border-box"
                :value="ex.reps"
                @change="store.updateWorkoutExercise(ei, { reps: $event.target.value })">
            </div>
            <div>
              <label class="ex-edit-label">N° de series</label>
              <input class="series-input" type="number" min="1" max="20"
                style="width:100%;box-sizing:border-box"
                :value="ex.series.length"
                @change="store.updateWorkoutExercise(ei, { series: parseInt($event.target.value) || 1 })">
            </div>
            <div>
              <label class="ex-edit-label">Equipo</label>
              <select class="series-input" style="width:100%;box-sizing:border-box;padding:6px 8px"
                :value="ex.equipo"
                @change="store.updateWorkoutExercise(ei, { equipo: $event.target.value })">
                <option v-for="[val, label] in store.allEquipoOptions" :key="val" :value="val">{{ label }}</option>
              </select>
            </div>
            <div>
              <label class="ex-edit-label">Descanso (seg)</label>
              <input class="series-input" type="number" min="10" max="600" step="5"
                style="width:100%;box-sizing:border-box"
                :value="ex.descansoRecomendado"
                @change="store.updateWorkoutExercise(ei, { descansoRecomendado: parseInt($event.target.value) || 90 })">
            </div>
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
              <div v-if="ex.notas.progresion" class="ex-cues ex-cues--progresion">
                <div class="ex-cues-label">📈 Progresión</div>
                {{ ex.notas.progresion }}
              </div>
            </template>
            <div v-else class="ex-cues">{{ ex.notas }}</div>
          </template>

          <ExerciseChat v-if="store.geminiKey" :ex="ex" />

          <textarea class="notes-area" placeholder="Notas del ejercicio..."
            :value="ex.notaSession || ''"
            @input="store.updateExNota(ei, $event.target.value)"></textarea>
        </div>
      </div>
    </div>

    <div style="padding:16px">
      <button class="btn btn-accent btn-full" @click="$emit('finish')">✓ Guardar entrenamiento</button>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue'
import { useStore } from '../store/index.js'
import MuscleMap from '../components/MuscleMap.vue'
import ExerciseChat from '../components/ExerciseChat.vue'

defineEmits(['finish'])

const store     = useStore()
const equipoMap = store.allEquipos
const collapsed = reactive({})
const showMap   = reactive({})
const editing   = reactive({})

// Inicializar: primer ejercicio abierto, los demás cerrados
watch(() => store.workout, (w) => {
  if (!w) return
  w.ejercicios.forEach((_, i) => { collapsed[i] = i !== 0 })
}, { immediate: true })

function toggleExBlock(ei) {
  const opening = collapsed[ei]
  if (store.workout) store.workout.ejercicios.forEach((_, i) => { collapsed[i] = true })
  if (opening) collapsed[ei] = false
}

function toggleEdit(ei) {
  editing[ei] = !editing[ei]
  if (editing[ei]) collapsed[ei] = false // open block when editing
}
</script>

<style scoped>
.ex-edit-panel {
  padding: 10px 12px;
  background: var(--bg3);
  border-bottom: 1px solid var(--border);
}

.ex-edit-label {
  display: block;
  font-size: 10px;
  font-weight: 700;
  color: var(--text3);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 4px;
}
</style>
