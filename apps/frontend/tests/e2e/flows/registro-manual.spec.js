/**
 * [TC-09] — Registro manual completo (flujo E2E crítico)
 *
 * Dado:  la app está cargada en el navegador y el backend en marcha
 * Cuando: el usuario abre el formulario, introduce valores válidos y pulsa "Guardar"
 * Entonces: el formulario se cierra, la medición aparece al inicio del historial,
 *           sin recargar la página
 *
 * Referencia arquitectónica: ADR-004, docs/testing/test-cases.md#TC-09
 */
import { test, expect } from '@playwright/test';
import { rm } from 'node:fs/promises';
import path from 'node:path';
import { SELECTORS } from '../helpers/pageObjects.js';

const DATA_E2E = path.resolve(process.cwd(), 'data/measurements.e2e.json');

test.describe('TC-09 — Registro manual completo', () => {
  test.beforeEach(async () => {
    // Partir siempre de un almacén vacío para garantizar aislamiento entre tests
    await rm(DATA_E2E, { force: true });
  });

  // -------------------------------------------------------------------
  // Helper: abre el formulario y rellena los campos obligatorios.
  // - measuredAt: si se pasa, sobreescribe el valor que auto-rellena
  //   rellenarFechaActual(). Necesario en tests de ordenación porque
  //   rellenarFechaActual() trunca al minuto (BUG-01: ver test-cases.md).
  // -------------------------------------------------------------------
  async function rellenarFormulario(page, { systolic, diastolic, pulse, measuredAt } = {}) {
    await page.locator(SELECTORS.btnNuevaMedicion).click();
    await expect(page.locator(SELECTORS.formulario)).toBeVisible();

    await page.locator(SELECTORS.inputSistolica).fill(String(systolic ?? 120));
    await page.locator(SELECTORS.inputDiastolica).fill(String(diastolic ?? 80));
    if (pulse !== undefined) {
      await page.locator(SELECTORS.inputPulso).fill(String(pulse));
    }
    // Sobreescribir la fecha solo cuando se proporciona explícitamente
    if (measuredAt !== undefined) {
      await page.locator(SELECTORS.inputFecha).fill(measuredAt);
    }
  }

  // -------------------------------------------------------------------
  // TC-09 — flujo principal
  // -------------------------------------------------------------------

  test('el formulario se cierra tras guardar una medición válida', async ({ page }) => {
    await page.goto('/');
    await rellenarFormulario(page, { systolic: 120, diastolic: 80 });

    await page.locator(SELECTORS.btnGuardar).click();

    await expect(page.locator(SELECTORS.formulario)).toBeHidden();
    await expect(page.locator(SELECTORS.btnNuevaMedicion)).toBeVisible();
  });

  test('la medición guardada aparece en el historial', async ({ page }) => {
    await page.goto('/');
    await rellenarFormulario(page, { systolic: 125, diastolic: 82 });

    await page.locator(SELECTORS.btnGuardar).click();

    // La lista debe hacerse visible con al menos un elemento
    await expect(page.locator(SELECTORS.listaMediciones)).toBeVisible();
    const items = page.locator(`${SELECTORS.listaMediciones} li`);
    await expect(items).toHaveCount(1);
    await expect(items.first()).toContainText('125');
    await expect(items.first()).toContainText('82');
  });

  test('la nueva medición queda en primera posición (más reciente primero)', async ({ page }) => {
    // NOTA: se pasan fechas explícitas con minutos distintos para sortear BUG-01
    // (rellenarFechaActual trunca al minuto → timestamps iguales → orden no determinista).
    await page.goto('/');

    // Primera medición — más antigua
    await rellenarFormulario(page, { systolic: 110, diastolic: 70, measuredAt: '2026-02-18T10:00' });
    await page.locator(SELECTORS.btnGuardar).click();
    await expect(page.locator(SELECTORS.listaMediciones)).toBeVisible();

    // Segunda medición — más reciente
    await rellenarFormulario(page, { systolic: 130, diastolic: 85, measuredAt: '2026-02-18T11:00' });
    await page.locator(SELECTORS.btnGuardar).click();
    await expect(page.locator(SELECTORS.listaMediciones)).toBeVisible();

    const items = page.locator(`${SELECTORS.listaMediciones} li`);
    await expect(items).toHaveCount(2);
    // La más reciente (11:00) debe ir primera
    await expect(items.first()).toContainText('130');
    await expect(items.first()).toContainText('85');
  });

  test('la medición guardada incluye el pulso cuando se introduce', async ({ page }) => {
    await page.goto('/');
    await rellenarFormulario(page, { systolic: 118, diastolic: 76, pulse: 65 });

    await page.locator(SELECTORS.btnGuardar).click();

    await expect(page.locator(SELECTORS.listaMediciones)).toBeVisible();
    const item = page.locator(`${SELECTORS.listaMediciones} li`).first();
    await expect(item).toContainText('65');
  });

  test('guardar sin pulso no muestra valor de pulso en la tarjeta', async ({ page }) => {
    await page.goto('/');
    await rellenarFormulario(page, { systolic: 120, diastolic: 80 });

    await page.locator(SELECTORS.btnGuardar).click();

    await expect(page.locator(SELECTORS.listaMediciones)).toBeVisible();
    const item = page.locator(`${SELECTORS.listaMediciones} li`).first();
    await expect(item.locator('.tarjeta__pulso')).toHaveCount(0);
  });

  test('#estado-vacio desaparece tras la primera medición guardada', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator(SELECTORS.estadoVacio)).toBeVisible();

    await rellenarFormulario(page, { systolic: 120, diastolic: 80 });
    await page.locator(SELECTORS.btnGuardar).click();

    await expect(page.locator(SELECTORS.estadoVacio)).toBeHidden();
    await expect(page.locator(SELECTORS.listaMediciones)).toBeVisible();
  });
});
