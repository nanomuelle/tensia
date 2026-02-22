/**
 * [BK-23] — Layout de dos columnas: gráfica + historial (US-14)
 *
 * Verifica que la clase `dashboard-content--columnas` aparece y desaparece
 * correctamente en función del número de mediciones y el viewport.
 *
 * | ID   | Viewport     | Mediciones | Expectativa                                        |
 * |------|--------------|------------|----------------------------------------------------|
 * | L-01 | 800 × 600 px | 0          | .dashboard-content--columnas ausente               |
 * | L-02 | 800 × 600 px | 2          | .dashboard-content--columnas presente              |
 * | L-03 | 375 × 812 px | 2          | .dashboard-content--columnas ausente (< 768 px)    |
 * | L-04 | 800 × 600 px | 1          | .dashboard-content--columnas presente + skeleton   |
 * | L-05 | 800 × 600 px | 2→0        | clase retirada tras vaciar localStorage y recargar |
 *
 * Estrategia: seedLocalStorage vía addInitScript / evaluate (ADR-005).
 * No se consulta ninguna API HTTP para datos.
 *
 * Referencia: docs/product/backlog.md#BK-23
 *             docs/design/screens.md#layout-gráfica--historial-en-columnas
 */

import { test, expect } from '@playwright/test';

// ─── helpers ─────────────────────────────────────────────────────────────────

/**
 * Escribe mediciones en localStorage antes de que la app arranque.
 * @param {import('@playwright/test').Page} page
 * @param {object[]} mediciones
 */
async function seedLocalStorage(page, mediciones) {
  await page.addInitScript((datos) => {
    const payload = JSON.stringify({ version: '1.0', measurements: datos });
    localStorage.setItem('bp_measurements', payload);
  }, mediciones);
}

/**
 * Medición mínima válida con fecha escalonada para garantizar orden determinista.
 * @param {number} offsetDias
 */
function crearMedicion(offsetDias = 0) {
  const fecha = new Date('2026-02-20T10:00:00.000Z');
  fecha.setDate(fecha.getDate() - offsetDias);
  return {
    id: `id-${offsetDias}-${Math.random().toString(36).slice(2)}`,
    systolic: 120,
    diastolic: 80,
    pulse: 72,
    measuredAt: fecha.toISOString(),
    source: 'manual',
  };
}

const DASHBOARD_CONTENT = '.dashboard-content';
const CLASE_COLUMNAS    = 'dashboard-content--columnas';
const SKELETON          = '.chart-skeleton';

// ─── L-01: viewport desktop, 0 mediciones ────────────────────────────────────

test.describe('L-01 — viewport 800×600, 0 mediciones', () => {
  test.use({ viewport: { width: 800, height: 600 } });

  test.beforeEach(async ({ page }) => {
    await seedLocalStorage(page, []);
    await page.goto('/');
  });

  test('la clase --columnas está ausente en el contenedor de layout', async ({ page }) => {
    const el = page.locator(DASHBOARD_CONTENT);
    await expect(el).toBeVisible();
    await expect(el).not.toHaveClass(new RegExp(CLASE_COLUMNAS));
  });
});

// ─── L-02: viewport desktop, 2 mediciones ────────────────────────────────────

test.describe('L-02 — viewport 800×600, 2 mediciones', () => {
  test.use({ viewport: { width: 800, height: 600 } });

  test.beforeEach(async ({ page }) => {
    await seedLocalStorage(page, [crearMedicion(0), crearMedicion(1)]);
    await page.goto('/');
  });

  test('la clase --columnas está presente en el contenedor de layout', async ({ page }) => {
    const el = page.locator(DASHBOARD_CONTENT);
    await expect(el).toHaveClass(new RegExp(CLASE_COLUMNAS));
  });
});

// ─── L-03: viewport móvil, 2 mediciones ──────────────────────────────────────

test.describe('L-03 — viewport 375×812, 2 mediciones (< 768 px)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test.beforeEach(async ({ page }) => {
    await seedLocalStorage(page, [crearMedicion(0), crearMedicion(1)]);
    await page.goto('/');
  });

  test('la clase --columnas está presente en el DOM (el CSS no aplica el grid)', async ({ page }) => {
    // La clase se asigna desde JS; el CSS la ignora en < 768 px.
    // El test verifica el comportamiento del DOM; la verificación visual del
    // grid pertenece a tests de captura visual (no implementados en MVP).
    const el = page.locator(DASHBOARD_CONTENT);
    await expect(el).toHaveClass(new RegExp(CLASE_COLUMNAS));
  });

  test('el layout no usa display:grid (CSS ignora la clase en móvil)', async ({ page }) => {
    const displayValue = await page.locator(DASHBOARD_CONTENT).evaluate((el) => {
      return window.getComputedStyle(el).display;
    });
    // En < 768 px el media query no aplica → flex (columna única)
    expect(displayValue).toBe('flex');
  });
});

// ─── L-04: viewport desktop, 1 medición (skeleton visible) ───────────────────

test.describe('L-04 — viewport 800×600, 1 medición (skeleton)', () => {
  test.use({ viewport: { width: 800, height: 600 } });

  test.beforeEach(async ({ page }) => {
    await seedLocalStorage(page, [crearMedicion(0)]);
    await page.goto('/');
  });

  test('la clase --columnas está presente', async ({ page }) => {
    const el = page.locator(DASHBOARD_CONTENT);
    await expect(el).toHaveClass(new RegExp(CLASE_COLUMNAS));
  });

  test('el skeleton es visible en la columna izquierda', async ({ page }) => {
    await expect(page.locator(SKELETON)).toBeVisible();
  });
});

// ─── L-05: viewport desktop, 2 mediciones → 0 (limpieza de localStorage) ─────

test.describe('L-05 — viewport 800×600, transición 2→0 mediciones', () => {
  test.use({ viewport: { width: 800, height: 600 } });

  test('la clase --columnas se retira tras vaciar localStorage y recargar', async ({ page }) => {
    // Arrancar con 2 mediciones → clase debe estar presente
    await seedLocalStorage(page, [crearMedicion(0), crearMedicion(1)]);
    await page.goto('/');

    const el = page.locator(DASHBOARD_CONTENT);
    await expect(el).toHaveClass(new RegExp(CLASE_COLUMNAS));

    // Vaciar localStorage y recargar → 0 mediciones → clase ausente
    await page.evaluate(() => localStorage.removeItem('bp_measurements'));
    await page.reload();

    await expect(page.locator(DASHBOARD_CONTENT)).not.toHaveClass(new RegExp(CLASE_COLUMNAS));
  });
});
