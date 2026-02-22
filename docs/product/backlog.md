# Backlog — Tensia

_Última revisión: 2026-02-22 — Gráficas de evolución incorporadas al MVP_

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
