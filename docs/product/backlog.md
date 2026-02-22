# Backlog — Tensia

_Última revisión: 2026-02-22 — BK-22 completado (modal formulario implementado); BK-21 completado (diseño layout columnas); BK-23 pendiente_

---

## Sprint MVP — Estado actual

### ✅ Completados

**BK-01 — Estructura base del proyecto**
Descripción: Monorepo con apps/backend, apps/frontend y docs.
Prioridad: Alta
Estado: Hecho

**BK-02 — Modelo de datos y dominio**
Descripción: Entidad `Measurement` con validaciones (sistólica, diastólica, pulso, UUID, source). Reside en `apps/frontend/src/domain/measurement.js` (ADR-005).
Prioridad: Alta
Estado: Hecho

**BK-03 — API REST: POST /measurements** ~~Hecho~~ → **Eliminado (ADR-005)**
Descripción: Endpoint de creación con validación y respuesta 201 / 400. Eliminado al aplicar ADR-005: la persistencia reside en el cliente. El código de este endpoint (controller, service, routes, domain del backend) ha sido borrado.
Prioridad: Alta
Estado: Eliminado con ADR-005 (2026-02-19)

**BK-04 — API REST: GET /measurements** ~~Hecho~~ → **Eliminado (ADR-005)**
Descripción: Endpoint de listado ordenado por fecha descendente. Eliminado al aplicar ADR-005.
Prioridad: Alta
Estado: Eliminado con ADR-005 (2026-02-19)

**BK-05 — Persistencia en `localStorage` (ADR-005)**
Descripción: `localStorageAdapter.js` en `apps/frontend/src/infra/`, con interfaz `getAll()` / `save()`. Servicio `measurementService.js` migrado al frontend. `JsonFileAdapter` se mantiene solo para desarrollo y tests de integración.
Prioridad: Alta
Estado: Hecho

**BK-06 — UI: formulario de registro manual**
Descripción: Formulario con validaciones inline, fecha auto-rellenada, campo pulso opcional.
Prioridad: Alta
Estado: Hecho

**BK-07 — UI: listado de mediciones**
Descripción: Historial ordenado descendente, mensaje "Sin mediciones todavía" en estado vacío.
Prioridad: Alta
Estado: Hecho

**BK-08 — Tests unitarios backend (infra)**
Descripción: Tests de `jsonFileAdapter.js` con Jest. Los tests de domain, services y API del backend fueron eliminados al aplicar ADR-005 (esa lógica migró al frontend con sus propios tests).
Prioridad: Alta
Estado: Hecho

**BK-09 — Tests unitarios frontend**
Descripción: Cobertura de `domain/measurement.js`, `services/measurementService.js`, `infra/localStorageAdapter.js`, `validators.js` y `api.js` con Jest + jsdom. 142 tests, 8 suites, cobertura global > 70 % (objetivo cumplido).
Prioridad: Alta
Estado: Hecho

**BK-10 — Tests E2E flujos críticos (Playwright)**
Descripción: TC-09 registro manual, TC-10 estado vacío, TC-11 error de almacenamiento local (`localStorage` bloqueado), TC-13 skeleton de gráfica cuando no hay datos suficientes (US-11).
Prioridad: Alta
Estado: Hecho

**BK-11 — Tests de componente frontend: validaciones de formulario**
Descripción: Automatizar TC-07 (campos vacíos) y TC-08 (sistólica ≤ diastólica) como tests de componente sin levantar el backend.
Prioridad: Media
Estado: Hecho — `apps/frontend/tests/formulario.test.js` (12 tests: TC-07 × 5, TC-08 × 4, CA-06 × 3)
Referencia: test-cases.md#TC-07, #TC-08

