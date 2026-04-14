<script setup lang="ts">
import ControlPanel from './components/ControlPanel.vue';
import PixiCanvas from './components/PixiCanvas.vue';
</script>

<template>
  <div id="Root">
    <PixiCanvas />
    <ControlPanel />
  </div>
</template>

<style lang="scss">
body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  background-color: #000;
}
#Root {
  width: 100vw;
  height: 100vh;
  position: relative;
}
</style>
