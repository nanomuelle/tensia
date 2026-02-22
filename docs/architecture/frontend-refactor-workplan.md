# Plan de trabajo — Refactorización del frontend

**Fecha:** 2026-02-22
**Referencia:** [frontend-refactor-assessment.md](./frontend-refactor-assessment.md)
**Estado:** ✅ Completado — 2026-02-22

---

## Principios del plan

1. **La app funciona al final de cada paso.** El desarrollador puede parar en cualquier paso numerado y la aplicación es desplegable y funcional.
2. **Los tests pasan en cada paso.** Si un paso modifica un fichero testeado, incluye la actualización del test correspondiente.
3. **Un paso = una responsabilidad.** Cada paso tiene un objetivo claro, un conjunto de ficheros afectados y una verificación concreta.
4. **Orden inside-out.** Se construye desde la capa más interna (utilidades puras) hacia fuera (vistas, router, HTML).

---

## Resumen de fases y pasos

| Fase | Descripción | Pasos | Riesgo |
|---|---|---|---|
| **F-1** | Utilidades compartidas | 1 → 4 | Bajo |
| **F-2** | Limpieza de infraestructura | 5 | Bajo |
| **F-3** | Extracción de componentes | 6 → 10 | Medio |
| **F-4** | Estado global (appStore) | 11 | Medio |
| **F-5** | Router + Vistas | 12 → 13 | Alto |
| **F-6** | index.html como shell | 14 | Medio |
| **F-7** | CSS por componente | 15 | Bajo/Medio |
| **F-8** | Tests: completar cobertura | 16 | Bajo |

---

## Fase 1 — Utilidades compartidas

> Objetivo: crear la carpeta `shared/` con las utilidades que hoy están dispersas o duplicadas. No se elimina nada todavía: solo se crean nuevos ficheros y se actualizan los imports de uno en uno.

---

### Paso 1 — `shared/formatters.js`

**Qué:** Extraer la lógica de formato de fecha (y cualquier otra transformación de presentación) de `app.js` a un módulo puro reutilizable.

**Ficheros a crear:**

```
apps/frontend/src/shared/formatters.js
```

**Contenido de `shared/formatters.js`:**
```js
/**
 * Utilidades de formato de presentación.
 * Módulo puro — no depende del DOM.
 */

/** Formateador de fecha localizado en español. */
export const formatearFecha = new Intl.DateTimeFormat('es', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

/**
 * Genera el valor para un input[type="datetime-local"] con la fecha actual en hora local,
 * incluyendo segundos para evitar timestamps idénticos (BUG-01).
 * @returns {string} Cadena con formato "YYYY-MM-DDTHH:MM:SS"
 */
export function fechaLocalActual() {
  const ahora = new Date();
  const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 19);
}
```

**Ficheros a modificar:**

`app.js`:
- Eliminar la declaración `const formatearFecha = new Intl.DateTimeFormat(...)` (línea ~16).
- Eliminar la función `rellenarFechaActual()` (líneas ~183–187).
- Añadir al bloque de imports:
  ```js
  import { formatearFecha, fechaLocalActual } from './shared/formatters.js';
  ```
- En `abrirFormulario()`, sustituir `rellenarFechaActual()` por `inputFecha.value = fechaLocalActual();`.

**Tests a crear:**
```
apps/frontend/tests/shared/formatters.test.js
```
Verificar que `fechaLocalActual()` devuelve una cadena con el formato `YYYY-MM-DDTHH:MM:SS`.

**Verificación:**
```bash
npm test --workspace=apps/frontend
# Todos los tests pasan.
# Abrir la app: el campo fecha se rellena igual que antes.
```

---

### Paso 2 — `shared/eventBus.js`

**Qué:** Centralizar los nombres de los Custom Events para eliminar las cadenas literales dispersas (hoy `'medicion-guardada'` aparece en `measurementService.js` y en `app.js`).

**Ficheros a crear:**

```
apps/frontend/src/shared/eventBus.js
```

**Contenido:**
```js
/**
 * Catálogo de eventos de dominio de la aplicación.
 * Fuente única de verdad para los nombres de CustomEvent.
 * Evita errores de tipado y facilita refactorizaciones.
 */
export const Events = {
  MEASUREMENT_SAVED: 'measurement:saved',
};

/**
 * Emite un evento de dominio en window.
 * @param {string} eventName - Uno de los valores de Events.
 * @param {*} [detail]       - Dato adjunto al evento.
 */
export function emit(eventName, detail) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  }
}

/**
 * Escucha un evento de dominio.
 * Devuelve una función para eliminar el listener (cleanup).
 * @param {string}   eventName
 * @param {Function} handler
 * @returns {Function} Función de limpieza: llamarla para desregistrar el listener.
 */
export function on(eventName, handler) {
  window.addEventListener(eventName, handler);
  return () => window.removeEventListener(eventName, handler);
}
```

