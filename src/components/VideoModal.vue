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

      <!-- TikTok: embed iframe -->
      <div v-else-if="tikTokId">
        <div class="video-frame video-frame--tiktok">
          <iframe :src="`https://www.tiktok.com/embed/v2/${tikTokId}`"
            allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            referrerpolicy="strict-origin-when-cross-origin"></iframe>
        </div>
        <button class="btn btn-outline btn-full" style="margin-top:8px;margin-bottom:12px" @click="abrirExterno">
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
        <label class="form-label">URL o código embed del video</label>
        <textarea class="form-input" rows="2"
          placeholder="Pega la URL de YouTube / TikTok, o el código embed de TikTok"
          v-model="urlInput"
          style="resize:none;font-size:12px;line-height:1.5"></textarea>
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

// Extract TikTok video ID from URL or <blockquote> embed code
const tikTokId = computed(() => {
  const txt = urlInput.value
  // data-video-id="123..." (embed code)
  const fromEmbed = txt.match(/data-video-id="(\d+)"/)
  if (fromEmbed) return fromEmbed[1]
  // cite="https://www.tiktok.com/@.../video/123..."
  const fromCite = txt.match(/cite="https:\/\/www\.tiktok\.com\/@[^/]+\/video\/(\d+)"/)
  if (fromCite) return fromCite[1]
  // plain URL: tiktok.com/@.../video/123...
  const fromUrl = txt.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/)
  if (fromUrl) return fromUrl[1]
  // short link or embed URL: tiktok.com/embed/v2/123...
  const fromEmbed2 = txt.match(/tiktok\.com\/embed\/v2\/(\d+)/)
  if (fromEmbed2) return fromEmbed2[1]
  return null
})

function guardar() {
  let url = urlInput.value.trim()
  // If embed code was pasted, store a clean TikTok URL
  if (tikTokId.value) url = `https://www.tiktok.com/video/${tikTokId.value}`
  store.guardarVideo(url)
  store.videoModalVisible = false
}

function cerrar() {
  store.videoModalVisible = false
}

function abrirExterno() {
  if (tikTokId.value) {
    abrirTikTok(tikTokId.value)
  } else if (urlInput.value) {
    window.open(urlInput.value, '_blank')
  }
}

function abrirTikTok(videoId) {
  const webUrl  = `https://www.tiktok.com/video/${videoId}`
  const appUrl  = `tiktok://video/${videoId}`
  let appOpened = false

  // If page goes hidden, the app opened — cancel web fallback
  const onHide = () => { appOpened = true; clearTimeout(timer) }
  document.addEventListener('visibilitychange', onHide, { once: true })

  const timer = setTimeout(() => {
    document.removeEventListener('visibilitychange', onHide)
    if (!appOpened) window.open(webUrl, '_blank')
  }, 1500)

  window.location.href = appUrl
}
</script>
