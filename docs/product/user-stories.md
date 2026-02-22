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

---

## US-11 — Mostrar skeleton vacío cuando no hay datos suficientes

**Estado:** Pendiente

Como usuario de la app,
quiero que la vista de la gráfica muestre un skeleton vacío cuando no hay datos suficientes,
para entender que la gráfica está disponible pero aún no tiene datos para renderizarse.

### Criterios de aceptación

- Dado que el almacenamiento contiene menos de 2 mediciones válidas (o el umbral definido), cuando accedo a la pantalla de historial/gráfica, entonces se muestra un skeleton/placeholder de la gráfica en lugar del gráfico real.
- El skeleton debe ocupar el mismo espacio que la gráfica real y mostrar texto/ícono informativo: "Sin datos suficientes para mostrar la gráfica".
- El comportamiento debe aplicarse leyendo los datos desde `localStorage` (clave `bp_measurements`) — no se debe consultar ninguna API HTTP.
- Las pruebas unitarias del componente/función que decide mostrar el skeleton deben cubrir:
	- estado con 0 mediciones,
	- estado con 1 medición,
	- estado con 2 o más mediciones (no mostrar skeleton).
- En Safari/iOS, si el localStorage está ausente o se ha perdido, se muestra el mismo skeleton con una nota opcional sobre la limitación de almacenamiento.

---

## US-12 — Actualizar la gráfica en tiempo real al introducir datos

**Estado:** ✅ Implementado y testado

Como usuario que registra mediciones,
quiero que la gráfica se actualice automáticamente a medida que introduzco nuevas mediciones,
para ver reflejados inmediatamente mis últimos cambios sin tener que recargar la página.

### Criterios de aceptación

- Dado que el usuario añade o edita una medición (formulario manual), cuando la operación es exitosa y se guarda en `localStorage` (clave `bp_measurements`), entonces la gráfica se actualiza automáticamente para incluir el cambio.
- La actualización debe:
	- reflejar las mediciones ordenadas por `measuredAt` descendente,
	- mantener zoom/escala razonable (si aplica) y actualizar ejes/ticks según los nuevos datos,
	- animar la transición o re-renderizar de forma fluida para no desorientar al usuario.
- El servicio/mediate layer que provee los datos a la gráfica debe exponer un mecanismo de notificación/observable (por ejemplo, evento de aplicación, callback o `CustomEvent`) que dispare la re-renderización cuando `localStorage` cambie desde la UI.
- No se deben usar peticiones HTTP para esta sincronización; todo el flujo usa `localStorage` en el cliente.
- Tests de integración/componentes que verifiquen:
	- añadir una medición causa la actualización visible de la gráfica,
	- editar/eliminar medición actualiza la gráfica accordingly,
	- si al añadir mediciones se supera el umbral de datos (de 0/1 a >=2), la vista pasa de skeleton a gráfica real.
- La UX debe ser coherente en PWA offline: la actualización ocurre aun sin conexión porque depende de `localStorage`.
