# Épica E-01 — Login con Google

**Estado:** Pendiente
**Sprint estimado:** Próximo sprint

**Objetivo:** El usuario puede autenticarse con su cuenta de Google. Alcance inicial: obtener su identidad (nombre y foto de perfil) y mostrarlo en la UI. La persistencia multi-dispositivo se aborda en la Épica E-03.

**Scopes Google requeridos (inicial):** `openid`, `profile`
**Scopes adicionales (E-03):** se añadirán cuando se cierre el assessment de persistencia.

> ⚠️ **Dependencia técnica:** requiere BK-26 ✅ y BK-27 ✅ completados (router Svelte).
> El usuario anónimo seguirá usando `localStorageAdapter`; no hay cambio de adaptador en esta épica.

---

## BK-29 — Flujo OAuth 2.0 PKCE + lectura de perfil de usuario

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

## BK-30 — Backend: endpoint proxy OAuth (`POST /auth/token`)

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
