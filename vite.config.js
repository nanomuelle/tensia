// vite.config.js — BK-25 (Fase 1: plugin Svelte activado)
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  root: 'apps/frontend',           // index.html vive aquí
  base: process.env.VITE_BASE_PATH ?? '/',
  build: {
    outDir: '../../dist',          // relativo al root → dist/ en la raíz del repo
    emptyOutDir: true,
  },
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      // manifest.json manual: lo gestionamos nosotros (en public/)
      manifest: false,
      workbox: {
        // Precachear todos los assets generados por Vite
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
      },
    }),
  ],
});
