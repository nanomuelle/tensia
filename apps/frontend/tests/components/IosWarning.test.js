/**
 * Tests unitarios: componente IosWarning.
 * Verifica la detección de plataforma Safari/iOS, el montaje del HTML
 * y el comportamiento del botón de cierre.
 *
 * Criterio de aceptación: "En Safari/iOS se muestra el aviso informativo
 * sobre la limitación de 7 días de localStorage."
 *
 * @jest-environment jsdom
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { createIosWarning } from '../../src/components/IosWarning/IosWarning.js';

// =========================================================
// Helpers
// =========================================================

const UA_CHROME = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const UA_SAFARI_MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
const UA_IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15';
const UA_IPAD = 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15';

let uaOriginal;

function setUA(ua) {
  Object.defineProperty(navigator, 'userAgent', { value: ua, configurable: true });
}

// =========================================================
// Setup
// =========================================================

let container;

beforeEach(() => {
  uaOriginal = navigator.userAgent;
  container = document.createElement('div');
  container.id = 'aviso-ios';
  container.hidden = true;
  document.body.appendChild(container);
});

afterEach(() => {
  document.body.removeChild(container);
  setUA(uaOriginal);
});

// =========================================================
// mount() — generación de HTML
// =========================================================

describe('createIosWarning — mount()', () => {
  test('mount() inserta el botón de cierre en el contenedor', () => {
    const warning = createIosWarning(container);
    warning.mount();
    expect(container.querySelector('#btn-cerrar-aviso-ios')).not.toBeNull();
  });

  test('el aviso contiene el texto sobre los 7 días', () => {
    const warning = createIosWarning(container);
    warning.mount();
    expect(container.textContent).toMatch(/7 días/);
  });

  test('mount() no lanza si rootEl es null', () => {
    const warning = createIosWarning(null);
    expect(() => warning.mount()).not.toThrow();
  });

  test('mount() no lanza si rootEl es undefined', () => {
    const warning = createIosWarning(undefined);
    expect(() => warning.mount()).not.toThrow();
  });
});

// =========================================================
// Detección de plataforma — visibilidad tras mount()
// =========================================================

describe('createIosWarning — detección de plataforma', () => {
  test('permanece oculto en Chrome/Linux (plataforma no afectada)', () => {
    setUA(UA_CHROME);
    const warning = createIosWarning(container);
    warning.mount();
    expect(container.hidden).toBe(true);
  });

  test('se muestra en Safari macOS', () => {
    setUA(UA_SAFARI_MAC);
    const warning = createIosWarning(container);
    warning.mount();
    expect(container.hidden).toBe(false);
  });

  test('se muestra en iPhone (iOS)', () => {
    setUA(UA_IPHONE);
    const warning = createIosWarning(container);
    warning.mount();
    expect(container.hidden).toBe(false);
  });

  test('se muestra en iPad (iOS)', () => {
    setUA(UA_IPAD);
    const warning = createIosWarning(container);
    warning.mount();
    expect(container.hidden).toBe(false);
  });
});

// =========================================================
// Botón de cierre
// =========================================================

describe('createIosWarning — botón cerrar', () => {
  test('click en el botón oculta el aviso (Safari)', () => {
    setUA(UA_SAFARI_MAC);
    const warning = createIosWarning(container);
    warning.mount();
    expect(container.hidden).toBe(false);

    const btn = container.querySelector('#btn-cerrar-aviso-ios');
    btn.click();

    expect(container.hidden).toBe(true);
  });

  test('el botón tiene aria-label="Cerrar aviso"', () => {
    const warning = createIosWarning(container);
    warning.mount();
    const btn = container.querySelector('#btn-cerrar-aviso-ios');
    expect(btn.getAttribute('aria-label')).toBe('Cerrar aviso');
  });
});

// =========================================================
// unmount()
// =========================================================

describe('createIosWarning — unmount()', () => {
  test('unmount() no lanza antes de mount()', () => {
    const warning = createIosWarning(container);
    expect(() => warning.unmount()).not.toThrow();
  });

  test('unmount() no lanza si rootEl es null', () => {
    const warning = createIosWarning(null);
    expect(() => warning.unmount()).not.toThrow();
  });

  test('tras unmount(), el click en el botón ya no oculta el aviso', () => {
    setUA(UA_SAFARI_MAC);
    const warning = createIosWarning(container);
    warning.mount();
    expect(container.hidden).toBe(false);

    // Guardar ref al botón antes de unmount (unmount solo elimina el listener, no el elemento)
    const btn = container.querySelector('#btn-cerrar-aviso-ios');
    warning.unmount();

    // El listener fue eliminado: el click no debe ejecutar onCerrar
    btn.click();
    expect(container.hidden).toBe(false);
  });
});