**BK-12 — Corrección BUG-01: ordenación no determinista mismo timestamp**
Descripción: Dos mediciones creadas en el mismo minuto pueden aparecer en orden incorrecto. Solución propuesta: incluir segundos en `rellenarFechaActual()` (frontend) o añadir clave de orden secundaria en el servicio backend.
Prioridad: Baja (raro en uso real)
Estado: Hecho (fix frontend) — `rellenarFechaActual()` usa `.slice(0, 19)` para incluir segundos en el timestamp, eliminando la causa raíz en el caso de uso normal. El fix backend (orden secundario por `id`) queda pendiente como mejora defensiva.
Referencia: test-cases.md#BUG-01

---

**BK-14 — Gráficas de evolución temporal**
Descripción: Gráfica de líneas (sistólica/diastólica) con D3.js modular sobre SVG (ADR-006). Se muestra cuando hay ≥ 2 mediciones. Implementada en `apps/frontend/src/chart.js` e integrada en `app.js` con `ResizeObserver`. `index.html` usa `<div id="chart-mediciones">` con `importmap` para D3 vía CDN jsDelivr. Service Worker actualizado (v3) para cachear módulos D3 y garantizar uso offline. 23 tests unitarios en `apps/frontend/tests/chart.test.js`.
Prioridad: Media
Estado: Hecho
Referencia: US-04, ADR-006

---

**BK-18 — Migrar chart.js a D3.js modular + tests**
Descripción: Reescribir `apps/frontend/src/chart.js` usando D3 (d3-selection, d3-scale, d3-axis, d3-shape) con salida SVG. Cambiado `<canvas>` por `<div id="chart-mediciones">` en `index.html`. Añadido `importmap` para carga ESM sin bundler. Tests en `apps/frontend/tests/chart.test.js` (23 tests). El contrato externo de `renderChart()` no cambió.
Prioridad: Media
Estado: Hecho
Referencia: US-04, ADR-006

---

**BK-19 — Skeleton de gráfica cuando no hay datos suficientes (US-11)**
Descripción: `renderSkeleton()` en `apps/frontend/src/chart.js`: cuando hay < 2 mediciones, `renderChart()` muestra un `div.chart-skeleton` con el texto "Sin datos suficientes para mostrar la gráfica" en lugar del SVG. Integrado en `app.js` mediante `renderizarGrafica()`. Tests E2E: `skeleton-grafica.spec.js` (15 tests, TC-13), que cubren 0 mediciones, 1 medición, ≥2 mediciones, transición y primera visita.
Prioridad: Alta
Estado: Hecho
Referencia: US-11, TC-13

---

## Próximo sprint — Mejoras de UX (post-MVP confirmadas)

**BK-20 — [Diseñador] Diseño: modal del formulario de registro**
Descripción: Definir y documentar en `docs/design/screens.md` el wireframe detallado de la ventana modal que contiene el formulario de nueva medición: overlay, animación de apertura/cierre, comportamiento bottom-sheet en móvil (< 640 px), posición y estilo del botón de cierre (✕), focus trap y estados (abierta / cerrando / error de validación).
Prioridad: Alta
Estado: Hecho — wireframes desktop y bottom-sheet móvil, animaciones de apertura/cierre, estado enviando, estado error de validación, especificaciones visuales (overlay, contenedor, botón ✕), order de tabulación del focus trap, tabla de interacciones y accesibilidad WCAG AA. Flujo actualizado en `ux-flow.md`.
Rol: Diseñador UX/UI
Referencia: US-13

**BK-21 — [Diseñador] Diseño: layout gráfica + historial en columnas (≥ 768 px)**
Descripción: Definir y documentar en `docs/design/screens.md` el wireframe del layout de dos columnas para pantallas anchas: proporciones de columna (sugerido 55 % gráfica / 45 % historial o 50/50), comportamiento sticky de la gráfica, scroll independiente del historial, breakpoints exactos y degradación a columna única en móvil. Incluir especificaciones de espaciado y alineación entre columnas.
Prioridad: Alta
Estado: Hecho — Wireframes columna única (< 768 px) y dos columnas (≥ 768 px), proporciones 55 %/45 %, gap 24 px, sticky con `top: calc(var(--header-height) + 8px)`, historial scrollable con `max-height` basado en variables CSS, estados intermedios (0 mediciones → columna única, 1 medición → skeleton + historial, ≥ 2 mediciones → gráfica + historial), tabla de espaciado, accesibilidad WCAG AA y notas de implementación para BK-23. Flujo responsivo añadido en `ux-flow.md`.
Rol: Diseñador UX/UI
Referencia: US-14

