/**
 * [TC-10] — Estado vacío en primera carga
 *
 * Dado:  el backend no tiene mediciones
 * Cuando: el usuario abre la app
 * Entonces: se muestra el mensaje "Sin mediciones todavía" y el botón "Nueva medición"
 *
 * Referencia arquitectónica: ADR-004, docs/testing/test-cases.md#TC-10
 */
import { test, expect } from '@playwright/test';
import { rm } from 'node:fs/promises';
import path from 'node:path';
import { SELECTORS } from '../helpers/pageObjects.js';

// Ruta al archivo de datos E2E (relativa al cwd del proceso Playwright, que es la raíz del proyecto)
const DATA_E2E = path.resolve(process.cwd(), 'data/measurements.e2e.json');

test.describe('TC-10 — Estado vacío en primera carga', () => {
  test.beforeEach(async () => {
    // Eliminar el archivo de datos para garantizar que el backend empieza sin mediciones.
    // JsonFileAdapter.getAll() lo recrea vacío si no existe.
    await rm(DATA_E2E, { force: true });
  });

  test('muestra #estado-vacio con el mensaje correcto', async ({ page }) => {
    await page.goto('/');

    // El estado vacío debe hacerse visible tras recibir la respuesta del backend
    await expect(page.locator(SELECTORS.estadoVacio)).toBeVisible();
    await expect(page.locator(SELECTORS.estadoVacio)).toContainText('Sin mediciones todavía');
    await expect(page.locator(SELECTORS.estadoVacio)).toContainText('Nueva medición');
  });

  test('muestra el botón "Nueva medición" cuando no hay mediciones', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator(SELECTORS.btnNuevaMedicion)).toBeVisible();
    await expect(page.locator(SELECTORS.btnNuevaMedicion)).toContainText('Nueva medición');
  });

  test('no muestra la lista de mediciones ni el estado de error', async ({ page }) => {
    await page.goto('/');

    // Esperamos el estado vacío para confirmar que la carga terminó
    await expect(page.locator(SELECTORS.estadoVacio)).toBeVisible();

    await expect(page.locator(SELECTORS.estadoError)).toBeHidden();
    await expect(page.locator(SELECTORS.listaMediciones)).toBeHidden();
  });
});