**Ficheros a modificar:**

`services/measurementService.js`:
- Añadir import: `import { emit, Events } from '../shared/eventBus.js';`
- Sustituir el bloque:
  ```js
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('medicion-guardada', { detail: nuevaMedicion }));
  }
  ```
  por:
  ```js
  emit(Events.MEASUREMENT_SAVED, nuevaMedicion);
  ```

`app.js`:
- Añadir import: `import { on, Events } from './shared/eventBus.js';`
- Sustituir:
  ```js
  window.addEventListener('medicion-guardada', () => cargarMediciones());
  ```
  por:
  ```js
  on(Events.MEASUREMENT_SAVED, () => cargarMediciones());
  ```

**Tests a modificar:**

`tests/services/measurementService.test.js`: Cambiar el nombre de evento escuchado en el test de `'medicion-guardada'` a `Events.MEASUREMENT_SAVED` (importar `Events` desde `shared/eventBus.js`).

**Verificación:**
```bash
npm test --workspace=apps/frontend
# Registrar una medición: la lista y gráfica se actualizan igual que antes.
```

---

### Paso 3 — `shared/validators.js` (resuelve P-05)

**Qué:** Eliminar la duplicación de `MEASUREMENT_LIMITS`. La fuente única será `domain/measurement.js`. El fichero `validators.js` se mueve a `shared/` y sus constantes internas se eliminan en favor del import del dominio.

**Acción en dos sub-pasos para no romper tests intermedios:**

#### 3a — Crear `shared/validators.js`

Crear `src/shared/validators.js` con el contenido actual de `src/validators.js`, pero:
- Eliminar la definición de `MEASUREMENT_LIMITS` propia.
- Añadir: `import { MEASUREMENT_LIMITS } from '../domain/measurement.js';`

La re-exportación de `MEASUREMENT_LIMITS` se mantiene: `export { MEASUREMENT_LIMITS };` (para que los tests que la importan sigan funcionando desde la nueva ruta).

#### 3b — Convertir `src/validators.js` en re-export shim

Sustituir el contenido completo de `src/validators.js` por:
```js
/**
 * @deprecated Usa 'shared/validators.js' directamente.
 * Este fichero es un shim de compatibilidad temporal.
 */
export * from './shared/validators.js';
```

Esto permite que los tests existentes y cualquier import antiguo sigan funcionando sin modificación inmediata.

**Ficheros a modificar:**

`app.js`: Actualizar import de `'./validators.js'` → `'./shared/validators.js'`.

**Tests a modificar:**

`tests/validators.test.js`: Actualizar import a `'../src/shared/validators.js'`. Mover el fichero a `tests/shared/validators.test.js` (opcional en este paso, obligatorio en el Paso 16).

**Verificación:**
```bash
npm test --workspace=apps/frontend
# Todos los tests del módulo de validación pasan.
# Comprobar que MEASUREMENT_LIMITS en validators es idéntico al de domain/.
```

---

### Paso 4 — `shared/constants.js`

**Qué:** Crear el fichero de constantes de aplicación (no de dominio) para el futuro. En este paso se establece el patrón; el contenido inicial es mínimo.

**Ficheros a crear:**

```
apps/frontend/src/shared/constants.js
```

**Contenido inicial:**
```js
/**
 * Constantes de aplicación (no pertenecientes al dominio de negocio).
 */

/** Número mínimo de mediciones necesarias para mostrar la gráfica. */
export const MIN_MEDICIONES_GRAFICA = 2;
```

**Ficheros a modificar:**

`app.js` y `chart.js`: Sustituir el literal `2` (comparación `mediciones.length < 2`) por la constante importada.

**Verificación:**
```bash
npm test --workspace=apps/frontend
# Tests de gráfica pasan. Comportamiento idéntico: skeleton con < 2 mediciones.
```

---

## Fase 2 — Limpieza de infraestructura

### Paso 5 — Mover `api.js` → `infra/httpAdapter.js`

**Qué:** `api.js` nunca se usa en producción (ADR-005). Moverlo a `infra/` junto a los otros adaptadores reduce la confusión de que es código de producción.

**Acción:**
```bash
mv apps/frontend/src/api.js apps/frontend/src/infra/httpAdapter.js
```

**Ficheros a modificar:**

`tests/api.test.js`:
- Actualizar import: `from '../src/api.js'` → `from '../src/infra/httpAdapter.js'`.
- Renombrar el fichero a `tests/infra/httpAdapter.test.js`.

