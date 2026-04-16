import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useSimulationStore = defineStore('simulation', () => {
  const bunnySpeed = ref(2);
  const spawnCount = ref(10);
  const bunnyCount = ref(0);
  const shaderIntensity = ref(0.5);
  const showCollisions = ref(false);

  return {
    bunnySpeed,
    spawnCount,
    bunnyCount,
    shaderIntensity,
    showCollisions,
  };
});
