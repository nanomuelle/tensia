// vite.config.js — BK-25 (Fase 1: plugin Svelte activado)
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  root: 'apps/frontend',           // index.html vive aquí
  envDir: '../../',                // .env en la raíz del repo (no en apps/frontend/)
  base: process.env.VITE_BASE_PATH ?? '/',
  build: {
    outDir: '../../dist',          // relativo al root → dist/ en la raíz del repo
    emptyOutDir: true,
  },
  plugins: [
    svelte(),
    // Service Worker eliminado: vite-plugin-pwa causaba conflictos con el flujo
    // OAuth 2.0 PKCE al cachear versiones con VITE_REDIRECT_URI incorrectas.
    // Reintroducir cuando el login esté estable.
  ],
});
