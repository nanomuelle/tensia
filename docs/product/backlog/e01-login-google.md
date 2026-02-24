# Épica E-01 — Login con Google

**Estado:** Pendiente — ~~bloqueado por E-04~~ **desbloqueada** (E-04 ✅ completada 2026-02-24)  
**Fecha de refinamiento:** 2026-02-24  
**Sprint estimado:** Sprint post-MVP 1

**Objetivo:** El usuario puede autenticarse con su cuenta de Google mediante OAuth 2.0 PKCE + Google Identity Services (GIS). La app muestra su nombre y foto de perfil en la cabecera. El adaptador de persistencia **no cambia** en esta épica: el usuario autenticado sigue usando `localStorageAdapter`. La sincronización multi-dispositivo se aborda en E-03.

**Scopes Google requeridos:** `openid`, `profile`, `email`  
**Scopes adicionales (E-03):** `https://www.googleapis.com/auth/drive.appdata` — se añadirán en E-03.

> **Dependencias completadas:**
> - ADR-007 ✅ — Migración a Svelte 5 + Vite completada (2026-02-23).
> - BK-26 ✅ y BK-27 ✅ — Router Svelte hash-based operativo.
> - E-04 ✅ — Arquitectura serverless implantada (2026-02-24). BK-40 entregó `authService.js` completamente funcional (flujo PKCE, intercambio de código, `userinfo`). Este servicio es la base de BK-36.

> **Nota arquitectónica — callback con hash router en GitHub Pages SPA:**  
> Google redirige al `redirect_uri` con `?code=...&state=...` como _query string_, **no como hash**.  
> En una SPA sobre GitHub Pages no existe un servidor que gestione rutas reales, por lo que la estrategia recomendada es registrar la propia URL base de la app como `redirect_uri` (p. ej. `https://nanomuelle.github.io/tensia/`) y detectar la presencia de `?code=` y `?state=` en `app.js` **antes** de inicializar el router. Si se detectan, se delega inmediatamente en `authService.handleCallback()` y se navega a `#/`.  
> Alternativa (más compleja): usar el truco 404.html de GitHub Pages para redirigir `/auth/callback` → `index.html` y añadir la ruta `/auth/callback` al router. La estrategia elegida se debe documentar en el componente o en un comentario de `app.js` antes de implementar.

---

## BK-29 — `authStore.svelte.js`: migrar a Svelte 5 Runes + persistencia en sessionStorage ✅

**Descripción:** El fichero `apps/frontend/src/store/authStore.svelte.js` existe como stub mínimo (BK-40): usa `writable` de `svelte/store` y no persiste la sesión. BK-29 lo **reescribe** con Svelte 5 Runes (`$state`, `$derived`) y añade persistencia en `sessionStorage` para que la sesión sobreviva recargas. Debe exponer `sesion` (estado reactivo), `isAuthenticated` ($derived), `login(tokenData, userProfile)` y `logout()`. Sin dependencias de DOM ni de otros stores.

**Prioridad:** Alta  
**Estimación:** 1 jornada  
**Dependencias:** ADR-007 ✅  
**Estado:** ✅ Completado (2026-02-24)  
**Tipo:** Feature (frontend)

**Criterios de aceptación:**
- [x] `authStore` expone estado reactivo `{ sesion: null | { tokenData, userProfile } }` usando Svelte 5 `$state`.
- [x] `login(tokenData, userProfile)` actualiza el estado y persiste la sesión serializada en `sessionStorage` (clave `auth_session`).
- [x] `logout()` limpia el estado y elimina la entrada `auth_session` de `sessionStorage`.
- [x] Al importarse por primera vez, recupera la sesión de `sessionStorage` si existe (rehydratación automática).
- [x] `isAuthenticated` es un `$derived` que devuelve `true` cuando `sesion !== null`.
- [x] El store **no** usa `writable` de `svelte/store`; únicamente Svelte 5 Runes.
- [x] No depende de DOM, de la UI ni del adaptador de persistencia.
- [x] Tests unitarios del store en verde (`sessionStorage` mockeado).

