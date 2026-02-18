/**
 * Configuración de Playwright para los tests E2E de Tensia.
 * Referencia arquitectónica: ADR-004
 *
 * Estrategia de arranque:
 *   - El backend Express arranca con SERVE_STATIC=true para servir también el frontend.
 *   - DATA_FILE apunta a un archivo de datos aislado para los tests E2E.
 *   - Playwright espera a que http://localhost:3000 responda antes de lanzar los specs.
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Directorio donde están los specs E2E
  testDir: './apps/frontend/tests/e2e/flows',

  // Tiempo máximo por test (30 s es suficiente para el MVP)
  timeout: 30_000,

  // En CI no reintentar; en local se puede subir a 1 para estabilidad
  retries: process.env.CI ? 0 : 0,

  // Ejecutar tests en serie para evitar concurrencia sobre el mismo archivo JSON
  workers: 1,

  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    // URL base; los specs pueden usar page.goto('/') en lugar de la URL completa
    baseURL: 'http://localhost:3000',

    // Headless en CI, con cabecera en desarrollo local
    headless: process.env.CI ? true : true,

    // Captura de pantalla solo en fallo
    screenshot: 'only-on-failure',

    // Trace solo en el primer reintento (útil para depurar en CI)
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Arranque automático del servidor antes de los tests.
  // El backend dev debe implementar el soporte de SERVE_STATIC=true en app.js.
  webServer: {
    command: 'SERVE_STATIC=true DATA_FILE=data/measurements.e2e.json node apps/backend/src/index.js',
    url: 'http://localhost:3000',
    // Reusar el servidor si ya está en marcha (útil en desarrollo local)
    reuseExistingServer: !process.env.CI,
    // Tiempo máximo para que el servidor arranque
    timeout: 15_000,
    // Suprimir la salida del servidor en los logs de Playwright
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
