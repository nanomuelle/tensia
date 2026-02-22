/**
 * Lógica de la interfaz — pantalla principal de Tensia.
 * Orquesta el DOM, gestiona los estados de la UI y delega la persistencia
 * al servicio local (ADR-005): en sesión anónima usa localStorageAdapter.
 */

import * as adapter from './infra/localStorageAdapter.js';
import { createMeasurementService } from './services/measurementService.js';
import { validarCamposMedicion, prepararDatosMedicion } from './shared/validators.js';
import { renderChart } from './chart.js';
import { formatearFecha, fechaLocalActual } from './shared/formatters.js';
import { on, Events } from './shared/eventBus.js';
import { MIN_MEDICIONES_GRAFICA } from './shared/constants.js';
import { createIosWarning } from './components/IosWarning/IosWarning.js';

// Servicio con adaptador inyectado (anónimo → localStorage)
const service = createMeasurementService(adapter);

// --- Referencias al DOM: historial ---
const estadoCargando = document.getElementById('estado-cargando');
const estadoError = document.getElementById('estado-error');
const estadoVacio = document.getElementById('estado-vacio');
const listaMediciones = document.getElementById('lista-mediciones');
const btnReintentar = document.getElementById('btn-reintentar');

// --- Referencias al DOM: gráfica ---
const seccionGrafica   = document.getElementById('seccion-grafica');
const containerChart   = document.getElementById('chart-mediciones');

// Referencia a las últimas mediciones para que ResizeObserver pueda redibujar
let ultimasMediciones = [];

// ResizeObserver: se crea al primer renderizado de la gráfica (no en carga del módulo)
let resizeObserver = null;

// --- Referencias al DOM: formulario ---
const btnNuevaMedicion = document.getElementById('btn-nueva-medicion');
const formularioRegistro = document.getElementById('formulario-registro');
const formMedicion = document.getElementById('form-medicion');
const btnGuardar = document.getElementById('btn-guardar');
const btnCancelar = document.getElementById('btn-cancelar');
const inputSystolic = document.getElementById('input-systolic');
const inputDiastolic = document.getElementById('input-diastolic');
const inputPulse = document.getElementById('input-pulse');
const inputFecha = document.getElementById('input-fecha');
const errorFormulario = document.getElementById('error-formulario');

// =========================================================
// Historial: helpers de estado
// =========================================================

/** Oculta todos los estados de la lista y la propia lista. */
function ocultarEstados() {
  estadoCargando.hidden = true;
  estadoError.hidden = true;
  estadoVacio.hidden = true;
  listaMediciones.hidden = true;
}

function mostrarCargando() {
  ocultarEstados();
  estadoCargando.hidden = false;
}

function mostrarError() {
  ocultarEstados();
  estadoError.hidden = false;
}

function mostrarVacio() {
  ocultarEstados();
  estadoVacio.hidden = false;
}

/** Renderiza la lista de mediciones en el DOM. */
function mostrarLista(mediciones) {
  ocultarEstados();
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

// =========================================================
// Gráfica: renderizado con D3 SVG (ADR-006)
// =========================================================

/**
 * Renderiza la gráfica de evolución de tensión arterial.
 * Muestra sistólica y diastólica en un gráfico de líneas SVG.
 * Solo se muestra con ≥ 2 mediciones.
 * El ResizeObserver se inicializa aquí, solo cuando la gráfica es visible.
 */
function renderizarGrafica(mediciones) {
  // Guardar referencia para que ResizeObserver pueda redibujar
  ultimasMediciones = mediciones;

  // Si no existe el DOM esperado, no hacemos nada
  if (!seccionGrafica || !containerChart) return;

  // Mostrar siempre la sección de gráfica: el módulo renderChart
  // decidirá si dibuja la gráfica real o el skeleton cuando haya <2 mediciones
  seccionGrafica.hidden = false;

  // Si no hay suficientes mediciones, renderizamos el skeleton y salimos
  if (mediciones.length < MIN_MEDICIONES_GRAFICA) {
    renderChart(containerChart, mediciones);
    return;
  }

  // Inicializar ResizeObserver solo cuando la gráfica es visible y tiene datos suficientes
  if (!resizeObserver && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      if (ultimasMediciones.length >= MIN_MEDICIONES_GRAFICA && containerChart) {
        renderChart(containerChart, ultimasMediciones);
      }
    });
    resizeObserver.observe(containerChart);
  }

  // Renderizar usando el módulo de gráficas D3
  renderChart(containerChart, mediciones);
}

// =========================================================
// Historial: carga
// =========================================================

