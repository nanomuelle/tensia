# System Overview

_Última revisión: 2026-02-22 — Actualizado para reflejar ADR-005, ADR-006 y la refactorización del frontend_

## Arquitectura (MVP)

```
PWA (Frontend — Vanilla JS + Service Worker)
  └─ Usuario anónimo → localStorageAdapter (clave: bp_measurements)
       │
       │ (no hay peticiones HTTP para datos en producción MVP)
       ▼
  Backend (Node.js/Express)
    └─ Servir ficheros estáticos del frontend
         (apps/frontend/public/ y apps/frontend/src/)
```

En el MVP los datos nunca salen del dispositivo del usuario. El backend es un servidor de ficheros estáticos.

## Arquitectura post-MVP (usuario autenticado)

```
PWA (Frontend)
  └─ Usuario Google → googleDriveAdapter
       │
       │ HTTP (solo OAuth y OCR)
       ▼
  Backend (Node.js/Express)
    ├─ Servir ficheros estáticos
    ├─ Proxy OAuth (custodia client_secret)  [post-MVP]
    └─ Endpoint OCR                          [post-MVP]
```

## Principios

- Separación estricta de capas.
- La persistencia es un **adaptador intercambiable** inyectado en el servicio del frontend: `localStorageAdapter` (anónimo) → `googleDriveAdapter` (autenticado).
- El backend **no gestiona ni almacena datos de mediciones** en el MVP.
- La lógica de negocio (validaciones, UUID, ordenación) reside en módulos ES del frontend (`domain/`, `services/`).
- Decisiones de arquitectura documentadas en `docs/architecture/decisions.md`.

---

## Estructura del frontend (tras refactorización — 2026-02-22)

El frontend ha sido refactorizado desde un `app.js` monolítico a una arquitectura de componentes por capas con router hash-based y store reactivo (ADR-003 mantenido).

### Árbol de directorios

```
apps/frontend/
  public/
    index.html              ← shell: <header> + <main id="app"> + registro SW
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
    app.js                  ← ~40 líneas: bootstrap (service, store, toast, router)
    router.js               ← router hash-based (#/, futuro #/settings, …)
    chart.js                ← módulo D3 puro (ADR-006)
    domain/
      measurement.js        ← validaciones de negocio
    infra/
      localStorageAdapter.js  ← implementa getAll() / save() [MVP]
      httpAdapter.js          ← renombrado de api.js (solo dev/tests)
    services/
      measurementService.js   ← lógica de aplicación (recibe adaptador por DI)
    store/
      appStore.js             ← estado global reactivo (pub/sub sin framework)
    views/
      HomeView.js             ← orquesta componentes de la pantalla principal
    components/
      IosWarning/
        IosWarning.js
      Toast/
        Toast.js
      MeasurementForm/
        MeasurementForm.js
      MeasurementList/
        MeasurementList.js
      MeasurementChart/
        MeasurementChart.js
    shared/
      formatters.js           ← formato de fecha (extraído de app.js)
      validators.js           ← validaciones de presentación (importa MEASUREMENT_LIMITS del dominio)
      constants.js            ← constantes de aplicación (MIN_MEDICIONES_GRAFICA, …)
      eventBus.js             ← wrapper tipado de CustomEvent
  tests/
    shared/
    infra/
    domain/
    services/
    store/
    components/
    e2e/
```

### Diagrama de dependencias

```
app.js (bootstrap)
  └── router.js
        └── views/HomeView.js
              ├── components/MeasurementForm/MeasurementForm.js
              │     ├── shared/validators.js
              │     │     └── domain/measurement.js (MEASUREMENT_LIMITS)
              │     └── shared/eventBus.js
              ├── components/MeasurementList/MeasurementList.js
              │     └── shared/formatters.js
              ├── components/MeasurementChart/MeasurementChart.js
              │     └── chart.js (D3 — ADR-006)
              └── store/appStore.js
                    └── services/measurementService.js
                          ├── domain/measurement.js
                          └── infra/localStorageAdapter.js  [MVP]
                               infra/googleDriveAdapter.js  [post-MVP]
```

**Regla de dependencias:** las capas solo pueden importar hacia abajo en el diagrama. Ningún módulo de `infra/`, `domain/` ni `shared/` importa de `components/`, `views/` o `store/`.

### Patrón de componentes

Cada componente es una función constructora que recibe un elemento raíz del DOM. Expone `mount()`, `unmount()` y, cuando aplica, métodos de actualización de estado:

```js
export function createNombreComponente(rootEl, opciones = {}) {
  function mount()         { /* inserta HTML y conecta handlers */ }
  function unmount()       { /* elimina handlers */ }
  function update(estado)  { /* actualiza solo el DOM necesario */ }
  return { mount, unmount, update };
}
```

Los componentes no se conocen entre sí: se comunican a través del `appStore` o el `eventBus`.

### Gráfica

La gráfica usa **D3.js modular** con salida SVG (ADR-006). El módulo `chart.js` mantiene el mismo contrato público (`renderChart(container, measurements)`) que la implementación anterior en Canvas, protegiendo los tests existentes.
