/**
 * [TC-07] [TC-08] — Tests de componente: formulario de registro manual
 *
 * Verifica que el componente MeasurementForm muestra errores inline y NO llama
 * al servicio cuando los datos son inválidos o están vacíos.
 *
 * Estrategia:
 * - Se monta solo el fragmento HTML del formulario en el DOM (jsdom).
 * - Se instancia createMeasurementForm con un service mockeado (DI).
 * - No se usa app.js ni se necesita mockear httpAdapter.
 *
 * Referencia: docs/testing/test-cases.md#TC-07, #TC-08
 *             docs/testing/aceptance-criteria.md#CA-06
 *
 * @jest-environment jsdom
 */

import { vi, describe, test, expect, beforeAll, beforeEach } from 'vitest';
import { createMeasurementForm } from '../../src/components/MeasurementForm/MeasurementForm.js';

// =========================================================
// Mock del servicio (inyectado por DI en el componente)
// =========================================================

const mockServiceCreate = vi.fn();
const mockServiceListAll = vi.fn().mockResolvedValue([]);

const mockService = {
  create:  mockServiceCreate,
  listAll: mockServiceListAll,
};

// Mock mínimo del Toast (no necesitamos verificar notificaciones en estos tests)
const mockToast = { show: vi.fn(), mount: vi.fn() };

// =========================================================
// HTML del formulario (único fragmento necesario para el componente)
// =========================================================

// Tras el Paso 14e, el componente genera su propio HTML en mount().
// El fixture solo necesita el contenedor vacío.
const HTML_FIXTURE = `
  <section id="formulario-registro" hidden></section>
`;

// =========================================================
// Setup: montar DOM e instanciar el componente una sola vez
// =========================================================

let formulario;

beforeAll(() => {
  document.body.innerHTML = HTML_FIXTURE;

  // Instanciar el componente con el servicio mockeado (DI)
  formulario = createMeasurementForm(
    document.getElementById('formulario-registro'),
    {
      service:   mockService,
      toast:     mockToast,
      onSuccess: vi.fn(),
      onCerrar:  vi.fn(),
    },
  );
  formulario.mount();
});

// Antes de cada test: resetear mocks y abrir el formulario limpio
beforeEach(() => {
  mockServiceCreate.mockReset();
  mockToast.show.mockReset();

  // Abrir formulario (igual que cuando el usuario pulsa el botón principal)
  formulario.abrir();
});

// =========================================================
// Helpers
// =========================================================

/** Despacha el evento submit del formulario (sin navegación real). */
function enviarFormulario() {
  document.getElementById('form-medicion').dispatchEvent(
    new Event('submit', { bubbles: true, cancelable: true })
  );
}

/** Atajo para obtener el elemento de error de un campo. */
function errorDe(id) {
  return document.getElementById(id);
}

// =========================================================
// TC-07 — Formulario rechaza envío con campos obligatorios vacíos
// =========================================================

describe('TC-07 — Campos obligatorios vacíos', () => {
  test('muestra error en sistólica cuando está vacía', () => {
    document.getElementById('input-systolic').value = '';
    document.getElementById('input-diastolic').value = '80';
    document.getElementById('input-fecha').value = '2026-02-18T10:00';

    enviarFormulario();

    const error = errorDe('error-systolic');
    expect(error.hidden).toBe(false);
    expect(error.textContent.trim()).not.toBe('');
  });

  test('muestra error en diastólica cuando está vacía', () => {
    document.getElementById('input-systolic').value = '120';
    document.getElementById('input-diastolic').value = '';
    document.getElementById('input-fecha').value = '2026-02-18T10:00';

    enviarFormulario();

    const error = errorDe('error-diastolic');
    expect(error.hidden).toBe(false);
    expect(error.textContent.trim()).not.toBe('');
  });

  test('muestra error en fecha cuando está vacía', () => {
    document.getElementById('input-systolic').value = '120';
    document.getElementById('input-diastolic').value = '80';
    // Forzar vaciado aunque fechaLocalActual() haya auto-rellenado el campo
    document.getElementById('input-fecha').value = '';

    enviarFormulario();

    const error = errorDe('error-fecha');
    expect(error.hidden).toBe(false);
    expect(error.textContent.trim()).not.toBe('');
  });

  test('muestra errores en sistólica, diastólica y fecha si todos están vacíos', () => {
    document.getElementById('input-systolic').value = '';
    document.getElementById('input-diastolic').value = '';
    document.getElementById('input-fecha').value = '';

    enviarFormulario();

    expect(errorDe('error-systolic').hidden).toBe(false);
    expect(errorDe('error-diastolic').hidden).toBe(false);
    expect(errorDe('error-fecha').hidden).toBe(false);
  });

  test('NO llama al servicio cuando hay campos obligatorios vacíos', () => {
    document.getElementById('input-systolic').value = '';
    document.getElementById('input-diastolic').value = '';
    document.getElementById('input-fecha').value = '';

    enviarFormulario();

    expect(mockServiceCreate).not.toHaveBeenCalled();
  });
});