**Nota:** `formulario.test.js` mockea `'../src/api.js'`. Actualizar la ruta del mock a `'../src/infra/httpAdapter.js'`. Verificar que el mock sigue siendo innecesario en producción (el formulario ya usa `measurementService`, no `api.js` directamente).

> ⚠️ Si `formulario.test.js` mockea `api.js` pero `app.js` ya no lo importa en producción (usa `measurementService` + `localStorageAdapter`), el mock puede que ya no sea necesario. Revisar en este paso si el test puede simplificarse.

**Verificación:**
```bash
npm test --workspace=apps/frontend
# Todos los tests pasan con la nueva ruta.
```

---

## Fase 3 — Extracción de componentes

> **Patrón de componente adoptado.** Cada componente es una función constructora que recibe un elemento raíz del DOM y opciones (callbacks). Expone: `mount()`, `unmount()`, `update(estado)`.
>
> ```js
> export function createNombreComponente(rootEl, opciones = {}) {
>   // Referencias internas al DOM
>   // Lógica interna
>   function mount()        { /* inserta o conecta handlers */ }
>   function unmount()      { /* elimina handlers */ }
>   function update(estado) { /* actualiza solo el DOM que necesita cambiar */ }
>   return { mount, unmount, update };
> }
> ```
>
> En esta fase (F-3) el HTML de cada componente **sigue viviendo en `index.html`**. Los componentes solo encapsulan la lógica JS que hoy está en `app.js`. El HTML se moverá al componente en el Paso 14 (F-6).

---

### Paso 6 — Componente `IosWarning`

**Qué:** Extraer el script inline de `index.html` que detecta Safari/iOS y gestiona el aviso, convirtiéndolo en un módulo importable. El HTML del aviso permanece en `index.html`.

**Ficheros a crear:**

```
apps/frontend/src/components/IosWarning/IosWarning.js
```

**Responsabilidades del componente:**
- Detectar `navigator.userAgent` para iOS/Safari.
- Mostrar/ocultar `#aviso-ios`.
- Gestionar el click en `#btn-cerrar-aviso-ios`.
- Exponer `mount()` / `unmount()`.

**Ficheros a modificar:**

`public/index.html`:
- Eliminar el bloque `<script>` inline que gestiona el aviso iOS.
- El bloque de registro del Service Worker permanece como script inline (no es lógica de componente).
- Añadir `import` del componente dentro del `<script type="module" src="src/app.js">` no (ya es un módulo); en su lugar, `app.js` importa y monta `IosWarning`.

`app.js`:
- Añadir:
  ```js
  import { createIosWarning } from './components/IosWarning/IosWarning.js';
  // Al final, antes de cargarMediciones():
  createIosWarning(document.getElementById('aviso-ios')).mount();
  ```

**Verificación:**
```bash
# Abrir en Safari/iOS (o con userAgent simulado): aparece el aviso.
# Botón ✕ cierra el aviso.
# En Chrome/Android: el aviso no aparece.
npm test --workspace=apps/frontend
```

---

### Paso 7 — Componente `Toast`

**Qué:** Crear el sistema de notificaciones efímeras que hoy no existe. Cuando se guarda una medición con éxito, la app no da ningún feedback visual positivo (solo cierra el formulario). Este componente lo añade.

**Ficheros a crear:**
```
apps/frontend/src/components/Toast/Toast.js
apps/frontend/src/components/Toast/Toast.css
```

**API del componente:**
```js
// app.js lo monta una sola vez; luego cualquier módulo puede llamar a show()
export function createToast(rootEl) {
  function mount()  { /* crea el nodo en el DOM */ }
  function unmount(){ /* lo elimina */ }
  function show(mensaje, tipo = 'success', duracionMs = 3000) { /* muestra y auto-oculta */ }
  return { mount, unmount, show };
}
```

`Toast.css` incluye estilos de posicionamiento, animación de entrada/salida y variantes `success` / `error` / `info`.

**Ficheros a modificar:**

`app.js`:
- Crear e importar el Toast: `import { createToast } from './components/Toast/Toast.js';`
- Montar el Toast en un `<div id="toast-container">` que se añade a `index.html`.
- En `enviarFormulario()`, tras `cerrarFormulario()`, llamar a `toast.show('Medición guardada', 'success')`.

`public/index.html`:
- Añadir `<div id="toast-container" aria-live="polite" aria-atomic="true"></div>` justo antes del cierre de `<body>`.

`public/styles.css`:
- Añadir `@import './src/components/Toast/Toast.css';` (o copiar los estilos al final del fichero hasta el Paso 15).

