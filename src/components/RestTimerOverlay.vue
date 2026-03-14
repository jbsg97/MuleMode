<template>
  <div class="rest-overlay" :class="{ show: store.restVisible }">
    <div style="font-family:'Bebas Neue',sans-serif;font-size:22px;color:var(--text2);letter-spacing:2px">DESCANSANDO</div>

    <div class="rest-ring-wrap">
      <svg width="180" height="180" viewBox="0 0 180 180">
        <circle cx="90" cy="90" r="80" fill="none" stroke="var(--border)" stroke-width="6"/>
        <circle
          cx="90" cy="90" r="80" fill="none"
          stroke="var(--accent)" stroke-width="6"
          stroke-linecap="round"
          stroke-dasharray="502.65"
          :stroke-dashoffset="store.restDashOffset"
          transform="rotate(-90 90 90)"
          style="transition: stroke-dashoffset 1s linear"
        />
      </svg>
      <div class="rest-circle-inner">
        <div class="rest-time">{{ store.restRemaining }}</div>
        <div class="rest-label">seg</div>
      </div>
    </div>

    <div class="rest-btns">
      <button class="btn btn-outline" @click="store.ajustarDescanso(-15)">-15s</button>
      <button class="btn btn-accent" @click="store.saltarDescanso()">Listo ✓</button>
      <button class="btn btn-outline" @click="store.ajustarDescanso(15)">+15s</button>
    </div>

    <div style="font-size:13px;color:var(--text3)">Toca "Listo" cuando estés listo para continuar</div>
  </div>
</template>

<script setup>
import { watch } from 'vue'
import { useStore } from '../store/index.js'

const store = useStore()

function playBeep() {
  try {
    const AudioCtx = /** @type {any} */ (window).AudioContext || /** @type {any} */ (window).webkitAudioContext
    const ctx = new AudioCtx()
    const beeps = [
      { freq: 880, start: 0,   dur: 0.12 },
      { freq: 880, start: 0.15, dur: 0.12 },
      { freq: 1100, start: 0.30, dur: 0.25 },
    ]
    beeps.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.4, ctx.currentTime + start)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur)
      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + dur)
    })
  } catch {}
}

watch(() => store.restRemaining, (val) => {
  if (val === 0) playBeep()
})
</script>
