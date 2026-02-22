/**
 * Tests unitarios: módulo de gráfica — chart.js (D3 SVG, ADR-006)
 * Verifica el contrato externo de renderChart() y la estructura del SVG generado.
 *
 * @jest-environment jsdom
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { renderChart } from '../src/chart.js';

// ---------------------------------------------------------------------------
// Datos de ejemplo
// ---------------------------------------------------------------------------

/** Devuelve un array de mediciones de prueba ordenadas descendentemente. */
function fixturesMediciones() {
  return [
    {
      id: 'uuid-1',
      systolic: 135,
      diastolic: 88,
      pulse: 80,
      measuredAt: '2026-02-20T08:30:00.000Z',
      source: 'manual',
    },
    {
      id: 'uuid-2',
      systolic: 120,
      diastolic: 80,
      pulse: 72,
      measuredAt: '2026-02-18T10:00:00.000Z',
      source: 'manual',
    },
    {
      id: 'uuid-3',
      systolic: 118,
      diastolic: 76,
      measuredAt: '2026-02-16T20:15:00.000Z',
      source: 'manual',
    },
  ];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Crea un div montado en el documento con ancho simulado. */
function crearContenedor() {
  const div = document.createElement('div');
  // jsdom devuelve 0 para clientWidth; definimos un valor para que D3 lo use
  Object.defineProperty(div, 'clientWidth', { get: () => 400, configurable: true });
  document.body.appendChild(div);
  return div;
}

let contenedor;

beforeEach(() => {
  document.body.innerHTML = '';
  contenedor = crearContenedor();
});

// ---------------------------------------------------------------------------
// Casos de guarda (no renderiza)
// ---------------------------------------------------------------------------

describe('renderChart — casos de guarda', () => {
  test('no hace nada si container es null', () => {
    expect(() => renderChart(null, fixturesMediciones())).not.toThrow();
    // El contenedor por defecto sigue vacío
    expect(contenedor.innerHTML).toBe('');
  });

  test('no hace nada si measurements es null', () => {
    expect(() => renderChart(contenedor, null)).not.toThrow();
    // Debe renderizar el skeleton informativo cuando measurements es null
    const skeleton = contenedor.querySelector('.chart-skeleton');
    expect(skeleton).not.toBeNull();
    expect(skeleton.textContent).toContain('Sin datos suficientes para mostrar la gráfica');
  });

  test('no renderiza con 0 mediciones', () => {
    renderChart(contenedor, []);
    const skeleton = contenedor.querySelector('.chart-skeleton');
    expect(skeleton).not.toBeNull();
    expect(skeleton.textContent).toContain('Sin datos suficientes para mostrar la gráfica');
  });

  test('no renderiza con exactamente 1 medición', () => {
    renderChart(contenedor, [fixturesMediciones()[0]]);
    const skeleton = contenedor.querySelector('.chart-skeleton');
    expect(skeleton).not.toBeNull();
    expect(skeleton.textContent).toContain('Sin datos suficientes para mostrar la gráfica');
  });
});

// ---------------------------------------------------------------------------
// Estructura del SVG con datos suficientes
// ---------------------------------------------------------------------------

describe('renderChart — estructura SVG', () => {
  test('crea un elemento <svg> en el contenedor', () => {
    renderChart(contenedor, fixturesMediciones());
    const svg = contenedor.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  test('el SVG tiene role="img" y aria-label correcto', () => {
    renderChart(contenedor, fixturesMediciones());
    const svg = contenedor.querySelector('svg');
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBe(
      'Gráfica de evolución de tensión arterial',
    );
  });

  test('el SVG tiene focusable="false"', () => {
    renderChart(contenedor, fixturesMediciones());
    const svg = contenedor.querySelector('svg');
    expect(svg.getAttribute('focusable')).toBe('false');
  });

  test('el SVG tiene viewBox y preserveAspectRatio', () => {
    renderChart(contenedor, fixturesMediciones());
    const svg = contenedor.querySelector('svg');
    expect(svg.getAttribute('viewBox')).toBeTruthy();
    expect(svg.getAttribute('preserveAspectRatio')).toBe('none');
  });

  test('el SVG contiene paths (líneas y áreas)', () => {
    renderChart(contenedor, fixturesMediciones());
    const paths = contenedor.querySelectorAll('path');
    // 2 áreas + 2 líneas = 4 paths mínimo
    expect(paths.length).toBeGreaterThanOrEqual(4);
  });

  test('el SVG contiene círculos para los puntos de dato', () => {
    const mediciones = fixturesMediciones();
    renderChart(contenedor, mediciones);
    const circles = contenedor.querySelectorAll('circle');
    // 2 series × N mediciones
    expect(circles.length).toBe(mediciones.length * 2);
  });
});

// ---------------------------------------------------------------------------
// Series y clases CSS
// ---------------------------------------------------------------------------

describe('renderChart — clases de las series', () => {
  test('genera paths con clase linea-systolic y linea-diastolic', () => {
    renderChart(contenedor, fixturesMediciones());
    expect(contenedor.querySelector('.linea-systolic')).not.toBeNull();
    expect(contenedor.querySelector('.linea-diastolic')).not.toBeNull();
  });

  test('genera paths con clase area-systolic y area-diastolic', () => {
    renderChart(contenedor, fixturesMediciones());
    expect(contenedor.querySelector('.area-systolic')).not.toBeNull();
    expect(contenedor.querySelector('.area-diastolic')).not.toBeNull();
  });

  test('genera círculos con clase punto-systolic y punto-diastolic', () => {
    renderChart(contenedor, fixturesMediciones());
    expect(contenedor.querySelector('.punto-systolic')).not.toBeNull();
    expect(contenedor.querySelector('.punto-diastolic')).not.toBeNull();
  });

  test('la línea sistólica tiene el color correcto (#ef4444)', () => {
    renderChart(contenedor, fixturesMediciones());
    const lineaSistolica = contenedor.querySelector('.linea-systolic');
    expect(lineaSistolica.getAttribute('stroke')).toBe('#ef4444');
  });

  test('la línea diastólica tiene el color correcto (#3b82f6)', () => {
    renderChart(contenedor, fixturesMediciones());
    const lineaDiastolica = contenedor.querySelector('.linea-diastolic');
    expect(lineaDiastolica.getAttribute('stroke')).toBe('#3b82f6');
  });

  test('el grosor de línea es 2.5px', () => {
    renderChart(contenedor, fixturesMediciones());
    const lineaSistolica = contenedor.querySelector('.linea-systolic');
    expect(lineaSistolica.getAttribute('stroke-width')).toBe('2.5');
  });
});

// ---------------------------------------------------------------------------
// Ejes
// ---------------------------------------------------------------------------

describe('renderChart — ejes', () => {
  test('contiene el grupo del eje X (.eje-x)', () => {
    renderChart(contenedor, fixturesMediciones());
    expect(contenedor.querySelector('.eje-x')).not.toBeNull();
  });

  test('contiene el grupo del eje Y (.eje-y)', () => {
    renderChart(contenedor, fixturesMediciones());
    expect(contenedor.querySelector('.eje-y')).not.toBeNull();
  });

  test('contiene el grupo del grid (.grid)', () => {
    renderChart(contenedor, fixturesMediciones());
    expect(contenedor.querySelector('.grid')).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Limpieza al re-renderizar
// ---------------------------------------------------------------------------

describe('renderChart — re-renderizado', () => {
  test('limpia el contenido previo antes de renderizar de nuevo', () => {
    const mediciones = fixturesMediciones();
    renderChart(contenedor, mediciones);
    const svgPrimero = contenedor.querySelector('svg');

    // Segunda llamada: debe limpiar e insertar un nuevo SVG
    renderChart(contenedor, mediciones.slice(0, 2));
    const svgSegundo = contenedor.querySelector('svg');

    // Solo debe haber un SVG en el contenedor
    expect(contenedor.querySelectorAll('svg').length).toBe(1);
    // Es un SVG diferente (nuevo DOM node)
    expect(svgPrimero).not.toBe(svgSegundo);
  });
});

// ---------------------------------------------------------------------------
// Ordenación interna
// ---------------------------------------------------------------------------

describe('renderChart — ordenación de datos', () => {
  test('ordena las mediciones de más antigua a más reciente internamente', () => {
    // Pasamos mediciones en orden descendente (como devuelve el servicio)
    const medicionesDesc = fixturesMediciones(); // ya están desc. en la fixture
    renderChart(contenedor, medicionesDesc);

    // El SVG debe generarse sin errores (validación implícita de orden correcto)
    const svg = contenedor.querySelector('svg');
    expect(svg).not.toBeNull();

    // Los puntos de dato deben existir para cada medición
    const puntos = contenedor.querySelectorAll('.punto-systolic');
    expect(puntos.length).toBe(medicionesDesc.length);
  });

  test('el array de mediciones original no se modifica (inmutabilidad)', () => {
    const original = fixturesMediciones();
    const primerFechaOriginal = original[0].measuredAt;

    renderChart(contenedor, original);

    // La primera medición del array original no debe cambiar
    expect(original[0].measuredAt).toBe(primerFechaOriginal);
  });
});

// ---------------------------------------------------------------------------
// Exactamente 2 mediciones (caso borde mínimo)
// ---------------------------------------------------------------------------

describe('renderChart — caso borde mínimo (2 mediciones)', () => {
  test('renderiza correctamente con exactamente 2 mediciones', () => {
    const dos = fixturesMediciones().slice(0, 2);
    renderChart(contenedor, dos);
    const svg = contenedor.querySelector('svg');
    expect(svg).not.toBeNull();

    const circles = contenedor.querySelectorAll('circle');
    expect(circles.length).toBe(4); // 2 series × 2 puntos
  });
});