**BK-22 — [Frontend Dev] Implementar modal del formulario de registro**
Descripción: Introducir un componente `Modal` genérico y reutilizable, y usarlo como contenedor de `MeasurementForm`. **`MeasurementForm` no debe ser modificado para incluir comportamiento de modal**; debe seguir siendo un componente de formulario puro. La composición se gestiona en `HomeView`.

### Tarea 1 — Crear componente `Modal` (genérico, reutilizable)

Ubicación: `apps/frontend/src/components/Modal/Modal.js` + `Modal.css`

**Contrato público:**
```js
// Instanciación
const modal = new Modal({
  title: 'Nueva medición',    // string — texto del encabezado
  onClose: () => {},          // callback invocado al cerrar (✕, Escape, overlay)
  contentFactory: (container) => component, // función que monta el contenido y devuelve { unmount }
  locked: false               // boolean reactivo: bloquea cierre cuando true (estado "enviando")
});

modal.open()     // monta en DOM, lanza animación de apertura, activa focus trap
modal.close()    // lanza animación de cierre, desactiva focus trap, desmonta del DOM
modal.lock()     // activa estado "enviando": deshabilita ✕, Escape y click en overlay
modal.unlock()   // revierte lock()
```

**Responsabilidades del componente `Modal`:**
- Crear y gestionar el overlay semitransparente (`rgba(0,0,0,0.45)`).
- Renderizar el contenedor con cabecera (título + botón ✕) y área de contenido.
- Llamar a `contentFactory(contentContainer)` al abrir para que el contenido se monte en su interior; invocar el `unmount` devuelto al cerrar.
- Implementar el **focus trap**: `Tab`/`Shift+Tab` ciclan dentro de la modal; el primer elemento enfocable recibe el foco al finalizar la animación de apertura.
- Gestionar el cierre con `Escape`, click en overlay y botón ✕, respetando el estado `locked`.
- Aplicar las **animaciones de apertura y cierre** según las especificaciones de `screens.md`:
  - Desktop/tablet (≥ 640 px): `opacity` + `translateY(16px → 0)` en apertura (180 ms ease-out); inverso en cierre (200 ms ease-in).
  - Móvil (< 640 px): bottom-sheet — `translateY(100% → 0)` (260 ms cubic-bezier); inverso en cierre (240 ms ease-in).
  - Devolver el foco al elemento de origen (`opener`) **al finalizar** la transición de cierre (`transitionend`).
- Atributos de accesibilidad: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` apuntando al título.
- CSS en `apps/frontend/public/styles/components/Modal.css`; importado desde `main.css`.

**Comportamiento bottom-sheet en móvil (< 640 px):**
- Contenedor anclado a `bottom: 0`, ancho 100 %, `border-radius` 16 px top-left/top-right.
- Handle visual: pill `40 × 4 px`, color `#d1d5db`, centrado, `margin-top: 8 px`.

### Tarea 2 — Integrar `Modal` + `MeasurementForm` en `HomeView`

- En `HomeView.js`, el botón "Nueva medición" actúa como *opener*: guarda la referencia del botón para devolver el foco al cerrar.
- Al pulsar el botón: instanciar `Modal` pasando como `contentFactory` una función que monte `MeasurementForm` en el contenedor proporcionado.
- `MeasurementForm` notifica el éxito mediante el `eventBus` o un callback; `HomeView` escucha ese evento para llamar a `modal.close()`, disparar el toast y actualizar el store.
- Mientras `MeasurementForm` está en estado "enviando", `HomeView` llama a `modal.lock()` / `modal.unlock()`.

