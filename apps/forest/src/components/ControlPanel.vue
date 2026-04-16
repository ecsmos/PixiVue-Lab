<script setup lang="ts">
import { useSimulationStore } from '../stores/simulation';

const store = useSimulationStore();
</script>

<template>
  <div class="control-panel">
    <h3>PixiVue-Lab Settings</h3>
    <div class="field">
      <label>Speed: {{ store.bunnySpeed.toFixed(1) }}</label>
      <input type="range" v-model.number="store.bunnySpeed" min="0" max="10" step="0.1" />
    </div>
    <div class="field">
      <label>Spawn Count: {{ store.spawnCount }}</label>
      <input type="range" v-model.number="store.spawnCount" min="1" max="100" step="1" />
    </div>
    <div class="field">
      <label>Shader Intensity: {{ store.shaderIntensity.toFixed(2) }}</label>
      <input type="range" v-model.number="store.shaderIntensity" min="0" max="1" step="0.01" />
    </div>
    <div class="field">
      <label>Bunnies: {{ store.bunnyCount }}</label>
    </div>
    <div class="field">
      <label>
        <input type="checkbox" v-model="store.showCollisions" />
        Enable Collisions
      </label>
    </div>
  </div>
</template>

<style scoped>
.control-panel {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 15px;
  border-radius: 8px;
  font-family: sans-serif;
  backdrop-filter: blur(5px);
  width: 220px;
  z-index: 100;
}
h3 { margin-top: 0; font-size: 16px; border-bottom: 1px solid #444; padding-bottom: 8px; }
.field { margin: 12px 0; }
label { display: block; margin-bottom: 4px; font-size: 13px; }
input[type="range"] { width: 100%; }
</style>
