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
Descripción: Cobertura de `domain/measurement.js`, `services/measurementService.js`, `infra/localStorageAdapter.js`, `validators.js` y `api.js` con Jest + jsdom. 115 tests, 7 suites, cobertura global > 70 % (objetivo cumplido).
Prioridad: Alta
Estado: Hecho

**BK-10 — Tests E2E flujos críticos (Playwright)**
Descripción: TC-09 registro manual, TC-10 estado vacío, TC-11 error de almacenamiento local (`localStorage` bloqueado).
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
Descripción: Gráfica de líneas (sistólica/diastólica) con Canvas API nativo. Se muestra cuando hay ≥ 2 mediciones. Implementada en `apps/frontend/src/chart.js` e integrada en `app.js`.
Prioridad: Media
Estado: Hecho
Referencia: US-04

---

## Pendientes del MVP

> No hay ítems pendientes en el sprint MVP. El MVP está completo.

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
