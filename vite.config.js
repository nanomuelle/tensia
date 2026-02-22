// vite.config.js — BK-24 (Fase 0: Vite como build tool, sin Svelte aún)
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  root: 'apps/frontend',           // index.html vive aquí
  base: process.env.VITE_BASE_PATH ?? '/',
  build: {
    outDir: '../../dist',          // relativo al root → dist/ en la raíz del repo
    emptyOutDir: true,
  },
  plugins: [
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