**Tests a crear:**
```
apps/frontend/tests/components/Toast.test.js
```

**Verificación:**
```bash
npm test --workspace=apps/frontend
# Registrar una medición: aparece una notificación verde "Medición guardada" que desaparece.
```

---

### Paso 8 — Componente `MeasurementList`

**Qué:** Extraer de `app.js` toda la lógica del historial: estados (cargando, error, vacío) y renderizado de tarjetas.

**Ficheros a crear:**
```
apps/frontend/src/components/MeasurementList/MeasurementList.js
apps/frontend/src/components/MeasurementList/MeasurementList.css
```

**API del componente:**
```js
export function createMeasurementList(rootEl) {
  // rootEl = el <section class="historial"> que ya existe en index.html
  function mount()                     { /* registra los listeners (btn reintentar) */ }
  function unmount()                   { /* limpia listeners */ }
  function mostrarCargando()           { /* ... */ }
  function mostrarError()              { /* ... */ }
  function mostrarVacio()              { /* ... */ }
  function mostrarLista(mediciones)    { /* ... */ }
  // Expone un callback para que el exterior pueda reaccionar al "Reintentar"
  // Se pasa como opcion: createMeasurementList(el, { onReintentar })
  return { mount, unmount, mostrarCargando, mostrarError, mostrarVacio, mostrarLista };
}
```

La generación de tarjetas (`li.innerHTML`) y el uso de `formatearFecha` se trasladan aquí.

**Ficheros a modificar:**

`app.js`:
- Eliminar las funciones: `ocultarEstados`, `mostrarCargando`, `mostrarError`, `mostrarVacio`, `mostrarLista`.
- Eliminar las referencias directas a los IDs del historial: `estadoCargando`, `estadoError`, `estadoVacio`, `listaMediciones`, `btnReintentar`.
- Crear una instancia del componente y delegar:
  ```js
  import { createMeasurementList } from './components/MeasurementList/MeasurementList.js';
  const historial = createMeasurementList(
    document.getElementById('historial-root'),  // ver nota HTML abajo
    { onReintentar: cargarMediciones }
  );
  historial.mount();
  ```
- En `cargarMediciones()`, sustituir las llamadas a `mostrarCargando()` etc. por `historial.mostrarCargando()` etc.

`public/index.html`:
- Envolver la sección historial en `<section id="historial-root" class="historial">` si no tiene ya un ID de sección padre único. (Actualmente la sección no tiene ID, solo clase.)

**Tests a modificar:**
`tests/formulario.test.js`: Añadir al setup del DOM la sección `#historial-root` con sus estados interiores. (Ya carga el DOM por los IDs; solo conviene que el HTML del test sea coherente con el nuevo wrapper.)

**Verificación:**
```bash
npm test --workspace=apps/frontend
# Comportamiento idéntico: cargando → lista / vacío / error.
# Botón Reintentar recarga correctamente.
```

---

### Paso 9 — Componente `MeasurementChart`

**Qué:** Extraer la función `renderizarGrafica()` y su `ResizeObserver` de `app.js` a un componente wrapper de `chart.js`.

**Ficheros a crear:**
```
apps/frontend/src/components/MeasurementChart/MeasurementChart.js
apps/frontend/src/components/MeasurementChart/MeasurementChart.css
```

**API del componente:**
```js
export function createMeasurementChart(seccionEl, containerEl) {
  // seccionEl   = #seccion-grafica
  // containerEl = #chart-mediciones
  let resizeObserver = null;
  let ultimasMediciones = [];

  function mount()                   { /* inicialización */ }
  function unmount()                 { if (resizeObserver) resizeObserver.disconnect(); }
  function update(mediciones)        { /* equivale a renderizarGrafica() */ }
  return { mount, unmount, update };
}
```

**Ficheros a modificar:**

`app.js`:
- Eliminar `renderizarGrafica`, `resizeObserver`, `ultimasMediciones`.
- Eliminar import de `renderChart` (queda solo en MeasurementChart.js).
- Crear instancia:
  ```js
  import { createMeasurementChart } from './components/MeasurementChart/MeasurementChart.js';
  const grafica = createMeasurementChart(
    document.getElementById('seccion-grafica'),
    document.getElementById('chart-mediciones')
  );
  grafica.mount();
  ```
- En `cargarMediciones()`, sustituir `renderizarGrafica(mediciones)` por `grafica.update(mediciones)`.

**Tests a modificar:**
`tests/chart.test.js`: Actualizar el import de `renderChart` a `../src/components/MeasurementChart/MeasurementChart.js` y adaptar los tests para testear a través de la API pública del componente, o mantener también tests directos de `chart.js` (recomendado: mantener ambos niveles).