---

## BK-36 — Integración del callback OAuth en la app Svelte ✅

**Descripción:** `authService.js` ya está implementado en BK-40 (flujo PKCE completo: `requestCode()`, `handleCallback()`, `logout()`). El trabajo de BK-36 es integrarlo en la app Svelte:

1. **Decidir y documentar la estrategia de callback** (ver nota arquitectónica): URL base como `redirect_uri` con detección de `?code=` en `app.js`, o ruta `/auth/callback` + truco 404.html.
2. Implementar la detección/gestión del callback en el punto de entrada elegido.
3. Conectar `authService` con `authStore` (BK-29): `createAuthService({ authStore, clientId, redirectUri })` — el store ya es recibido por inyección.
4. Gestionar los errores del callback: cancelación por el usuario, `state` inválido, error de red, código expirado → toast informativo + estado limpio.
5. Añadir tests unitarios para `handleCallback` con `fetch` y `crypto` mockeados.

**Nota:** `authService.js` usa directamente `authStore.login()`; cuando BK-29 reescriba el store con Runes, la firma `login(tokenData, userProfile)` y `logout()` se mantiene — no hay cambios de contrato.

**Prioridad:** Alta  
**Estimación:** 1-2 jornadas  
**Dependencias:** BK-29, BK-40 ✅  
**Estado:** ✅ Completado (2026-02-24)  
**Tipo:** Feature (frontend)  
**Referencia:** US-15

**Criterios de aceptación:**
- [x] La estrategia de callback elegida está documentada con un comentario en `App.svelte` (URL base como `redirect_uri`, detección de `?code=` en `onMount` antes de arrancar el router).
- [x] `code_verifier` se genera con mínimo 32 bytes aleatorios (Web Crypto `getRandomValues`) codificados en base64url — cumple RFC 7636 (rango 43-128 chars).
- [x] `code_challenge` se calcula como `BASE64URL(SHA-256(ASCII(code_verifier)))` usando Web Crypto API.
- [x] `state` es un valor aleatorio de 16 bytes en hexadecimal, verificado al recibir el callback (previene CSRF).
- [x] `code_verifier` y `state` se almacenan en `sessionStorage`, no en `localStorage`.
- [x] El `redirect_uri` usado en la llamada coincide exactamente con el registrado en Google Cloud Console (configurado mediante `VITE_REDIRECT_URI`).
- [x] Tras intercambio exitoso, `authStore.isAuthenticated` es `true` y el perfil está disponible; la app navega a `#/`.
- [x] Si el usuario cancela el consentimiento (`error=access_denied`), la app muestra un toast informativo y queda en estado anónimo funcional.
- [x] Si `state` no coincide al volver del callback, el flujo se aborta, `sessionStorage` se limpia y se muestra error.
- [x] Si el endpoint de tokens devuelve error (p. ej. código expirado), se muestra un toast y el estado queda limpio.
- [x] La ruta `#/` sigue siendo accesible sin autenticación durante y después del flujo.
- [x] Tests unitarios de `handleCallback` en verde (Web Crypto y `fetch` mockeados) + tests de integración en `App.svelte.test.js` (13 tests).

---

## ~~BK-30 — Backend: endpoint proxy `POST /auth/token`~~ — OBSOLETO

