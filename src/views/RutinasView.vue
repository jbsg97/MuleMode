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

    <!-- Rutinas list -->
    <div class="section-pad" style="display:flex;justify-content:space-between;align-items:center">
      <div class="section-title" style="margin:0">Mis rutinas</div>
      <button v-if="store.geminiKey" class="btn btn-outline btn-sm"
        @click="store.generarRutinaModalVisible = true">
        🤖 Generar con IA
      </button>
    </div>

    <div v-if="store.rutinas.length === 0" class="empty">
      <div class="empty-icon">💪</div>
      <div class="empty-text">No tienes rutinas. Toca + para crear una.</div>
    </div>

    <div v-else>
      <div v-for="r in store.rutinas" :key="r.id" class="routine-card">
        <div class="routine-header" @click="toggleCard(r.id)">
          <div class="routine-badge">{{ r.nombre.charAt(0).toUpperCase() }}</div>
          <div class="routine-info">
            <div class="routine-name">{{ r.nombre }}</div>
            <div class="routine-meta">{{ routineDesc(r) }} · {{ r.ejercicios.length }} ejercicios</div>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <button class="icon-btn icon-btn--edit" @click.stop="store.editarRutina(r.id)" title="Editar">✎</button>
            <div class="chevron" :style="{ transform: openCards[r.id] ? 'rotate(90deg)' : '' }">›</div>
          </div>
        </div>

        <div v-if="openCards[r.id]" class="routine-exercises">
          <div v-for="e in r.ejercicios" :key="e.id" class="ex-row">
            <div style="flex:1;min-width:0">
              <div>
                <span class="ex-row-name">{{ e.nombre }}</span>
                <span v-if="equipoMap[e.equipo]" class="ex-tag"
                  :style="{ background: equipoMap[e.equipo].bg, color: equipoMap[e.equipo].color }">
                  {{ equipoMap[e.equipo].label }}
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
          <div style="padding:12px 16px">
            <button class="btn btn-accent btn-full" @click="store.iniciarEntrenamiento(r.id)">
              ▶ Iniciar entrenamiento
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- FAB -->
    <button class="fab" @click="store.abrirNuevaRutina()">+</button>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { useStore, EQUIPO_MAP, MUSCLE_LABELS } from '../store/index.js'

defineEmits(['settings'])

const store = useStore()
const equipoMap = EQUIPO_MAP
const openCards = reactive({})

function toggleCard(id) {
  const wasOpen = openCards[id]
  Object.keys(openCards).forEach(k => { openCards[k] = false })
  openCards[id] = !wasOpen
}

function muscleId(m) { return typeof m === 'string' ? m : m.muscle }
function muscleNivel(m) { return typeof m === 'string' ? 'primario' : m.nivel }

function routineDesc(r) {
  const muscles = [...new Set(r.ejercicios.flatMap(e => (e.musculos || []).map(muscleId)))]
  if (muscles.length) return muscles.map(m => MUSCLE_LABELS[m] || m).join(' · ')
  return r.desc || ''
}

const NIVEL_COLORS = { primario: '#ff4d4d', secundario: '#ff9900', terciario: '#ffd700' }
</script>
