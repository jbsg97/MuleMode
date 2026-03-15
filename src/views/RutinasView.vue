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

    <!-- Section title -->
    <div class="section-pad" style="display:flex;justify-content:space-between;align-items:center">
      <div class="section-title" style="margin:0">Mis rutinas</div>
      <div style="display:flex;gap:6px;align-items:center">
        <button class="btn btn-outline btn-sm" @click="toggleNuevoPlan">＋ Plan</button>
        <button v-if="store.geminiKey" class="btn btn-outline btn-sm"
          @click="store.generarRutinaModalVisible = true">
          🤖 IA
        </button>
      </div>
    </div>

    <!-- New plan inline input -->
    <div v-if="showNuevoPlan" style="padding:0 16px 12px;display:flex;gap:8px">
      <input class="form-input" style="flex:1;font-size:13px" ref="nuevoPlanInputRef"
        placeholder="Nombre del plan (ej: Plan Doomsday)"
        v-model="nuevoPlanNombre"
        @keydown.enter="confirmarNuevoPlan"
        @keydown.escape="showNuevoPlan = false" />
      <button class="btn btn-accent btn-sm" :disabled="!nuevoPlanNombre.trim()" @click="confirmarNuevoPlan">Crear</button>
    </div>

    <!-- Empty state -->
    <div v-if="store.rutinas.length === 0" class="empty">
      <div class="empty-icon">💪</div>
      <div class="empty-text">No tienes rutinas. Toca + para crear una.</div>
    </div>

    <!-- With plans: plan sections + free routines -->
    <template v-if="store.planes.length">

      <!-- Plan sections -->
      <div v-for="plan in store.planes" :key="plan.id" class="plan-section">
        <!-- Plan header -->
        <div class="plan-header">
          <template v-if="editingPlanId !== plan.id">
            <div class="plan-name">{{ plan.nombre }}</div>
            <div style="display:flex;gap:4px;flex-shrink:0">
              <button class="icon-btn icon-btn--edit" @click="startRename(plan)" title="Renombrar">✎</button>
              <button class="icon-btn icon-btn--delete" @click="eliminarPlan(plan.id)" title="Eliminar plan">✕</button>
            </div>
          </template>
          <template v-else>
            <input class="form-input" style="flex:1;font-size:13px;padding:6px 10px"
              v-model="editPlanName"
              @keydown.enter="confirmarRename(plan.id)"
              @keydown.escape="editingPlanId = null"
              @blur="confirmarRename(plan.id)" />
          </template>
        </div>

        <!-- Routines in plan -->
        <RoutineCard
          v-for="r in rutinasDePlan(plan.id)" :key="r.id"
          :rutina="r" :inPlan="true"
          @remove-from-plan="store.quitarRutinaDePlan(r.id)" />

        <!-- Empty hint -->
        <div v-if="!rutinasDePlan(plan.id).length"
          style="padding:10px 16px;color:var(--text3);font-size:13px;font-style:italic">
          Sin rutinas en este plan.
        </div>

        <!-- Add free routine to plan -->
        <div v-if="rutinasLibres.length" style="padding:4px 16px 8px">
          <select class="form-input" style="font-size:12px;padding:7px 10px"
            @change="agregarRutinaAPlan(plan.id, $event)">
            <option value="">＋ Agregar rutina al plan...</option>
            <option v-for="r in rutinasLibres" :key="r.id" :value="r.id">{{ r.nombre }}</option>
          </select>
        </div>

        <!-- Aggregate muscle map -->
        <div v-if="planMuscles(plan.id).length" style="padding:0 12px 4px">
          <MuscleMap :model-value="planMuscles(plan.id)" readonly />
        </div>
      </div>

      <!-- Free routines (sin plan) -->
      <template v-if="rutinasLibres.length">
        <div class="section-pad" style="padding-top:16px">
          <div class="section-title" style="margin:0;font-size:11px">Sin plan</div>
        </div>
        <div v-for="r in rutinasLibres" :key="r.id">
          <RoutineCard :rutina="r" />
          <div style="padding:0 16px 4px">
            <select class="form-input" style="font-size:12px;padding:7px 10px"
              @change="moverAPlan(r.id, $event)">
              <option value="">Mover a plan...</option>
              <option v-for="p in store.planes" :key="p.id" :value="p.id">{{ p.nombre }}</option>
            </select>
          </div>
        </div>
      </template>

    </template>

    <!-- No plans: just show all routines -->
    <template v-else>
      <RoutineCard v-for="r in store.rutinas" :key="r.id" :rutina="r" />
    </template>

    <!-- FAB -->
    <button class="fab" @click="store.abrirNuevaRutina()">+</button>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useStore, MUSCLE_LABELS } from '../store/index.js'
