# Épica E-02 — Registro por foto (OCR / AI)

**Estado:** Pendiente (Post-MVP confirmado)
**Sprint estimado:** Posterior a E-01 o en paralelo

**Objetivo:** El usuario puede fotografiar su tensiómetro y la app extrae y prerrellena los valores automáticamente, mostrándolos para corrección antes de guardar.

> ⚠️ **Dependencia técnica:** requiere BK-26 ✅ completado (cero `innerHTML` con datos externos; el texto extraído por OCR es un dato externo no confiable).
> Esta épica es **independiente** de E-01 y puede desarrollarse en paralelo o en sprint separado.

---

## BK-32 — UI: componente de captura de imagen

Descripción: Nuevo componente `ImageCapture.svelte` que permite seleccionar una foto desde la galería o capturar con la cámara (`<input type="file" accept="image/*" capture>`). Gestiona los estados del flujo: `idle` → `capturada` → `enviando` → `procesando` → `confirmando` → `error`.
Prioridad: Alta (cuando se abra el sprint)
Estimación: 2-3 jornadas
Dependencias: BK-26 ✅
Estado: Pendiente
Tipo: Feature
Referencia: US-02

Criterios de aceptación:
- [ ] El usuario puede seleccionar una imagen desde su dispositivo.
- [ ] En móvil, el input abre la cámara directamente.
- [ ] Los estados del flujo se muestran en la UI con mensajes claros.
- [ ] Ningún dato de la imagen se muestra con `innerHTML`.

---

## BK-33 — Backend: endpoint OCR + integración AI (`POST /ocr`)

Descripción: Añadir endpoint `POST /ocr` al backend Express que recibe la imagen (multipart/form-data), la envía al servicio de AI elegido y devuelve `{ systolic, diastolic, pulse }`. La API key del servicio de AI se gestiona como variable de entorno.
Prioridad: Alta (cuando se abra el sprint)
Estimación: 3-4 jornadas
Dependencias: BK-32
Estado: Pendiente
Tipo: Feature (backend)
Referencia: US-02

Criterios de aceptación:
- [ ] El endpoint acepta `multipart/form-data` con el campo `image`.
- [ ] Devuelve `{ systolic, diastolic, pulse }` o un error descriptivo si no se reconocen valores.
- [ ] Los valores devueltos son números enteros positivos validados antes de devolverse.
- [ ] La API key del servicio de AI se gestiona como variable de entorno del servidor.
- [ ] Tests unitarios del endpoint con imagen de prueba.

---

## BK-34 — Integración OCR en el formulario de registro

Descripción: Integrar `ImageCapture.svelte` en el flujo de `MeasurementForm.svelte`: tras el reconocimiento, los valores se prerrellanan en los campos y el usuario puede corregirlos antes de guardar. Si el OCR falla, el formulario queda vacío con mensaje de error. El guardado usa el mismo flujo de validación del registro manual.
Prioridad: Alta (cuando se abra el sprint)
Estimación: 2 jornadas
Dependencias: BK-32, BK-33
Estado: Pendiente
Tipo: Feature
Referencia: US-02

Criterios de aceptación:
- [ ] Los valores extraídos por OCR aparecen en los campos del formulario.
- [ ] El usuario puede corregir cualquier valor antes de guardar.
- [ ] Si el OCR falla, el formulario queda vacío y se muestra un mensaje de error.
- [ ] El guardado final usa el mismo flujo de validación que el registro manual.
