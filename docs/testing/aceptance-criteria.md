# Criterios de aceptación — MVP Tensia

_Última revisión: 2026-02-18 — Regresión completa ejecutada_

Cada criterio es verificable de forma objetiva. Un criterio no está "aceptado" hasta que existe un test que lo valida o se ha verificado manualmente con pasos documentados.

**Resumen de estado:**
| CA | Descripción | Implementado | Test automatizado |
|---|---|---|---|
| CA-01 | Registro manual desde UI | ✅ | E2E ✅ (TC-09) |
| CA-02 | Registro por foto (OCR) | ⏸ Post-MVP | ⏸ |
| CA-03 | Persistencia tras refrescar | ✅ | E2E ✅ (TC-09) |
| CA-04 | Listado de mediciones | ✅ | E2E ✅ (TC-10) |
| CA-05 | Sin errores críticos en flujo principal | ✅ | E2E ✅ (TC-11) |
| CA-06 | Validaciones del formulario manual | ✅ | Componente ✅ (TC-07, TC-08) |
| CA-07 | Rangos clínicos en validaciones     | ✅ | ✅ (TC-12)                    |

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

**Estado:** ⏸ Post-MVP — no implementado

---

## CA-03 — Persistencia tras refrescar el navegador

**Verificable cuando:**
1. Se crea al menos una medición.
2. El usuario recarga la página (F5 / Ctrl+R).
3. La medición sigue apareciendo en el historial.

**Estado:** ✅ Implementado (persistencia en JSON en disco) — ✅ Test E2E automatizado (TC-09, `registro-manual.spec.js`)

---

## CA-04 — Listado de mediciones se muestra correctamente

**Verificable cuando:**
1. Existen mediciones en el backend.
2. Al cargar la app, el historial muestra todas las mediciones.
3. El orden es descendente por fecha (la más reciente primero).
4. Se muestran: fecha formateada, sistólica/diastólica en mmHg, pulso si existe.
5. Si no hay mediciones, se muestra el mensaje "Sin mediciones todavía".

**Estado:** ✅ Implementado — ✅ Test E2E automatizado (TC-10, `estado-vacio.spec.js`)

---

## CA-05 — No hay errores críticos no controlados en el flujo principal

**Verificable cuando:**
1. El usuario realiza el flujo completo (abrir app → nueva medición → guardar → ver historial) sin consola de errores en rojo.
2. Si el backend no está disponible, la app muestra un mensaje de error y no se rompe.
3. Si el usuario envía datos inválidos, aparecen mensajes de error y la app no se queda bloqueada.

**Estado:** ✅ Implementado — ✅ Test E2E automatizado (TC-11, `error-backend.spec.js`)

---

## CA-06 — Validaciones del formulario manual

**Verificable cuando:**
1. Al enviar con sistólica vacía → error inline en ese campo; no se llama al backend.
2. Al enviar con sistólica ≤ diastólica → error inline; no se llama al backend.
3. Al enviar con pulso decimal (ej. 72.5) → error inline; no se llama al backend.
4. Al corregir un campo con error y empezar a escribir → el error desaparece inmediatamente.

**Estado:** ✅ Implementado — ✅ Test de componente automatizado (TC-07, TC-08 en `formulario.test.js`)

---

## CA-07 — Rangos clínicamente plausibles (OMS / NHS)

Los umbrales se basan en las guías de la **OMS** (*Hypertension Fact Sheet*, sept. 2025) y el **NHS** (*Blood pressure test*, nov. 2025).

**Verificable cuando:**
1. Al enviar `systolic` < 50 mmHg → error inline "La sistólica debe estar entre 50 y 300 mmHg."; no se llama al backend.
2. Al enviar `systolic` > 300 mmHg → mismo error.
3. Al enviar `diastolic` < 30 mmHg → error inline "La diastólica debe estar entre 30 y 200 mmHg."; no se llama al backend.
4. Al enviar `diastolic` > 200 mmHg → mismo error.
5. Al enviar `pulse` < 20 bpm → error inline "El pulso debe estar entre 20 y 300 bpm."; no se llama al backend.
6. Al enviar `pulse` > 300 bpm → mismo error.
7. El backend devuelve `400 Bad Request` con mensaje descriptivo ante cualquiera de los casos anteriores, incluso si el frontend los deja pasar.

**Rangos de referencia:**
| Campo      | Mín. | Máx. | Unidad |
|------------|------|------|--------|
| sistólica  | 50   | 300  | mmHg   |
| diastólica | 30   | 200  | mmHg   |
| pulso      | 20   | 300  | bpm    |

**Estado:** ✅ Implementado (backend y frontend) — ✅ Unitario automatizado (TC-12, `measurement.test.js` + `validators.test.js`)
