<template>
  <div class="routine-card">
    <div class="routine-header" @click="open = !open">
      <div class="routine-badge">{{ rutina.nombre.charAt(0).toUpperCase() }}</div>
      <div class="routine-info">
        <div class="routine-name">{{ rutina.nombre }}</div>
        <div class="routine-meta">{{ desc }} · {{ rutina.ejercicios.length }} ejercicios</div>
      </div>
      <div style="display:flex;gap:6px;align-items:center">
        <button class="icon-btn icon-btn--edit" @click.stop="store.editarRutina(rutina.id)" title="Editar">✎</button>
        <button v-if="inPlan" class="icon-btn rc-remove-btn" @click.stop="$emit('remove-from-plan')" title="Quitar del plan">⊖</button>
        <div class="chevron" :style="{ transform: open ? 'rotate(90deg)' : '' }">›</div>
      </div>
    </div>

    <div v-if="open" class="routine-exercises">
      <div v-for="e in rutina.ejercicios" :key="e.id" class="ex-row">
        <div style="flex:1;min-width:0">
          <div>
            <span class="ex-row-name">{{ e.nombre }}</span>
            <span v-if="store.allEquipos[e.equipo]" class="ex-tag"
              :style="{ background: store.allEquipos[e.equipo].bg, color: store.allEquipos[e.equipo].color }">
              {{ store.allEquipos[e.equipo].label }}
            </span>
            <a v-if="e.musclewiki" :href="e.musclewiki" target="_blank"
              style="font-size:11px;padding:2px 8px;border-radius:20px;background:#1a2a1a;color:#44cc88;text-decoration:none;margin-left:4px;">
              💪 MuscleWiki
            </a>
          </div>
          <div v-if="e.musculos && e.musculos.length" style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">
            <span v-for="m in e.musculos" :key="muscleId(m)" class="muscle-tag"
              :style="`background:${NIVEL_COLORS[muscleNivel(m)]}18;color:${NIVEL_COLORS[muscleNivel(m)]};border-color:${NIVEL_COLORS[muscleNivel(m)]}40`">
              {{ MUSCLE_LABELS[muscleId(m)] || muscleId(m) }}
            </span>
          </div>
        </div>
        <span class="ex-row-sets" style="flex-shrink:0">{{ e.series }}×{{ e.reps }}</span>
      </div>
      <div v-if="muscles.length" style="padding:0 12px 4px">
        <MuscleMap :model-value="muscles" readonly />
      </div>
      <div style="padding:12px 16px">
        <button class="btn btn-accent btn-full" @click="store.iniciarEntrenamiento(rutina.id)">
          ▶ Iniciar entrenamiento
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useStore, MUSCLE_LABELS } from '../store/index.js'
import MuscleMap from './MuscleMap.vue'

const props = defineProps({
  rutina:  { type: Object, required: true },
  inPlan:  { type: Boolean, default: false },
})
defineEmits(['remove-from-plan'])

const store = useStore()
const open  = ref(false)

const NIVEL_COLORS = { primario: '#ff4d4d', secundario: '#ff9900', terciario: '#ffd700' }
function muscleId(m)   { return typeof m === 'string' ? m : m.muscle }
function muscleNivel(m){ return typeof m === 'string' ? 'primario'  : m.nivel  }

const desc = computed(() => {
  const ids = [...new Set(props.rutina.ejercicios.flatMap(e => (e.musculos || []).map(muscleId)))]
  return ids.length ? ids.map(m => MUSCLE_LABELS[m] || m).join(' · ') : (props.rutina.desc || '')
})

const muscles = computed(() => {
  const nivelOrder = { primario: 0, secundario: 1, terciario: 2 }
  const map = {}
  props.rutina.ejercicios.forEach(e => {
    ;(e.musculos || []).forEach(m => {
      const muscle = muscleId(m); const nivel = muscleNivel(m)
      if (!map[muscle] || nivelOrder[nivel] < nivelOrder[map[muscle]]) map[muscle] = nivel
    })
  })
  return Object.entries(map).map(([muscle, nivel]) => ({ muscle, nivel }))
})
</script>
