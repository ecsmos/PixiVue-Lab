import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/PixiVue-Lab/forest/',
  server: {
    port: 3001,
  },
  plugins: [vue()],
});