// =========================================================
// TC-08 — Formulario rechaza sistólica ≤ diastólica
// =========================================================

describe('TC-08 — Sistólica ≤ diastólica', () => {
  test('muestra error en sistólica cuando es menor que la diastólica', () => {
    document.getElementById('input-systolic').value = '70';
    document.getElementById('input-diastolic').value = '80';
    document.getElementById('input-fecha').value = '2026-02-18T10:00';

    enviarFormulario();

    const error = errorDe('error-systolic');
    expect(error.hidden).toBe(false);
    expect(error.textContent.trim()).not.toBe('');
  });

  test('muestra error en sistólica cuando es igual a la diastólica', () => {
    document.getElementById('input-systolic').value = '80';
    document.getElementById('input-diastolic').value = '80';
    document.getElementById('input-fecha').value = '2026-02-18T10:00';

    enviarFormulario();

    const error = errorDe('error-systolic');
    expect(error.hidden).toBe(false);
    expect(error.textContent.trim()).not.toBe('');
  });

  test('NO llama al servicio cuando sistólica ≤ diastólica', () => {
    document.getElementById('input-systolic').value = '70';
    document.getElementById('input-diastolic').value = '80';
    document.getElementById('input-fecha').value = '2026-02-18T10:00';

    enviarFormulario();

    expect(mockServiceCreate).not.toHaveBeenCalled();
  });

  test('no muestra error en sistólica cuando es mayor que la diastólica', () => {
    document.getElementById('input-systolic').value = '130';
    document.getElementById('input-diastolic').value = '85';
    document.getElementById('input-fecha').value = '2026-02-18T10:00';

    mockServiceCreate.mockResolvedValue({
      measuredAt: '2026-02-18T10:00:00.000Z',
      source: 'manual',
    });

    enviarFormulario();

    expect(errorDe('error-systolic').hidden).toBe(true);
  });
});

// =========================================================
// CA-06 — El error de un campo desaparece al empezar a escribir
// =========================================================

describe('CA-06 — Error de campo desaparece al escribir', () => {
  test('el error de sistólica se borra cuando el usuario empieza a escribir', () => {
    const inputSystolic = document.getElementById('input-systolic');
    inputSystolic.value = '';
    document.getElementById('input-diastolic').value = '80';
    document.getElementById('input-fecha').value = '2026-02-18T10:00';

    enviarFormulario();

    // El error debe estar visible tras el intento de envío
    expect(errorDe('error-systolic').hidden).toBe(false);

    // Simular que el usuario empieza a corregir el campo
    inputSystolic.value = '1';
    inputSystolic.dispatchEvent(new Event('input', { bubbles: true }));

    // El error debe desaparecer inmediatamente
    expect(errorDe('error-systolic').hidden).toBe(true);
    expect(errorDe('error-systolic').textContent).toBe('');
  });

  test('el error de diastólica se borra cuando el usuario empieza a escribir', () => {
    const inputDiastolic = document.getElementById('input-diastolic');
    document.getElementById('input-systolic').value = '120';
    inputDiastolic.value = '';
    document.getElementById('input-fecha').value = '2026-02-18T10:00';

    enviarFormulario();
    expect(errorDe('error-diastolic').hidden).toBe(false);

    inputDiastolic.value = '7';
    inputDiastolic.dispatchEvent(new Event('input', { bubbles: true }));

    expect(errorDe('error-diastolic').hidden).toBe(true);
    expect(errorDe('error-diastolic').textContent).toBe('');
  });

  test('el error de fecha se borra cuando el usuario empieza a escribir', () => {
    const inputFecha = document.getElementById('input-fecha');
    document.getElementById('input-systolic').value = '120';
    document.getElementById('input-diastolic').value = '80';
    inputFecha.value = '';

    enviarFormulario();
    expect(errorDe('error-fecha').hidden).toBe(false);

    inputFecha.value = '2026-02-18T10:00';
    inputFecha.dispatchEvent(new Event('input', { bubbles: true }));

    expect(errorDe('error-fecha').hidden).toBe(true);
    expect(errorDe('error-fecha').textContent).toBe('');
  });
});
