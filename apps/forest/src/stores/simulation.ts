import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useSimulationStore = defineStore('simulation', () => {
  const leafSpeed = ref(1.5);
  const spawnCount = ref(10);
  const leafCount = ref(0);
  const shaderIntensity = ref(0.5);
  const showCollisions = ref(false);

  return {
    leafSpeed,
    spawnCount,
    leafCount,
    shaderIntensity,
    showCollisions,
  };
});
