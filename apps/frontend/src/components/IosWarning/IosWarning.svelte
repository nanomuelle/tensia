<!--
  IosWarning.svelte — Aviso informativo sobre la política ITP de Safari/iOS.
  Informa al usuario de que localStorage puede borrarse tras 7 días de inactividad.
  Se monta en #aviso-ios desde app.js (BK-25):
    mount(IosWarning, { target: document.getElementById('aviso-ios') });
-->
<script>
  import { onMount } from 'svelte';

  /** Controla la visibilidad del aviso. */
  let visible = $state(false);

  /** Detecta si el navegador es Safari o un dispositivo iOS. */
  function esPlataformaAfectada() {
    const ua = navigator.userAgent;
    const esIOS    = /iP(hone|od|ad)/.test(ua);
    const esSafari = /^((?!chrome|android).)*safari/i.test(ua);
    return esIOS || esSafari;
  }

  onMount(() => {
    visible = esPlataformaAfectada();
  });
</script>

{#if visible}
  <div class="aviso-ios" role="alert" aria-live="polite">
    <span>⚠️ En Safari/iOS los datos pueden borrarse si no usas la app durante 7 días.</span>
    <button
      id="btn-cerrar-aviso-ios"
      class="aviso-ios__cerrar"
      aria-label="Cerrar aviso"
      onclick={() => { visible = false; }}
    >✕</button>
  </div>
{/if}

<style>
  .aviso-ios {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    background-color: #fef3c7;
    border-bottom: 1px solid #f59e0b;
    color: #78350f;
    font-size: 0.875rem;
    padding: 0.625rem 1rem;
  }

  .aviso-ios__cerrar {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    color: inherit;
    flex-shrink: 0;
    padding: 0 0.25rem;
  }
</style>
