<template>
  <div class="modal" :class="{ show: store.generarRutinaModalVisible }">
    <div class="modal-header">
      <div class="modal-title">🤖 Generar rutina con IA</div>
      <button class="modal-close" @click="cerrar">✕</button>
    </div>

    <div style="padding:16px;overflow-y:auto;flex:1;padding-bottom:16px">

      <!-- Step 1: prompt -->
      <template v-if="step === 1">
        <!-- Profile chips -->
        <div class="gr-profile-chips">
          <span v-if="store.genero" class="gr-chip">
            {{ store.genero === 'hombre' ? '♂' : '♀' }} {{ store.genero }}
          </span>
          <span v-if="store.peso || store.altura" class="gr-chip">
            {{ [store.peso ? store.peso + ' kg' : '', store.altura ? store.altura + ' cm' : ''].filter(Boolean).join(' · ') }}
          </span>
          <span v-if="store.equipoPreferido.length" class="gr-chip">
            {{ store.equipoPreferido.map(e => EQUIPO_MAP[e]?.label || e).join(' · ') }}
          </span>
          <span v-if="!store.genero && !store.peso && !store.equipoPreferido.length"
            class="gr-chip gr-chip--warn">
            Completa tu perfil en Ajustes para mejores resultados
          </span>
        </div>

        <div class="form-group">
          <label class="form-label">¿Qué tipo de rutina quieres?</label>
          <textarea class="form-input gr-prompt-input" rows="4" v-model="prompt"
            placeholder="Ej: Generame 3 rutinas para la semana, una de tren superior, una de inferior y una de core. Que duren unos 45 min. Me cuesta la espalda baja así que evita peso muerto."></textarea>
        </div>

        <!-- Quick prompts -->
        <div style="margin-bottom:16px">
          <div class="form-label" style="margin-bottom:8px">Sugerencias rápidas</div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <button v-for="s in QUICK_PROMPTS" :key="s" class="gr-quick-btn"
              @click="prompt = s">
              {{ s }}
            </button>
          </div>
        </div>
      </template>

      <!-- Step 2: loading -->
      <template v-else-if="step === 2">
        <div class="gr-loading">
          <div class="gr-loading-spinner"></div>
          <div class="gr-loading-text">Generando tu plan de entrenamiento...</div>
          <div class="gr-loading-sub">Esto puede tardar unos segundos</div>
        </div>
      </template>

      <!-- Step 3: preview -->
      <template v-else-if="step === 3">
        <div v-if="error" class="gr-error">
          {{ error }}
          <button class="btn btn-outline btn-sm" style="margin-top:12px;width:100%" @click="step = 1">
            Intentar de nuevo
          </button>
        </div>

        <template v-else>
          <div style="font-size:12px;color:var(--text3);margin-bottom:12px">
            {{ rutinasGeneradas.length }} rutina{{ rutinasGeneradas.length !== 1 ? 's' : '' }} generada{{ rutinasGeneradas.length !== 1 ? 's' : '' }} · Revisa y guarda las que te gusten
          </div>

          <div v-for="(r, ri) in rutinasGeneradas" :key="ri" class="gr-rutina-card">
            <div class="gr-rutina-header" @click="previewOpen[ri] = !previewOpen[ri]">
              <div>
                <div class="gr-rutina-nombre">{{ r.nombre }}</div>
                <div class="gr-rutina-desc">{{ r.ejercicios.length }} ejercicios · {{ r.desc }}</div>
              </div>
              <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
                <button v-if="!r._guardada" class="btn btn-accent btn-sm"
                  @click.stop="guardarRutina(ri)">
                  Guardar
                </button>
                <span v-else style="font-size:12px;color:#44cc88;font-weight:600">✓ Guardada</span>
                <span class="gr-chevron" :style="{ transform: previewOpen[ri] ? 'rotate(90deg)' : '' }">›</span>
              </div>
            </div>

            <div v-if="previewOpen[ri]" class="gr-ex-list">
              <div v-for="(ex, ei) in r.ejercicios" :key="ei" class="gr-ex-row">
                <div style="flex:1;min-width:0">
                  <span class="gr-ex-nombre">{{ ex.nombre }}</span>
                  <span v-if="EQUIPO_MAP[ex.equipo]" class="ex-tag" style="margin-left:6px"
                    :style="{ background: EQUIPO_MAP[ex.equipo].bg, color: EQUIPO_MAP[ex.equipo].color }">
                    {{ EQUIPO_MAP[ex.equipo].label }}
                  </span>
                  <div v-if="ex.musculos_p?.length" style="display:flex;flex-wrap:wrap;gap:3px;margin-top:4px">
                    <span v-for="m in ex.musculos_p" :key="m"
                      style="font-size:10px;padding:1px 7px;border-radius:20px;background:#ff4d4d18;color:#ff4d4d;border:1px solid #ff4d4d40">
                      {{ MUSCLE_LABELS[m] || m }}
                    </span>
                    <span v-for="m in ex.musculos_s" :key="m"
                      style="font-size:10px;padding:1px 7px;border-radius:20px;background:#ff990018;color:#ff9900;border:1px solid #ff990040">
                      {{ MUSCLE_LABELS[m] || m }}
                    </span>
                  </div>
                </div>
                <span class="gr-ex-sets">{{ ex.series }}×{{ ex.reps }}</span>
              </div>
            </div>
          </div>

          <button class="btn btn-outline btn-sm" style="width:100%;margin-top:8px" @click="step = 1">
            ← Generar otra
          </button>
        </template>
      </template>

    </div>

    <!-- Footer -->
    <div class="modal-footer" v-if="step === 1">
      <button class="btn btn-accent btn-full" :disabled="!prompt.trim()" @click="generar">
        Generar rutina
      </button>
    </div>
    <div class="modal-footer" v-else-if="step === 3 && !error">
      <button class="btn btn-accent btn-full" @click="guardarTodas">
        Guardar todas
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useStore, EQUIPO_MAP, MUSCLE_LABELS } from '../store/index.js'

