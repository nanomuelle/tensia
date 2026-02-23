# Criterios de aceptación — Tensia

_Última revisión: 2026-02-23 — CA-10 y CA-11 marcados como implementados y testados. Añadidos CA-12 (Login Google) y CA-13 (Persistencia nube) como post-MVP._

Cada criterio es verificable de forma objetiva. Un criterio no está "aceptado" hasta que existe un test que lo valida o se ha verificado manualmente con pasos documentados.

---

## Resumen de estado

| CA | Descripción | Implementado | Test automatizado |
|---|---|---|---|
| CA-01 | Registro manual desde UI | ✅ | E2E ✅ (TC-09) |
| CA-02 | Registro por foto (OCR) | ⏸ Post-MVP (E-02) | ⏸ |
| CA-03 | Persistencia tras refrescar | ✅ | E2E ✅ (TC-09) |
| CA-04 | Listado de mediciones | ✅ | E2E ✅ (TC-10) |
| CA-05 | Sin errores críticos en flujo principal | ✅ | E2E ✅ (TC-11) |
| CA-06 | Validaciones del formulario manual | ✅ | Componente ✅ (TC-07, TC-08) |
| CA-07 | Rangos clínicos en validaciones | ✅ | Unitario ✅ (TC-12) |
| CA-08 | Gráfica de evolución temporal | ✅ | Unitario ✅ (`chart.test.js`) |
| CA-09 | Skeleton cuando no hay datos suficientes | ✅ | E2E ✅ (TC-13) |
| CA-10 | Modal del formulario de registro (US-13) | ✅ | Componente + E2E ✅ |
| CA-11 | Layout gráfica + historial en columnas (US-14) | ✅ | Componente + E2E ✅ (TC-15) |
| CA-12 | Login con Google (US-15) | ⏸ Post-MVP (E-01) | ⏸ |
| CA-13 | Persistencia con cuenta Google (US-16) | ⏸ Post-MVP (E-03) | ⏸ |

---

## CA-01 — Registro de medición manual desde la UI

**Verificable cuando:**
1. El usuario abre la app en el navegador.
2. Pulsa "Nueva medición".
3. Rellena sistólica, diastólica y fecha (pulso opcional).
4. Pulsa "Guardar medición".
5. La medición aparece al inicio del historial en la misma sesión sin recargar.
6. Al recargar la página la medición sigue visible.

**Estado:** ✅ Implementado — ✅ Test E2E automatizado (TC-09, `registro-manual.spec.js`)

---

## CA-02 — Registro de medición por foto (OCR)

**Verificable cuando:**
1. El usuario puede subir una foto de un tensiómetro.
2. La app extrae los valores y los muestra editables.
3. El usuario puede corregirlos y guardar.
4. La medición aparece en el historial con `source: "photo"`.

**Estado:** ⏸ Post-MVP — Épica E-02 (BK-32, BK-33, BK-34)

---

## CA-03 — Persistencia tras refrescar el navegador

**Verificable cuando:**
1. Se crea al menos una medición.
2. El usuario recarga la página (F5 / Ctrl+R).
3. La medición sigue apareciendo en el historial.

**Estado:** ✅ Implementado (persistencia en `localStorage`, ADR-005) — ✅ Test E2E automatizado (TC-09, `registro-manual.spec.js`)

---

## CA-04 — Listado de mediciones se muestra correctamente

**Verificable cuando:**
1. Existen mediciones guardadas en `localStorage`.
2. Al cargar la app, el historial muestra todas las mediciones.
3. El orden es descendente por fecha (la más reciente primero).
4. Se muestran: fecha formateada, sistólica/diastólica en mmHg, pulso si existe.
5. Si no hay mediciones, se muestra el mensaje "Sin mediciones todavía".

**Estado:** ✅ Implementado — ✅ Test E2E automatizado (TC-10, `estado-vacio.spec.js`)

---

## CA-05 — Sin errores críticos no controlados en el flujo principal

**Verificable cuando:**
1. El usuario realiza el flujo completo (abrir app → nueva medición → guardar → ver historial) sin errores en consola.
2. Si el almacenamiento local (`localStorage`) no está disponible, la app muestra un banner de error y no se rompe.
3. Si el usuario envía datos inválidos, aparecen mensajes de error y la app no se queda bloqueada.

**Estado:** ✅ Implementado — ✅ Test E2E automatizado (TC-11, `error-backend.spec.js`)

---

## CA-06 — Validaciones del formulario manual

**Verificable cuando:**
1. Al enviar con sistólica vacía → error inline en ese campo; no se guarda la medición.
2. Al enviar con sistólica ≤ diastólica → error inline; no se guarda la medición.
3. Al enviar con pulso decimal (ej. 72.5) → error inline; no se guarda la medición.
4. Al corregir un campo con error y empezar a escribir → el error desaparece inmediatamente.

**Estado:** ✅ Implementado — ✅ Test de componente automatizado (TC-07, TC-08 en `MeasurementForm.test.js`)

---

## CA-07 — Rangos clínicamente plausibles (OMS / NHS)

Los umbrales se basan en las guías de la **OMS** (*Hypertension Fact Sheet*, sept. 2025) y el **NHS** (*Blood pressure test*, nov. 2025).

**Verificable cuando:**
1. Al enviar `systolic` < 50 mmHg → error inline "La sistólica debe estar entre 50 y 300 mmHg."; no se guarda.
2. Al enviar `systolic` > 300 mmHg → mismo error.
3. Al enviar `diastolic` < 30 mmHg → error inline "La diastólica debe estar entre 30 y 200 mmHg."; no se guarda.
4. Al enviar `diastolic` > 200 mmHg → mismo error.
5. Al enviar `pulse` < 20 bpm → error inline "El pulso debe estar entre 20 y 300 bpm."; no se guarda.
6. Al enviar `pulse` > 300 bpm → mismo error.

