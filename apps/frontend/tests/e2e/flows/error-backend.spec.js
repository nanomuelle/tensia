/**
 * [TC-11] — Banner de error si el backend no responde
 *
 * Dado:  el backend está caído (o simula un error)
 * Cuando: la app intenta cargar el historial
 * Entonces: se muestra el banner de error con el botón "Reintentar"
 *
 * Implementación pendiente — responsabilidad del QA Engineer.
 * Referencia arquitectónica: ADR-004, docs/testing/test-cases.md#TC-11
 */
import { test, expect } from '@playwright/test';
import { SELECTORS } from '../helpers/pageObjects.js';

test.describe('TC-11 — Banner de error si el backend no responde', () => {
  // TODO (QA): implementar la simulación de fallo de red (page.route) y
  //            la verificación del banner de error
});
