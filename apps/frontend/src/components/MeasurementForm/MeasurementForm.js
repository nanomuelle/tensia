/**
 * Componente MeasurementForm.
 * Gestiona el formulario de registro manual de mediciones:
 * apertura/cierre, validación inline y envío al servicio.
 *
 * mount() genera su propio HTML dentro de rootEl (Paso 14e).
 * rootEl (#formulario-registro) es el único nodo que debe existir en el HTML padre.
 *
 * @param {HTMLElement} rootEl - El elemento #formulario-registro (vacío al montarse).
 * @param {{
 *   service:    object,
 *   onSuccess?: Function,
 *   onCerrar?:  Function,
 *   toast:      object
 * }} opciones
 *   - service   — servicio de mediciones (inyectado desde HomeView).
 *   - onSuccess — callback invocado tras guardar con éxito (p.ej. recargar la lista).
 *   - onCerrar  — callback invocado al cerrar el formulario (p.ej. mostrar el botón principal).
 *   - toast     — instancia del componente Toast para notificaciones efímeras.
 * @returns {{ mount: Function, unmount: Function, abrir: Function, cerrar: Function }}
 */

import { validarCamposMedicion, prepararDatosMedicion } from '../../shared/validators.js';
import { fechaLocalActual } from '../../shared/formatters.js';

