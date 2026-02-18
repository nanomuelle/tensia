/**
 * Lógica de la interfaz — pantalla principal de Tensia.
 * Orquesta el DOM, gestiona los estados de la UI y delega todas las
 * llamadas al backend al módulo api.js.
 */

import { getMediciones, crearMedicion } from './api.js';
import { validarCamposMedicion, prepararDatosMedicion } from './validators.js';

// --- Formato de fecha localizado ---
const formatearFecha = new Intl.DateTimeFormat('es', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

// --- Referencias al DOM: historial ---
const estadoCargando = document.getElementById('estado-cargando');
const estadoError = document.getElementById('estado-error');
const estadoVacio = document.getElementById('estado-vacio');
const listaMediciones = document.getElementById('lista-mediciones');
const btnReintentar = document.getElementById('btn-reintentar');

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
// Historial: carga
// =========================================================

async function cargarMediciones() {
  mostrarCargando();
  try {
    const mediciones = await getMediciones();
    if (mediciones.length === 0) {
      mostrarVacio();
    } else {
      mostrarLista(mediciones);
    }
  } catch {
    mostrarError();
  }
}

// =========================================================
// Formulario: mostrar / ocultar
// =========================================================

/** Rellena el campo fecha con la fecha y hora actuales (formato datetime-local). */
function rellenarFechaActual() {
  // datetime-local requiere "YYYY-MM-DDTHH:MM" en hora local
  const ahora = new Date();
  const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
  inputFecha.value = local.toISOString().slice(0, 16);
}

function abrirFormulario() {
  limpiarFormulario();
  rellenarFechaActual();
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
    await crearMedicion(datos);
    cerrarFormulario();
    await cargarMediciones();
  } catch (error) {
    // Error de validación del backend (400) u otro error de red
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
cargarMediciones();

