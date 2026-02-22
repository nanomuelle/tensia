# Assessment de refactorización del frontend — Tensia

**Fecha:** 2026-02-22
**Autor:** Arquitecto de Software
**Estado:** Propuesto — pendiente de aprobación antes de implementar

---

## 1. Estado actual

### 1.1 Estructura de ficheros

```
apps/frontend/
  public/
    index.html          ← HTML único: toda la UI está embebida aquí
    manifest.json
    styles.css          ← hoja de estilos monolítica (sin separación por componente)
    sw.js
    icons/
  src/
    api.js              ← módulo HTTP legacy (solo dev/tests, nunca se usa en producción)
    app.js              ← punto de entrada + orquestador + DOM + UI (319 líneas)
    chart.js            ← módulo D3 (bien encapsulado)
    validators.js       ← validaciones de presentación (bien separado)
    domain/
      measurement.js    ← validaciones de negocio (bien separado)
    infra/
      localStorageAdapter.js
    services/
      measurementService.js
  tests/
    ...
```

### 1.2 Lo que funciona bien (conservar)

| Módulo | Por qué está bien |
|---|---|
| `domain/measurement.js` | Puro, sin dependencias del DOM, bien documentado |
| `services/measurementService.js` | Inyección de dependencias, sin conocimiento del DOM |
| `infra/localStorageAdapter.js` | Contrato `getAll/save` limpio e intercambiable |
| `chart.js` | Encapsulado razonablemente (recibe container y datos, no accede al DOM global) |
| `validators.js` | Puro y testeable |

---

## 2. Problemas identificados

### P-01 — `app.js` es un god module (severidad: alta)

`app.js` mezcla en 319 líneas:
- Referencias directas a ~15 IDs del DOM
- Gestión de estados de la UI (cargando / error / vacío / lista)
- Renderizado de tarjetas (generación de `innerHTML`)
- Lógica de apertura/cierre del formulario
- Validación de formulario con presentación de errores
- Orquestación de la gráfica + `ResizeObserver`
- Todos los `addEventListener`
- Inicialización de la aplicación

Consecuencia: **no se puede añadir ninguna funcionalidad nueva sin modificar este fichero**, lo que multiplica el riesgo de regresión.

### P-02 — Un único HTML para toda la UI (severidad: alta)

`index.html` contiene en línea el marcado de todos los bloques (formulario, historial, gráfica, aviso iOS). No hay separación de vistas ni de componentes reutilizables en el marcado, lo que hace imposible añadir nuevas pantallas sin replantear el fichero entero.

### P-03 — Sin router (severidad: alta para post-MVP)

No existe concepto de "página" o "vista". Toda la aplicación es una única pantalla. En cuanto se añada una pantalla de configuración, detalle de medición, o flujo OAuth, no hay mecanismo para navegar entre ellas.

### P-04 — CSS monolítico (severidad: media)

`styles.css` es un único fichero sin división por componentes. Cualquier clase nueva puede colisionar con las existentes. No hay variables CSS centralizadas para el sistema de diseño.

### P-05 — Duplicación de `MEASUREMENT_LIMITS` (severidad: baja)

La constante está definida en `domain/measurement.js` y de nuevo en `validators.js`. Si los límites cambian, hay que actualizar dos ficheros.

### P-06 — `api.js` convive con el código de producción (severidad: baja)

Es código exclusivo para dev/tests pero reside en `src/` junto a los módulos productivos. Genera confusión y puede importarse por error.

### P-07 — Sin sistema de notificaciones (severidad: media)

Los errores solo se muestran en el contexto del formulario. No hay infraestructura para mensajes de confirmación (ej. "Medición guardada"), errores de sistema, o avisos de conectividad offline.

### P-08 — Sin gestión de estado centralizada (severidad: media)

El estado de la UI (últimas mediciones, estado del formulario) vive en variables globales de módulo dentro de `app.js`. Es difícil sincronizar múltiples componentes que necesiten el mismo dato.

---

## 3. Estructura propuesta

### 3.1 Árbol de directorios