import MuscleMap from '../components/MuscleMap.vue'
import RoutineCard from '../components/RoutineCard.vue'

defineEmits(['settings'])

const store = useStore()

// ── New plan ──────────────────────────────────────────────────
const showNuevoPlan    = ref(false)
const nuevoPlanNombre  = ref('')
const nuevoPlanInputRef = ref(null)

async function toggleNuevoPlan() {
  showNuevoPlan.value = !showNuevoPlan.value
  if (showNuevoPlan.value) {
    await nextTick()
    nuevoPlanInputRef.value?.focus()
  }
}

function confirmarNuevoPlan() {
  if (!nuevoPlanNombre.value.trim()) return
  store.crearPlan(nuevoPlanNombre.value.trim())
  nuevoPlanNombre.value  = ''
  showNuevoPlan.value    = false
}

// ── Rename plan ───────────────────────────────────────────────
const editingPlanId = ref(null)
const editPlanName  = ref('')

function startRename(plan) {
  editingPlanId.value = plan.id
  editPlanName.value  = plan.nombre
}

function confirmarRename(planId) {
  if (editPlanName.value.trim()) store.renamePlan(planId, editPlanName.value.trim())
  editingPlanId.value = null
}

// ── Delete plan ───────────────────────────────────────────────
function eliminarPlan(planId) {
  const plan = store.planes.find(p => p.id === planId)
  if (!plan) return
  const count = store.rutinas.filter(r => r.planId === planId).length
  const msg = count
    ? `¿Eliminar "${plan.nombre}"? Las ${count} rutina(s) quedarán sin plan.`
    : `¿Eliminar el plan "${plan.nombre}"?`
  if (confirm(msg)) store.eliminarPlan(planId)
}

// ── Move routines ─────────────────────────────────────────────
function agregarRutinaAPlan(planId, event) {
  const rutinaId = event.target.value
  if (rutinaId) store.moverRutinaAPlan(rutinaId, planId)
  event.target.value = ''
}

function moverAPlan(rutinaId, event) {
  const planId = event.target.value
  if (planId) store.moverRutinaAPlan(rutinaId, planId)
  event.target.value = ''
}

// ── Computed ──────────────────────────────────────────────────
const rutinasLibres = computed(() => store.rutinas.filter(r => !r.planId))

function rutinasDePlan(planId) {
  return store.rutinas.filter(r => r.planId === planId)
}

function planMuscles(planId) {
  const nivelOrder = { primario: 0, secundario: 1, terciario: 2 }
  const map = {}
  store.rutinas
    .filter(r => r.planId === planId)
    .forEach(r => {
      r.ejercicios.forEach(e => {
        ;(e.musculos || []).forEach(m => {
          const muscle = typeof m === 'string' ? m : m.muscle
          const nivel  = typeof m === 'string' ? 'primario' : m.nivel
          if (!map[muscle] || nivelOrder[nivel] < nivelOrder[map[muscle]]) map[muscle] = nivel
        })
      })
    })
  return Object.entries(map).map(([muscle, nivel]) => ({ muscle, nivel }))
}
</script>

<style scoped>
.plan-section {
  margin: 0 16px 16px;
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.plan-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 14px;
  background: var(--bg3);
  border-bottom: 1px solid var(--border);
}

.plan-name {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 18px;
  color: var(--accent);
  letter-spacing: 0.06em;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Override routine-card margin inside plan sections */
.plan-section :deep(.routine-card) {
  margin: 0;
  border-radius: 0;
  border-left: none;
  border-right: none;
  border-top: none;
}
.plan-section :deep(.routine-card:last-of-type) {
  border-bottom: none;
}
</style>
