# Casos de prueba — Tensia

_Última revisión: 2026-02-23 — Reorganizado por funcionalidad. Todos los TC activos en verde. BUG-01 cerrado._

> Los casos están agrupados por área funcional para facilitar la lectura por el Product Owner.
> Estado del conjunto: **todos los TC activos están cubiertos y en verde.**

---

## Resumen

| ID | Descripción | Tipo | Estado |
|---|---|---|---|
| TC-01 | `JsonFileAdapter`: ciclo save/getAll (dev/tests) | Unitario infra | ✅ Cubierto |
| TC-02 | Dominio: sistólica inválida (negativa, cero, vacía) | Unitario dominio | ✅ Cubierto |
| TC-05 | Servicio: listado ordenado por fecha descendente | Unitario servicio | ✅ Cubierto |
| TC-06 | Dominio: diastólica ≥ sistólica → error | Unitario dominio | ✅ Cubierto |
| TC-07 | Formulario: campos vacíos → errores inline, sin persistir | Componente | ✅ Cubierto |
| TC-08 | Formulario: sistólica ≤ diastólica → error inline | Componente | ✅ Cubierto |
| TC-09 | E2E: registro manual completo (flujo crítico) | E2E | ✅ Cubierto |
| TC-10 | E2E: estado vacío en primera carga | E2E | ✅ Cubierto |
| TC-11 | E2E: banner de error si `localStorage` falla | E2E | ✅ Cubierto |
| TC-12 | Dominio: rangos clínicos OMS/NHS | Unitario dominio + validadores | ✅ Cubierto |
| TC-13 | E2E: skeleton de gráfica cuando no hay datos suficientes | E2E | ✅ Cubierto |
| TC-14 | Componente: aviso Safari/iOS mostrado en plataformas afectadas | Componente | ✅ Cubierto |
| TC-15 | E2E: layout gráfica + historial en columnas (US-14) | E2E | ✅ Cubierto |
| TC-16 | `eventBus`: emisión y suscripción de eventos de dominio | Unitario shared | ✅ Cubierto |
| TC-17 | Router hash-based: navegación y fallback | Unitario | ✅ Cubierto |
| TC-04 | OCR: respuesta con estructura válida | Integración | ⏸ Post-MVP (E-02) |

---

## Área: Persistencia e infraestructura

**[TC-01] — `JsonFileAdapter`: ciclo save/getAll**
Dado: el adaptador `JsonFileAdapter` está inicializado con un fichero temporal
Cuando: se llama a `save([medición])` con valores válidos y luego a `getAll()`
Entonces: el fichero persiste la medición con `id` (UUID) y `source: "manual"`, y `getAll()` la devuelve
Tipo: Unitario infra (solo entorno dev/tests — ADR-005)
Prioridad: Alta
Estado: ✅ Cubierto — `apps/backend/tests/infra/jsonFileAdapter.test.js`

---

## Área: Dominio y validaciones

**[TC-02] — Sistólica inválida (negativa, cero, no numérica)**
Dado: el módulo de dominio frontend está cargado
Cuando: se llama a `validateMeasurement()` con `systolic: 0`, `systolic: -10` o sin el campo
Entonces: se lanza o devuelve un error descriptivo
Tipo: Unitario dominio
Prioridad: Alta
Estado: ✅ Cubierto — `apps/frontend/tests/domain/measurement.test.js`

---

**[TC-06] — Diastólica mayor o igual a sistólica**
Dado: el módulo de dominio frontend está cargado
Cuando: se llama a `validateMeasurement()` con `systolic: 80, diastolic: 80`
Entonces: se lanza o devuelve un error de dominio
Tipo: Unitario dominio
Prioridad: Alta
Estado: ✅ Cubierto — `apps/frontend/tests/domain/measurement.test.js`

---

**[TC-12] — Rangos clínicamente plausibles (OMS / NHS)**
Dado: el módulo de dominio y los validadores del formulario están activos
Cuando: se validan valores fuera de los rangos clínicos para sistólica, diastólica o pulso
Entonces:
- `systolic` < 50 o > 300 → error con mención al límite correspondiente
- `diastolic` < 30 o > 200 → error con mención al límite correspondiente
- `pulse` < 20 o > 300 → error con mención al límite correspondiente
- Los valores en los límites exactos (50, 300, 30, 200, 20, 300) son aceptados sin error
Tipo: Unitario dominio + validadores
Prioridad: Alta
Estado: ✅ Cubierto — `apps/frontend/tests/domain/measurement.test.js` (13 tests) · `apps/frontend/tests/shared/validators.test.js` (13 tests)
Fuente: OMS — *Hypertension Fact Sheet* (sept. 2025) · NHS — *Blood pressure test* (nov. 2025)