```
apps/frontend/
  public/
    index.html          ← shell mínimo: solo <head>, <header>, <main id="app">, imports del SW
    manifest.json
    sw.js
    icons/
    styles/
      main.css          ← importa los parciales; solo variables + reset global
  src/
    main.js             ← punto de entrada: registra SW, inicializa router, monta vista inicial
    router.js           ← router hash-based (#/home, #/settings …)
    
    domain/
      measurement.js    ← sin cambios
    
    services/
      measurementService.js  ← sin cambios
    
    infra/
      localStorageAdapter.js    ← sin cambios
      googleDriveAdapter.js     ← post-MVP
      httpAdapter.js            ← (renombrado de api.js, movido fuera de src raíz)
    
    store/
      appStore.js       ← estado global reactivo: publisher/subscriber sin framework
    
    views/
      HomeView.js        ← orquesta MeasurementList + MeasurementChart + FAB nueva medición
      SettingsView.js    ← post-MVP: exportar datos, cuenta Google, tema
    
    components/
      MeasurementForm/
        MeasurementForm.js
        MeasurementForm.css
      MeasurementList/
        MeasurementList.js
        MeasurementList.css
      MeasurementChart/
        MeasurementChart.js     ← wrapper del módulo chart.js existente
        MeasurementChart.css
      Toast/
        Toast.js                ← notificaciones efímeras (éxito, error, info)
        Toast.css
      IosWarning/
        IosWarning.js
        IosWarning.css
    
    shared/
      validators.js     ← refactorizado: importa MEASUREMENT_LIMITS desde domain/
      formatters.js     ← fecha, unidades (extraído de app.js)
      constants.js      ← constantes de app no pertenecientes al dominio
      eventBus.js       ← CustomEvent wrapper tipado
  
  tests/
    domain/
    services/
    infra/
    shared/
    components/
      MeasurementForm/
      MeasurementList/
      MeasurementChart/
      Toast/
    e2e/
      flows/
      helpers/
```

### 3.2 Diagrama de dependencias

```
main.js
  └── router.js
        └── views/HomeView.js
              ├── components/MeasurementForm/MeasurementForm.js
              │     ├── shared/validators.js
              │     │     └── domain/measurement.js (MEASUREMENT_LIMITS)
              │     └── shared/eventBus.js
              ├── components/MeasurementList/MeasurementList.js
              │     └── shared/formatters.js
              ├── components/MeasurementChart/MeasurementChart.js
              │     └── chart.js (sin cambios)
              └── store/appStore.js
                    └── services/measurementService.js
                          ├── domain/measurement.js
                          └── infra/localStorageAdapter.js  [MVP]
                               infra/googleDriveAdapter.js  [post-MVP]
```

**Regla de dependencias:** las capas solo pueden importar hacia abajo en el diagrama. Ningún módulo de `infra/` o `domain/` importa de `components/`, `views/` ni `store/`.

---

## 4. Decisiones de diseño

### 4.1 Router hash-based

Se usa el hash de la URL (`#/home`, `#/settings`) para la navegación entre vistas.

**Justificación:**
- No requiere configuración adicional en el servidor Express (que en MVP solo sirve estáticos).
- Compatible con PWA en iOS/Android sin necesidad de reescribir reglas de routing.
- Soporta el botón "atrás" del navegador y del sistema operativo móvil nativamente.
- Implementable sin librería externa (ADR-003).

### 4.2 Componentes como funciones constructoras (sin framework)

Cada componente sigue este contrato:

```js
export function createMeasurementForm(rootElement, { onSubmit }) {
  // ... lógica interna
  function mount() { /* inserta HTML en rootElement */ }
  function unmount() { /* limpia listeners */ }
  function update(state) { /* actualiza el DOM mínimo necesario */ }
  return { mount, unmount, update };
}
```

**Justificación:** consistente con ADR-003 (sin framework). El patrón es simple, testeable con JSDOM, y no introduce dependencias. Los componentes no se conocen entre sí: se comunican a través del `appStore` o el `eventBus`.

### 4.3 `appStore.js` — estado global reactivo mínimo

