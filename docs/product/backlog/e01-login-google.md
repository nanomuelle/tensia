# Épica E-01 — Login con Google

**Estado:** Pendiente — _bloqueado por E-04 (arquitectura serverless)_  
**Fecha de refinamiento:** 2026-02-24  
**Sprint estimado:** Sprint post-MVP 2 (tras E-04)

**Objetivo:** El usuario puede autenticarse con su cuenta de Google mediante OAuth 2.0 PKCE + Google Identity Services (GIS). La app muestra su nombre y foto de perfil en la cabecera. El adaptador de persistencia **no cambia** en esta épica: el usuario autenticado sigue usando `localStorageAdapter`. La sincronización multi-dispositivo se aborda en E-03.

**Scopes Google requeridos:** `openid`, `profile`  
**Scopes adicionales (E-03):** `https://www.googleapis.com/auth/drive.appdata` — se añadirán al cierre del assessment BK-35.

> **Dependencias completadas:**
> - ADR-007 ✅ — Migración a Svelte 5 + Vite completada (2026-02-23).
> - BK-26 ✅ y BK-27 ✅ — Router Svelte hash-based operativo.
>
> **Dependencia nueva:**
> - E-04 ✅ (pendiente) — BK-40 implementa `authService.js` con GIS. Este servicio reemplaza el proxy BK-30 y es la base sobre la que se construye BK-36.
>
> **Nota arquitectónica — callback con hash router:**  
> Google redirige al `redirect_uri` con `?code=...&state=...` como _query string_, **no como hash**.  
> Con el router hash-based (`#/`), la URL de retorno será del tipo:  
> `https://app.example.com/auth/callback?code=...&state=...`  
> El `redirect_uri` debe ser una ruta real (sin hash) registrada en Google Cloud Console y resuelta por el backend/Service Worker hacia `index.html`; el cliente lee `?code` y `?state` al montar el componente callback.

---

## BK-29 — `authStore.svelte.js`: estado reactivo de sesión

**Descripción:** Crear `apps/frontend/src/store/authStore.svelte.js` usando Svelte 5 runes (`$state`, `$derived`). Gestiona el estado de sesión: `user` (name, email, picture) y `accessToken`. Al inicializarse, recupera la sesión de `sessionStorage` si existe (para resistir recargas manuales). Expone `login(tokenData, userProfile)`, `logout()` e `isAuthenticated`. Sin dependencias de DOM ni de otros stores.

**Prioridad:** Alta  
**Estimación:** 1 jornada  
**Dependencias:** ADR-007 ✅  
**Estado:** Pendiente  
**Tipo:** Feature (frontend)

**Criterios de aceptación:**
- [ ] `authStore` expone estado reactivo `{ user: null | { name, email, picture }, accessToken: null | string }`.
- [ ] `login(tokenData, userProfile)` actualiza el estado y persiste la sesión en `sessionStorage`.
- [ ] `logout()` limpia el estado y elimina la entrada de `sessionStorage`.
- [ ] Al importarse por primera vez, recupera la sesión de `sessionStorage` si existe.
- [ ] `isAuthenticated` es un `$derived` (`true` cuando `accessToken !== null`).
- [ ] No depende de DOM, de la UI ni del adaptador de persistencia.
- [ ] Tests unitarios del store en verde (`sessionStorage` mockeado).

---

## BK-36 — Flujo OAuth 2.0 PKCE en el cliente

**Descripción:** Implementar el flujo PKCE completo como servicio puro (`apps/frontend/src/services/authService.js`):  
1. Generar `code_verifier` (mínimo 96 bytes, base64url) y `code_challenge` (SHA-256 via Web Crypto API).  
2. Guardar `code_verifier` y `state` aleatorio en `sessionStorage`.  
3. Redirigir a `accounts.google.com/o/oauth2/v2/auth` con los parámetros PKCE y scopes `openid profile`.  
4. En la ruta callback (`/auth/callback`), leer `?code` y `?state`; verificar `state`; llamar al proxy backend (`POST /auth/token`) para intercambiar código por token.  
5. Llamar a `https://www.googleapis.com/oauth2/v3/userinfo` con el `access_token`.  
6. Llamar a `authStore.login(tokenData, userProfile)`.  
Gestionar errores: cancelación por el usuario, `state` inválido, error de red, código expirado.

**Prioridad:** Alta  
**Estimación:** 2-3 jornadas  
**Dependencias:** BK-29, BK-40 (reemplaza BK-30)  
**Estado:** Pendiente  
**Tipo:** Feature (frontend)  
**Referencia:** US-15

