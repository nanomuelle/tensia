# Casos de prueba — Tensia MVP

---

## Backend

---

**[TC-01] — Crear medición válida**
Dado: el servidor está en marcha y el adaptador en memoria está vacío
Cuando: se hace `POST /measurements` con `{ systolic: 120, diastolic: 80, pulse: 72, measuredAt: "2026-02-18T10:00:00.000Z" }`
Entonces: la respuesta es `201 Created` con un objeto que incluye `id` (UUID), `source: "manual"` y los valores enviados
Tipo: Integración
Prioridad: Alta
Estado: ✅ Cubierto — `tests/api/measurements.test.js`

---

**[TC-02] — Rechazar sistólica inválida (negativa, cero, no numérica)**
Dado: el servidor está en marcha
Cuando: se hace `POST /measurements` con `systolic: 0`, `systolic: -10` o sin el campo
Entonces: la respuesta es `400 Bad Request` con un campo `error` descriptivo
Tipo: Integración
Prioridad: Alta
Estado: ✅ Cubierto — `tests/api/measurements.test.js` + `tests/domain/measurement.test.js`

---

**[TC-03] — Persistencia correcta tras recargar el servidor**
Dado: se ha creado una medición con `POST /measurements`
Cuando: el servidor se reinicia y se llama a `GET /measurements`
Entonces: la medición creada aparece en la lista
Tipo: Integración (filesystem)
Prioridad: Alta
Estado: ✅ Cubierto parcialmente — `tests/infra/jsonFileAdapter.test.js` (ciclo get/save)
Nota: no hay test de restart completo del servidor; aceptable para MVP

---

**[TC-04] — OCR devuelve estructura válida**
Dado: (post-MVP) el endpoint OCR está implementado
Cuando: se sube una imagen de un tensiómetro
Entonces: la respuesta incluye `{ systolic, diastolic, pulse? }` con valores numéricos
Tipo: Integración
Prioridad: Media
Estado: ⏸ Pendiente — funcionalidad post-MVP

---

**[TC-05] — Listado ordenado por fecha descendente**
Dado: existen tres mediciones con fechas distintas
Cuando: se hace `GET /measurements`
Entonces: el array devuelto está ordenado de más reciente a más antiguo
Tipo: Integración
Prioridad: Alta
Estado: ✅ Cubierto — `tests/api/measurements.test.js` + `tests/services/measurementService.test.js`

---

**[TC-06] — Rechazar diastólica mayor o igual a sistólica**
Dado: el servidor está en marcha
Cuando: se hace `POST /measurements` con `systolic: 80, diastolic: 80`
Entonces: la respuesta es `400 Bad Request`
Tipo: Integración
Prioridad: Alta
Estado: ✅ Cubierto — `tests/api/measurements.test.js`

---

**[TC-07] — Formulario frontend rechaza campos vacíos**
Dado: el formulario de registro está abierto
Cuando: el usuario pulsa "Guardar" sin rellenar ningún campo
Entonces: se muestran mensajes de error inline en sistólica, diastólica y fecha; no se llama al backend
Tipo: Componente frontend
Prioridad: Alta
Estado: ✅ Cubierto — `apps/frontend/tests/formulario.test.js` (5 tests, jsdom)

---

**[TC-08] — Formulario frontend rechaza sistólica ≤ diastólica**
Dado: el formulario de registro está abierto
Cuando: el usuario introduce `systolic: 70, diastolic: 80` y pulsa "Guardar"
Entonces: aparece error inline en sistólica; no se llama al backend
Tipo: Componente frontend
Prioridad: Alta
Estado: ✅ Cubierto — `apps/frontend/tests/formulario.test.js` (4 tests, jsdom)

---

**[TC-09] — Registro manual completo (flujo E2E crítico)**
Dado: la app está cargada en el navegador y el backend en marcha
Cuando: el usuario abre el formulario, introduce valores válidos y pulsa "Guardar"
Entonces: el formulario se cierra, la medición aparece al inicio del historial, sin recargar la página
Tipo: E2E
Prioridad: Alta
Estado: ✅ Cubierto — `apps/frontend/tests/e2e/flows/registro-manual.spec.js` (6 tests, Playwright)
Nota: el test de ordenación usa fechas explícitas para sortear BUG-01

---

## Bugs detectados

---

**[BUG-01] — Ordenación no determinista cuando dos mediciones tienen el mismo timestamp**

Pasos para reproducir:
1. Abrir la app con el backend en marcha.
2. Crear una primera medición (sin modificar la fecha auto-rellenada).
3. Crear una segunda medición inmediatamente (sin modificar la fecha auto-rellenada).
4. Observar el orden en el historial.

Resultado actual: la segunda medición puede aparecer antes o después de la primera, de forma no determinista.

Resultado esperado: la medición creada más recientemente aparece siempre en primer lugar.

Causa raíz identificada:
- `rellenarFechaActual()` en `apps/frontend/src/app.js` trunca la fecha a minutos (`.slice(0, 16)`). Dos mediciones creadas dentro del mismo minuto reciben el mismo `measuredAt`.
- El sort del backend (`new Date(b.measuredAt) - new Date(a.measuredAt)`) devuelve `0` para timestamps iguales; el orden resultante es no determinista.

Soluciones posibles (a decidir por el equipo):
- **Frontend** (`app.js`): usar `.slice(0, 19)` para incluir segundos en la fecha auto-rellenada.
- **Backend** (`measurementService.js`): añadir clave de ordenación secundaria estable (p.ej. `id` o timestamp de inserción).

Severidad: Baja (solo afecta a mediciones creadas en el mismo minuto; raro en uso real)
Afecta a: `apps/frontend/src/app.js` · `apps/backend/src/services/measurementService.js`

**Estado resolución:**
- ✅ Fix frontend aplicado: `rellenarFechaActual()` usa `.slice(0, 19)` → el campo fecha incluye segundos, por lo que dos mediciones creadas de forma consecutiva tendrán timestamps distintos en el uso normal.
- ⏳ Fix backend pendiente (mejora defensiva): añadir clave secundaria de ordenación por `id` en `measurementService.js` para cubrir el caso de timestamps enviados explícitamente iguales. Pendiente de decisión del equipo backend.

---

**[TC-10] — Estado vacío en primera carga**
Dado: el backend no tiene mediciones
Cuando: el usuario abre la app
Entonces: se muestra el mensaje "Sin mediciones todavía" y el botón "Nueva medición"
Tipo: E2E
Prioridad: Media
Estado: ✅ Cubierto — `apps/frontend/tests/e2e/flows/estado-vacio.spec.js` (3 tests, Playwright)

---

**[TC-11] — Banner de error si el backend no responde**
Dado: el backend está caído
Cuando: la app intenta cargar el historial
Entonces: se muestra el banner de error con el botón "Reintentar"
Tipo: E2E
Prioridad: Media
Estado: ✅ Cubierto — `apps/frontend/tests/e2e/flows/error-backend.spec.js` (5 tests, Playwright)
