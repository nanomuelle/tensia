/**
 * Tests unitarios: eventBus (emit / on).
 * Verifica la emisión de eventos de dominio y la suscripción/limpieza de listeners.
 *
 * @jest-environment jsdom
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { emit, on, Events } from '../../src/shared/eventBus.js';

// =========================================================
// emit()
// =========================================================

describe('emit()', () => {
  test('dispara un CustomEvent en window con el nombre correcto', () => {
    let capturado = null;
    window.addEventListener(Events.MEASUREMENT_SAVED, (e) => { capturado = e; });

    emit(Events.MEASUREMENT_SAVED, { id: '1' });

    expect(capturado).not.toBeNull();
    expect(capturado.type).toBe(Events.MEASUREMENT_SAVED);
  });

  test('el detalle del evento contiene el dato pasado', () => {
    const detalle = { id: 'abc', systolic: 120 };
    let recibido = null;

    window.addEventListener(Events.MEASUREMENT_SAVED, (e) => { recibido = e.detail; });

    emit(Events.MEASUREMENT_SAVED, detalle);

    expect(recibido).toEqual(detalle);
  });

  test('emit() sin detalle no lanza', () => {
    expect(() => emit(Events.MEASUREMENT_SAVED)).not.toThrow();
  });

  test('emit() con detalle null no lanza', () => {
    expect(() => emit(Events.MEASUREMENT_SAVED, null)).not.toThrow();
  });
});

// =========================================================
// on()
// =========================================================

describe('on()', () => {
  test('el handler se llama cuando se emite el evento', () => {
    const handler = vi.fn();
    on(Events.MEASUREMENT_SAVED, handler);

    emit(Events.MEASUREMENT_SAVED, { id: '1' });

    expect(handler).toHaveBeenCalledTimes(1);

    // Limpieza manual
    window.removeEventListener(Events.MEASUREMENT_SAVED, handler);
  });

  test('el handler recibe el CustomEvent con el detalle correcto', () => {
    const detalle = { id: '42', systolic: 130 };
    let resultado = null;

    const cleanup = on(Events.MEASUREMENT_SAVED, (e) => { resultado = e.detail; });

    emit(Events.MEASUREMENT_SAVED, detalle);

    expect(resultado).toEqual(detalle);
    cleanup();
  });

  test('la función de cleanup elimina el listener', () => {
    const handler = vi.fn();
    const cleanup = on(Events.MEASUREMENT_SAVED, handler);

    cleanup();
    emit(Events.MEASUREMENT_SAVED, {});

    expect(handler).not.toHaveBeenCalled();
  });

  test('varios handlers independientes reciben el mismo evento', () => {
    const h1 = vi.fn();
    const h2 = vi.fn();

    const c1 = on(Events.MEASUREMENT_SAVED, h1);
    const c2 = on(Events.MEASUREMENT_SAVED, h2);

    emit(Events.MEASUREMENT_SAVED, {});

    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).toHaveBeenCalledTimes(1);

    c1();
    c2();
  });
});

// =========================================================
// Events — catálogo de nombres
// =========================================================

describe('Events', () => {
  test('Events.MEASUREMENT_SAVED tiene el valor correcto', () => {
    expect(Events.MEASUREMENT_SAVED).toBe('measurement:saved');
  });

  test('Events.AUTH_LOGIN tiene el valor correcto (BK-40)', () => {
    expect(Events.AUTH_LOGIN).toBe('auth:login');
  });

  test('Events.AUTH_LOGOUT tiene el valor correcto (BK-40)', () => {
    expect(Events.AUTH_LOGOUT).toBe('auth:logout');
  });

  test('emit() y on() funcionan correctamente con AUTH_LOGIN', () => {
    const handler = vi.fn();
    const cleanup = on(Events.AUTH_LOGIN, handler);

    emit(Events.AUTH_LOGIN, { sub: '123', name: 'Test' });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail).toEqual({ sub: '123', name: 'Test' });
    cleanup();
  });

  test('emit() no lanza cuando window no está disponible (entorno no-browser)', () => {
    // Simula ejecución fuera del navegador eliminando temporalmente window
    const originalWindow = globalThis.window;
    delete globalThis.window;

    expect(() => emit(Events.MEASUREMENT_SAVED, {})).not.toThrow();

    globalThis.window = originalWindow;
  });
});
