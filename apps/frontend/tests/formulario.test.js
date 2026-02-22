/**
 * [TC-07] [TC-08] — Tests de componente: formulario de registro manual
 *
 * Verifica que el formulario muestra errores inline y NO llama al backend
 * cuando los datos son inválidos o están vacíos.
 *
 * Estrategia:
 * - jsdom proporciona un DOM real en el que app.js puede ejecutarse.
 * - El módulo infra/httpAdapter.js se mockea para evitar peticiones HTTP reales.
 * - app.js se importa dinámicamente (dentro de beforeAll) para que el DOM
 *   ya esté montado cuando el módulo ejecuta sus referencias a getElementById.
 *
 * Referencia: docs/testing/test-cases.md#TC-07, #TC-08
 *             docs/testing/aceptance-criteria.md#CA-06
 *
 * @jest-environment jsdom
 */

import { jest, describe, test, expect, beforeAll, beforeEach } from '@jest/globals';

// =========================================================
// Mocks de infra/httpAdapter.js — deben registrarse ANTES del import dinámico
// =========================================================

const mockGetMediciones = jest.fn().mockResolvedValue([]);
const mockCrearMedicion = jest.fn();

jest.unstable_mockModule('../src/infra/httpAdapter.js', () => ({
  getMediciones: mockGetMediciones,
  crearMedicion: mockCrearMedicion,
}));

// =========================================================
// HTML mínimo necesario para que app.js pueda inicializarse
// Contiene todos los elementos que app.js referencia con getElementById
// =========================================================

const HTML_FIXTURE = `
  <button id="btn-nueva-medicion">+ Nueva medición</button>

  <section id="formulario-registro" hidden>
    <form id="form-medicion" novalidate>
      <input
        id="input-systolic"
        type="number"
        aria-describedby="error-systolic"
      />
      <span id="error-systolic" hidden></span>

      <input
        id="input-diastolic"
        type="number"
        aria-describedby="error-diastolic"
      />
      <span id="error-diastolic" hidden></span>

      <input
        id="input-pulse"
        type="number"
        aria-describedby="error-pulse"
      />
      <span id="error-pulse" hidden></span>

      <input
        id="input-fecha"
        type="datetime-local"
        aria-describedby="error-fecha"
      />
      <span id="error-fecha" hidden></span>

      <div id="error-formulario" hidden></div>

      <button id="btn-guardar" type="submit">Guardar medición</button>
      <button id="btn-cancelar" type="button">Cancelar</button>
    </form>
  </section>

  <section id="historial-root">
    <div id="estado-cargando" hidden></div>
    <div id="estado-error" hidden>
      <button id="btn-reintentar">Reintentar</button>
    </div>
    <div id="estado-vacio" hidden></div>
    <ul id="lista-mediciones"></ul>
  </section>
`;

// =========================================================
// Setup: montar DOM e importar app.js una sola vez
// =========================================================

beforeAll(async () => {
  document.body.innerHTML = HTML_FIXTURE;

  // Importar app.js después de que el DOM esté listo.
  // app.js ejecuta cargarMediciones() al cargarse; el mock devuelve [].
  await import('../src/app.js');

  // Esperar a que la promesa inicial de cargarMediciones se resuelva
  await Promise.resolve();
  await Promise.resolve();
});

// Antes de cada test: resetear mocks y abrir el formulario limpio
beforeEach(async () => {
  mockCrearMedicion.mockReset();
  mockGetMediciones.mockResolvedValue([]);

  // Abrir formulario (simula click en "Nueva medición")
  document.getElementById('btn-nueva-medicion').click();

  // Esperar micro-tarea para que el DOM se actualice
  await Promise.resolve();
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
    // Forzar vaciado aunque rellenarFechaActual() haya auto-rellenado el campo
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

  test('NO llama al backend cuando hay campos obligatorios vacíos', () => {
    document.getElementById('input-systolic').value = '';
    document.getElementById('input-diastolic').value = '';
    document.getElementById('input-fecha').value = '';

    enviarFormulario();

    expect(mockCrearMedicion).not.toHaveBeenCalled();
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

  test('NO llama al backend cuando sistólica ≤ diastólica', () => {
    document.getElementById('input-systolic').value = '70';
    document.getElementById('input-diastolic').value = '80';
    document.getElementById('input-fecha').value = '2026-02-18T10:00';

    enviarFormulario();

    expect(mockCrearMedicion).not.toHaveBeenCalled();
  });

  test('no muestra error en sistólica cuando es mayor que la diastólica', () => {
    document.getElementById('input-systolic').value = '130';
    document.getElementById('input-diastolic').value = '85';
    document.getElementById('input-fecha').value = '2026-02-18T10:00';

    mockCrearMedicion.mockResolvedValue({
      id: 'uuid-test',
      systolic: 130,
      diastolic: 85,
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
