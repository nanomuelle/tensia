# Backlog — Tensia · Pendiente

_Última revisión: 2026-02-24. Stack definitivo: Svelte 5 + Vite + Vitest. Próximos sprints: **E-04 Arquitectura serverless** → E-01 Login Google → E-02 OCR/AI → E-03 Persistencia Google._

> Los ítems ya implementados están en [backlog-done.md](backlog-done.md).
> El detalle de cada épica está en la carpeta [`backlog/`](backlog/).

---

## Resumen de épicas pendientes

| ID | Épica | Ítems | Estado |
|---|---|---|---|
| **E-04** | [**Arquitectura serverless: eliminar backend**](backlog/e04-arquitectura-serverless.md) | BK-38…BK-42 | **Pendiente — bloqueante para E-01** |
| E-01 | [Login con Google](backlog/e01-login-google.md) | BK-29, BK-36, BK-40, BK-37 | Pendiente — _BK-30 obsoleto_ |
| E-02 | [Registro por foto (OCR / AI)](backlog/e02-ocr-ai.md) | BK-32, BK-33, BK-34 | Post-MVP confirmado |
| E-03 | [Persistencia con cuenta Google](backlog/e03-persistencia-google.md) | BK-35, BK-31 | Bloqueado por E-01 |
| — | [Post-MVP sin épica](backlog/post-mvp.md) | BK-17 | Baja prioridad |

---

## Épica E-04 — Arquitectura serverless: eliminar backend

**Objetivo:** Eliminar el servidor Express de producción. Hosting en GitHub Pages (provisional) y autenticación Google completamente client-side con GIS.

> Bloqueante para E-01. Ver detalle completo en [backlog/e04-arquitectura-serverless.md](backlog/e04-arquitectura-serverless.md).

| BK | Descripción | Estimación | Estado |
|---|---|---|---|
| BK-38 | ADR-008: documentar decisión serverless | 0,5 j. | ✅ Completado |
| BK-39 | Activar GitHub Pages (fix `manifest.json` + configurar repo) | 0,5 j. | ✅ Completado |
| BK-40 | Google Identity Services client-side (reemplaza BK-30) | 1-2 j. | Pendiente |
| BK-41 | Eliminar Express de producción / aislar `apps/backend/` a dev | 1 j. | Pendiente |
| BK-42 | Actualizar scripts npm, CI/CD y documentación | 0,5 j. | Pendiente |

→ Detalle completo: [backlog/e04-arquitectura-serverless.md](backlog/e04-arquitectura-serverless.md)

---

## Épica E-01 — Login con Google

**Objetivo:** Autenticación con Google (scopes `openid`, `profile`). Muestra nombre y foto del usuario en la UI. La persistencia multi-dispositivo se aborda en E-03.

> Requiere E-04 completada, BK-26 ✅ y BK-27 ✅. El usuario anónimo sigue usando `localStorageAdapter`.

| BK | Descripción | Estimación | Estado |
|---|---|---|---|
| BK-29 | `authStore.svelte.js`: estado reactivo de sesión | 1 j. | Pendiente |
| ~~BK-30~~ | ~~Backend: proxy OAuth `POST /auth/token`~~ | — | **Obsoleto — reemplazado por BK-40 (E-04)** |
| BK-36 | Flujo PKCE en el cliente (usa GIS de BK-40) | 2-3 j. | Pendiente |
| BK-37 | Cabecera: botón Login / avatar de perfil | 1 j. | Pendiente |

→ Detalle completo: [backlog/e01-login-google.md](backlog/e01-login-google.md)

---

## Épica E-02 — Registro por foto (OCR / AI)

**Objetivo:** El usuario fotografía su tensiómetro y la app extrae los valores automáticamente para corrección antes de guardar.

> Independiente de E-01. No iniciar sin confirmación explícita.

| BK | Descripción | Estimación | Estado |
|---|---|---|---|
| BK-32 | UI: componente de captura de imagen | 2-3 jornadas | Pendiente |
| BK-33 | Backend: endpoint OCR + integración AI | 3-4 jornadas | Pendiente |
| BK-34 | Integración OCR en el formulario de registro | 2 jornadas | Pendiente |

→ Detalle completo: [backlog/e02-ocr-ai.md](backlog/e02-ocr-ai.md)

---

## Épica E-03 — Persistencia con cuenta Google

**Objetivo:** Mediciones en la nube para el usuario autenticado, con acceso multi-dispositivo y migración desde `localStorage`.

> ⏸ Bloqueado: requiere E-01 completada y BK-35 (assessment) cerrado.

| BK | Descripción | Estimación | Estado |
|---|---|---|---|
| BK-35 | Assessment: alternativas de persistencia con Google | 1 jornada | Pendiente |
| BK-31 | Implementar adaptador elegido + migración de datos | 2-3 jornadas | Bloqueado por BK-35 |

→ Detalle completo: [backlog/e03-persistencia-google.md](backlog/e03-persistencia-google.md)

---

## Post-MVP sin épica

| BK | Descripción | Prioridad | Estado |
|---|---|---|---|
| BK-17 | Recordatorios / notificaciones | Baja | Pendiente |

→ Detalle completo: [backlog/post-mvp.md](backlog/post-mvp.md)
