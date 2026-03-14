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
            <button v-if="ex.musclewiki" class="ex-video-btn" @click.stop="openMuscleWiki(ex.musclewiki)">
              💪 Músculo
            </button>
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
import { reactive } from 'vue'
import { useStore, EQUIPO_MAP } from '../store/index.js'
import MuscleMap from '../components/MuscleMap.vue'

defineEmits(['finish'])

const store = useStore()
const equipoMap = EQUIPO_MAP
const collapsed = reactive({})
const showMap   = reactive({})

function toggleExBlock(ei) {
  collapsed[ei] = !collapsed[ei]
}

function openMuscleWiki(url) {
  if (url) window.open(url, '_blank')
}
</script>