**Verificación:**
```bash
npm test --workspace=apps/frontend
# Gráfica se renderiza igual. ResizeObserver redibuja al cambiar el ancho.
```

---

### Paso 10 — Componente `MeasurementForm`

**Qué:** El bloque más grande de `app.js`. Extraer toda la lógica del formulario: referencias al DOM del form, apertura/cierre, validación inline, envío.

**Ficheros a crear:**
```
apps/frontend/src/components/MeasurementForm/MeasurementForm.js
apps/frontend/src/components/MeasurementForm/MeasurementForm.css
```

**API del componente:**
```js
export function createMeasurementForm(rootEl, { service, onSuccess, toast }) {
  // rootEl    = #formulario-registro
  // service   = instancia de measurementService (DI)
  // onSuccess = callback llamado tras guardar con éxito
  // toast     = instancia del Toast para notificaciones
  function mount()          { /* registra listeners del form */ }
  function unmount()        { /* limpia listeners */ }
  function abrir()          { /* muestra el form, rellena fecha, foco en sistólica */ }
  function cerrar()         { /* oculta el form */ }
  return { mount, unmount, abrir, cerrar };
}
```

El componente gestiona internamente: `inputSystolic`, `inputDiastolic`, `inputPulse`, `inputFecha`, `errorFormulario`, `btnGuardar`, `btnCancelar`, y todos los handlers de validación inline.

**Ficheros a modificar:**

`app.js`:
- Eliminar todas las referencias al DOM del formulario y sus funciones asociadas.
- Eliminar imports de `validarCamposMedicion` y `prepararDatosMedicion` (se mueven al componente).
- Crear instancia:
  ```js
  import { createMeasurementForm } from './components/MeasurementForm/MeasurementForm.js';
  const formulario = createMeasurementForm(
    document.getElementById('formulario-registro'),
    { service, onSuccess: () => {}, toast }
  );
  formulario.mount();
  ```
- El `btnNuevaMedicion` sigue en `app.js` (o se mueve a `HomeView` en el Paso 12):
  ```js
  document.getElementById('btn-nueva-medicion')
    .addEventListener('click', () => formulario.abrir());
  ```
- El callback `onSuccess` llama internamente a `cargarMediciones()`.

**Tests a modificar:**

`tests/formulario.test.js`: Es el test que más cambios requiere. Pasar de testear `app.js` directamente a testear `MeasurementForm.js`. Montar solo el fragmento HTML del formulario, instanciar el componente, y ejecutar los casos de validación. El mock de `api.js` ya no es necesario (el formulario usa `service`, que se inyecta; se puede mockear `service.create` directamente).

> ⚠️ Este es el test con mayor esfuerzo de refactorización. Si el tiempo es limitado, es válido mantener temporalmente el test apuntando a `app.js` hasta el Paso 16, siempre que los tests sigan pasando.

**Verificación:**
```bash
npm test --workspace=apps/frontend
# Formulario abre, valida, guarda y cierra igual que antes.
# app.js ya no tiene ninguna referencia al DOM del formulario.
```

> ✅ Al completar el Paso 10, `app.js` habrá quedado reducido a ~50 líneas: imports, creación de instancias de componentes, arranque.

---

## Fase 4 — Estado global

### Paso 11 — `store/appStore.js`

**Qué:** Centralizar el estado de la aplicación (mediciones cargadas, estado de carga) en un store pub/sub. Eliminar la necesidad de que `app.js` orqueste directamente los componentes al cargar mediciones.

**Ficheros a crear:**
```
apps/frontend/src/store/appStore.js
```

**API mínima del store:**
```js
export function createAppStore(measurementService) {
  let state = { mediciones: [], cargando: false, error: null };
  const listeners = new Map(); // clave: 'state', valor: Set<Function>

  function getState() { return { ...state }; }

  function subscribe(handler) {
    if (!listeners.has('state')) listeners.set('state', new Set());
    listeners.get('state').add(handler);
    return () => listeners.get('state').delete(handler); // función de cleanup
  }

  async function cargarMediciones() {
    state = { ...state, cargando: true, error: null };
    _notify();
    try {
      const mediciones = await measurementService.listAll();
      state = { ...state, mediciones, cargando: false };
    } catch (err) {
      state = { ...state, error: err.message, cargando: false };
    }
    _notify();
  }

  function _notify() {
    listeners.get('state')?.forEach((fn) => fn(getState()));
  }

  return { getState, subscribe, cargarMediciones };
}
```

**Ficheros a modificar:**