> ⛔ **Obsoleto desde 2026-02-24.** Reemplazado por **BK-40** (épica E-04).
> Con Google Identity Services (GIS) el flujo PKCE es completamente client-side: no se necesita `client_secret` ni proxy de servidor.
> Ver [backlog/e04-arquitectura-serverless.md](e04-arquitectura-serverless.md#bk-40--reemplazar-proxy-oauth-por-google-identity-services-gis-client-side).

---

## BK-37 — Cabecera: botón Login / avatar de perfil de usuario

**Descripción:** Añadir zona de sesión a la cabecera de la app. Estado anónimo: botón "Iniciar sesión con Google". Estado autenticado: foto de perfil del usuario (o inicial del nombre si no hay imagen) con menú desplegable "Cerrar sesión". El componente se suscribe a `authStore` reactivamente usando `$derived` / `isAuthenticated`. Al hacer logout llama a `authService.logout()` (que delega en `authStore.logout()`) y navega a `#/`.

**Prioridad:** Media  
**Estimación:** 1 jornada  
**Dependencias:** BK-29, BK-36  
**Estado:** ✅ Completado (2026-02-24)  
**Tipo:** Feature (frontend)  
**Referencia:** US-15

**Criterios de aceptación:**
- [x] En estado anónimo la cabecera muestra el botón "Iniciar sesión con Google".
- [x] En estado autenticado la cabecera muestra el nombre del usuario y su foto de perfil (o la inicial si no hay foto).
- [x] El botón/avatar es accesible: `aria-label` en el botón, `alt` descriptivo en la imagen.
- [x] Pulsar "Cerrar sesión" limpia la sesión via `authService.logout()` y la UI vuelve al estado anónimo sin recargar.
- [x] El componente usa `authStore.isAuthenticated` y `authStore.sesion` reactivamente; no contiene lógica PKCE.
- [x] Tests de componente para el estado anónimo y el estado autenticado en verde.

---

## Diagrama de flujo OAuth 2.0 PKCE (completamente client-side — sin backend)

```
Cliente (PWA)                                             Google
──────────────────────────────────────────────────────────────────
[1] authService.requestCode()
    Genera code_verifier (32 bytes) + state (16 bytes hex)
    Guarda ambos en sessionStorage
    Calcula code_challenge = BASE64URL(SHA-256(verifier))
    window.location.href → accounts.google.com/o/oauth2/v2/auth
    con scope=openid profile email + code_challenge ────────────▶ Google muestra consentimiento
                                                               Usuario acepta
                                         ◀──────────────────── Redirige a redirect_uri?code=…&state=…
[2] app.js detecta ?code= en query params (antes de iniciar router)
    authService.handleCallback(searchParams)
      · Verifica state (CSRF)
      · Lee code_verifier de sessionStorage
      · Limpia sessionStorage (state + verifier)
      POST oauth2.googleapis.com/token
        { code, code_verifier, client_id, redirect_uri }
        (sin client_secret — cliente público, RFC 7636) ────────▶
                                         ◀──────────────────── { access_token, id_token, … }
[3] GET googleapis.com/oauth2/v3/userinfo (Bearer token) ───────▶
                                         ◀───────────────────── { sub, name, email, picture }
[4] authStore.login(tokenData, userProfile)
    Persiste sesión en sessionStorage (clave: auth_session)
    router.navigate('#/')
    UI → estado autenticado (cabecera muestra avatar)
```

> `redirect_uri` recomendado para GitHub Pages SPA: la propia URL base de la app.  
> La presencia de `?code=` se detecta en `app.js` antes de llamar a `router.start()`.

---

## Estimación total

| Tarea | Estimación | Estado |
|---|---|---|
| BK-29 — Migrar `authStore.svelte.js` a Runes + sessionStorage | 1 j. | ✅ Completado |
| ~~BK-30 — Proxy backend~~ | ~~1-2 j.~~ → _obsoleto desde E-04_ | Obsoleto |
| BK-36 — Integración del callback OAuth en la app Svelte | 1-2 j. | ✅ Completado |
| BK-37 — Cabecera Login / perfil | 1 j. | Pendiente |
| **Total E-01** | **3-4 jornadas** | |

> El coste de BK-40 (1-2 j.) se contabilizó en **E-04** (completada). `authService.js` está entregado.