const store = useStore()

const step             = ref(1)
const prompt           = ref('')
const error            = ref('')
const rutinasGeneradas = ref([])
const previewOpen      = reactive({})

const VALID_MUSCLES = ['chest','obliques','abs','biceps','triceps','front-deltoids',
  'abductors','quadriceps','calves','forearm','trapezius','upper-back','lower-back',
  'back-deltoids','gluteal','adductor','hamstring','left-soleus']

const EQUIPO_LABELS_ES = { kb: 'kettlebell', sb: 'sandbag', bb: 'barra', db: 'mancuerna', bw: 'peso corporal', band: 'bandas de resistencia', trx: 'TRX' }

const QUICK_PROMPTS = [
  '3 rutinas semanales: tren superior, tren inferior y core. 45 min cada una.',
  '4 rutinas push/pull/legs/full body. 50 min cada una.',
  '2 rutinas fullbody para la semana. 30-40 min cada una.',
  '3 rutinas fullbody que trabajen todos los músculos. Sin repetir grupos el mismo día.',
]

function cerrar() {
  store.generarRutinaModalVisible = false
}

function buildPrompt() {
  const genero   = store.genero === 'hombre' ? 'hombre' : store.genero === 'mujer' ? 'mujer' : null
  const peso     = store.peso   ? `${store.peso} kg`   : null
  const altura   = store.altura ? `${store.altura} cm` : null
  const equipo   = store.equipoPreferido.length
    ? store.equipoPreferido.map(e => EQUIPO_LABELS_ES[e] || e).join(', ')
    : 'kettlebell y sandbag'
  const memoria  = store.memoriaEntrenador

  const perfilLines = [
    genero  ? `- Género: ${genero}` : null,
    (peso || altura) ? `- Físico: ${[peso, altura].filter(Boolean).join(', ')}` : null,
    `- Equipo disponible/preferido: ${equipo}`,
    memoria ? `- Lo que ya sabes del atleta:\n${memoria}` : null,
  ].filter(Boolean).join('\n')

  return `Eres un entrenador experto en kettlebell y entrenamiento funcional. Diseña rutinas de entrenamiento personalizadas.

PERFIL DEL ATLETA:
${perfilLines}

SOLICITUD DEL ATLETA:
${prompt.value.trim()}

Responde SOLO con este JSON (sin markdown, sin texto extra):
{
  "rutinas": [
    {
      "nombre": "string (ej: Día 1 — Tren Superior)",
      "desc": "string (músculos principales, muy corto)",
      "ejercicios": [
        {
          "nombre": "string",
          "series": 3,
          "reps": "string (ej: '10', '8 c/lado', '40 seg', '20 m')",
          "equipo": "kb|sb|bb|db|bw|band|trx|",
          "tipoMedida": "reps|time|dist",
          "descansoRecomendado": 90,
          "musculos_p": ["muscle"],
          "musculos_s": ["muscle"],
          "musculos_t": []
        }
      ]
    }
  ]
}

Reglas:
- Usa SOLO estos valores de músculo: ${VALID_MUSCLES.join(', ')}
- Adapta los ejercicios al equipo preferido del atleta
- Reps realistas según el tipo de ejercicio y equipo
- tipoMedida: "time" para planchas/iso, "dist" para carries, "reps" para todo lo demás
- descansoRecomendado: 60-90 para fuerza, 30-60 para cardio/metcon
- Si el atleta mencionó lesiones o limitaciones en su perfil, respétalas
- Solo devuelve el JSON, nada más`
}