---

## Área: Servicio de mediciones

**[TC-05] — Listado ordenado por fecha descendente**
Dado: el servicio de mediciones recibe tres mediciones con fechas distintas
Cuando: se llama a `listAll()`
Entonces: el array devuelto está ordenado de más reciente a más antiguo
Tipo: Unitario servicio
Prioridad: Alta
Estado: ✅ Cubierto — `apps/frontend/tests/services/measurementService.test.js`

---

## Área: Formulario de registro

**[TC-07] — Campos vacíos → errores inline, sin persistir**
Dado: el formulario de registro está abierto
Cuando: el usuario pulsa "Guardar" sin rellenar ningún campo
Entonces: se muestran mensajes de error inline en sistólica, diastólica y fecha; no se persiste nada
Tipo: Componente frontend
Prioridad: Alta
Estado: ✅ Cubierto — `apps/frontend/tests/components/MeasurementForm.test.js`

---

**[TC-08] — Sistólica ≤ diastólica → error inline**
Dado: el formulario de registro está abierto
Cuando: el usuario introduce `systolic: 70, diastolic: 80` y pulsa "Guardar"
Entonces: aparece error inline en sistólica; no se persiste nada
Tipo: Componente frontend
Prioridad: Alta
Estado: ✅ Cubierto — `apps/frontend/tests/components/MeasurementForm.test.js`

---

## Área: Flujos E2E

**[TC-09] — Registro manual completo (flujo E2E crítico)**
Dado: la app está cargada en el navegador
Cuando: el usuario abre el formulario, introduce valores válidos y pulsa "Guardar"
Entonces: el formulario se cierra, la medición aparece al inicio del historial sin recargar la página; tras recargar sigue visible
Tipo: E2E
Prioridad: Alta
Estado: ✅ Cubierto — `apps/frontend/tests/e2e/flows/registro-manual.spec.js` (6 tests, Playwright)

---

**[TC-10] — Estado vacío en primera carga**
Dado: `localStorage` no contiene mediciones
Cuando: el usuario abre la app
Entonces: se muestra el mensaje "Sin mediciones todavía" y el botón "Nueva medición"
Tipo: E2E
Prioridad: Media
Estado: ✅ Cubierto — `apps/frontend/tests/e2e/flows/estado-vacio.spec.js` (3 tests, Playwright)

---

**[TC-11] — Banner de error si el almacenamiento local falla**
Dado: `localStorage.getItem` lanza una excepción (almacenamiento bloqueado o no disponible)
Cuando: la app intenta cargar el historial al arrancar
Entonces: se muestra el banner `#estado-error` con el botón "Reintentar";
  al pulsar "Reintentar" se repite la lectura (muestra estado vacío si ya funciona, error si sigue fallando)
Tipo: E2E
Prioridad: Media
Estado: ✅ Cubierto — `apps/frontend/tests/e2e/flows/error-backend.spec.js` (5 tests, Playwright)
Nota técnica: la simulación de fallo se realiza con `page.addInitScript()` sobreescribiendo `Storage.prototype.getItem`

---

**[TC-13] — Skeleton de gráfica cuando no hay datos suficientes**
Dado: `localStorage` contiene 0, 1 ó ≥2 mediciones al cargar la app
Cuando: se accede a la pantalla principal
Entonces:
- 0 mediciones → `#seccion-grafica` visible · `.chart-skeleton` visible · texto "Sin datos suficientes para mostrar la gráfica" · sin SVG
- 1 medición → igual que con 0
- ≥2 mediciones → `.chart-skeleton` ausente · SVG con `role="img"` y `aria-label` correcto visible
- Transición: al guardar la 2.ª medición, el skeleton desaparece y el SVG aparece sin recargar
- Primera visita (clave ausente en localStorage) → skeleton visible con texto informativo
Tipo: E2E
Prioridad: Alta
Estado: ✅ Cubierto — `apps/frontend/tests/e2e/flows/skeleton-grafica.spec.js` (15 tests, Playwright)
Nota técnica: el seeding usa `page.addInitScript()` escribiendo `bp_measurements` en localStorage

