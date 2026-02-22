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

## US-04 — Gráfica de evolución de tensión arterial

**Estado:** ✅ Implementado (pendiente tests)

Como usuario,
quiero ver una gráfica con la evolución de mi tensión arterial a lo largo del tiempo,
para identificar tendencias y detectar si mis valores mejoran o empeoran.

### Criterios de aceptación

- Dado que existen 2 o más mediciones, cuando la app carga el historial, entonces se muestra una gráfica de líneas con la serie de sistólica (rojo) y diastólica (azul).
- Dado que solo hay 1 medición o ninguna, cuando la app carga, entonces la gráfica no se muestra (no hay suficientes puntos para trazar una línea).
- Las mediciones se representan en orden cronológico ascendente (izquierda = más antigua).
- Cada punto de la gráfica corresponde a una medición; el eje Y muestra valores en mmHg.
- La gráfica incluye una leyenda que identifica sistólica y diastólica.
- La gráfica es legible en pantallas de alta densidad (retina).
- Dado que el número de mediciones es elevado, cuando se renderizan las etiquetas del eje X, entonces se muestran como máximo 10 fechas para evitar solapamiento.

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