**Criterios de aceptación:**
- [ ] `code_verifier` se genera con mínimo 96 bytes aleatorios (Web Crypto `getRandomValues`) y se codifica en base64url.
- [ ] `code_challenge` se calcula como `BASE64URL(SHA256(ASCII(code_verifier)))` usando Web Crypto API.
- [ ] `state` es un valor aleatorio verificado al recibir el callback (previene CSRF).
- [ ] `code_verifier` y `state` se almacenan en `sessionStorage`, no en `localStorage`.
- [ ] El `redirect_uri` usado en la llamada coincide exactamente con el registrado en Google Cloud Console.
- [ ] Tras intercambio exitoso, `authStore.isAuthenticated` es `true` y el perfil está disponible.
- [ ] Si el usuario cancela el consentimiento, la app muestra un toast informativo y queda en estado anónimo funcional.
- [ ] Si `state` no coincide al volver del callback, el flujo se aborta, `sessionStorage` se limpia y se muestra error.
- [ ] Si el proxy devuelve error (p. ej. código expirado), se muestra un toast y el estado queda limpio.
- [ ] La ruta `#/` sigue siendo accesible sin autenticación durante y después del flujo.
- [ ] Tests unitarios del servicio en verde (Web Crypto y `fetch` mockeados).

---

## ~~BK-30 — Backend: endpoint proxy `POST /auth/token`~~ — OBSOLETO

> ⛔ **Obsoleto desde 2026-02-24.** Reemplazado por **BK-40** (épica E-04).
> Con Google Identity Services (GIS) el flujo PKCE es completamente client-side: no se necesita `client_secret` ni proxy de servidor.
> Ver [backlog/e04-arquitectura-serverless.md](e04-arquitectura-serverless.md#bk-40--reemplazar-proxy-oauth-por-google-identity-services-gis-client-side).

---

## BK-37 — Cabecera: botón Login / avatar de perfil de usuario

**Descripción:** Añadir zona de sesión a la cabecera de la app. Estado anónimo: botón "Iniciar sesión con Google". Estado autenticado: foto de perfil del usuario (o inicial del nombre si no hay imagen) con menú desplegable "Cerrar sesión". El componente se suscribe a `authStore` reactivamente. Al hacer logout llama a `authStore.logout()` y redirige a `#/`.

**Prioridad:** Media  
**Estimación:** 1 jornada  
**Dependencias:** BK-29, BK-36  
**Estado:** Pendiente  
**Tipo:** Feature (frontend)  
**Referencia:** US-15

**Criterios de aceptación:**
- [ ] En estado anónimo la cabecera muestra el botón "Iniciar sesión con Google".
- [ ] En estado autenticado la cabecera muestra el nombre del usuario y su foto de perfil (o la inicial si no hay foto).
- [ ] El botón/avatar es accesible: `aria-label` en el botón, `alt` descriptivo en la imagen.
- [ ] Pulsar "Cerrar sesión" limpia la sesión via `authStore.logout()` y la UI vuelve al estado anónimo sin recargar.
- [ ] El componente no contiene lógica PKCE; delega en `authService` para iniciar el flujo.
- [ ] Tests de componente para el estado anónimo y el estado autenticado en verde.

---

## Diagrama de flujo OAuth 2.0 PKCE (sin backend)

```
Cliente (PWA)                                             Google
──────────────────────────────────────────────────────────────────
[1] Genera code_verifier + state (GIS / Web Crypto)
    Guarda en sessionStorage
    Redirige a accounts.google.com
    con code_challenge + scopes ──────────────────────────────▶ Google muestra consentimiento
                                                               Usuario acepta
                                         ◀──────────────────── Redirige a /auth/callback?code=…&state=…
[2] Lee code + state de query params
    Verifica state
    POST oauth2.googleapis.com/token { code, code_verifier,
         client_id, redirect_uri } (sin client_secret — cliente público)
                                         ◀────────────────────  { access_token, refresh_token… }
[3] GET /oauth2/v3/userinfo (Bearer token) ───────────────────▶
                                         ◀─────────────────────  { name, email, picture }
[4] authStore.login(token, profile)
    UI → estado autenticado
```

---

## Estimación total

| Tarea | Estimación |
|---|---|
| BK-29 — `authStore.svelte.js` | 1 j. |
| ~~BK-30 — Proxy backend~~ | ~~1-2 j.~~ → _movido a E-04 como BK-40_ |
| BK-36 — Flujo PKCE en el cliente (usa GIS de BK-40) | 2-3 j. |
| BK-37 — Cabecera Login / perfil | 1 j. |
| **Total E-01** | **4-5 jornadas** |

> El coste de BK-40 (1-2 j.) se contabiliza en **E-04**, no en E-01.