### Tarea 3 — CSS

- `Modal.css` cubre overlay, contenedor, cabecera, botón ✕, handle del bottom-sheet y todas las animaciones.
- No modificar `MeasurementForm.css`; solo ajustar si hay conflictos de espaciado interior con el nuevo contenedor.
- Importar `Modal.css` como parcial en `apps/frontend/public/styles/main.css`.

### Tarea 4 — Tests

- **`apps/frontend/tests/components/Modal.test.js`** — tests unitarios del componente `Modal` en aislamiento (con `contentFactory` stub):
  - `open()` inserta el overlay y el contenedor en el DOM.
  - `close()` elimina overlay y contenedor del DOM tras la transición.
  - Focus trap: Tab no sale de la modal.
  - Escape cierra la modal en estado normal; no la cierra en estado `locked`.
  - Click en overlay cierra la modal en estado normal; no la cierra en estado `locked`.
  - Foco devuelto al opener al cerrar.
  - `lock()` / `unlock()` habilitan e inhabilitan el botón ✕.
- **`apps/frontend/tests/components/MeasurementForm.test.js`** — verificar que `MeasurementForm` sigue funcionando montado fuera de una modal (sin regresiones).

Prioridad: Alta
Estado: Hecho — `Modal.js` + `Modal.css` en `apps/frontend/src/components/Modal/` y `apps/frontend/public/styles/components/`; `HomeView.js` actualizado para componer Modal + MeasurementForm; 21 tests unitarios en `Modal.test.js`; suite completa 247 tests pasando (sin regresiones).
Rol: Frontend Dev
Referencia: US-13, BK-20

**BK-23 — [Frontend Dev] Implementar layout gráfica + historial en columnas**
Descripción: Cambiar el layout de `HomeView` para que en pantallas ≥ 768 px la gráfica y el historial aparezcan en columnas (`display: grid` o `flex`). Tareas:
- Modificar `apps/frontend/src/views/HomeView.js` para envolver gráfica e historial en un contenedor de dos columnas.
- Añadir media query en CSS (`MeasurementChart.css` o nuevo parcial de layout) para activar el grid ≥ 768 px y mantener columna única < 768 px.
- Hacer la columna del historial independientemente scrollable (`overflow-y: auto`, `max-height`).
- Mantener comportamiento responsivo del `ResizeObserver` de la gráfica al cambiar el tamaño de su columna.
- Verificar que skeleton (< 2 mediciones) no rompe el layout de columnas.
- Añadir/actualizar tests: E2E o de componente que verifiquen las dos variantes de layout.
Prioridad: Alta
Estado: Pendiente
Rol: Frontend Dev
Referencia: US-14, BK-21

---

## Post-MVP (no iniciar sin confirmación)

**BK-13 — Registro por foto (OCR)**
Descripción: El usuario sube una foto del tensiómetro; la app extrae los valores y los muestra editables antes de guardar.
Prioridad: Alta (cuando se abra el siguiente sprint)
Estado: Pendiente
Referencia: US-02, CA-02

**BK-14 — Gráficas de evolución temporal** → _Movido al Sprint MVP (2026-02-22)_

**BK-15 — Autenticación con Google OAuth**
Descripción: Login opcional para persistencia multi-dispositivo vía Google Drive.
Prioridad: Media
Estado: Pendiente

**BK-16 — Persistencia en Google Drive**
Descripción: Adaptador de persistencia alternativo al fichero JSON local.
Prioridad: Media
Estado: Pendiente

**BK-17 — Recordatorios / notificaciones**
Descripción: Alertar al usuario para tomar la tensión periódicamente.
Prioridad: Baja
Estado: Pendiente
