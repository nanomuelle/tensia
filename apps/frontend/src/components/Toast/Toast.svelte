<!--
  Toast.svelte — Notificaciones efímeras.
  Variantes: 'success', 'error', 'info'.
  Se monta mediante la API programática de Svelte 5 (BK-25):
    const toast = mount(Toast, { target: document.body });
    toast.show('Medición guardada');
-->
<script>
  /** Texto del mensaje visible. */
  let mensaje = $state('');
  /** Controla la visibilidad del toast. */
  let visible = $state(false);
  /** Variante visual: success | error | info. */
  let tipo = $state('success');
  /** Referencia al temporizador de auto-ocultación. */
  let timerId = null;

  /**
   * Muestra el toast con el mensaje indicado.
   * @param {string} msg - Texto a mostrar.
   * @param {'success'|'error'|'info'} [t='success'] - Variante visual.
   * @param {number} [duracionMs=3000] - Milisegundos antes de ocultarse automáticamente.
   */
  export function show(msg, t = 'success', duracionMs = 3000) {
    // Cancelar ocultación previa si hubiera
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }

    mensaje = msg;
    tipo = t;
    visible = true;

    // Auto-ocultar tras duracionMs
    timerId = setTimeout(() => {
      visible = false;
      timerId = null;
    }, duracionMs);
  }
</script>

{#if visible}
  <div class="toast toast--{tipo}" role="status" aria-live="polite">{mensaje}</div>
{/if}

<style>
  .toast {
    position: fixed;
    bottom: 1.5rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;

    padding: 0.75rem 1.25rem;
    border-radius: 0.5rem;
    font-size: 0.95rem;
    font-weight: 500;
    color: #fff;
    white-space: nowrap;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

    animation: toast-in 0.2s ease-out;
  }

  @keyframes toast-in {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(0.5rem);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }

  .toast--success { background-color: #16a34a; }
  .toast--error   { background-color: #dc2626; }
  .toast--info    { background-color: #2563eb; }
</style>
