/**
 * [TC-11] — Banner de error si el almacenamiento local falla
 *
 * Dado:  localStorage.getItem lanza una excepción (p.ej. almacenamiento bloqueado)
 * Cuando: la app intenta cargar el historial
 * Entonces: se muestra el banner de error con el botón "Reintentar"
 *
 * Referencia arquitectónica: ADR-005, docs/testing/test-cases.md#TC-11
 *
 * Estrategia de simulación de fallo:
 *   Se usa page.addInitScript() para sustituir localStorage.getItem por una función
 *   que lanza un error, simulando que el almacenamiento no está disponible.
 *   Esto hace que localStorageAdapter.getAll() rechace la promesa y el frontend
 *   llame a mostrarError().
 *
 *   Para el test de "Reintentar con éxito", se usa page.evaluate() tras la carga
 *   inicial para restaurar el comportamiento normal (window.__storageThrows = false).
 */
import { test, expect } from '@playwright/test';
import { rm } from 'node:fs/promises';
import path from 'node:path';
import { SELECTORS } from '../helpers/pageObjects.js';

const DATA_E2E = path.resolve(process.cwd(), 'data/measurements.e2e.json');

test.describe('TC-11 — Banner de error si el almacenamiento local falla', () => {
  test.beforeEach(async () => {
    // Partir de almacén vacío para que el reintento exitoso muestre estado vacío
    await rm(DATA_E2E, { force: true });
  });

  test('muestra #estado-error cuando localStorage.getItem lanza una excepción', async ({ page }) => {
    // Reemplaza getItem para que siempre lance error (simula almacenamiento no disponible)
    await page.addInitScript(() => {
      Storage.prototype.getItem = function () {
        throw new Error('Storage not available');
      };
    });

    await page.goto('/');

    await expect(page.locator(SELECTORS.estadoError)).toBeVisible();
  });

  test('muestra el botón "Reintentar" dentro del banner de error', async ({ page }) => {
    await page.addInitScript(() => {
      Storage.prototype.getItem = function () {
        throw new Error('Storage not available');
      };
    });

    await page.goto('/');

    await expect(page.locator(SELECTORS.estadoError)).toBeVisible();
    await expect(page.locator(SELECTORS.btnReintentar)).toBeVisible();
    await expect(page.locator(SELECTORS.btnReintentar)).toContainText('Reintentar');
  });

  test('no muestra #estado-vacio ni la lista cuando hay error de almacenamiento', async ({ page }) => {
    await page.addInitScript(() => {
      Storage.prototype.getItem = function () {
        throw new Error('Storage not available');
      };
    });

    await page.goto('/');

    await expect(page.locator(SELECTORS.estadoError)).toBeVisible();
    await expect(page.locator(SELECTORS.estadoVacio)).toBeHidden();
    await expect(page.locator(SELECTORS.listaMediciones)).toBeHidden();
  });

  test('"Reintentar" vuelve a leer localStorage y muestra estado vacío si responde', async ({ page }) => {
    // Primera carga: getItem lanza — se usa flag para permitir desactivar el error
    await page.addInitScript(() => {
      window.__storageThrows = true;
      const originalGetItem = Storage.prototype.getItem;
      Storage.prototype.getItem = function (key) {
        if (window.__storageThrows && key === 'bp_measurements') {
          throw new Error('Storage not available');
        }
        return originalGetItem.call(this, key);
      };
    });

    await page.goto('/');
    await expect(page.locator(SELECTORS.estadoError)).toBeVisible();

    // Desactivar el error para que el reintento tenga éxito
    await page.evaluate(() => { window.__storageThrows = false; });

    await page.locator(SELECTORS.btnReintentar).click();

    // Tras el reintento exitoso con almacén vacío debe mostrar estado vacío
    await expect(page.locator(SELECTORS.estadoVacio)).toBeVisible();
    await expect(page.locator(SELECTORS.estadoError)).toBeHidden();
  });

  test('"Reintentar" vuelve a mostrar error si el almacenamiento sigue fallando', async ({ page }) => {
    await page.addInitScript(() => {
      Storage.prototype.getItem = function () {
        throw new Error('Storage not available');
      };
    });

    await page.goto('/');
    await expect(page.locator(SELECTORS.estadoError)).toBeVisible();

    await page.locator(SELECTORS.btnReintentar).click();

    // El error persiste: getItem sigue lanzando
    await expect(page.locator(SELECTORS.estadoError)).toBeVisible();
    await expect(page.locator(SELECTORS.estadoVacio)).toBeHidden();
  });
});
