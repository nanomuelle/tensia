# User Stories — Tensia

_Última revisión: 2026-02-23 — backlog consolidado en épicas E-01/E-02/E-03; añadidas US-15 (Login Google) y US-16 (Persistencia en la nube)_

---

## US-01 — Registro manual de medición

**Estado:** ✅ Implementado y testado

Como usuario,
quiero registrar mi tensión arterial manualmente introduciendo los valores en un formulario,
para llevar un control personal de mis mediciones sin depender de ningún dispositivo adicional.

### Criterios de aceptación

- Dado el formulario abierto, cuando el usuario introduce sistólica, diastólica y fecha válidas y pulsa "Guardar", entonces la medición aparece al inicio del historial sin recargar la página.
- Dado el formulario abierto, cuando el usuario no rellena la sistólica, entonces aparece un error inline en ese campo y la medición no se guarda.
- Dado el formulario abierto, cuando la sistólica es menor o igual que la diastólica, entonces aparece un error inline y la medición no se guarda.
- Dado que se ha guardado una medición, cuando el usuario recarga la página, entonces la medición sigue visible.
- El campo pulso es opcional; si se rellena, debe ser un entero positivo.

---

## US-02 — Registro de medición por foto (OCR)

**Estado:** ⏸ Post-MVP — Épica E-02 (BK-32, BK-33, BK-34)

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
- Dado que `localStorage` no está disponible (almacenamiento bloqueado), cuando la app intenta cargar el historial, entonces se muestra un banner de error con la opción de reintentar.

---

## US-04 — Gráfica de evolución de tensión arterial

**Estado:** ✅ Implementado y testado

Como usuario,
quiero ver una gráfica con la evolución de mi tensión arterial a lo largo del tiempo,
para identificar tendencias y detectar si mis valores mejoran o empeoran.

### Criterios de aceptación

- Dado que existen 2 o más mediciones, cuando la app carga el historial, entonces se muestra una gráfica de líneas con la serie de sistólica (rojo) y diastólica (azul).
- Dado que solo hay 1 medición o ninguna, cuando la app carga, entonces se muestra un skeleton con el texto "Sin datos suficientes para mostrar la gráfica" en lugar de la gráfica real.
- Las mediciones se representan en orden cronológico ascendente (izquierda = más antigua).
- Cada punto de la gráfica corresponde a una medición; el eje Y muestra valores en mmHg.
- La gráfica incluye una leyenda que identifica sistólica y diastólica.
- La gráfica es legible en pantallas de alta densidad (retina).
- Dado que el número de mediciones es elevado, cuando se renderizan las etiquetas del eje X, entonces se muestran como máximo 10 fechas para evitar solapamiento.

---

## US-11 — Mostrar skeleton vacío cuando no hay datos suficientes

**Estado:** ✅ Implementado y testado

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

---

## US-13 — Formulario de registro en modal

**Estado:** ✅ Implementado y testado

Como usuario,
quiero que el formulario de nueva medición se abra en una ventana modal sobre el resto de la app,
para no perder el contexto del historial y la gráfica mientras registro una medición.

### Criterios de aceptación