`app.js`:
- Crear el store: `const store = createAppStore(service);`
- Suscribir los componentes al store:
  ```js
  store.subscribe((state) => {
    if (state.cargando)       historial.mostrarCargando();
    else if (state.error)     historial.mostrarError();
    else if (!state.mediciones.length) historial.mostrarVacio();
    else                      historial.mostrarLista(state.mediciones);
    grafica.update(state.mediciones);
  });
  ```
- Sustituir la función local `cargarMediciones()` por `store.cargarMediciones()`.
- El evento `Events.MEASUREMENT_SAVED` llama a `store.cargarMediciones()`.

**Tests a crear:**
```
apps/frontend/tests/store/appStore.test.js
```
Verificar transiciones de estado: `cargando` → `mediciones`, `cargando` → `error`.

**Verificación:**
```bash
npm test --workspace=apps/frontend
# Comportamiento idéntico. app.js ya no contiene la función cargarMediciones.
```

---

## Fase 5 — Router y Vistas

### Paso 12 — `views/HomeView.js`

**Qué:** Mover la orquestación de componentes (instanciación, montado, suscripción al store) de `app.js` a una vista. `app.js` solo crea el router y llama `navigate`.

**Ficheros a crear:**
```
apps/frontend/src/views/HomeView.js
```

**Responsabilidades de `HomeView`:**
- Recibe el elemento contenedor (`#app` o `<main>`).
- Instancia y monta todos los componentes de la pantalla principal.
- Suscribe los componentes al store.
- Expone `mount()` y `unmount()` para que el router pueda gestionar el ciclo de vida.

```js
export function createHomeView(containerEl, { store, service, toast }) {
  let components = [];
  let unsubscribe = null;

  function mount() {
    // Crear instancias de componentes:
    const historial = createMeasurementList(...);
    const grafica   = createMeasurementChart(...);
    const formulario = createMeasurementForm(...);
    components = [historial, grafica, formulario];
    components.forEach(c => c.mount());

    unsubscribe = store.subscribe((state) => { /* actualizar componentes */ });
    store.cargarMediciones();
  }

  function unmount() {
    unsubscribe?.();
    components.forEach(c => c.unmount());
  }

  return { mount, unmount };
}
```

**Ficheros a modificar:**

`app.js`:
- Delegar la orquestación en `HomeView`.
- El fichero se reduce a:
  ```js
  import * as adapter from './infra/localStorageAdapter.js';
  import { createMeasurementService } from './services/measurementService.js';
  import { createAppStore } from './store/appStore.js';
  import { createToast } from './components/Toast/Toast.js';
  import { createHomeView } from './views/HomeView.js';
  import { createIosWarning } from './components/IosWarning/IosWarning.js';

  const service = createMeasurementService(adapter);
  const store   = createAppStore(service);
  const toast   = createToast(document.getElementById('toast-container'));
  toast.mount();

  createIosWarning(document.getElementById('aviso-ios')).mount();
  createHomeView(document.querySelector('main'), { store, service, toast }).mount();
  ```

**Verificación:**
```bash
npm test --workspace=apps/frontend
# app.js tiene ≤ 20 líneas. La app funciona igual.
```

---

### Paso 13 — `router.js`

**Qué:** Introducir el router hash-based para habilitar la navegación entre vistas futuras (`#/`, `#/settings`). En este paso solo existe la vista `HomeView`, pero la infraestructura ya está lista.

**Ficheros a crear:**
```
apps/frontend/src/router.js
```

**Implementación:**
```js
/**
 * Router hash-based mínimo.
 * Escucha el evento 'hashchange' y monta/desmonta vistas según la ruta.
 */
export function createRouter(routes, containerEl) {
  let vistaActual = null;

  function navigate(hash = window.location.hash || '#/') {
    const ruta = hash.replace(/^#/, '') || '/';
    const ViewFactory = routes[ruta] ?? routes['/'];
    if (!ViewFactory) return;

    vistaActual?.unmount();
    vistaActual = ViewFactory(containerEl);
    vistaActual.mount();
  }

  function start() {
    window.addEventListener('hashchange', () => navigate(window.location.hash));
    navigate();
  }

  return { start, navigate };
}
```

**Ficheros a modificar:**

`app.js`:
- Pasar de montar `HomeView` directamente a registrarla en el router:
  ```js
  import { createRouter } from './router.js';

  const routes = {
    '/': (el) => createHomeView(el, { store, service, toast }),
  };

  const router = createRouter(routes, document.querySelector('main'));
  router.start();
  ```

**Verificación:**
```bash
# Navegar a index.html → HomeView se monta.
# Navegar a index.html#/settings → el router no encuentra ruta y cae al '/'.
# El botón Atrás del navegador funciona.
npm test --workspace=apps/frontend
```

