<!--
  HomeView.svelte — Vista principal del dashboard (BK-27).
  Reemplaza HomeView.js; ya no existe código Vanilla JS en la capa de vistas.

  Responsabilidades:
  - Suscribir reactivamente a los stores Svelte del nuevo appStore.svelte.js.
  - Orquestar MeasurementList, MeasurementChart y RegistroMedicionModal como
    subcomponentes Svelte declarativos (sin svelteMount/svelteUnmount).
  - Gestionar la apertura/cierre de la modal con estado interno ($state).

  Props:
    service   — instancia de measurementService (inyectada desde App.svelte / main.js).
    toast     — instancia Toast para notificaciones efímeras.
-->
<script>
  import { onMount } from 'svelte';
  import { mediciones, cargando, error, cargarMediciones } from '../store/appStore.svelte.js';
  import MeasurementList       from '../components/MeasurementList/MeasurementList.svelte';
  import MeasurementChart      from '../components/MeasurementChart/MeasurementChart.svelte';
  import RegistroMedicionModal from '../components/Modal/RegistroMedicionModal.svelte';

  // --- Props ---
  let { service, toast } = $props();

  // --- Estado interno ---
  /** Controla si la modal de nueva medición está montada en el DOM. */
  let modalAbierta = $state(false);

  // --- Ciclo de vida ---
  onMount(() => cargarMediciones(service));

  // --- Handlers ---
  function abrirModal() {
    modalAbierta = true;
  }

  function cerrarModal() {
    modalAbierta = false;
    // Recargar el historial para reflejar la medición recién guardada
    cargarMediciones(service);
  }
</script>

<!-- Botón principal de acción -->
<section class="nueva-medicion">
  <button
    id="btn-nueva-medicion"
    class="btn btn--primario"
    aria-label="Registrar nueva medición"
    onclick={abrirModal}
  >
    + Nueva medición
  </button>
</section>

<!-- Layout del dashboard: una columna (sin datos) o dos columnas (con datos) -->
<div
  id="dashboard-content"
  class="dashboard-content"
  class:dashboard-content--columnas={$mediciones.length >= 1}
>
  <!-- Gráfica: visible siempre que no haya carga ni error.
       Con 0 ó 1 mediciones, MeasurementChart muestra el skeleton internamente. -->
  <section
    id="seccion-grafica"
    class="grafica-seccion"
    hidden={$cargando || !!$error}
  >
    <MeasurementChart measurements={$mediciones} />
  </section>

  <!-- Historial: gestiona los estados cargando/error/vacío/lista mediante props -->
  <section id="historial-root" class="historial">
    <MeasurementList
      measurements={$mediciones}
      cargando={$cargando}
      error={$error}
      onReintentar={() => cargarMediciones(service)}
    />
  </section>
</div>

<!-- Modal de registro: se monta solo cuando está abierta -->
{#if modalAbierta}
  <RegistroMedicionModal {service} {toast} onClose={cerrarModal} />
{/if}
