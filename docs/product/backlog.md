# Backlog — Tensia · Pendiente

_Última revisión: 2026-02-23. Stack definitivo: Svelte 5 + Vite + Vitest (BK-24–BK-28 completados y en [backlog-done.md](backlog-done.md)). Próximos sprints: E-01 Login Google → E-02 OCR/AI → E-03 Persistencia Google._

> Los ítems ya implementados están en [backlog-done.md](backlog-done.md).

---

## Épica E-01: Login con Google

**Objetivo:** El usuario puede autenticarse con su cuenta de Google. Alcance inicial: obtener su identidad (nombre y foto de perfil) y mostrarlo en la UI. La persistencia multi-dispositivo se aborda en la Épica E-03.

**Scopes Google requeridos (inicial):** `openid`, `profile`
**Scopes adicionales (E-03):** se añadirán cuando se cierre el assessment de persistencia.

> ⚠️ **Dependencia técnica:** requiere BK-26 ✅ y BK-27 ✅ completados (router Svelte).
> El usuario anónimo seguirá usando `localStorageAdapter`; no hay cambio de adaptador en esta épica.

---

**BK-29 — Flujo OAuth 2.0 PKCE + lectura de perfil de usuario**
Descripción: Implementar el flujo de autorización OAuth 2.0 con PKCE en el cliente: generación de `code_verifier`/`code_challenge`, redirección a Google (scopes `openid profile`), recepción del código de autorización en la URL de callback, intercambio por token (vía proxy backend BK-30) y almacenamiento del token en `sessionStorage`. Mostrar nombre y foto del usuario autenticado en la cabecera. El usuario anónimo sigue accediendo a `#/` sin login y con `localStorageAdapter`.
Prioridad: Media
Estimación: 3-4 jornadas
Dependencias: BK-27 ✅
Estado: Pendiente
Tipo: Feature
Referencia: US-15 (pendiente de redactar)

Criterios de aceptación:
- [ ] El usuario puede hacer login con Google desde la app.
- [ ] El `code_verifier` nunca sale del cliente.
- [ ] El `client_secret` nunca llega al cliente (reside en el proxy backend).
- [ ] El token se almacena en `sessionStorage` (no `localStorage`) para limitar la superficie de exposición.
- [ ] El usuario autenticado ve su **nombre** (y foto si está disponible) en la cabecera de la UI.
- [ ] La ruta `#/` es accesible sin login (usuario anónimo).
- [ ] Al cerrar sesión, la sesión se borra de `sessionStorage` y la UI vuelve al estado anónimo.
- [ ] El adaptador de persistencia **no cambia** en esta épica: sigue siendo `localStorageAdapter` también para el usuario autenticado (el cambio se realiza en E-03).

---

**BK-30 — Backend: endpoint proxy OAuth (`POST /auth/token`)**
Descripción: Añadir endpoint `POST /auth/token` al backend Express que recibe `{ code, code_verifier, redirect_uri }` del cliente, intercambia con Google usando `client_secret` (variable de entorno) y devuelve `{ access_token, refresh_token, expires_in }`. El endpoint no almacena tokens.
Prioridad: Media
Estimación: 1-2 jornadas
Dependencias: BK-29
Estado: Pendiente
Tipo: Feature (backend)

Criterios de aceptación:
- [ ] `client_secret` solo existe en variables de entorno del servidor; no aparece en el bundle.
- [ ] El endpoint acepta `{ code, code_verifier, redirect_uri }` y devuelve `{ access_token, refresh_token, expires_in }`.
- [ ] Tests unitarios del endpoint en verde.
- [ ] El endpoint no almacena tokens.

---

## Épica E-02: Registro por foto (OCR / AI)

**Objetivo:** El usuario puede fotografiar su tensiómetro y la app extrae y prerrellena los valores automáticamente, mostrándolos para corrección antes de guardar.

> ⚠️ **Dependencia técnica:** requiere BK-26 ✅ completado (cero `innerHTML` con datos externos; el texto extraído por OCR es un dato externo no confiable).
> Esta épica es **independiente** de E-01 y puede desarrollarse en paralelo o en sprint separado.

---

**BK-32 — UI: componente de captura de imagen**
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

**BK-33 — Backend: endpoint OCR + integración AI (`POST /ocr`)**
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

**BK-34 — Integración OCR en el formulario de registro**
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

---

## Épica E-03: Persistencia con cuenta Google

**Objetivo:** El usuario autenticado puede persistir sus mediciones en la nube usando su cuenta de Google, con acceso multi-dispositivo y migración automática desde `localStorage` al hacer login por primera vez.

**Estado:** ⏸ Pendiente de assessment (BK-35). No iniciar BK-31 hasta tener BK-35 cerrado.

> ⚠️ **Dependencias:** requiere E-01 completada (token de acceso disponible en sesión) y BK-35 completado (alternativa de persistencia elegida).
> Los scopes adicionales de Google (p. ej. `https://www.googleapis.com/auth/drive.appdata`) se añadirán a BK-29 una vez cerrado el assessment.

---

**BK-35 — Assessment: alternativas de persistencia con cuenta Google**
Descripción: Evaluar y documentar las alternativas de persistencia en la nube para usuario autenticado. Candidatas principales: (a) Google Drive API `appdata` folder (client-side, sin backend de datos); (b) Google Drive API con proxy backend; (c) backend propio con base de datos, autenticado por Google OAuth. Criterios de evaluación: complejidad de implementación, privacidad del usuario, coste operativo, offline-first, independencia de plataforma. Resultado: documento de recomendación en `docs/architecture/decisions.md` (nuevo ADR).
Prioridad: Media
Estimación: 1 jornada
Dependencias: E-01 completada
Estado: Pendiente
Tipo: Investigación / ADR

Criterios de aceptación:
- [ ] Documento con comparativa de al menos 2 alternativas (pros/contras/complejidad/coste).
- [ ] Alternativa recomendada claramente justificada.
- [ ] Scopes adicionales de Google necesarios identificados.
- [ ] ADR creado en `docs/architecture/decisions.md`.

---

**BK-31 — Implementar adaptador de persistencia elegido + migración de datos**
Descripción: Implementar el adaptador de persistencia elegido en BK-35 (p. ej. `googleDriveAdapter`) con el mismo contrato `getAll()` / `save()` que `localStorageAdapter`. Implementar `sessionStore` en Svelte para distribuir el estado de login. Lógica de selección de adaptador: usuario anónimo → `localStorageAdapter`; usuario autenticado → adaptador elegido. Flujo de migración al hacer login por primera vez: si hay mediciones en `localStorage`, proponer importarlas al nuevo almacén.
Prioridad: Media
Estimación: 2-3 jornadas
Dependencias: BK-29, BK-30, BK-35
Estado: Pendiente
Tipo: Feature

Criterios de aceptación:
- [ ] El adaptador implementado cumple el contrato `getAll()` / `save()`.
- [ ] `measurementService` recibe el adaptador correcto según el estado de sesión (inyección de dependencias).
- [ ] Al hacer login con mediciones existentes en `localStorage`, se propone importarlas al nuevo almacén.
- [ ] Al cerrar sesión, los datos del almacén en la nube no quedan accesibles sin autenticación.
- [ ] El cambio de adaptador no requiere recargar la página.
- [ ] Tests unitarios del nuevo adaptador en verde.

---

## Post-MVP (no iniciar sin confirmación)

**BK-17 — Recordatorios / notificaciones**
Descripción: Alertar al usuario para tomar la tensión periódicamente (p. ej. Web Push Notifications o recordatorio en pantalla).
Prioridad: Baja
Estado: Pendiente
