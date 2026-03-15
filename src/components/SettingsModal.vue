<template>
  <div class="modal" :class="{ show: visible }">
    <div class="modal-header">
      <div class="modal-title">Ajustes</div>
      <button class="modal-close" @click="$emit('close')">✕</button>
    </div>

    <div style="padding:16px;overflow-y:auto;flex:1">

      <!-- Perfil -->
      <div style="margin-bottom:24px">
        <div style="font-size:13px;font-weight:700;color:var(--text1);margin-bottom:12px">👤 Perfil</div>
        <label class="form-label">Género</label>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
          <button v-for="[val, label] in GENERO_OPTIONS" :key="val" type="button"
            @click="generoInput = val"
            :style="{
              padding:'10px 0',
              borderRadius:'var(--radius-sm)',
              border: generoInput === val ? '2px solid var(--accent)' : '1px solid var(--border)',
              background: generoInput === val ? 'rgba(232,240,58,0.08)' : 'transparent',
              color: generoInput === val ? 'var(--accent)' : 'var(--text2)',
              fontSize:'13px', fontWeight:'600', cursor:'pointer'
            }">
            {{ label }}
          </button>
        </div>
        <div style="font-size:11px;color:var(--text3);margin-top:6px">
          Se usa para personalizar los tips y búsqueda de videos con IA
        </div>
      </div>

      <!-- Equipo preferido -->
      <div style="margin-bottom:24px;border-top:1px solid var(--border);padding-top:16px">
        <label class="form-label">Equipo preferido</label>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:6px">
          <button v-for="[val, label] in EQUIPO_OPTIONS" :key="val" type="button"
            @click="toggleEquipo(val)"
            :style="{
              padding:'8px 14px',
              borderRadius:'var(--radius-sm)',
              border: equipoInput.includes(val) ? '2px solid var(--accent)' : '1px solid var(--border)',
              background: equipoInput.includes(val) ? 'rgba(232,240,58,0.08)' : 'transparent',
              color: equipoInput.includes(val) ? 'var(--accent)' : 'var(--text2)',
              fontSize:'13px', fontWeight:'600', cursor:'pointer'
            }">
            {{ label }}
          </button>
        </div>
        <div style="font-size:11px;color:var(--text3)">
          La IA priorizará estos equipos al sugerir ejercicios. Puedes elegir varios.
        </div>
      </div>

      <!-- Groq API Key -->
      <div style="margin-bottom:24px;border-top:1px solid var(--border);padding-top:16px">
        <div style="font-size:13px;font-weight:700;color:var(--text1);margin-bottom:4px">🤖 Groq API Key</div>
        <div style="font-size:12px;color:var(--text3);margin-bottom:10px;line-height:1.5">
          Genera músculos, notas de técnica y búsqueda de videos con IA.<br>
          Tu key se guarda en tu cuenta y nunca se comparte.<br><br>
          <strong style="color:var(--text2)">Cómo obtenerla gratis:</strong><br>
          1. Ve a <span style="color:var(--accent)">console.groq.com</span><br>
          2. Inicia sesión con Google<br>
          3. Clic en <em>"API Keys"</em> → <em>"Create API key"</em><br>
          4. Copia la key (empieza con <em>gsk_</em>) y pégala aquí
        </div>
        <input class="form-input" type="password" placeholder="gsk_..." v-model="keyInput"
          style="font-family:monospace;font-size:13px">
        <div v-if="store.geminiKey" style="font-size:11px;color:#44cc88;margin-top:6px">
          ✓ Key guardada — IA activa
        </div>
      </div>

      <!-- Memoria del entrenador -->
      <div style="margin-bottom:24px;border-top:1px solid var(--border);padding-top:16px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <div style="font-size:13px;font-weight:700;color:var(--text1)">🧠 Lo que recuerda el entrenador</div>
          <button v-if="store.memoriaEntrenador" type="button"
            @click="store.memoriaEntrenador = ''; store.save()"
            style="background:none;border:none;color:var(--red);font-size:12px;cursor:pointer;padding:0">
            Borrar todo
          </button>
        </div>
        <div v-if="store.memoriaEntrenador"
          style="font-size:12px;color:var(--text2);line-height:1.7;white-space:pre-line;
                 background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius-sm);
                 padding:10px 12px;max-height:180px;overflow-y:auto">
          {{ store.memoriaEntrenador }}
        </div>
        <div v-else style="font-size:12px;color:var(--text3)">
          Aún no hay memoria. Se construye automáticamente al usar el chat del entrenador.
        </div>
      </div>

      <!-- Cuenta -->
      <div style="border-top:1px solid var(--border);padding-top:16px">
        <div style="font-size:13px;font-weight:700;color:var(--text1);margin-bottom:8px">Cuenta</div>
        <div style="font-size:12px;color:var(--text3);margin-bottom:10px">{{ store.uid }}</div>
        <button class="btn btn-outline btn-sm" @click="cerrarSesion">Cerrar sesión</button>
      </div>
    </div>

    <div class="modal-footer">
      <button class="btn btn-accent btn-full" @click="guardar">Guardar ajustes</button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase.js'
import { useStore, EQUIPO_MAP } from '../store/index.js'

const GENERO_OPTIONS = [['hombre', '♂ Hombre'], ['mujer', '♀ Mujer'], ['', 'No especificar']]
const EQUIPO_OPTIONS = Object.entries(EQUIPO_MAP).map(([val, { label }]) => [val, label])

defineProps({ visible: Boolean })
const emit = defineEmits(['close'])

const store = useStore()
const keyInput    = ref('')
const generoInput = ref('')
const equipoInput = ref([])

watch(() => store.geminiKey,       (val) => { keyInput.value    = val },          { immediate: true })
watch(() => store.genero,          (val) => { generoInput.value = val },          { immediate: true })
watch(() => store.equipoPreferido, (val) => { equipoInput.value = [...(val||[])] }, { immediate: true })

function toggleEquipo(val) {
  const idx = equipoInput.value.indexOf(val)
  if (idx === -1) equipoInput.value.push(val)
  else equipoInput.value.splice(idx, 1)
}

function guardar() {
  store.geminiKey       = keyInput.value.trim()
  store.genero          = generoInput.value
  store.equipoPreferido = [...equipoInput.value]
  store.save()
  store.showToast('Ajustes guardados ✓')
  emit('close')
}

async function cerrarSesion() {
  await signOut(auth)
}
</script>
