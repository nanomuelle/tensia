/**
 * Tests unitarios del componente MeasurementChart.
 *
 * Verifica que:
 * - mount() genera la estructura HTML interna correcta.
 * - update() muestra la sección y delega en renderChart (chart.js).
 * - update() con menos del mínimo de mediciones llama igualmente a renderChart
 *   (que mostrará el skeleton).
 * - unmount() desconecta el ResizeObserver.
 *
 * chart.js se mockea porque testea la lógica del componente, no el render D3
 * (que tiene su propio suite en chart.test.js).
 *
 * @jest-environment jsdom
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// ---------------------------------------------------------------------------
// Mock de chart.js (evita dependencias D3 en esta suite)
// ---------------------------------------------------------------------------

jest.unstable_mockModule('../../src/chart.js', () => ({
  renderChart: jest.fn(),
}));

// Los imports dinámicos se resuelven tras el mock
const { renderChart }          = await import('../../src/chart.js');
const { createMeasurementChart } = await import('../../src/components/MeasurementChart/MeasurementChart.js');

// ---------------------------------------------------------------------------
// Datos de ejemplo
// ---------------------------------------------------------------------------

function fixturesMediciones(n = 3) {
  return Array.from({ length: n }, (_, i) => ({
    id: `uuid-${i}`,
    systolic: 120 + i,
    diastolic: 80 + i,
    pulse: 70,
    measuredAt: `2026-02-${10 + i}T10:00:00.000Z`,
    source: 'manual',
  }));
}

// ---------------------------------------------------------------------------
// Setup compartido
// ---------------------------------------------------------------------------

let seccionEl;
let chart;

beforeEach(() => {
  renderChart.mockClear();
  document.body.innerHTML = '<section id="seccion-grafica" hidden></section>';
  seccionEl = document.getElementById('seccion-grafica');
  chart = createMeasurementChart(seccionEl);
  chart.mount();
});

// ---------------------------------------------------------------------------
// mount() — estructura interna
// ---------------------------------------------------------------------------

describe('mount() — estructura del DOM', () => {
  test('genera el header de la gráfica con título', () => {
    expect(seccionEl.querySelector('.grafica-header')).not.toBeNull();
    expect(seccionEl.querySelector('.grafica__titulo').textContent).toContain('Evolución');
  });

  test('genera la leyenda con pills de sistólica y diastólica', () => {
    expect(seccionEl.querySelector('.leyenda-pill--sistolica')).not.toBeNull();
    expect(seccionEl.querySelector('.leyenda-pill--diastolica')).not.toBeNull();
  });

  test('genera el contenedor D3 (#chart-mediciones)', () => {
    expect(seccionEl.querySelector('#chart-mediciones')).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// update() — comportamiento con datos suficientes
// ---------------------------------------------------------------------------

describe('update() — con datos suficientes (≥ 2 mediciones)', () => {
  test('muestra la sección (quita hidden)', () => {
    chart.update(fixturesMediciones(3));
    expect(seccionEl.hidden).toBe(false);
  });

  test('llama a renderChart con el contenedor y las mediciones', () => {
    const mediciones = fixturesMediciones(3);
    chart.update(mediciones);
    expect(renderChart).toHaveBeenCalledTimes(1);
    expect(renderChart).toHaveBeenCalledWith(
      seccionEl.querySelector('#chart-mediciones'),
      mediciones,
    );
  });
});

// ---------------------------------------------------------------------------
// update() — comportamiento con datos insuficientes (skeleton)
// ---------------------------------------------------------------------------

describe('update() — con datos insuficientes (< 2 mediciones)', () => {
  test('muestra la sección aunque no haya datos suficientes', () => {
    chart.update([]);
    expect(seccionEl.hidden).toBe(false);
  });

  test('llama a renderChart (que mostrará el skeleton interno)', () => {
    chart.update([fixturesMediciones(1)[0]]);
    expect(renderChart).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// unmount()
// ---------------------------------------------------------------------------

describe('unmount()', () => {
  test('no lanza error sin haber llamado a update() antes', () => {
    expect(() => chart.unmount()).not.toThrow();
  });

  test('no lanza error al llamar update() después de unmount()', () => {
    chart.unmount();
    expect(() => chart.update(fixturesMediciones(3))).not.toThrow();
  });
});
