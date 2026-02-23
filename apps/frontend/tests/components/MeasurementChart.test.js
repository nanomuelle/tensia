/**
 * Tests unitarios: componente MeasurementChart.svelte (Vitest + @testing-library/svelte)
 * Verifica la estructura del DOM, el delegado en renderChart y el ciclo de vida.
 * chart.js se mockea para aislar las dependencias D3.
 * Migrado de Jest en BK-25.
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';

// ---------------------------------------------------------------------------
// Mock de chart.js (evita dependencias D3 en esta suite)
// ---------------------------------------------------------------------------

vi.mock('../../src/chart.js', () => ({
  renderChart: vi.fn(),
}));

import { renderChart } from '../../src/chart.js';
import MeasurementChart from '../../src/components/MeasurementChart/MeasurementChart.svelte';

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

beforeEach(() => {
  renderChart.mockClear();
});

// ---------------------------------------------------------------------------
// Estructura del DOM
// ---------------------------------------------------------------------------

describe('MeasurementChart — estructura del DOM', () => {
  test('renderiza el header con el título "Evolución"', () => {
    render(MeasurementChart);
    expect(screen.getByText('Evolución')).toBeInTheDocument();
  });

  test('renderiza la leyenda con pills de sistólica y diastólica', () => {
    render(MeasurementChart);
    expect(document.querySelector('.leyenda-pill--sistolica')).toBeInTheDocument();
    expect(document.querySelector('.leyenda-pill--diastolica')).toBeInTheDocument();
  });

  test('renderiza el contenedor D3 (#chart-mediciones)', () => {
    render(MeasurementChart);
    expect(document.getElementById('chart-mediciones')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// update() — datos suficientes (≥ 2 mediciones)
// ---------------------------------------------------------------------------

describe('update() — con datos suficientes (≥ 2 mediciones)', () => {
  test('llama a renderChart con el contenedor y las mediciones', async () => {
    const { component } = render(MeasurementChart);
    await tick(); // asegurar que bind:this esté asignado

    const mediciones = fixturesMediciones(3);
    component.update(mediciones);

    expect(renderChart).toHaveBeenCalledTimes(1);
    expect(renderChart).toHaveBeenCalledWith(
      document.getElementById('chart-mediciones'),
      mediciones,
    );
  });
});

// ---------------------------------------------------------------------------
// update() — datos insuficientes (< 2 mediciones → skeleton)
// ---------------------------------------------------------------------------

describe('update() — con datos insuficientes (< 2 mediciones)', () => {
  test('llama igualmente a renderChart (que mostrará el skeleton)', async () => {
    const { component } = render(MeasurementChart);
    await tick();

    component.update([fixturesMediciones(1)[0]]);
    expect(renderChart).toHaveBeenCalledTimes(1);
  });

  test('llama a renderChart con array vacío', async () => {
    const { component } = render(MeasurementChart);
    await tick();

    component.update([]);
    expect(renderChart).toHaveBeenCalledTimes(1);
    expect(renderChart).toHaveBeenCalledWith(
      document.getElementById('chart-mediciones'),
      [],
    );
  });
});
