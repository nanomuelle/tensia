/**
 * Tests unitarios: componente Toast.svelte (Vitest + @testing-library/svelte)
 * Verifica show(), variantes visuales y auto-ocultación con fake timers.
 * Migrado de Jest en BK-25.
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import Toast from '../../src/components/Toast/Toast.svelte';

// =========================================================
// Setup
// =========================================================

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// =========================================================
// Estado inicial
// =========================================================

describe('Toast — estado inicial', () => {
  test('no muestra ningún elemento toast al renderizar', () => {
    render(Toast);
    expect(document.querySelector('.toast')).toBeNull();
  });
});

// =========================================================
// show()
// =========================================================

describe('Toast — show()', () => {
  test('hace visible el toast con el mensaje correcto', async () => {
    const { component } = render(Toast);
    component.show('Medición guardada');
    await tick();
    expect(screen.getByText('Medición guardada')).toBeInTheDocument();
  });

  test('aplica la clase de variante "success" por defecto', async () => {
    const { component } = render(Toast);
    component.show('OK');
    await tick();
    expect(document.querySelector('.toast--success')).toBeInTheDocument();
  });

  test('aplica la clase de variante "error"', async () => {
    const { component } = render(Toast);
    component.show('Error', 'error');
    await tick();
    expect(document.querySelector('.toast--error')).toBeInTheDocument();
  });

  test('aplica la clase de variante "info"', async () => {
    const { component } = render(Toast);
    component.show('Info', 'info');
    await tick();
    expect(document.querySelector('.toast--info')).toBeInTheDocument();
  });

  test('oculta el toast automáticamente tras la duración indicada', async () => {
    const { component } = render(Toast);
    component.show('Temporal', 'success', 2000);
    await tick();
    expect(screen.getByText('Temporal')).toBeInTheDocument();

    vi.advanceTimersByTime(2000);
    await tick();
    expect(document.querySelector('.toast')).toBeNull();
  });

  test('no oculta antes de que expire la duración', async () => {
    const { component } = render(Toast);
    component.show('Temporal', 'success', 3000);
    await tick();

    vi.advanceTimersByTime(1500);
    await tick();
    expect(document.querySelector('.toast')).toBeInTheDocument();
  });

  test('reinicia el temporizador si se llama a show() mientras está visible', async () => {
    const { component } = render(Toast);

    component.show('Primero', 'success', 3000);
    await tick();
    vi.advanceTimersByTime(2000);   // A los 2 s: aún visible
    await tick();

    component.show('Segundo', 'success', 3000); // Reinicia temporizador
    await tick();
    vi.advanceTimersByTime(2000);   // A los 2 s del nuevo show: aún visible
    await tick();

    expect(screen.getByText('Segundo')).toBeInTheDocument();

    vi.advanceTimersByTime(1001);   // Ahora expira
    await tick();
    expect(document.querySelector('.toast')).toBeNull();
  });

  test('tiene role="status" y aria-live="polite"', async () => {
    const { component } = render(Toast);
    component.show('Accesible');
    await tick();
    const el = document.querySelector('.toast');
    expect(el.getAttribute('role')).toBe('status');
    expect(el.getAttribute('aria-live')).toBe('polite');
  });
});

