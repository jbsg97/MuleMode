<template>
  <nav class="bottom-nav">
    <button class="nav-btn" :class="{ active: current === 'rutinas' }" @click="$emit('navigate', 'rutinas')">
      <div class="nav-icon">🏋️</div><span>Rutinas</span>
    </button>
    <button class="nav-btn" :class="{ active: current === 'historial' }" @click="$emit('navigate', 'historial')">
      <div class="nav-icon">📋</div><span>Historial</span>
    </button>
    <button class="nav-btn" :class="{ active: current === 'progreso' }" @click="$emit('navigate', 'progreso')">
      <div class="nav-icon">📈</div><span>Progreso</span>
    </button>
    <button class="nav-btn" @click="$emit('settings')">
      <div class="nav-icon">⚙️</div><span>Ajustes</span>
    </button>
  </nav>
</template>

<script setup>
defineProps({ current: String })
defineEmits(['navigate', 'settings'])
</script>
