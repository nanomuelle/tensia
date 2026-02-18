# Criterios de aceptación — MVP Tensia

Cada criterio es verificable de forma objetiva. Un criterio no está "aceptado" hasta que existe un test que lo valida o se ha verificado manualmente con pasos documentados.

---

## CA-01 — Registro de medición manual desde la UI

**Verificable cuando:**
1. El usuario abre la app en el navegador.
2. Pulsa "Nueva medición".
3. Rellena sistólica, diastólica y fecha (pulso opcional).
4. Pulsa "Guardar medición".
5. La medición aparece al inicio del historial en la misma sesión sin recargar.
6. Al recargar la página la medición sigue visible.

**Estado:** ✅ Implementado — ❌ Sin test E2E automatizado

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

**Estado:** ✅ Implementado (persistencia en JSON en disco) — ❌ Sin test E2E automatizado

---

## CA-04 — Listado de mediciones se muestra correctamente

**Verificable cuando:**
1. Existen mediciones en el backend.
2. Al cargar la app, el historial muestra todas las mediciones.
3. El orden es descendente por fecha (la más reciente primero).
4. Se muestran: fecha formateada, sistólica/diastólica en mmHg, pulso si existe.
5. Si no hay mediciones, se muestra el mensaje "Sin mediciones todavía".

**Estado:** ✅ Implementado — ❌ Sin test de componente automatizado

---

## CA-05 — No hay errores críticos no controlados en el flujo principal

**Verificable cuando:**
1. El usuario realiza el flujo completo (abrir app → nueva medición → guardar → ver historial) sin consola de errores en rojo.
2. Si el backend no está disponible, la app muestra un mensaje de error y no se rompe.
3. Si el usuario envía datos inválidos, aparecen mensajes de error y la app no se queda bloqueada.

**Estado:** ✅ Implementado — ❌ Sin test E2E automatizado

---

## CA-06 — Validaciones del formulario manual

**Verificable cuando:**
1. Al enviar con sistólica vacía → error inline en ese campo; no se llama al backend.
2. Al enviar con sistólica ≤ diastólica → error inline; no se llama al backend.
3. Al enviar con pulso decimal (ej. 72.5) → error inline; no se llama al backend.
4. Al corregir un campo con error y empezar a escribir → el error desaparece inmediatamente.

**Estado:** ✅ Implementado — ❌ Sin test de componente automatizado