---

## Fase 6 — index.html como shell

### Paso 14 — Mover el HTML al interior de los componentes

**Qué:** `index.html` actualmente tiene el marcado de todos los bloques hardcodeado. Los componentes solo encapsulaban la lógica JS. En este paso, cada componente genera su propio HTML en `mount()` mediante template literals, y el contenedor correspondiente en `index.html` se vacía.

**Orden de migración (de menor a mayor riesgo):**

| Sub-paso | Componente | Bloque HTML en index.html a vaciar |
|---|---|---|
| 14a | `IosWarning` | `<div id="aviso-ios">...</div>` → queda `<div id="aviso-ios"></div>` |
| 14b | `Toast` | Nodo `#toast-container` lo crea el propio componente en `<body>` |
| 14c | `MeasurementChart` | `<section id="seccion-grafica">...</section>` → vacía |
| 14d | `MeasurementList` | `<section id="historial-root">...</section>` → vacía |
| 14e | `MeasurementForm` | `<section id="formulario-registro">...</section>` y `<section class="nueva-medicion">` → vacías |
| 14f | `HomeView` | `<main class="main">` queda vacío; `HomeView.mount()` inserta todo |

Al finalizar 14f, `index.html` queda como:
```html
<body>
  <header class="header">
    <span class="header__logo" aria-hidden="true">🩺</span>
    <h1 class="header__title">Tensia</h1>
  </header>
  <main id="app"></main>
  <script type="module" src="src/app.js"></script>
  <script>/* registro SW */</script>
</body>
```

**Verificación por sub-paso:**
```bash
# Después de cada sub-paso: la sección migrada se renderiza correctamente.
npm test --workspace=apps/frontend
# Los tests E2E (Playwright) validan el comportamiento end-to-end de cada flujo.
npx playwright test
```

---

## Fase 7 — CSS por componente

### Paso 15 — Dividir `styles.css`

**Qué:** Extraer los estilos de cada componente a sus respectivos ficheros `.css`. `styles.css` se convierte en `styles/main.css`, que solo contiene el sistema de diseño (variables CSS) y el reset global.

**Ficheros a crear:**
```
apps/frontend/public/styles/
  main.css              ← variables + reset + layout base
  components/
    MeasurementForm.css
    MeasurementList.css
    MeasurementChart.css
    Toast.css
    IosWarning.css
```

**Estrategia de migración:**
1. Identificar en `styles.css` los bloques de clases por componente usando comentarios existentes (`/* tarjeta */`, `/* formulario */`, etc.).
2. Copiar cada bloque al fichero del componente correspondiente.
3. En `index.html`, actualizar `<link rel="stylesheet" href="styles.css">` → `<link rel="stylesheet" href="styles/main.css">`.
4. `main.css` importa los parciales con `@import`:
   ```css
   @import './components/MeasurementForm.css';
   @import './components/MeasurementList.css';
   /* ... */
   ```
5. Eliminar `styles.css` cuando `main.css` contenga todo.

**Variables CSS del sistema de diseño** (extraer a `main.css`):
```css
:root {
  --color-primary:     #2563eb;
  --color-danger:      #ef4444;
  --color-success:     #16a34a;
  --color-text:        #1f2937;
  --color-text-muted:  #6b7280;
  --color-border:      #e5e7eb;
  --color-bg:          #f9fafb;
  --spacing-xs:        0.25rem;
  --spacing-sm:        0.5rem;
  --spacing-md:        1rem;
  --spacing-lg:        1.5rem;
  --spacing-xl:        2rem;
  --border-radius:     0.5rem;
  --shadow-card:       0 1px 3px rgba(0,0,0,0.1);
}
```

**Verificación:**
```bash
# Inspeccionar visualmente todos los componentes.
# Confirmar que no hay regresiones visuales.
npm test --workspace=apps/frontend
```

---

## Fase 8 — Tests: completar y consolidar

### Paso 16 — Actualizar tests y añadir cobertura de componentes

**Qué:** Actualizar todos los tests afectados, eliminar los shims temporales y asegurar cobertura ≥ 70%.

**Checklist de tests:**

| Test | Acción |
|---|---|
| `tests/shared/validators.test.js` | Mover desde `tests/validators.test.js`, actualizar import |
| `tests/shared/formatters.test.js` | Ya creado en Paso 1 |
| `tests/infra/httpAdapter.test.js` | Renombrado en Paso 5 |
| `tests/components/MeasurementForm.test.js` | Refactorizar desde `formulario.test.js` |
| `tests/components/MeasurementList.test.js` | Nuevo |
| `tests/components/MeasurementChart.test.js` | Adaptar desde `chart.test.js` |
| `tests/components/Toast.test.js` | Ya creado en Paso 7 |
| `tests/store/appStore.test.js` | Ya creado en Paso 11 |
| `tests/e2e/` | Sin cambios (prueban comportamiento, no internos) |

