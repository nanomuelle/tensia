// vitest.config.js — BK-25 (tests de componentes Svelte con Vitest)
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({ hot: false })],
  // Usar la variante de navegador de Svelte en lugar de la de servidor (SSR)
  resolve: {
    conditions: ['browser'],
  },
  test: {
    // Entorno navegador simulado para acceder a DOM
    environment: 'jsdom',
    // Globals (describe, it, expect, vi…) disponibles sin importar
    globals: true,
    // Configuración inicial: @testing-library/jest-dom
    setupFiles: ['./vitest.setup.js'],
    // Solo los tests de los componentes migrados a Svelte (BK-25)
    include: [
      'apps/frontend/tests/components/Toast.test.js',
      'apps/frontend/tests/components/IosWarning.test.js',
      'apps/frontend/tests/components/MeasurementList.test.js',
      'apps/frontend/tests/components/MeasurementChart.test.js',
      'apps/frontend/tests/components/HomeView.test.js',
    ],
  },
});