**Rangos de referencia:**
| Campo | Mín. | Máx. | Unidad |
|---|---|---|---|
| sistólica | 50 | 300 | mmHg |
| diastólica | 30 | 200 | mmHg |
| pulso | 20 | 300 | bpm |

**Estado:** ✅ Implementado (`domain/measurement.js` + `validators.js`) — ✅ Unitario automatizado (TC-12)

---

## CA-08 — Gráfica de evolución temporal

**Verificable cuando:**
1. Existen 2 o más mediciones guardadas en `localStorage`.
2. Al cargar la app, se renderiza una gráfica SVG de líneas con la serie sistólica (rojo) y diastólica (azul).
3. Las mediciones están representadas en orden cronológico ascendente (izquierda = más antigua).
4. La gráfica incluye leyenda, ejes con etiquetas legibles y máximo 10 fechas en el eje X.
5. El SVG tiene `role="img"` y `aria-label` descriptivo.

**Estado:** ✅ Implementado (D3.js modular, ADR-006) — ✅ Unitario automatizado (23 tests, `chart.test.js`)

---

## CA-09 — Skeleton cuando no hay datos suficientes (US-11)

**Verificable cuando:**
1. `localStorage` contiene 0 o 1 medición.
2. Al cargar la app, la sección de gráfica es visible y contiene `.chart-skeleton`.
3. El skeleton muestra el texto "Sin datos suficientes para mostrar la gráfica".
4. No se renderiza ningún SVG.
5. En primera visita (clave ausente en localStorage) se muestra el mismo skeleton.
6. Al guardar la segunda medición desde el formulario, el skeleton desaparece y la gráfica SVG aparece sin recargar.

**Estado:** ✅ Implementado (`renderSkeleton()` en `chart.js`) — ✅ E2E automatizado (TC-13, 15 tests, `skeleton-grafica.spec.js`)

---

## CA-10 — Modal del formulario de registro (US-13)

**Verificable cuando:**
1. Al pulsar "Nueva medición", el formulario se abre en una modal con overlay semitransparente; el contenido de fondo queda bloqueado.
2. El foco se mueve automáticamente al primer campo del formulario al abrir la modal.
3. Al pulsar el botón ✕ o el área de overlay, la modal se cierra sin guardar datos.
4. Al pulsar `Escape`, la modal se cierra sin guardar datos.
5. Al guardar correctamente, la modal se cierra, la medición aparece al inicio del historial y se muestra un toast de confirmación.
6. El foco vuelve al botón "Nueva medición" al cerrar la modal.
7. La modal es accesible: `role="dialog"`, `aria-modal="true"`, focus trap activo mientras está abierta.
8. En pantallas < 640 px la modal aparece como bottom-sheet anclada a la parte inferior.

**Estado:** ✅ Implementado (`Modal.svelte` + `RegistroMedicionModal.svelte`) — ✅ Tests de componente automatizados (`Modal.test.js`, 21 tests)

---

## CA-11 — Layout gráfica + historial en columnas (US-14)

**Verificable cuando:**
1. Con viewport ≥ 768 px y ≥ 1 medición: la gráfica ocupa la columna izquierda (55 %) y el historial la columna derecha (45 %), visibles simultáneamente.
2. Con viewport ≥ 768 px y 0 mediciones: se usa columna única (sin layout de columnas).
3. Con viewport < 768 px (móvil): siempre columna única, independientemente del número de mediciones.
4. El historial es scrollable de forma independiente; la gráfica permanece sticky al hacer scroll en el historial.
5. Al añadir una nueva medición, el layout se actualiza sin recargar la página.
6. Al eliminar todas las mediciones, el layout de columnas se deshace sin recargar.

**Estado:** ✅ Implementado (`HomeLayout.css` + `HomeView.svelte`) — ✅ Tests de componente (`HomeView.test.js`, 10 tests) + E2E (TC-15, `layout-columnas.spec.js`, 6 tests)

---

## Post-MVP

### CA-12 — Login con Google (US-15, Épica E-01)

**Verificable cuando:**
1. El usuario puede usar la app completamente sin login (modo anónimo).
2. Al pulsar "Iniciar sesión con Google", se inicia el flujo OAuth 2.0 PKCE y el navegador redirige a Google.
3. Tras completar el consentimiento, la cabecera muestra el nombre (y foto si disponible) del usuario.
4. Al pulsar "Cerrar sesión", la UI vuelve al estado anónimo y `sessionStorage` queda limpio.
5. El `client_secret` nunca está en el bundle del cliente.
6. El adaptador de persistencia no cambia en esta fase: sigue siendo `localStorage`.

**Estado:** ⏸ Post-MVP — Épica E-01 (BK-29, BK-30)

---

### CA-13 — Persistencia con cuenta Google (US-16, Épica E-03)

**Verificable cuando:**
1. El usuario autenticado registra una medición y esta se guarda en el almacén vinculado a su cuenta de Google.
2. Al acceder desde un segundo dispositivo con la misma cuenta, las mismas mediciones son visibles.
3. Al hacer login con mediciones existentes en `localStorage`, la app propone importarlas al nuevo almacén.
4. Al cerrar sesión, los datos del almacén en la nube no son accesibles sin autenticación.
5. El mecanismo concreto (Google Drive API `appdata` u otro) se determinará en el assessment BK-35.

**Estado:** ⏸ Post-MVP — Épica E-03 (pendiente assessment BK-35; implementación BK-31)

