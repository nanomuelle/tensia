# User Stories — Tensia MVP

_Última revisión: 2026-02-18_

---

## US-01 — Registro manual de medición

**Estado:** ✅ Implementado y testado

Como usuario,
quiero registrar mi tensión arterial manualmente introduciendo los valores en un formulario,
para llevar un control personal de mis mediciones sin depender de ningún dispositivo adicional.

### Criterios de aceptación

- Dado el formulario abierto, cuando el usuario introduce sistólica, diastólica y fecha válidas y pulsa "Guardar", entonces la medición aparece al inicio del historial sin recargar la página.
- Dado el formulario abierto, cuando el usuario no rellena la sistólica, entonces aparece un error inline en ese campo y no se llama al backend.
- Dado el formulario abierto, cuando la sistólica es menor o igual que la diastólica, entonces aparece un error inline y no se llama al backend.
- Dado que se ha guardado una medición, cuando el usuario recarga la página, entonces la medición sigue visible.
- El campo pulso es opcional; si se rellena, debe ser un entero positivo.

---

## US-02 — Registro de medición por foto (OCR)

**Estado:** ⏸ Post-MVP — no iniciar sin confirmación

Como usuario,
quiero subir una foto de mi tensiómetro,
para que la app extraiga los valores automáticamente y no tenga que introducirlos a mano.

### Criterios de aceptación

- Dado un botón "Subir foto", cuando el usuario selecciona una imagen de un tensiómetro, entonces la app extrae sistólica, diastólica y pulso y los muestra en campos editables.
- Dado los valores extraídos, cuando el usuario los corrige y pulsa "Guardar", entonces la medición se registra con `source: "photo"`.
- Dado una imagen ilegible, cuando el OCR no puede extraer valores, entonces se muestra un mensaje de error y el usuario puede introducir los datos manualmente.

---

## US-03 — Consulta del historial de mediciones

**Estado:** ✅ Implementado y testado

Como usuario,
quiero ver el listado completo de mis mediciones ordenado de más reciente a más antiguo,
para revisar mi evolución y detectar tendencias sin necesidad de herramientas externas.

### Criterios de aceptación

- Dado que existen mediciones guardadas, cuando la app carga, entonces el historial muestra todas las mediciones con fecha formateada, sistólica/diastólica en mmHg y pulso (si existe).
- Las mediciones están ordenadas por fecha descendente (la más reciente primero).
- Dado que no hay mediciones, cuando la app carga, entonces se muestra el mensaje "Sin mediciones todavía" y el botón "Nueva medición".
- Dado que el backend no está disponible, cuando la app intenta cargar el historial, entonces se muestra un banner de error con la opción de reintentar.
