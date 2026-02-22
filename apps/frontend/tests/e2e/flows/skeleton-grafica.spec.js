/**
 * [TC-13] — Skeleton de gráfica cuando no hay datos suficientes (US-11)
 *
 * Dado:  localStorage contiene 0, 1 ó ≥2 mediciones
 * Cuando: accede a la pantalla principal
 * Entonces:
 *   - 0 mediciones → se muestra el skeleton (.chart-skeleton) con el texto informativo
 *   - 1 medición   → idem
 *   - ≥2 mediciones → se muestra el SVG real; el skeleton no existe
 *
 * Estrategia de seeding:
 *   Se usa page.addInitScript() para escribir la clave `bp_measurements`
 *   en localStorage antes de que la app cargue; no se consulta ninguna API HTTP.
 *   Esto sigue la restricción de ADR-005 y las instrucciones del agente QA.
 *
 * Referencia: docs/product/user-stories.md#US-11, docs/testing/test-cases.md
 */
import { test, expect } from '@playwright/test';

// ─── helpers ────────────────────────────────────────────────────────────────

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

/** Medición mínima válida. */
function crearMedicion(overrides = {}) {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : `id-${Math.random()}`,
    systolic: 120,
    diastolic: 80,
    pulse: 72,
    measuredAt: new Date().toISOString(),
    source: 'manual',
    ...overrides,
  };
}

// ─── selector del skeleton ───────────────────────────────────────────────────

const SKELETON       = '.chart-skeleton';
const SKELETON_MSG   = '.chart-skeleton__mensaje';
const TEXTO_ESPERADO = 'Sin datos suficientes para mostrar la gráfica';
const SECCION        = '#seccion-grafica';
const CHART_SVG      = '#chart-mediciones svg';

// ─── suite ───────────────────────────────────────────────────────────────────

test.describe('US-11 — Skeleton de gráfica cuando no hay datos suficientes', () => {

  // ── 0 mediciones ────────────────────────────────────────────────────────────

  test.describe('con 0 mediciones', () => {
    test.beforeEach(async ({ page }) => {
      await seedLocalStorage(page, []);
      await page.goto('/');
    });

    test('la sección de gráfica es visible', async ({ page }) => {
      await expect(page.locator(SECCION)).toBeVisible();
    });

    test('se muestra el skeleton', async ({ page }) => {
      await expect(page.locator(SKELETON)).toBeVisible();
    });

    test('el skeleton contiene el texto informativo', async ({ page }) => {
      await expect(page.locator(SKELETON_MSG)).toContainText(TEXTO_ESPERADO);
    });

    test('no se renderiza ningún SVG de gráfica', async ({ page }) => {
      await expect(page.locator(CHART_SVG)).toHaveCount(0);
    });
  });

  // ── 1 medición ──────────────────────────────────────────────────────────────

  test.describe('con 1 medición', () => {
    test.beforeEach(async ({ page }) => {
      await seedLocalStorage(page, [
        crearMedicion({ measuredAt: '2026-02-01T10:00:00.000Z' }),
      ]);
      await page.goto('/');
    });

    test('la sección de gráfica es visible', async ({ page }) => {
      await expect(page.locator(SECCION)).toBeVisible();
    });

    test('se muestra el skeleton', async ({ page }) => {
      await expect(page.locator(SKELETON)).toBeVisible();
    });

    test('el skeleton contiene el texto informativo', async ({ page }) => {
      await expect(page.locator(SKELETON_MSG)).toContainText(TEXTO_ESPERADO);
    });

    test('no se renderiza ningún SVG de gráfica', async ({ page }) => {
      await expect(page.locator(CHART_SVG)).toHaveCount(0);
    });
  });

  // ── ≥2 mediciones → gráfica real ────────────────────────────────────────────

  test.describe('con 2 o más mediciones', () => {
    test.beforeEach(async ({ page }) => {
      await seedLocalStorage(page, [
        crearMedicion({ measuredAt: '2026-02-01T10:00:00.000Z', systolic: 120, diastolic: 80 }),
        crearMedicion({ measuredAt: '2026-02-02T10:00:00.000Z', systolic: 125, diastolic: 85 }),
      ]);
      await page.goto('/');
    });

    test('la sección de gráfica es visible', async ({ page }) => {
      await expect(page.locator(SECCION)).toBeVisible();
    });

    test('no se muestra el skeleton', async ({ page }) => {
      await expect(page.locator(SKELETON)).toHaveCount(0);
    });

    test('se renderiza el SVG de la gráfica', async ({ page }) => {
      await expect(page.locator(CHART_SVG)).toBeVisible();
    });

    test('el SVG tiene el aria-label correcto', async ({ page }) => {
      const svg = page.locator(CHART_SVG);
      await expect(svg).toHaveAttribute(
        'aria-label',
        'Gráfica de evolución de tensión arterial',
      );
    });
  });

  // ── transición: de 1 a 2 mediciones sin recargar ────────────────────────────

  test.describe('transición al añadir la segunda medición desde el formulario', () => {
    test('al guardar la segunda medición el skeleton se reemplaza por la gráfica SVG', async ({ page }) => {
      // Seeding: una sola medición preexistente
      await seedLocalStorage(page, [
        crearMedicion({ measuredAt: '2026-01-15T08:00:00.000Z', systolic: 115, diastolic: 75 }),
      ]);
      await page.goto('/');

      // Verificamos el estado inicial: skeleton visible, sin SVG
      await expect(page.locator(SKELETON)).toBeVisible();
      await expect(page.locator(CHART_SVG)).toHaveCount(0);

      // Añadimos la segunda medición desde el formulario
      await page.locator('#btn-nueva-medicion').click();
      await page.locator('#input-systolic').fill('130');
      await page.locator('#input-diastolic').fill('85');
      await page.locator('#btn-guardar').click();

      // Tras guardar, el skeleton debe desaparecer y el SVG aparecer
      await expect(page.locator(SKELETON)).toHaveCount(0);
      await expect(page.locator(CHART_SVG)).toBeVisible();
    });
  });

  // ── caso localStorage ausente (null) ────────────────────────────────────────

  test.describe('cuando localStorage no contiene la clave (primera visita)', () => {
    test.beforeEach(async ({ page }) => {
      // No se escribe nada en localStorage → primera visita real
      await page.goto('/');
    });

    test('se muestra el skeleton', async ({ page }) => {
      await expect(page.locator(SKELETON)).toBeVisible();
    });

    test('el skeleton contiene el texto informativo', async ({ page }) => {
      await expect(page.locator(SKELETON_MSG)).toContainText(TEXTO_ESPERADO);
    });
  });
});