export function createMeasurementForm(rootEl, { service, onSuccess, onCerrar, toast }) {
  // Referencias internas al DOM (se inicializan en mount() tras generar el HTML)
  let formMedicion    = null;
  let btnGuardar      = null;
  let btnCancelar     = null;
  let inputSystolic   = null;
  let inputDiastolic  = null;
  let inputPulse      = null;
  let inputFecha      = null;
  let errorFormulario = null;

  // -------------------------------------------------------
  // Helpers internos: errores inline
  // -------------------------------------------------------

  /** Muestra o borra el mensaje de error asociado a un campo. */
  function setErrorCampo(inputEl, errorEl, mensaje) {
    if (!inputEl || !errorEl) return;
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

  /** Limpia todos los mensajes de error del formulario. */
  function limpiarErrores() {
    setErrorCampo(inputSystolic,  rootEl?.querySelector('#error-systolic'),  '');
    setErrorCampo(inputDiastolic, rootEl?.querySelector('#error-diastolic'), '');
    setErrorCampo(inputPulse,     rootEl?.querySelector('#error-pulse'),     '');
    setErrorCampo(inputFecha,     rootEl?.querySelector('#error-fecha'),     '');
    if (errorFormulario) {
      errorFormulario.textContent = '';
      errorFormulario.hidden = true;
    }
  }

  /** Limpia valores y errores del formulario. */
  function limpiarFormulario() {
    if (formMedicion) formMedicion.reset();
    limpiarErrores();
  }

  /**
   * Lee los valores del DOM, delega la validación en validators.js (puro)
   * y muestra los errores inline correspondientes.
   * @returns {object|null} Datos listos para el servicio, o null si hay errores.
   */
  function validarFormulario() {
    limpiarErrores();

    const campos = {
      systolic:   inputSystolic?.value   ?? '',
      diastolic:  inputDiastolic?.value  ?? '',
      pulse:      inputPulse?.value      ?? '',
      measuredAt: inputFecha?.value      ?? '',
    };

    const errores = validarCamposMedicion(campos);

    if (errores.systolic)
      setErrorCampo(inputSystolic,  rootEl?.querySelector('#error-systolic'),  errores.systolic);
    if (errores.diastolic)
      setErrorCampo(inputDiastolic, rootEl?.querySelector('#error-diastolic'), errores.diastolic);
    if (errores.pulse)
      setErrorCampo(inputPulse,     rootEl?.querySelector('#error-pulse'),     errores.pulse);
    if (errores.measuredAt)
      setErrorCampo(inputFecha,     rootEl?.querySelector('#error-fecha'),     errores.measuredAt);

    if (Object.keys(errores).length > 0) return null;

    return prepararDatosMedicion(campos);
  }

  // -------------------------------------------------------
  // API pública: apertura / cierre
  // -------------------------------------------------------

  /** Muestra el formulario, rellena la fecha actual y enfoca el primer campo. */
  function abrir() {
    limpiarFormulario();
    if (inputFecha) inputFecha.value = fechaLocalActual();
    if (rootEl) rootEl.hidden = false;
    if (inputSystolic) inputSystolic.focus();
  }

  /** Oculta el formulario e invoca el callback onCerrar si se proporcionó. */
  function cerrar() {
    if (rootEl) rootEl.hidden = true;
    if (onCerrar) onCerrar();
  }

  // -------------------------------------------------------
  // Handlers de eventos (guardados como referencias para poder desmontarlos)
  // -------------------------------------------------------

  async function _handleSubmit(evento) {
    evento.preventDefault();

    const datos = validarFormulario();
    if (!datos) return;

    // Deshabilitar botón mientras se envía
    if (btnGuardar) {
      btnGuardar.disabled = true;
      btnGuardar.textContent = 'Guardando…';
    }

    try {
      await service.create(datos);
      cerrar();
      if (toast) toast.show('Medición guardada', 'success');
      if (onSuccess) onSuccess();
    } catch (error) {
      // Error de validación de dominio u otro error inesperado
      if (errorFormulario) {
        errorFormulario.textContent = error.message;
        errorFormulario.hidden = false;
      }
    } finally {
      if (btnGuardar) {
        btnGuardar.disabled = false;
        btnGuardar.textContent = 'Guardar medición';
      }
    }
  }

  function _handleCancelar() {
    cerrar();
  }

  /** Borra el error de un campo en cuanto el usuario empieza a escribir. */
  function _handleInputChange(evento) {
    const input = evento.target;
    const errorId = input.getAttribute('aria-describedby');
    const errorEl = errorId ? rootEl?.querySelector(`#${errorId}`) : null;
    if (errorEl) setErrorCampo(input, errorEl, '');
  }

  // -------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------

  function mount() {
    if (!rootEl) return;

    // Generar el HTML del formulario dentro del contenedor
    rootEl.innerHTML = `
      <h2 class="formulario__titulo">Nueva medición</h2>

      <form id="form-medicion" novalidate>
        <!-- Sistólica -->
        <div class="campo">
          <label class="campo__label" for="input-systolic">
            Sistólica <span class="campo__requerido" aria-hidden="true">*</span>
          </label>
          <div class="campo__fila">
            <input
              id="input-systolic"
              name="systolic"
              type="number"
              class="campo__input"
              inputmode="numeric"
              min="1"
              placeholder="ej. 120"
              required
              aria-required="true"
              aria-describedby="error-systolic"
            />
            <span class="campo__unidad" aria-hidden="true">mmHg</span>
          </div>
          <span id="error-systolic" class="campo__error" role="alert" hidden></span>
        </div>

        <!-- Diastólica -->
        <div class="campo">
          <label class="campo__label" for="input-diastolic">
            Diastólica <span class="campo__requerido" aria-hidden="true">*</span>
          </label>
          <div class="campo__fila">
            <input
              id="input-diastolic"
              name="diastolic"
              type="number"
              class="campo__input"
              inputmode="numeric"
              min="1"
              placeholder="ej. 80"
              required
              aria-required="true"
              aria-describedby="error-diastolic"
            />
            <span class="campo__unidad" aria-hidden="true">mmHg</span>
          </div>
          <span id="error-diastolic" class="campo__error" role="alert" hidden></span>
        </div>

        <!-- Pulso (opcional) -->
        <div class="campo">
          <label class="campo__label" for="input-pulse">
            Pulso <span class="campo__opcional">(opcional)</span>
          </label>
          <div class="campo__fila">
            <input
              id="input-pulse"
              name="pulse"
              type="number"
              class="campo__input"
              inputmode="numeric"
              min="1"
              placeholder="ej. 72"
              aria-describedby="error-pulse"
            />
            <span class="campo__unidad" aria-hidden="true">ppm</span>
          </div>
          <span id="error-pulse" class="campo__error" role="alert" hidden></span>
        </div>

        <!-- Fecha y hora -->
        <div class="campo">
          <label class="campo__label" for="input-fecha">
            Fecha y hora <span class="campo__requerido" aria-hidden="true">*</span>
          </label>
          <input
            id="input-fecha"
            name="measuredAt"
            type="datetime-local"
            class="campo__input campo__input--fecha"
            required
            aria-required="true"
            aria-describedby="error-fecha"
          />
          <span id="error-fecha" class="campo__error" role="alert" hidden></span>
        </div>

        <!-- Error global del formulario -->
        <div id="error-formulario" class="formulario__error" role="alert" hidden></div>

        <!-- Acciones -->
        <div class="formulario__acciones">
          <button type="submit" id="btn-guardar" class="btn btn--primario">
            Guardar medición
          </button>
          <button type="button" id="btn-cancelar" class="btn btn--secundario">
            Cancelar
          </button>
        </div>
      </form>
    `;

    // Capturar refs tras generar el HTML
    formMedicion    = rootEl.querySelector('#form-medicion');
    btnGuardar      = rootEl.querySelector('#btn-guardar');
    btnCancelar     = rootEl.querySelector('#btn-cancelar');
    inputSystolic   = rootEl.querySelector('#input-systolic');
    inputDiastolic  = rootEl.querySelector('#input-diastolic');
    inputPulse      = rootEl.querySelector('#input-pulse');
    inputFecha      = rootEl.querySelector('#input-fecha');
    errorFormulario = rootEl.querySelector('#error-formulario');

    // Registrar listeners
    if (formMedicion) formMedicion.addEventListener('submit',  _handleSubmit);
    if (btnCancelar)  btnCancelar.addEventListener('click',    _handleCancelar);
    [inputSystolic, inputDiastolic, inputPulse, inputFecha].forEach((input) => {
      if (input) input.addEventListener('input', _handleInputChange);
    });
  }

  function unmount() {
    if (formMedicion) formMedicion.removeEventListener('submit',  _handleSubmit);
    if (btnCancelar)  btnCancelar.removeEventListener('click',    _handleCancelar);
    [inputSystolic, inputDiastolic, inputPulse, inputFecha].forEach((input) => {
      if (input) input.removeEventListener('input', _handleInputChange);
    });
    formMedicion    = null;
    btnGuardar      = null;
    btnCancelar     = null;
    inputSystolic   = null;
    inputDiastolic  = null;
    inputPulse      = null;
    inputFecha      = null;
    errorFormulario = null;
  }

  return { mount, unmount, abrir, cerrar };
}

