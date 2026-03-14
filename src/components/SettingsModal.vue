<template>
  <div class="modal" :class="{ show: visible }">
    <div class="modal-header">
      <div class="modal-title">Ajustes</div>
      <button class="modal-close" @click="$emit('close')">✕</button>
    </div>

    <div style="padding:16px;overflow-y:auto;flex:1">
      <!-- Gemini API Key -->
      <div style="margin-bottom:24px">
        <div style="font-size:13px;font-weight:700;color:var(--text1);margin-bottom:4px">
          🤖 Google Gemini API Key
        </div>
        <div style="font-size:12px;color:var(--text3);margin-bottom:10px;line-height:1.5">
          Permite detectar músculos automáticamente al escribir el nombre de un ejercicio.
          Tu key se guarda en tu cuenta y nunca se comparte.<br><br>
          <strong style="color:var(--text2)">Cómo obtenerla gratis:</strong><br>
          1. Ve a <span style="color:var(--accent)">aistudio.google.com</span><br>
          2. Inicia sesión con Google<br>
          3. Clic en <em>"Get API key"</em> → <em>"Create API key"</em><br>
          4. Copia la key y pégala aquí
        </div>
        <input
          class="form-input"
          type="password"
          placeholder="AIza..."
          v-model="keyInput"
          style="font-family:monospace;font-size:13px"
        >
        <div v-if="store.geminiKey" style="font-size:11px;color:#44cc88;margin-top:6px">
          ✓ Key guardada — detección automática activa
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
import { useStore } from '../store/index.js'

defineProps({ visible: Boolean })
const emit = defineEmits(['close'])

const store = useStore()
const keyInput = ref('')

watch(() => store.geminiKey, (val) => { keyInput.value = val }, { immediate: true })

function guardar() {
  store.geminiKey = keyInput.value.trim()
  store.save()
  store.showToast('Ajustes guardados ✓')
  emit('close')
}

async function cerrarSesion() {
  await signOut(auth)
}
</script>
