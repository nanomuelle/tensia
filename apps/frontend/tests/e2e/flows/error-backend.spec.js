/**
 * [TC-11] — Banner de error si el backend no responde
 *
 * Dado:  el backend está caído (o simula un error)
 * Cuando: la app intenta cargar el historial
 * Entonces: se muestra el banner de error con el botón "Reintentar"
 *
 * Referencia arquitectónica: ADR-004, docs/testing/test-cases.md#TC-11
 *
 * Estrategia de simulación de fallo:
 *   Se usa page.route() para interceptar GET /measurements y abortar la
 *   conexión, simulando que el backend no responde (network error).
 *   Esto hace que fetch() rechace la promesa y el frontend llame a mostrarError().
 */
import { test, expect } from '@playwright/test';
import { rm } from 'node:fs/promises';
import path from 'node:path';
import { SELECTORS } from '../helpers/pageObjects.js';

const DATA_E2E = path.resolve(process.cwd(), 'data/measurements.e2e.json');

test.describe('TC-11 — Banner de error si el backend no responde', () => {
  test.beforeEach(async () => {
    // Limpiar datos para garantizar que, cuando el backend responde realmente,
    // lo hace con el almacén vacío (necesario en el test de reintento exitoso).
    await rm(DATA_E2E, { force: true });
  });
  test('muestra #estado-error cuando GET /measurements falla por red', async ({ page }) => {
    // Intercepta la llamada al API y aborta la conexión (simula backend caído)
    await page.route('**/measurements', (route) => route.abort('failed'));

    await page.goto('/');

    await expect(page.locator(SELECTORS.estadoError)).toBeVisible();
  });

  test('muestra el botón "Reintentar" dentro del banner de error', async ({ page }) => {
    await page.route('**/measurements', (route) => route.abort('failed'));

    await page.goto('/');

    await expect(page.locator(SELECTORS.estadoError)).toBeVisible();
    await expect(page.locator(SELECTORS.btnReintentar)).toBeVisible();
    await expect(page.locator(SELECTORS.btnReintentar)).toContainText('Reintentar');
  });

  test('no muestra #estado-vacio ni la lista cuando hay error de red', async ({ page }) => {
    await page.route('**/measurements', (route) => route.abort('failed'));

    await page.goto('/');

    await expect(page.locator(SELECTORS.estadoError)).toBeVisible();
    await expect(page.locator(SELECTORS.estadoVacio)).toBeHidden();
    await expect(page.locator(SELECTORS.listaMediciones)).toBeHidden();
  });

  test('"Reintentar" vuelve a llamar al backend y muestra estado vacío si responde', async ({ page }) => {
    // Primera carga: falla
    await page.route('**/measurements', (route) => route.abort('failed'));
    await page.goto('/');
    await expect(page.locator(SELECTORS.estadoError)).toBeVisible();

    // Levantar la intercepción para que el reintento llegue al backend real (vacío)
    await page.unroute('**/measurements');

    await page.locator(SELECTORS.btnReintentar).click();

    // Tras el reintento exitoso con backend vacío debe mostrar estado vacío
    await expect(page.locator(SELECTORS.estadoVacio)).toBeVisible();
    await expect(page.locator(SELECTORS.estadoError)).toBeHidden();
  });

  test('"Reintentar" vuelve a mostrar error si el backend sigue caído', async ({ page }) => {
    await page.route('**/measurements', (route) => route.abort('failed'));
    await page.goto('/');
    await expect(page.locator(SELECTORS.estadoError)).toBeVisible();

    await page.locator(SELECTORS.btnReintentar).click();

    // La intercepción sigue activa: el error debe persistir
    await expect(page.locator(SELECTORS.estadoError)).toBeVisible();
    await expect(page.locator(SELECTORS.estadoVacio)).toBeHidden();
  });
});
