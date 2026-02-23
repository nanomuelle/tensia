<!--
  MeasurementForm.svelte
  Formulario de registro manual de mediciones.

  Props:
    - service    — servicio de mediciones (inyectado desde el componente padre).
    - toast      — instancia Toast para notificaciones efímeras.
    - onSuccess  — callback invocado tras guardar con éxito.
    - onCerrar   — callback invocado al cancelar o cerrar el formulario.

  API pública exportada:
    - abrir()    — rellena la fecha actual, limpia el formulario y enfoca el primer campo.
-->
<script>
  import { onMount } from 'svelte';
  import { validarCamposMedicion, prepararDatosMedicion } from '../../shared/validators.js';
  import { fechaLocalActual } from '../../shared/formatters.js';

  // --- Props ---
  let { service, toast, onSuccess, onCerrar } = $props();

  // --- Estado interno ---
  let systolic   = $state('');
  let diastolic  = $state('');
  let pulse      = $state('');
  // measuredAt se inicializa vacío y se rellena en onMount con la fecha local
  // actual, garantizando que el campo siempre tenga un valor válido al abrir.
  let measuredAt = $state('');

  onMount(() => {
    measuredAt = fechaLocalActual();
  });
  let errores    = $state({});
  let enviando   = $state(false);
  let errorGlobal = $state('');

  // Referencia al primer campo (para mover el foco en abrir())
  let inputSystolicEl = $state(null);

  // -------------------------------------------------------
  // API pública
  // -------------------------------------------------------

  /** Prepara y muestra el formulario: limpia campos, pone la fecha actual y enfoca. */
  export function abrir() {
    systolic    = '';
    diastolic   = '';
    pulse       = '';
    measuredAt  = fechaLocalActual();
    errores     = {};
    errorGlobal = '';
    enviando    = false;
    // El foco lo solicita Modal.svelte tras la animación de apertura (transitionend).
    // Como fallback, lo ponemos aquí con un micro-tick.
    setTimeout(() => inputSystolicEl?.focus(), 0);
  }

  // -------------------------------------------------------
  // Validación
  // -------------------------------------------------------

  /** Valida todos los campos usando validators.js y actualiza `errores`. */
  function validar() {
    const campos = {
      systolic:   String(systolic),
      diastolic:  String(diastolic),
      pulse:      String(pulse),
      measuredAt: String(measuredAt),
    };
    errores = validarCamposMedicion(campos);
    return Object.keys(errores).length === 0 ? prepararDatosMedicion(campos) : null;
  }

  /** Borra el error de un campo concreto cuando el usuario empieza a escribir. */
  function limpiarErrorCampo(campo) {
    if (errores[campo]) {
      errores = { ...errores, [campo]: undefined };
    }
  }

  // -------------------------------------------------------
  // Handlers
  // -------------------------------------------------------

  async function handleSubmit(evento) {
    evento.preventDefault();

    const datos = validar();
    if (!datos) return;

    enviando    = true;
    errorGlobal = '';

    try {
      await service.create(datos);
      if (toast) toast.show('Medición guardada', 'success');
      if (onSuccess) onSuccess();
    } catch (error) {
      errorGlobal = error.message ?? 'Error al guardar la medición.';
    } finally {
      enviando = false;
    }
  }

  function handleCancelar() {
    if (onCerrar) onCerrar();
  }
</script>

<!-- ========================================================
     Marcado del formulario
     ======================================================== -->
<h2 class="formulario__titulo">Nueva medición</h2>

