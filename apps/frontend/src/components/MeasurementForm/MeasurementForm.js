/**
 * Componente MeasurementForm.
 * Gestiona el formulario de registro manual de mediciones:
 * apertura/cierre, validación inline y envío al servicio.
 *
 * El HTML vive en index.html (dentro de #formulario-registro).
 * Este módulo encapsula toda la lógica del formulario que antes estaba en app.js.
 *
 * @param {HTMLElement} rootEl - El elemento #formulario-registro.
 * @param {{
 *   service:   object,
 *   onSuccess?: Function,
 *   onCerrar?: Function,
 *   toast:     object
 * }} opciones
 *   - service   — servicio de mediciones (inyectado desde app.js).
 *   - onSuccess — callback invocado tras guardar con éxito (p.ej. recargar la lista).
 *   - onCerrar  — callback invocado al cerrar el formulario (p.ej. mostrar el botón principal).
 *   - toast     — instancia del componente Toast para notificaciones efímeras.
 * @returns {{ mount: Function, unmount: Function, abrir: Function, cerrar: Function }}
 */

import { validarCamposMedicion, prepararDatosMedicion } from '../../shared/validators.js';
import { fechaLocalActual } from '../../shared/formatters.js';

export function createMeasurementForm(rootEl, { service, onSuccess, onCerrar, toast }) {
  // Referencias internas al DOM (buscadas dentro de rootEl)
  const formMedicion    = rootEl?.querySelector('#form-medicion');
  const btnGuardar      = rootEl?.querySelector('#btn-guardar');
  const btnCancelar     = rootEl?.querySelector('#btn-cancelar');
  const inputSystolic   = rootEl?.querySelector('#input-systolic');
  const inputDiastolic  = rootEl?.querySelector('#input-diastolic');
  const inputPulse      = rootEl?.querySelector('#input-pulse');
  const inputFecha      = rootEl?.querySelector('#input-fecha');
  const errorFormulario = rootEl?.querySelector('#error-formulario');

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
    if (formMedicion)  formMedicion.addEventListener('submit',  _handleSubmit);
    if (btnCancelar)   btnCancelar.addEventListener('click',    _handleCancelar);
    [inputSystolic, inputDiastolic, inputPulse, inputFecha].forEach((input) => {
      if (input) input.addEventListener('input', _handleInputChange);
    });
  }

  function unmount() {
    if (formMedicion)  formMedicion.removeEventListener('submit',  _handleSubmit);
    if (btnCancelar)   btnCancelar.removeEventListener('click',    _handleCancelar);
    [inputSystolic, inputDiastolic, inputPulse, inputFecha].forEach((input) => {
      if (input) input.removeEventListener('input', _handleInputChange);
    });
  }

  return { mount, unmount, abrir, cerrar };
}