- Dado que el usuario pulsa "Nueva medición", cuando se abre la modal, entonces el fondo (historial + gráfica) queda bloqueado bajo un overlay semitransparente y el foco se mueve al primer campo del formulario.
- Dado que la modal está abierta, cuando el usuario pulsa el botón "Cerrar" (✕) o el área de overlay, entonces la modal se cierra sin guardar datos y el historial queda de nuevo activo.
- Dado que la modal está abierta, cuando el usuario pulsa la tecla `Escape`, entonces la modal se cierra sin guardar datos.
- Dado que el usuario guarda una medición correctamente, cuando la operación tiene éxito, entonces la modal se cierra, el historial se actualiza con la nueva medición al inicio y se muestra un toast de confirmación.
- La modal no provoca navegación a otra URL; permanece en `#/`.
- La modal es accesible: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` apuntando al título del formulario y gestión del foco atrapado (focus trap) mientras está abierta.
- El overlay de fondo impide interacción con el resto del DOM mientras la modal está visible.
- En pantallas pequeñas (< 640 px) la modal ocupa el 100 % del ancho y aparece anclada a la parte inferior (bottom sheet) o en pantalla completa.

---

## US-14 — Layout gráfica + historial en columnas

**Estado:** ✅ Implementado y testado

Como usuario con pantalla ancha,
quiero ver la gráfica de evolución al lado del historial de mediciones,
para comparar visualmente la tendencia con los valores concretos sin tener que hacer scroll entre ambas secciones.

### Criterios de aceptación

- Dado que el viewport tiene ≥ 768 px de ancho, cuando se carga el historial con 2 o más mediciones, entonces la gráfica ocupa una columna a la izquierda y el historial de tarjetas ocupa la columna a la derecha, ambas visibles simultáneamente.
- Dado que el viewport tiene < 768 px de ancho (móvil), cuando se carga el historial, entonces la gráfica se muestra encima del historial (layout en columna única), manteniendo el comportamiento actual del MVP.
- Dado que el viewport tiene < 768 px y no hay datos suficientes para la gráfica (< 2 mediciones), el skeleton ocupa el ancho completo encima de la lista sin cambios.
- El historial es scrollable de forma independiente en el layout de dos columnas (la gráfica permanece fija/sticky en su columna mientras el usuario hace scroll en el historial).
- La gráfica mantiene su comportamiento responsivo interno (`ResizeObserver`) al cambiar el tamaño de su columna.
- Dado que se añade una nueva medición, la gráfica y el historial se actualizan sin recargar la página, conservando el layout de columnas.

---

## US-15 — Login con Google

**Estado:** ⏸ Post-MVP — Épica E-01 (BK-29, BK-30)

Como usuario,
quiero poder iniciar sesión con mi cuenta de Google,
para que la app conozca mi identidad y pueda ofrecerme funcionalidades vinculadas a mi cuenta (como la sincronización de datos entre dispositivos).

### Criterios de aceptación

- Dado que el usuario no ha iniciado sesión, cuando accede a la app, entonces puede usarla de forma completamente anónima sin ninguna restricción.
- Dado un botón "Iniciar sesión con Google", cuando el usuario lo pulsa, entonces se inicia el flujo OAuth 2.0 PKCE y se le redirige a la pantalla de consentimiento de Google (scopes: `openid`, `profile`).
- Dado que el usuario completa el consentimiento, cuando regresa a la app, entonces la cabecera muestra su **nombre** de Google (y foto de perfil si está disponible).
- Dado que el usuario está autenticado, cuando pulsa "Cerrar sesión", entonces la sesión se elimina de `sessionStorage` y la UI vuelve al estado anónimo.
- El token de acceso se almacena en `sessionStorage`, no en `localStorage`.
- El `client_secret` de la aplicación nunca llega al cliente; el intercambio de código por token se realiza a través del proxy backend (`POST /auth/token`).
- En esta fase el adaptador de persistencia **no cambia**: el usuario autenticado sigue usando `localStorageAdapter`. El cambio de adaptador se aborda en US-16.

---

## US-16 — Persistencia de datos con cuenta Google

**Estado:** ⏸ Post-MVP — Épica E-03 (pendiente de assessment BK-35; implementación en BK-31)

Como usuario autenticado con Google,
quiero que mis mediciones se guarden en un almacén vinculado a mi cuenta,
para acceder a mi historial desde cualquier dispositivo y no depender exclusivamente del almacenamiento local del navegador.

### Criterios de aceptación

- Dado que el usuario inicia sesión con Google y ya tiene mediciones en `localStorage`, cuando completa el login, entonces la app propone importarlas al nuevo almacén en la nube.
- Dado que el usuario está autenticado, cuando registra una nueva medición, entonces se guarda automáticamente en el almacén en la nube sin acción adicional.
- Dado que el usuario accede desde un segundo dispositivo con la misma cuenta de Google, cuando carga la app, entonces ve las mismas mediciones que registró en el primer dispositivo.
- Dado que el usuario cierra sesión, cuando recarga la app, entonces los datos de la nube no son accesibles sin autenticación.
- El mecanismo de almacenamiento concreto (p. ej. Google Drive API `appdata`, backend propio) se determinará en el assessment BK-35; este criterio es independiente de la implementación elegida.
