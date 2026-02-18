/**
 * [TC-09] — Registro manual completo (flujo E2E crítico)
 *
 * Dado:  la app está cargada en el navegador y el backend en marcha
 * Cuando: el usuario abre el formulario, introduce valores válidos y pulsa "Guardar"
 * Entonces: el formulario se cierra, la medición aparece al inicio del historial,
 *           sin recargar la página
 *
 * Implementación pendiente — responsabilidad del QA Engineer.
 * Referencia arquitectónica: ADR-004, docs/testing/test-cases.md#TC-09
 */
import { test, expect } from '@playwright/test';
import { SELECTORS } from '../helpers/pageObjects.js';

test.describe('TC-09 — Registro manual completo', () => {
  // TODO (QA): implementar el flujo completo
});
