<script setup lang="ts">
import { useSimulationStore } from '../stores/simulation';

const store = useSimulationStore();
</script>

<template>
  <div class="control-panel">
    <h3>Forest Simulation</h3>
    <div class="field">
      <label>Wind Speed: {{ store.leafSpeed.toFixed(1) }}</label>
      <input type="range" v-model.number="store.leafSpeed" min="0" max="10" step="0.1" />
    </div>
    <div class="field">
      <label>Spawn Count: {{ store.spawnCount }}</label>
      <input type="range" v-model.number="store.spawnCount" min="1" max="100" step="1" />
    </div>
    <div class="field">
      <label>Sunlight Intensity: {{ store.shaderIntensity.toFixed(2) }}</label>
      <input type="range" v-model.number="store.shaderIntensity" min="0" max="1" step="0.01" />
    </div>
    <div class="field">
      <label>Leaves: {{ store.leafCount }}</label>
    </div>
    <div class="field">
      <label>
        <input type="checkbox" v-model="store.showCollisions" />
        Leaf Collisions
      </label>
    </div>
  </div>
</template>

<style scoped>
.control-panel {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(10, 30, 10, 0.7);
  color: #e0ffe0;
  padding: 15px;
  border-radius: 8px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  backdrop-filter: blur(8px);
  width: 220px;
  z-index: 100;
  border: 1px solid #2d5a27;
}
h3 { margin-top: 0; font-size: 16px; border-bottom: 1px solid #2d5a27; padding-bottom: 8px; color: #42b883; }
.field { margin: 12px 0; }
label { display: block; margin-bottom: 4px; font-size: 13px; }
input[type="range"] { width: 100%; accent-color: #42b883; }
</style>
