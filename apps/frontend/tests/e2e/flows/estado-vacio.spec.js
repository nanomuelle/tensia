/**
 * [TC-10] — Estado vacío en primera carga
 *
 * Dado:  el backend no tiene mediciones
 * Cuando: el usuario abre la app
 * Entonces: se muestra el mensaje "Sin mediciones todavía" y el botón "Nueva medición"
 *
 * Implementación pendiente — responsabilidad del QA Engineer.
 * Referencia arquitectónica: ADR-004, docs/testing/test-cases.md#TC-10
 */
import { test, expect } from '@playwright/test';
import { SELECTORS } from '../helpers/pageObjects.js';

test.describe('TC-10 — Estado vacío en primera carga', () => {
  // TODO (QA): implementar la verificación de estado vacío
});
