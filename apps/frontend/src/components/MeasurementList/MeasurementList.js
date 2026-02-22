/**
 * Componente MeasurementList.
 * Gestiona los estados del historial (cargando, error, vacío) y renderiza
 * la lista de tarjetas de mediciones.
 *
 * mount() genera su propio HTML dentro de rootEl (Paso 14d).
 * rootEl (#historial-root) es el único nodo que debe existir en el HTML padre.
 *
 * @param {HTMLElement} rootEl                     - El elemento #historial-root (vacío al montarse).
 * @param {{ onReintentar?: Function }} [opciones] - Callbacks opcionales.
 * @returns {{ mount, unmount, mostrarCargando, mostrarError, mostrarVacio, mostrarLista }}
 */

import { formatearFecha } from '../../shared/formatters.js';

export function createMeasurementList(rootEl, { onReintentar } = {}) {
  // Referencias internas al DOM (se capturan en mount() tras generar el HTML)
  let estadoCargando  = null;
  let estadoError     = null;
  let estadoVacio     = null;
  let listaMediciones = null;
  let btnReintentar   = null;

  // -------------------------------------------------------
  // Helpers de estado internos
  // -------------------------------------------------------

  /** Oculta todos los estados y la lista. */
  function ocultarEstados() {
    if (estadoCargando)  estadoCargando.hidden  = true;
    if (estadoError)     estadoError.hidden     = true;
    if (estadoVacio)     estadoVacio.hidden     = true;
    if (listaMediciones) listaMediciones.hidden = true;
  }

  // -------------------------------------------------------
  // API pública
  // -------------------------------------------------------

  function mostrarCargando() {
    ocultarEstados();
    if (estadoCargando) estadoCargando.hidden = false;
  }

  function mostrarError() {
    ocultarEstados();
    if (estadoError) estadoError.hidden = false;
  }

  function mostrarVacio() {
    ocultarEstados();
    if (estadoVacio) estadoVacio.hidden = false;
  }

  /** Renderiza la lista de mediciones en el DOM. */
  function mostrarLista(mediciones) {
    ocultarEstados();
    if (!listaMediciones) return;

    listaMediciones.innerHTML = '';

    mediciones.forEach((m) => {
      const li = document.createElement('li');
      li.className = 'tarjeta';
      li.setAttribute('role', 'listitem');

      const fecha = formatearFecha.format(new Date(m.measuredAt));

      const pulsoHTML = m.pulse
        ? `<span class="tarjeta__pulso" aria-label="Pulso: ${m.pulse} pulsaciones por minuto">💓 ${m.pulse} ppm</span>`
        : '';

      li.innerHTML = `
        <span class="tarjeta__fecha">${fecha}</span>
        <div class="tarjeta__valores">
          <span class="tarjeta__tension" aria-label="Tensión: ${m.systolic} sobre ${m.diastolic} milímetros de mercurio">
            ${m.systolic} / ${m.diastolic}
          </span>
          <span class="tarjeta__unidad" aria-hidden="true">mmHg</span>
          ${pulsoHTML}
        </div>
      `;

      listaMediciones.appendChild(li);
    });

    listaMediciones.hidden = false;
  }

  // -------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------

  function mount() {
    if (!rootEl) return;

    // Generar el HTML interno del historial
    rootEl.innerHTML = `
      <h2 class="historial__titulo">Historial</h2>

      <div
        id="estado-cargando"
        class="estado estado--cargando"
        aria-live="polite"
        aria-label="Cargando"
        hidden
      >
        <span class="spinner" aria-hidden="true"></span>
        <span>Cargando mediciones…</span>
      </div>

      <div
        id="estado-error"
        class="estado estado--error"
        role="alert"
        hidden
      >
        <span>⚠️ No se pudieron cargar las mediciones.</span>
        <button id="btn-reintentar" class="btn btn--secundario">
          Reintentar
        </button>
      </div>

      <div id="estado-vacio" class="estado estado--vacio" hidden>
        <p>Sin mediciones todavía.</p>
        <p>Pulsa "Nueva medición" para registrar la primera.</p>
      </div>

      <ul
        id="lista-mediciones"
        class="lista-mediciones"
        role="list"
        aria-label="Historial de mediciones"
      ></ul>
    `;

    // Capturar refs tras generar el HTML
    estadoCargando  = rootEl.querySelector('#estado-cargando');
    estadoError     = rootEl.querySelector('#estado-error');
    estadoVacio     = rootEl.querySelector('#estado-vacio');
    listaMediciones = rootEl.querySelector('#lista-mediciones');
    btnReintentar   = rootEl.querySelector('#btn-reintentar');

    if (btnReintentar && onReintentar) {
      btnReintentar.addEventListener('click', onReintentar);
    }
  }

  function unmount() {
    if (btnReintentar && onReintentar) {
      btnReintentar.removeEventListener('click', onReintentar);
    }
    estadoCargando  = null;
    estadoError     = null;
    estadoVacio     = null;
    listaMediciones = null;
    btnReintentar   = null;
  }

  return { mount, unmount, mostrarCargando, mostrarError, mostrarVacio, mostrarLista };
}
