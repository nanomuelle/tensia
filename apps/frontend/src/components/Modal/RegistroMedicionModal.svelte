<!--
  RegistroMedicionModal.svelte — Composición Modal + MeasurementForm.

  Encapsula la integración entre Modal.svelte y MeasurementForm.svelte,
  permitiendo que HomeView.js (aún Vanilla JS) lo monte con la API
  programática de Svelte 5 (mount/unmount) sin necesidad de snippets.

  Props:
    service  — servicio de mediciones (inyectado desde HomeView).
    toast    — instancia Toast para notificaciones efímeras.
    onClose  — callback invocado al finalizar el cierre de la modal.

  API pública (accesible via bind:this o mount()):
    open()   — abre la modal.
    close()  — cierra la modal.
-->
<script>
  import { onMount } from 'svelte';
  import Modal from './Modal.svelte';
  import MeasurementForm from '../MeasurementForm/MeasurementForm.svelte';

  // --- Props ---
  let { service, toast, onClose } = $props();

  // Referencias a los componentes hijos
  let modal = $state(null);
  let form  = $state(null);

  // API pública
  export function open()  { modal?.open(); }
  export function close() { modal?.close(); }

  // Abrir automáticamente al montar en el DOM
  onMount(() => { modal?.open(); });
</script>

<Modal bind:this={modal} title="Nueva medición" {onClose}>
  <MeasurementForm
    bind:this={form}
    {service}
    {toast}
    onSuccess={() => modal?.close()}
    onCerrar={() => modal?.close()}
  />
</Modal>