async function generar() {
  if (!prompt.value.trim() || !store.geminiKey) return
  step.value  = 2
  error.value = ''
  rutinasGeneradas.value = []

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${store.geminiKey}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: buildPrompt() }],
        temperature: 0.5,
        max_tokens: 4000,
      }),
    })
    const data = await res.json()
    let raw = (data?.choices?.[0]?.message?.content || '').replace(/```json?|```/g, '').trim()

    // Sanitize literal newlines inside JSON strings
    const sanitized = raw.replace(/("(?:[^"\\]|\\[\s\S])*")/g, s =>
      s.replace(/\n/g, '\\n').replace(/\r/g, '').replace(/\t/g, ' '))

    const json = JSON.parse(sanitized)
    if (!Array.isArray(json.rutinas) || json.rutinas.length === 0) throw new Error('Sin rutinas')

    rutinasGeneradas.value = json.rutinas.map(r => ({
      ...r,
      _guardada: false,
      ejercicios: (r.ejercicios || []).map(e => ({
        ...e,
        musculos_p: (e.musculos_p || []).filter(m => VALID_MUSCLES.includes(m)),
        musculos_s: (e.musculos_s || []).filter(m => VALID_MUSCLES.includes(m)),
        musculos_t: (e.musculos_t || []).filter(m => VALID_MUSCLES.includes(m)),
      })),
    }))

    // Open first routine by default
    previewOpen[0] = true

  } catch (err) {
    error.value = 'No pude generar las rutinas. Intenta de nuevo o simplifica tu solicitud.'
    console.error('GenerarRutina error:', err)
  }

  step.value = 3
}

function toRutinaEjercicios(r) {
  const MUSCLE_LABELS_MAP = MUSCLE_LABELS
  return r.ejercicios.map(e => ({
    id: 'e' + Date.now() + Math.random(),
    nombre: e.nombre,
    series: parseInt(e.series) || 3,
    reps: e.reps || '10',
    equipo: e.equipo || '',
    tipoMedida: e.tipoMedida || 'reps',
    descansoRecomendado: parseInt(e.descansoRecomendado) || 90,
    notas: { respiracion: '', forma: '', tips: '' },
    musculos: [
      ...(e.musculos_p || []).map(m => ({ muscle: m, nivel: 'primario' })),
      ...(e.musculos_s || []).map(m => ({ muscle: m, nivel: 'secundario' })),
      ...(e.musculos_t || []).map(m => ({ muscle: m, nivel: 'terciario' })),
    ],
  }))
}

function guardarRutina(ri) {
  const r = rutinasGeneradas.value[ri]
  const ejercicios = toRutinaEjercicios(r)
  const muscles = [...new Set(ejercicios.flatMap(e => e.musculos.map(m => m.muscle)))]
  const autoDesc = muscles.slice(0, 4).map(m => MUSCLE_LABELS[m] || m).join(' · ')
  store.guardarRutina(r.nombre, autoDesc || r.desc, ejercicios)
  // guardarRutina cierra el modal de rutina, así que solo marcamos guardada
  store.rutinaModalVisible = false
  r._guardada = true
}

function guardarTodas() {
  rutinasGeneradas.value.forEach((_, i) => {
    if (!rutinasGeneradas.value[i]._guardada) guardarRutina(i)
  })
  cerrar()
}
</script>

<style scoped>
.gr-profile-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
}
.gr-chip {
  background: rgba(232,240,58,0.08);
  border: 1px solid rgba(232,240,58,0.3);
  color: var(--accent);
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
  text-transform: capitalize;
}
.gr-chip--warn {
  background: rgba(255,153,0,0.08);
  border-color: rgba(255,153,0,0.3);
  color: #ff9900;
}

.gr-prompt-input {
  resize: none;
  font-size: 14px;
  line-height: 1.6;
  min-height: 100px;
}

.gr-quick-btn {
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text2);
  font-size: 12px;
  padding: 10px 12px;
  text-align: left;
  cursor: pointer;
  line-height: 1.4;
  width: 100%;
}
.gr-quick-btn:active { border-color: var(--accent); }

.gr-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
}
.gr-loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: gr-spin 0.8s linear infinite;
}
@keyframes gr-spin { to { transform: rotate(360deg); } }
.gr-loading-text {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 20px;
  color: var(--text1);
  letter-spacing: 0.05em;
}
.gr-loading-sub { font-size: 12px; color: var(--text3); }

.gr-error {
  background: rgba(255,68,68,0.08);
  border: 1px solid rgba(255,68,68,0.3);
  border-radius: var(--radius-sm);
  color: #ff6666;
  font-size: 13px;
  padding: 14px;
  text-align: center;
  line-height: 1.5;
}

.gr-rutina-card {
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  margin-bottom: 10px;
  overflow: hidden;
}
.gr-rutina-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  cursor: pointer;
  gap: 8px;
}
.gr-rutina-nombre {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 16px;
  color: var(--text1);
  letter-spacing: 0.04em;
}
.gr-rutina-desc {
  font-size: 11px;
  color: var(--text3);
  margin-top: 2px;
}
.gr-chevron {
  color: var(--text3);
  font-size: 20px;
  transition: transform 0.2s;
  line-height: 1;
}

.gr-ex-list {
  border-top: 1px solid var(--border);
}
.gr-ex-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 9px 14px;
  border-bottom: 1px solid var(--border);
  gap: 8px;
}
.gr-ex-row:last-child { border-bottom: none; }
.gr-ex-nombre {
  font-size: 13px;
  font-weight: 500;
  color: var(--text1);
}
.gr-ex-sets {
  font-size: 13px;
  font-weight: 700;
  color: var(--accent);
  flex-shrink: 0;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 15px;
  letter-spacing: 0.03em;
}
</style>
