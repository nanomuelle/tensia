/**
 * Configuración de Playwright para los tests E2E de Tensia.
 * Referencia arquitectónica: ADR-004, ADR-008
 *
 * Estrategia de arranque:
 *   - Playwright levanta automáticamente `vite preview --port 3000` antes de ejecutar los specs.
 *   - El build de producción (`dist/`) debe existir; se genera con `npm run build`.
 *   - Playwright espera a que http://localhost:3000 responda antes de lanzar los specs.
 *   - El aislamiento de datos se hace mediante `localStorage` del contexto Playwright (sin servidor de datos).
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
  // Con BK-24 (Vite), se sirve el build de dist/ mediante vite preview en :3000.
  webServer: {
    command: 'vite preview --port 3000',
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