async function cargarMediciones() {
  mostrarCargando();
  try {
    const mediciones = await service.listAll();
    if (mediciones.length === 0) {
      mostrarVacio();
      // Mostrar skeleton de la gráfica incluso con lista vacía
      renderizarGrafica(mediciones);
    } else {
      renderizarGrafica(mediciones);
      mostrarLista(mediciones);
    }
  } catch {
    mostrarError();
    // En caso de error, ocultamos la sección de gráfica
    if (seccionGrafica) seccionGrafica.hidden = true;
  }
}

// =========================================================
// Formulario: mostrar / ocultar
// =========================================================

function abrirFormulario() {
  limpiarFormulario();
  inputFecha.value = fechaLocalActual();
  formularioRegistro.hidden = false;
  btnNuevaMedicion.hidden = true;
  inputSystolic.focus();
}

function cerrarFormulario() {
  formularioRegistro.hidden = true;
  btnNuevaMedicion.hidden = false;
}

// =========================================================
// Formulario: validación y errores inline
// =========================================================

/** Muestra o borra el mensaje de error de un campo. */
function setErrorCampo(inputEl, errorEl, mensaje) {
  if (mensaje) {
    inputEl.classList.add('campo__input--invalido');
    errorEl.textContent = mensaje;
    errorEl.hidden = false;
  } else {
    inputEl.classList.remove('campo__input--invalido');
    errorEl.textContent = '';
    errorEl.hidden = true;
  }
}

/** Limpia todos los errores del formulario. */
function limpiarErrores() {
  setErrorCampo(inputSystolic, document.getElementById('error-systolic'), '');
  setErrorCampo(inputDiastolic, document.getElementById('error-diastolic'), '');
  setErrorCampo(inputPulse, document.getElementById('error-pulse'), '');
  setErrorCampo(inputFecha, document.getElementById('error-fecha'), '');
  errorFormulario.textContent = '';
  errorFormulario.hidden = true;
}

/** Limpia campos y errores del formulario. */
function limpiarFormulario() {
  formMedicion.reset();
  limpiarErrores();
}

/**
 * Valida el formulario leyendo los valores del DOM,
 * delega la lógica de validación en validators.js (puro)
 * y muestra los errores inline correspondientes.
 * Devuelve los datos listos para el POST, o null si hay errores.
 */
function validarFormulario() {
  limpiarErrores();

  const campos = {
    systolic: inputSystolic.value,
    diastolic: inputDiastolic.value,
    pulse: inputPulse.value,
    measuredAt: inputFecha.value,
  };

  const errores = validarCamposMedicion(campos);

  if (errores.systolic) setErrorCampo(inputSystolic, document.getElementById('error-systolic'), errores.systolic);
  if (errores.diastolic) setErrorCampo(inputDiastolic, document.getElementById('error-diastolic'), errores.diastolic);
  if (errores.pulse) setErrorCampo(inputPulse, document.getElementById('error-pulse'), errores.pulse);
  if (errores.measuredAt) setErrorCampo(inputFecha, document.getElementById('error-fecha'), errores.measuredAt);

  if (Object.keys(errores).length > 0) return null;

  return prepararDatosMedicion(campos);
}

// =========================================================
// Formulario: envío
// =========================================================

async function enviarFormulario(evento) {
  evento.preventDefault();

  const datos = validarFormulario();
  if (!datos) return;

  // Deshabilitar botón mientras se envía
  btnGuardar.disabled = true;
  btnGuardar.textContent = 'Guardando…';

  try {
    await service.create(datos);
    // La actualización de lista y gráfica se dispara mediante el evento
    // 'medicion-guardada' despachado por el servicio (US-12).
    cerrarFormulario();
  } catch (error) {
    // Error de validación de dominio u otro error
    errorFormulario.textContent = error.message;
    errorFormulario.hidden = false;
  } finally {
    btnGuardar.disabled = false;
    btnGuardar.textContent = 'Guardar medición';
  }
}

// =========================================================
// Eventos
// =========================================================

btnNuevaMedicion.addEventListener('click', abrirFormulario);
btnCancelar.addEventListener('click', cerrarFormulario);
btnReintentar.addEventListener('click', cargarMediciones);
formMedicion.addEventListener('submit', enviarFormulario);

// Actualización reactiva de lista y gráfica al guardar una medición (US-12).
// El servicio despacha este evento tras persistir en localStorage, de modo que
// cualquier parte de la UI puede reaccionar sin acoplarse al formulario.
on(Events.MEASUREMENT_SAVED, () => cargarMediciones());

// Limpiar error de campo al empezar a escribir
[inputSystolic, inputDiastolic, inputPulse, inputFecha].forEach((input) => {
  input.addEventListener('input', () => {
    const errorId = input.getAttribute('aria-describedby');
    const errorEl = document.getElementById(errorId);
    if (errorEl) setErrorCampo(input, errorEl, '');
  });
});

// =========================================================
// Arranque
// =========================================================
createIosWarning(document.getElementById('aviso-ios')).mount();
cargarMediciones();

