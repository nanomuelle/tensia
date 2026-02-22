/**
 * Módulo de gráfica de evolución temporal — D3.js modular sobre SVG.
 * Renderiza una gráfica de líneas (sistólica/diastólica) con Canvas API migrado a SVG.
 * Implementado según ADR-006 y especificaciones en docs/design/screens.md.
 */

import { select } from 'd3-selection';
import { scaleTime, scaleLinear } from 'd3-scale';
import { axisBottom, axisLeft } from 'd3-axis';
import { line, area } from 'd3-shape';

// --- Colores según especificación de diseño (screens.md) ---
const COLOR_SISTOLICA   = '#ef4444';
const COLOR_DIASTOLICA  = '#3b82f6';
const FILL_SISTOLICA    = 'rgba(239,68,68,0.1)';
const FILL_DIASTOLICA   = 'rgba(59,130,246,0.1)';
const COLOR_GRID        = '#e5e7eb';
const COLOR_LABELS      = '#6b7280';

// --- Márgenes internos SVG (screens.md: top 20, right 20, bottom 40, left 44) ---
const MARGIN = { top: 20, right: 20, bottom: 40, left: 44 };

// --- Altura del SVG según breakpoint ---
const ALTO_MOVIL   = 200; // < 640px
const ALTO_DESKTOP = 240; // ≥ 640px

/**
 * Renderiza la gráfica de líneas en el contenedor indicado.
 * El contenedor se limpia antes de insertar el nuevo SVG.
 *
 * @param {HTMLElement} container      - El div#chart-mediciones donde montar el SVG
 * @param {Array}       measurements   - Array de mediciones (cualquier orden)
 */
export function renderChart(container, measurements) {
  // Guardia: al menos 2 mediciones para trazar una línea con sentido
  if (!container || !measurements || measurements.length < 2) {
    return;
  }

  // Limpiar contenido previo
  container.innerHTML = '';

  // Ordenar por fecha ascendente (más antigua a la izquierda)
  const datos = [...measurements].sort(
    (a, b) => new Date(a.measuredAt) - new Date(b.measuredAt),
  );

  // Dimensiones responsivas
  const anchoTotal  = container.clientWidth || 320;
  const altoTotal   = anchoTotal < 640 ? ALTO_MOVIL : ALTO_DESKTOP;
  const anchoInner  = anchoTotal - MARGIN.left - MARGIN.right;
  const altoInner   = altoTotal  - MARGIN.top  - MARGIN.bottom;

  // --- Escalas ---
  const escalaX = scaleTime()
    .domain([
      new Date(datos[0].measuredAt),
      new Date(datos[datos.length - 1].measuredAt),
    ])
    .range([0, anchoInner]);

  const todosLosValores = datos.flatMap((m) => [m.systolic, m.diastolic]);
  const minValor = Math.floor(Math.min(...todosLosValores) / 10) * 10 - 10;
  const maxValor = Math.ceil(Math.max(...todosLosValores) / 10) * 10 + 10;

  const escalaY = scaleLinear()
    .domain([minValor, maxValor])
    .range([altoInner, 0]);

  // --- SVG raíz con accesibilidad (screens.md: role="img", aria-label) ---
  const svg = select(container)
    .append('svg')
    .attr('role', 'img')
    .attr('aria-label', 'Gráfica de evolución de tensión arterial')
    .attr('width', '100%')
    .attr('height', altoTotal)
    .attr('viewBox', `0 0 ${anchoTotal} ${altoTotal}`)
    .attr('preserveAspectRatio', 'none')
    .attr('focusable', 'false');

  const g = svg.append('g')
    .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

  // --- Grid horizontal (líneas tenues en el fondo) ---
  g.append('g')
    .attr('class', 'grid')
    .call(
      axisLeft(escalaY)
        .tickSize(-anchoInner)
        .tickFormat('')
        .ticks(5),
    )
    .call((eje) => eje.select('.domain').remove())
    .call((eje) =>
      eje.selectAll('line')
        .attr('stroke', COLOR_GRID)
        .attr('stroke-width', 1),
    );

  // --- Eje X (fechas, máx. 10 etiquetas) ---
  const maxEtiquetas = 10;
  g.append('g')
    .attr('class', 'eje-x')
    .attr('transform', `translate(0,${altoInner})`)
    .call(
      axisBottom(escalaX)
        .ticks(Math.min(datos.length, maxEtiquetas))
        .tickFormat((d) => {
          const fecha = new Date(d);
          return `${String(fecha.getDate()).padStart(2, '0')}/${String(fecha.getMonth() + 1).padStart(2, '0')}`;
        }),
    )
    .call((eje) => eje.select('.domain').attr('stroke', COLOR_GRID))
    .call((eje) =>
      eje.selectAll('text')
        .attr('fill', COLOR_LABELS)
        .style('font-size', '11px'),
    )
    .call((eje) => eje.selectAll('.tick line').attr('stroke', COLOR_GRID));

  // --- Eje Y (valores mmHg) ---
  g.append('g')
    .attr('class', 'eje-y')
    .call(axisLeft(escalaY).ticks(5))
    .call((eje) => eje.select('.domain').remove())
    .call((eje) =>
      eje.selectAll('text')
        .attr('fill', COLOR_LABELS)
        .style('font-size', '11px'),
    )
    .call((eje) => eje.selectAll('.tick line').attr('stroke', COLOR_GRID));

  /**
   * Traza el área de relleno + línea + puntos para una serie.
   * @param {string} campo        - 'systolic' | 'diastolic'
   * @param {string} colorLinea   - Hex del color de la línea y puntos
   * @param {string} colorRelleno - Color rgba del área
   */
  function trazarSerie(campo, colorLinea, colorRelleno) {
    const generadorLinea = line()
      .x((d) => escalaX(new Date(d.measuredAt)))
      .y((d) => escalaY(d[campo]));

    const generadorArea = area()
      .x((d) => escalaX(new Date(d.measuredAt)))
      .y0(altoInner)
      .y1((d) => escalaY(d[campo]));

    // Área de relleno transparente bajo la línea
    g.append('path')
      .datum(datos)
      .attr('class', `area area-${campo}`)
      .attr('fill', colorRelleno)
      .attr('d', generadorArea);

    // Línea principal
    g.append('path')
      .datum(datos)
      .attr('class', `linea linea-${campo}`)
      .attr('fill', 'none')
      .attr('stroke', colorLinea)
      .attr('stroke-width', 2.5)
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('d', generadorLinea);

    // Puntos de dato (radio 4px según screens.md)
    g.selectAll(`.punto-${campo}`)
      .data(datos)
      .enter()
      .append('circle')
      .attr('class', `punto-${campo}`)
      .attr('cx', (d) => escalaX(new Date(d.measuredAt)))
      .attr('cy', (d) => escalaY(d[campo]))
      .attr('r', 4)
      .attr('fill', colorLinea);
  }

  // Diastólica primero (queda detrás), sistólica encima
  trazarSerie('diastolic', COLOR_DIASTOLICA, FILL_DIASTOLICA);
  trazarSerie('systolic',  COLOR_SISTOLICA,  FILL_SISTOLICA);
}
