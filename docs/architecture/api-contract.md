# Contratos de la capa de persistencia

_Revisado: 2026-02-24 (ADR-008 — arquitectura serverless)_

---

## Adaptador de persistencia (cliente)

Todo adaptador debe implementar:

```js
adapter.getAll()                           → Promise<Measurement[]>
adapter.save(measurements: Measurement[]) → Promise<void>
```

| Adaptador | Entorno | Ubicación |
|---|---|---|
| `localStorageAdapter` | Producción MVP (usuario anónimo) | `apps/frontend/src/infra/localStorageAdapter.js` |
| `googleDriveAdapter` | Post-MVP (usuario autenticado) | `apps/frontend/src/infra/googleDriveAdapter.js` |
| `JsonFileAdapter` | Tests de integración (solo local) | `apps/backend/src/infra/jsonFileAdapter.js` |

`measurementService` recibe el adaptador por DI; nunca lo instancia directamente (ADR-002).

---

## Endpoints HTTP del backend (dev/tests — no en producción)

> ⚠️ **ADR-008 (2026-02-24):** el backend Express no existe en producción. El hosting lo gestiona GitHub Pages. Esta sección documenta los endpoints disponibles únicamente en entorno local de desarrollo.

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/*` | Ficheros estáticos del frontend (`dist/`) |

---

## ~~Endpoints HTTP post-MVP planificados con backend~~ — OBSOLETO por ADR-008

> ⛔ **Obsoleto desde 2026-02-24 (ADR-008).** La arquitectura serverless elimina la necesidad de un servidor Express en producción.
> - `POST /auth/token` (BK-30) queda **obsoleto**: reemplazado por el flujo GIS client-side (BK-40, sección siguiente).
> - `POST /ocr` (E-02) se implementará como serverless function (Vercel/Netlify), no como endpoint Express.

~~| Método | Ruta | Descripción | Épica |~~  
~~| `POST` | `/auth/token` | Proxy OAuth 2.0 | E-01 / BK-30 |~~  
~~| `POST` | `/ocr` | OCR/AI | E-02 |~~

---

## Autenticación Google — Flujo GIS client-side (post-MVP)

> Implementado en **BK-40** (épica E-04). Reemplaza el proxy `POST /auth/token` (BK-30 obsoleto).

### Principio

Google Identity Services (GIS) implementa OAuth 2.0 + PKCE (RFC 7636) íntegramente en el cliente. Al usar `token_endpoint_auth_method: none` (cliente público), no se necesita `client_secret` en el servidor.

### Variables de entorno del cliente

| Variable | Descripción |
|---|---|
| `VITE_GOOGLE_CLIENT_ID` | ID de cliente OAuth de Google Cloud Console. Pública (cliente público PKCE). |

### Flujo PKCE client-side

```
Cliente (PWA)                                             Google
──────────────────────────────────────────────────────────────────
[1] Genera code_verifier (≥96 bytes, base64url)
    Calcula code_challenge = BASE64URL(SHA256(code_verifier))
    Genera state aleatorio
    Guarda code_verifier + state en sessionStorage
    Redirige a accounts.google.com con:
      response_type=code, client_id, redirect_uri,
      scope=openid profile, code_challenge,
      code_challenge_method=S256, state ──────────────▶ Muestra consentimiento
                                                       Usuario acepta
                              ◀─────────────────────── /auth/callback?code=…&state=…
[2] Verifica state (previene CSRF)
    POST oauth2.googleapis.com/token ─────────────────▶
      { code, code_verifier, client_id,
        redirect_uri, grant_type=authorization_code }
                              ◀─────────────────────── { access_token, refresh_token, expires_in }
[3] GET /oauth2/v3/userinfo (Bearer token) ───────────▶
                              ◀───────────────────────  { sub, name, email, picture }
[4] authStore.login(token, profile)
    UI → estado autenticado
```

### Google Drive (post-MVP — E-03)

Tras el login, `googleDriveAdapter` usa el `access_token` de `authStore` para llamar directamente a la Google Drive API desde el cliente:

```js
// Lectura
GET https://www.googleapis.com/drive/v3/files?spaces=appDataFolder
    Authorization: Bearer <access_token>

// Escritura
PATCH https://www.googleapis.com/upload/drive/v3/files/<fileId>
     Authorization: Bearer <access_token>
     Content-Type: application/json
```

No hay intermediación del servidor para los datos.

---

## Reglas de validación (dominio del cliente)

Implementadas en `apps/frontend/src/domain/measurement.js` y `src/shared/validators.js`.

| Campo | Obligatorio | Tipo | Rango | Regla adicional |
|---|:---:|---|---|---|
| `systolic` | ✅ | entero positivo | 50 – 300 mmHg | Debe ser > `diastolic` |
| `diastolic` | ✅ | entero positivo | 30 – 200 mmHg | Debe ser < `systolic` |
| `pulse` | ❌ | entero positivo | 20 – 300 bpm | Solo si está presente |
| `measuredAt` | ✅ | string ISO 8601 | — | Fecha/hora válida |
| `source` | ✅ (auto) | `"manual"` \| `"photo"` | — | Asignado por el servicio |
