/**
 * Tests unitarios: componente Toast.
 * Verifica mount/unmount, show() y auto-ocultación.
 * @jest-environment jsdom
 */

import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { createToast } from '../../src/components/Toast/Toast.js';

// =========================================================
// Setup
// =========================================================

let container;
let toast;

beforeEach(() => {
  // Crear un contenedor raíz limpio en el DOM
  container = document.createElement('div');
  container.id = 'toast-container';
  document.body.appendChild(container);

  toast = createToast(container);
  toast.mount();

  // Usar fake timers para controlar setTimeout
  jest.useFakeTimers();
});

afterEach(() => {
  toast.unmount();
  document.body.removeChild(container);
  jest.useRealTimers();
});

// =========================================================
// mount / unmount
// =========================================================

describe('createToast — mount/unmount', () => {
  test('mount() inserta el nodo .toast en el contenedor', () => {
    expect(container.querySelector('.toast')).not.toBeNull();
  });

  test('el nodo está oculto tras mount()', () => {
    const el = container.querySelector('.toast');
    expect(el.hidden).toBe(true);
  });

  test('unmount() elimina el nodo del DOM', () => {
    toast.unmount();
    expect(container.querySelector('.toast')).toBeNull();
    // Remontar para que afterEach no falle en la limpieza
    toast.mount();
  });
});

// =========================================================
// show()
// =========================================================

describe('createToast — show()', () => {
  test('hace visible el toast con el mensaje correcto', () => {
    toast.show('Medición guardada');
    const el = container.querySelector('.toast');
    expect(el.hidden).toBe(false);
    expect(el.textContent).toBe('Medición guardada');
  });

  test('aplica la clase de variante "success" por defecto', () => {
    toast.show('OK');
    expect(container.querySelector('.toast').classList.contains('toast--success')).toBe(true);
  });

  test('aplica la clase de variante "error"', () => {
    toast.show('Error', 'error');
    expect(container.querySelector('.toast').classList.contains('toast--error')).toBe(true);
  });

  test('aplica la clase de variante "info"', () => {
    toast.show('Info', 'info');
    expect(container.querySelector('.toast').classList.contains('toast--info')).toBe(true);
  });

  test('oculta el toast automáticamente tras la duración indicada', () => {
    toast.show('Temporal', 'success', 2000);
    const el = container.querySelector('.toast');
    expect(el.hidden).toBe(false);

    jest.advanceTimersByTime(2000);
    expect(el.hidden).toBe(true);
  });

  test('no oculta antes de que expire la duración', () => {
    toast.show('Temporal', 'success', 3000);
    const el = container.querySelector('.toast');

    jest.advanceTimersByTime(1500);
    expect(el.hidden).toBe(false);
  });

  test('reinicia el temporizador si se llama a show() mientras está visible', () => {
    toast.show('Primero', 'success', 3000);
    jest.advanceTimersByTime(2000);    // A los 2 s: aún visible
    toast.show('Segundo', 'success', 3000);  // Reinicia el temporizador
    jest.advanceTimersByTime(2000);    // A los 2 s del nuevo show: aún visible
    const el = container.querySelector('.toast');
    expect(el.hidden).toBe(false);
    expect(el.textContent).toBe('Segundo');

    jest.advanceTimersByTime(1001);    // Ahora expira
    expect(el.hidden).toBe(true);
  });
});
