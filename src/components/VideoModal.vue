<template>
  <div class="modal" :class="{ show: store.videoModalVisible }">
    <div class="modal-header">
      <div class="modal-title">{{ store.videoModalTitle }}</div>
      <button class="modal-close" @click="cerrar">✕</button>
    </div>
    <div class="video-container">
      <!-- Sin URL -->
      <div v-if="!urlInput.trim()" class="video-placeholder">
        <div style="font-size:36px">▶</div>
        <div style="font-size:13px">Sin video asignado</div>
      </div>

      <!-- YouTube: embed -->
      <div v-else-if="youtubeId">
        <div class="video-frame">
          <iframe :src="`https://www.youtube-nocookie.com/embed/${youtubeId}?playsinline=1&rel=0&modestbranding=1`"
            allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerpolicy="strict-origin-when-cross-origin"></iframe>
        </div>
        <button class="btn btn-outline btn-full" style="margin-bottom:12px" @click="abrirExterno">
          Abrir en YouTube ↗
        </button>
        <div style="font-size:11px;color:var(--text3);text-align:center;margin-bottom:12px">
          Si el video no carga arriba, usa este botón
        </div>
      </div>

      <!-- TikTok: solo botón externo -->
      <div v-else-if="isTikTok">
        <div class="video-placeholder" style="margin-bottom:12px">
          <div style="font-size:32px">🎵</div>
          <div style="font-size:13px;color:var(--text2)">TikTok no permite reproducir aquí</div>
        </div>
        <button class="btn btn-outline btn-full" style="margin-bottom:12px" @click="abrirExterno">
          Abrir en TikTok ↗
        </button>
      </div>

      <!-- Cualquier otra URL -->
      <div v-else>
        <div class="video-placeholder" style="margin-bottom:12px">
          <div style="font-size:32px">🔗</div>
          <div style="font-size:13px;color:var(--text2)">Enlace guardado</div>
        </div>
        <button class="btn btn-outline btn-full" style="margin-bottom:12px" @click="abrirExterno">
          Abrir enlace ↗
        </button>
      </div>

      <div class="form-group">
        <label class="form-label">URL del video</label>
        <input class="form-input" type="url" placeholder="YouTube, TikTok u otro enlace..."
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

const youtubeId = computed(() => {
  const m = urlInput.value.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
})

const isTikTok = computed(() => /tiktok\.com/i.test(urlInput.value))

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