Un store publisher/subscriber implementado con `Map` de callbacks. No es Redux ni Zustand, pero proporciona una fuente única de verdad sin variables globales dispersas.

```js
// Uso desde un componente
appStore.subscribe('measurements', (mediciones) => component.update(mediciones));
appStore.dispatch('measurements:load');
```

**Justificación:** elimina el acoplamiento directo entre componentes y resuelve P-08 sin introducir librerías externas.

### 4.4 `eventBus.js` — eventos de dominio tipados

Wrapper sobre `CustomEvent` que fuerza nombres de evento en un único lugar:

```js
export const Events = {
  MEASUREMENT_SAVED: 'measurement:saved',
  STORE_UPDATED:     'store:updated',
};
```

**Justificación:** el `medicion-guardada` actual es una cadena literal dispersa en el código. Centralizar los nombres evita errores de typo y facilita refactorizar.

### 4.5 CSS por componente + variables globales

- `public/styles/main.css` define las variables del sistema de diseño (`--color-primary`, `--spacing-*`, fuentes) e importa los parciales.
- Cada componente tiene su propio fichero `.css` (ej. `MeasurementForm.css`).
- Los estilos globales de layout y reset se mantienen en `main.css`.

**Justificación:** resuelve P-04. Permite añadir o eliminar componentes sin riesgo de colisión, y facilita eventual migración a CSS Modules o similares.

### 4.6 `shared/validators.js` importa `MEASUREMENT_LIMITS` de dominio

```js
// shared/validators.js
import { MEASUREMENT_LIMITS } from '../domain/measurement.js';
```

**Justificación:** elimina la duplicación (P-05). La fuente única de los límites es la capa de dominio.

---

## 5. Módulos sin cambios

Estos módulos están bien diseñados y **no requieren refactorización**, solo reubicación o renombrado puntual donde aplica:

| Módulo actual | Acción |
|---|---|
| `domain/measurement.js` | Sin cambios |
| `services/measurementService.js` | Sin cambios |
| `infra/localStorageAdapter.js` | Sin cambios |
| `chart.js` | Sin cambios; `MeasurementChart.js` lo envuelve |
| `validators.js` → `shared/validators.js` | Mover + importar `MEASUREMENT_LIMITS` desde dominio |
| `api.js` → `infra/httpAdapter.js` | Renombrar y mover (solo dev/tests) |

---

## 6. Impacto en tests

| Tipo | Impacto esperado |
|---|---|
| Tests unitarios de dominio/services/infra/validators | **Ninguno** — los módulos no cambian |
| Tests de componentes (`formulario.test.js`, `chart.test.js`) | Requieren actualización para apuntar a los nuevos módulos de componente |
| Tests E2E (Playwright) | **Ninguno** — prueban comportamiento de la UI, no la estructura interna |
| `api.test.js` | Actualizar el import a `infra/httpAdapter.js` |

---

## 7. Plan de refactorización sugerido (por fases)

| Fase | Contenido | Riesgo |
|---|---|---|
| **F-1** | Crear `shared/` (mover validators, crear formatters, constants, eventBus). Arreglar duplicación P-05. | Bajo |
| **F-2** | Extraer componentes (`MeasurementForm`, `MeasurementList`, `MeasurementChart`, `Toast`, `IosWarning`) con sus CSS | Medio |
| **F-3** | Crear `appStore.js` y migrar el estado de `app.js` al store | Medio |
| **F-4** | Crear `router.js` + `views/HomeView.js`; reducir `app.js` a punto de entrada mínimo → renombrar a `main.js` | Alto |
| **F-5** | Reestructurar `index.html` como shell mínimo; reorganizar `styles/` | Bajo/Medio |
| **F-6** | Actualizar todos los tests; validar cobertura ≥ 70% | — |

Cada fase es independiente y deployable: la app debe funcionar correctamente al finalizar cada una.

---

## 8. Fuera del alcance de esta refactorización

- Añadir nuevas funcionalidades (OCR, Google Drive, OAuth).
- Cambiar la arquitectura de persistencia (ADR-005 se mantiene).
- Migrar a un framework (ADR-003 no se modifica).
- Cambiar el backend.