---

**[TC-15] — Layout gráfica + historial en columnas**
Dado: la app está cargada en el navegador
Cuando: el viewport es ≥ 768 px y hay ≥ 1 medición, o cuando hay 0 mediciones, o en móvil (< 768 px)
Entonces:
- ≥ 768 px + ≥ 1 medición → `.dashboard-content--columnas` presente
- ≥ 768 px + 0 mediciones → `.dashboard-content--columnas` ausente
- < 768 px + ≥ 1 medición → `.dashboard-content--columnas` ausente (columna única en móvil)
- ≥ 768 px + 1 medición → columnas activas + skeleton visible
- ≥ 768 px + eliminar todas las mediciones → clase retirada sin recargar
Tipo: E2E
Prioridad: Media
Estado: ✅ Cubierto — `apps/frontend/tests/e2e/flows/layout-columnas.spec.js` (6 tests, Playwright)

---

## Área: Componentes UI

**[TC-14] — Aviso Safari/iOS mostrado en plataformas afectadas**
Dado: el componente `IosWarning` está montado
Cuando: el userAgent corresponde a Safari macOS, iPhone o iPad
Entonces: el contenedor `#aviso-ios` queda visible
Cuando: el userAgent es Chrome/Linux
Entonces: el contenedor permanece oculto
Cuando: el usuario pulsa el botón de cierre
Entonces: el aviso se oculta y, tras `unmount()`, el click ya no tiene efecto
Tipo: Componente (Vitest + jsdom)
Prioridad: Alta
Estado: ✅ Cubierto — `apps/frontend/tests/components/IosWarning.test.js`

---

## Post-MVP

**[TC-04] — OCR: respuesta con estructura válida**
Dado: el endpoint `POST /ocr` está implementado (Épica E-02)
Cuando: se sube una imagen de un tensiómetro
Entonces: la respuesta incluye `{ systolic, diastolic, pulse? }` con valores numéricos validados
Tipo: Integración E2E
Prioridad: Media
Estado: ⏸ Pendiente — Épica E-02 (BK-32, BK-33, BK-34)

---

## Bugs

**[BUG-01] — Ordenación no determinista con mismo timestamp** ✅ CERRADO

Descripción: dos mediciones creadas en el mismo minuto podían aparecer en orden incorrecto en el historial.

Causa raíz: `rellenarFechaActual()` truncaba la fecha a minutos (`.slice(0, 16)`), lo que producía timestamps idénticos para mediciones creadas consecutivamente; el sort devolvía `0` y el orden era no determinista.

Fix aplicado: `rellenarFechaActual()` usa `.slice(0, 19)` → el campo fecha incluye segundos; dos mediciones creadas de forma consecutiva reciben timestamps distintos.

Severidad original: Baja
Estado: ✅ Cerrado — fix aplicado en el frontend. El servicio backend original fue eliminado en ADR-005.

---

## Área: Infraestructura transversal

**[TC-16] — EventBus: emisión y suscripción de eventos de dominio**
Dado: el módulo `eventBus` está cargado
Cuando: se llama a `emit(Events.MEASUREMENT_SAVED, detalle)`
Entonces: el handler registrado con `on()` recibe el `CustomEvent` con el detalle correcto
Cuando: se llama a la función de cleanup devuelta por `on()`
Entonces: el handler ya no recibe eventos subsiguientes
Tipo: Unitario (jsdom)
Prioridad: Media
Estado: ✅ Cubierto — `apps/frontend/tests/shared/eventBus.test.js`

---

**[TC-17] — Router hash-based: navegación y fallback**
Dado: el router está creado con un mapa de rutas y un contenedor
Cuando: se llama a `navigate('#/')` o a `navigate('#/ruta-inexistente')`
Entonces: se monta la vista correcta (o el fallback `'/'`) y se desmonta la anterior
Cuando: se llama a `start()` y se dispara `hashchange`
Entonces: el router navega a la nueva ruta automáticamente
Tipo: Unitario (jsdom)
Prioridad: Media
Estado: ✅ Cubierto — `apps/frontend/tests/router.test.js`
