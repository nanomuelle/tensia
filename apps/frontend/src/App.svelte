<!--
  App.svelte — Componente raíz de Tensia (BK-27).
  Reemplaza app.js como punto de entrada de la UI.

  Responsabilidades:
  - Montar Toast e IosWarning como subcomponentes Svelte declarativos.
  - Instanciar el router y arrancar la navegación en onMount.
  - Exponer la instancia de Toast a las vistas hijas mediante bind:this.

  Props:
    service — instancia de measurementService creada en main.js (inyección de dependencias).

  Nota: El router monta HomeView dentro de <main id="app">. El <div id="aviso-ios">
  de index.html puede eliminarse cuando se actualice ese fichero en la subtarea 5
  de BK-27, ya que IosWarning.svelte se renderiza aquí directamente.
-->
<script>
  import { onMount } from 'svelte';
  import Toast      from './components/Toast/Toast.svelte';
  import IosWarning from './components/IosWarning/IosWarning.svelte';
  import HomeView   from './views/HomeView.svelte';
  import { createRouter } from './router.js';

  // --- Props ---
  /** Instancia de measurementService inyectada desde main.js. */
  let { service } = $props();

  // --- Referencias a componentes ---
  /** Referencia a la instancia de Toast para pasarla a las vistas. */
  let toast;

  // --- Ciclo de vida ---
  onMount(() => {
    const routes = {
      '/': { component: HomeView, props: () => ({ service, toast }) },
    };
    createRouter(routes, document.querySelector('main')).start();
  });
</script>

<!-- Notificaciones efímeras (accesibles desde vistas vía prop toast) -->
<Toast bind:this={toast} />

<!-- Aviso informativo Safari/iOS sobre la política ITP de 7 días -->
<IosWarning />

<!-- Contenedor donde el router monta las vistas -->
<main id="app"></main>
