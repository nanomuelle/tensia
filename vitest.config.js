// vitest.config.js — BK-28 (runner único)
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({ hot: false })],
  // Usar la variante de navegador de Svelte en lugar de la de servidor (SSR)
  resolve: {
    conditions: ['browser'],
  },
  test: {
    // Entorno predeterminado: jsdom; los tests de lógica pura anulan con @vitest-environment node
    environment: 'jsdom',
    // Globals (describe, it, expect, vi…) disponibles sin importar
    globals: true,
    // Configuración inicial: @testing-library/jest-dom
    setupFiles: ['./vitest.setup.js'],
    // Todos los tests del repositorio (backend + frontend)
    include: ['apps/**/tests/**/*.test.{js,svelte.js}'],
    coverage: {
      provider: 'v8',
      include: [
        'apps/backend/src/**/*.js',
        'apps/frontend/src/**/*.js',
        'apps/frontend/src/**/*.svelte',
      ],
      exclude: [
        'apps/backend/src/index.js',
        'apps/backend/src/api/app.js',
      ],
      thresholds: { lines: 70 },
    },
  },
});
