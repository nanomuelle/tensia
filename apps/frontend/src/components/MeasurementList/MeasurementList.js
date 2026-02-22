/**
 * Componente MeasurementList.
 * Gestiona los estados del historial (cargando, error, vacío) y renderiza
 * la lista de tarjetas de mediciones.
 *
 * El HTML vive en index.html (dentro de #historial-root).
 * Este módulo solo encapsula la lógica JS que antes estaba en app.js.
 *
 * @param {HTMLElement} rootEl                     - El elemento #historial-root.
 * @param {{ onReintentar?: Function }} [opciones] - Callbacks opcionales.
 * @returns {{ mount, unmount, mostrarCargando, mostrarError, mostrarVacio, mostrarLista }}
 */

import { formatearFecha } from '../../shared/formatters.js';

export function createMeasurementList(rootEl, { onReintentar } = {}) {
  // Referencias internas al DOM (buscadas dentro del rootEl)
  const estadoCargando  = rootEl?.querySelector('#estado-cargando')  ?? document.getElementById('estado-cargando');
  const estadoError     = rootEl?.querySelector('#estado-error')     ?? document.getElementById('estado-error');
  const estadoVacio     = rootEl?.querySelector('#estado-vacio')     ?? document.getElementById('estado-vacio');
  const listaMediciones = rootEl?.querySelector('#lista-mediciones') ?? document.getElementById('lista-mediciones');
  const btnReintentar   = rootEl?.querySelector('#btn-reintentar')   ?? document.getElementById('btn-reintentar');

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
    if (btnReintentar && onReintentar) {
      btnReintentar.addEventListener('click', onReintentar);
    }
  }

  function unmount() {
    if (btnReintentar && onReintentar) {
      btnReintentar.removeEventListener('click', onReintentar);
    }
  }

  return { mount, unmount, mostrarCargando, mostrarError, mostrarVacio, mostrarLista };
}