<form id="form-medicion" novalidate onsubmit={handleSubmit}>

  <!-- Sistólica -->
  <div class="campo">
    <label class="campo__label" for="input-systolic">
      Sistólica <span class="campo__requerido" aria-hidden="true">*</span>
    </label>
    <div class="campo__fila">
      <input
        bind:this={inputSystolicEl}
        id="input-systolic"
        name="systolic"
        type="number"
        class="campo__input"
        class:campo__input--invalido={errores.systolic}
        inputmode="numeric"
        min="1"
        placeholder="ej. 120"
        required
        aria-required="true"
        aria-describedby="error-systolic"
        bind:value={systolic}
        oninput={() => limpiarErrorCampo('systolic')}
      />
      <span class="campo__unidad" aria-hidden="true">mmHg</span>
    </div>
    {#if errores.systolic}
      <span id="error-systolic" class="campo__error" role="alert">{errores.systolic}</span>
    {/if}
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
        class:campo__input--invalido={errores.diastolic}
        inputmode="numeric"
        min="1"
        placeholder="ej. 80"
        required
        aria-required="true"
        aria-describedby="error-diastolic"
        bind:value={diastolic}
        oninput={() => limpiarErrorCampo('diastolic')}
      />
      <span class="campo__unidad" aria-hidden="true">mmHg</span>
    </div>
    {#if errores.diastolic}
      <span id="error-diastolic" class="campo__error" role="alert">{errores.diastolic}</span>
    {/if}
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
        class:campo__input--invalido={errores.pulse}
        inputmode="numeric"
        min="1"
        placeholder="ej. 72"
        aria-describedby="error-pulse"
        bind:value={pulse}
        oninput={() => limpiarErrorCampo('pulse')}
      />
      <span class="campo__unidad" aria-hidden="true">ppm</span>
    </div>
    {#if errores.pulse}
      <span id="error-pulse" class="campo__error" role="alert">{errores.pulse}</span>
    {/if}
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
      class:campo__input--invalido={errores.measuredAt}
      required
      aria-required="true"
      aria-describedby="error-fecha"
      bind:value={measuredAt}
      oninput={() => limpiarErrorCampo('measuredAt')}
    />
    {#if errores.measuredAt}
      <span id="error-fecha" class="campo__error" role="alert">{errores.measuredAt}</span>
    {/if}
  </div>

  <!-- Error global del formulario -->
  {#if errorGlobal}
    <div class="formulario__error" role="alert">{errorGlobal}</div>
  {/if}

  <!-- Acciones -->
  <div class="formulario__acciones">
    <button type="submit" id="btn-guardar" class="btn btn--primario" disabled={enviando}>
      {enviando ? 'Guardando…' : 'Guardar medición'}
    </button>
    <button type="button" id="btn-cancelar" class="btn btn--secundario" onclick={handleCancelar}>
      Cancelar
    </button>
  </div>

</form>

<style>
  /* =========================================================
     MeasurementForm — Formulario de registro manual
     ========================================================= */

  .formulario__titulo {
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--color-texto-principal);
  }

  /* --- Campos del formulario --- */
  .campo {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .campo__label {
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--color-texto-principal);
  }

  .campo__requerido {
    color: #c0392b;
    margin-left: 0.125rem;
  }

  .campo__opcional {
    font-weight: 400;
    color: var(--color-texto-secundario);
    font-size: 0.875rem;
  }

  .campo__fila {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .campo__input {
    flex: 1;
    min-height: 48px;
    padding: 0.625rem 0.75rem;
    border: 1.5px solid var(--color-borde);
    border-radius: 8px;
    font-family: var(--fuente);
    font-size: 1rem;
    color: var(--color-texto-principal);
    background-color: var(--color-superficie);
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
    appearance: none;
    -webkit-appearance: none;
  }

  .campo__input:focus {
    outline: none;
    border-color: var(--color-primario);
    box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.2);
  }

  .campo__input--fecha {
    width: 100%;
  }

  /* Estado de error en el input */
  .campo__input--invalido {
    border-color: #c0392b;
  }

  .campo__input--invalido:focus {
    border-color: #c0392b;
    box-shadow: 0 0 0 3px rgba(192, 57, 43, 0.15);
  }

  .campo__unidad {
    font-size: 0.875rem;
    color: var(--color-texto-unidad);
    white-space: nowrap;
    min-width: 2.5rem;
  }

  .campo__error {
    font-size: 0.875rem;
    color: #c0392b;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  /* --- Error global del formulario --- */
  .formulario__error {
    background-color: var(--color-error-fondo);
    border: 1px solid var(--color-error-borde);
    border-radius: 8px;
    padding: 0.75rem 1rem;
    color: var(--color-error-texto);
    font-size: 0.9375rem;
  }

  /* --- Acciones --- */
  .formulario__acciones {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
    padding-top: 0.25rem;
  }
</style>
