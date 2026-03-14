<template>
  <div class="modal" :class="{ show: store.videoModalVisible }">
    <div class="modal-header">
      <div class="modal-title">{{ store.videoModalTitle }}</div>
      <button class="modal-close" @click="cerrar">✕</button>
    </div>
    <div class="video-container">
      <div v-if="!embedId" class="video-placeholder">
        <div style="font-size:36px">▶</div>
        <div style="font-size:13px">Sin video asignado</div>
      </div>
      <div v-if="embedId">
        <div class="video-frame">
          <iframe :src="`https://www.youtube-nocookie.com/embed/${embedId}?playsinline=1&rel=0&modestbranding=1`"
            allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerpolicy="strict-origin-when-cross-origin"></iframe>
        </div>
        <button class="btn btn-outline btn-full" style="margin-bottom:12px" @click="abrirExterno">
          Abrir video en YouTube ↗
        </button>
        <div style="font-size:11px;color:var(--text3);text-align:center;margin-bottom:12px">
          Si el video no carga arriba, usa este botón
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">URL de YouTube</label>
        <input class="form-input" type="url" placeholder="https://youtube.com/watch?v=..."
          v-model="urlInput">
      </div>
      <button class="btn btn-accent btn-full" @click="guardar">Guardar video</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useStore } from '../store/index.js'

const store = useStore()
const urlInput = ref('')

watch(() => store.videoModalVisible, (v) => {
  if (v) urlInput.value = store.videoModalUrl
})

function getYTId(url) {
  if (!url) return null
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

const embedId = computed(() => getYTId(urlInput.value))

function guardar() {
  store.guardarVideo(urlInput.value.trim())
  store.videoModalVisible = false
}

function cerrar() {
  store.videoModalVisible = false
}

function abrirExterno() {
  if (urlInput.value) window.open(urlInput.value, '_blank')
}
</script>
