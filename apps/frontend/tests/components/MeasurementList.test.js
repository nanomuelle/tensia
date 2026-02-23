/**
 * Tests unitarios: componente MeasurementList.svelte (Vitest + @testing-library/svelte)
 * Verifica los estados del historial: cargando, error, vacio, lista.
 * Migrado de Jest en BK-25.
 *
 * Nota: en la versión Svelte cada estado se renderiza de forma exclusiva con {#if},
 * por lo que se verifica presencia/ausencia en DOM en lugar del atributo hidden.
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import MeasurementList from '../../src/components/MeasurementList/MeasurementList.svelte';

// ---------------------------------------------------------------------------
// Fixture de mediciones de ejemplo
// ---------------------------------------------------------------------------

const medicionesEjemplo = [
  {
    id: 'uuid-1',
    systolic: 130,
    diastolic: 85,
    pulse: 72,
    measuredAt: '2026-02-20T08:30:00.000Z',
    source: 'manual',
  },
  {
    id: 'uuid-2',
    systolic: 120,
    diastolic: 80,
    measuredAt: '2026-02-18T10:00:00.000Z',
    source: 'manual',
  },
];

// ---------------------------------------------------------------------------
// Estado inicial (cargando)
// ---------------------------------------------------------------------------

describe('estado inicial — cargando', () => {
  test('muestra el indicador de carga al renderizar', () => {
    render(MeasurementList);
    expect(document.getElementById('estado-cargando')).toBeInTheDocument();
  });

  test('no muestra otros estados en el estado inicial', () => {
    render(MeasurementList);
    expect(document.getElementById('estado-error')).toBeNull();
    expect(document.getElementById('estado-vacio')).toBeNull();
    expect(document.getElementById('lista-mediciones')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// mostrarCargando()
// ---------------------------------------------------------------------------

describe('mostrarCargando()', () => {
  test('muestra el estado cargando', async () => {
    const { component } = render(MeasurementList);
    component.mostrarCargando();
    await tick();
    expect(document.getElementById('estado-cargando')).toBeInTheDocument();
  });

  test('oculta los demás estados (solo cargando en DOM)', async () => {
    const { component } = render(MeasurementList);
    component.mostrarLista(medicionesEjemplo); // primero mostrar lista
    await tick();
    component.mostrarCargando();              // volver a cargando
    await tick();
    expect(document.getElementById('estado-error')).toBeNull();
    expect(document.getElementById('estado-vacio')).toBeNull();
    expect(document.getElementById('lista-mediciones')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// mostrarError()
// ---------------------------------------------------------------------------

describe('mostrarError()', () => {
  test('muestra el estado error', async () => {
    const { component } = render(MeasurementList);
    component.mostrarError();
    await tick();
    expect(document.getElementById('estado-error')).toBeInTheDocument();
  });

  test('oculta los demás estados (solo error en DOM)', async () => {
    const { component } = render(MeasurementList);
    component.mostrarError();
    await tick();
    expect(document.getElementById('estado-cargando')).toBeNull();
    expect(document.getElementById('estado-vacio')).toBeNull();
    expect(document.getElementById('lista-mediciones')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// mostrarVacio()
// ---------------------------------------------------------------------------

describe('mostrarVacio()', () => {
  test('muestra el estado vacío', async () => {
    const { component } = render(MeasurementList);
    component.mostrarVacio();
    await tick();
    expect(document.getElementById('estado-vacio')).toBeInTheDocument();
  });

  test('oculta los demás estados (solo vacio en DOM)', async () => {
    const { component } = render(MeasurementList);
    component.mostrarVacio();
    await tick();
    expect(document.getElementById('estado-cargando')).toBeNull();
    expect(document.getElementById('estado-error')).toBeNull();
    expect(document.getElementById('lista-mediciones')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// mostrarLista()
// ---------------------------------------------------------------------------

describe('mostrarLista()', () => {
  test('muestra la lista de mediciones', async () => {
    const { component } = render(MeasurementList);
    component.mostrarLista(medicionesEjemplo);
    await tick();
    expect(document.getElementById('lista-mediciones')).toBeInTheDocument();
  });

  test('renderiza tantos elementos <li> como mediciones', async () => {
    const { component } = render(MeasurementList);
    component.mostrarLista(medicionesEjemplo);
    await tick();
    const items = document.querySelectorAll('#lista-mediciones li');
    expect(items.length).toBe(medicionesEjemplo.length);
  });

  test('incluye los valores de tensión de la primera medición', async () => {
    const { component } = render(MeasurementList);
    component.mostrarLista(medicionesEjemplo);
    await tick();
    const texto = document.getElementById('lista-mediciones').textContent;
    expect(texto).toContain('130');
    expect(texto).toContain('85');
  });

  test('muestra el pulso cuando está presente', async () => {
    const { component } = render(MeasurementList);
    component.mostrarLista(medicionesEjemplo);
    await tick();
    const texto = document.getElementById('lista-mediciones').textContent;
    expect(texto).toContain('72');
    expect(texto).toContain('ppm');
  });

  test('no muestra el pulso cuando el campo es undefined', async () => {
    const { component } = render(MeasurementList);
    component.mostrarLista([medicionesEjemplo[1]]); // sin pulse
    await tick();
    const tarjeta = document.querySelector('#lista-mediciones li');
    expect(tarjeta.textContent).not.toContain('ppm');
  });

  test('oculta los demás estados (solo lista en DOM)', async () => {
    const { component } = render(MeasurementList);
    component.mostrarLista(medicionesEjemplo);
    await tick();
    expect(document.getElementById('estado-cargando')).toBeNull();
    expect(document.getElementById('estado-error')).toBeNull();
    expect(document.getElementById('estado-vacio')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Callback onReintentar
// ---------------------------------------------------------------------------

describe('onReintentar callback', () => {
  test('llama a onReintentar al pulsar el botón reintentar', async () => {
    const onReintentar = vi.fn();
    const { component } = render(MeasurementList, { props: { onReintentar } });
    component.mostrarError();
    await tick();

    const btn = document.getElementById('btn-reintentar');
    await fireEvent.click(btn);

    expect(onReintentar).toHaveBeenCalledTimes(1);
  });
});