**Eliminar shims temporales:**
- `src/validators.js` (el re-export shim del Paso 3b) — eliminar una vez todos los imports apunten a `shared/validators.js`.

**Verificación final:**
```bash
npm test --workspace=apps/frontend -- --coverage
# Cobertura ≥ 70% en todas las categorías.
npx playwright test
# Todos los flujos E2E pasan.
```

---

## Estructura objetivo final

```
apps/frontend/
  public/
    index.html              ← shell: <header> + <main id="app"> + imports
    manifest.json
    sw.js
    icons/
    styles/
      main.css              ← variables CSS + reset + layout base
      components/
        MeasurementForm.css
        MeasurementList.css
        MeasurementChart.css
        Toast.css
        IosWarning.css
  src/
    app.js                  ← ~20 líneas: bootstrap (service, store, toast, router)
    router.js               ← router hash-based
    chart.js                ← módulo D3 puro (sin cambios)
    domain/
      measurement.js        ← sin cambios
    infra/
      localStorageAdapter.js  ← sin cambios
      httpAdapter.js          ← renombrado de api.js (solo dev/tests)
    services/
      measurementService.js   ← sin cambios
    store/
      appStore.js
    views/
      HomeView.js
    components/
      IosWarning/
        IosWarning.js
      Toast/
        Toast.js
        Toast.css             ← o en public/styles/components/
      MeasurementForm/
        MeasurementForm.js
      MeasurementList/
        MeasurementList.js
      MeasurementChart/
        MeasurementChart.js
    shared/
      formatters.js
      validators.js
      constants.js
      eventBus.js
  tests/
    shared/
      formatters.test.js
      validators.test.js
    infra/
      localStorageAdapter.test.js
      httpAdapter.test.js
    domain/
      measurement.test.js
    services/
      measurementService.test.js
    store/
      appStore.test.js
    components/
      MeasurementForm.test.js
      MeasurementList.test.js
      MeasurementChart.test.js
      Toast.test.js
    e2e/
      flows/
      helpers/
```

---

## Tabla resumen de pasos

| Paso | Descripción | Ficheros nuevos | Ficheros modificados | Riesgo | Cobertura |
|---|---|---|---|---|---|
| 1 | `shared/formatters.js` | `shared/formatters.js`, `tests/shared/formatters.test.js` | `app.js` | Bajo | + |
| 2 | `shared/eventBus.js` | `shared/eventBus.js` | `measurementService.js`, `app.js`, test servicio | Bajo | = |
| 3 | `shared/validators.js` (P-05) | `shared/validators.js` | `validators.js` (shim), `app.js`, `tests/validators.test.js` | Bajo | = |
| 4 | `shared/constants.js` | `shared/constants.js` | `app.js`, `chart.js` | Bajo | = |
| 5 | `infra/httpAdapter.js` | `infra/httpAdapter.js` | `tests/api.test.js` → renombrar | Bajo | = |
| 6 | Comp: `IosWarning` | `components/IosWarning/IosWarning.js` | `index.html`, `app.js` | Bajo | + |
| 7 | Comp: `Toast` | `components/Toast/Toast.js`, `.css`, test | `index.html`, `app.js`, `styles.css` | Bajo | + |
| 8 | Comp: `MeasurementList` | `components/MeasurementList/MeasurementList.js`, `.css` | `app.js`, `index.html`, `formulario.test.js` | Medio | + |
| 9 | Comp: `MeasurementChart` | `components/MeasurementChart/MeasurementChart.js`, `.css` | `app.js`, `chart.test.js` | Medio | + |
| 10 | Comp: `MeasurementForm` | `components/MeasurementForm/MeasurementForm.js`, `.css` | `app.js`, `formulario.test.js` | Medio | + |
| 11 | `store/appStore.js` | `store/appStore.js`, `tests/store/appStore.test.js` | `app.js` | Medio | + |
| 12 | `views/HomeView.js` | `views/HomeView.js` | `app.js` | Medio | + |
| 13 | `router.js` | `router.js` | `app.js` | Alto | + |
| 14 | HTML a componentes (6 sub-pasos) | — | Todos los componentes, `index.html` | Medio | = |
| 15 | CSS por componente | `styles/main.css`, CSS de componentes | `index.html`, `styles.css` | Bajo | = |
| 16 | Tests: consolidación final | Tests nuevos de componentes | Todos los tests | — | ≥ 70% |
