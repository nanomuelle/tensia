# System Overview

_Revisado: 2026-02-24 (ADR-008 — arquitectura serverless)_

---

## Arquitectura actual (MVP — serverless desde ADR-008)

```
 GitHub Pages (hosting estático)
 └─ dist/  ←  vite build
      │
      PWA (Svelte 5 + Vite + Service Worker)
      │
      │  main.js → App.svelte → Router → HomeView
      │
      │  measurementService ◄── localStorageAdapter
      │           │                (localStorage)
      │  domain/measurement.js  (validaciones)
```

Los datos viven exclusivamente en el cliente (`localStorage`). No hay servidor de producción (ADR-008).

---

## Arquitectura post-MVP

```
GitHub Pages (hosting estático)
  └─ dist/  ←  vite build
       │
       PWA (Svelte 5)
         ├─ anónimo      → localStorageAdapter
         └─ Google login → googleDriveAdapter
              │
              │ HTTPS directo (sin proxy)
              ├─ Google Identity Services  (auth PKCE client-side)
              └─ Google Drive API          (persistencia)

Post-MVP OCR:
  Serverless function (Vercel / Netlify)
    └─ Endpoint OCR/AI  (custodia API key del proveedor AI)
```

No hay servidor Express en producción. `apps/backend/` existe únicamente como utilidad de dev/tests.

---

## Estructura del frontend

```
apps/frontend/
  index.html              ← shell Vite (<div id="app"> + SW via vite-plugin-pwa)
  public/
    manifest.json
    icons/
    styles/
      main.css            ← variables CSS + reset
      components/         ← estilos de componentes complejos
  src/
    main.js               ← monta <App />, inicializa service y store
    App.svelte            ← root: Toast, IosWarning, Router
    router.js             ← router hash-based (#/, #/settings…)
    chart.js              ← módulo D3 puro (ADR-006)
    domain/
      measurement.js      ← validaciones de negocio (puro, sin DOM)
    services/
      measurementService.js ← lógica de app; recibe adaptador por DI
    infra/
      localStorageAdapter.js  ← getAll() / save()  [MVP]
      httpAdapter.js          ← fetch al backend; solo OCR/OAuth [post-MVP]
    store/
      appStore.svelte.js  ← estado global con Svelte runes ($state)
    views/
      HomeView.svelte      ← orquesta los componentes de la pantalla principal
    components/
      MeasurementForm/    ← formulario de registro
      MeasurementList/    ← historial de mediciones
      MeasurementChart/   ← wrapper D3
      Toast/              ← notificaciones efímeras
      IosWarning/         ← aviso ITP Safari/iOS
      Modal/              ← diálogo reutilizable
    shared/
      validators.js       ← validaciones de presentación
      formatters.js       ← formato de fecha y unidades
      constants.js        ← constantes de aplicación
      eventBus.js         ← CustomEvent wrapper tipado
```

---

## Principios

- **Adaptador intercambiable:** `measurementService` recibe el adaptador por DI → `localStorageAdapter` (anónimo) → `googleDriveAdapter` (autenticado). Mismo contrato `getAll() / save()`.
- **Backend sin datos:** no almacena ni gestiona mediciones. En el MVP sirve `dist/`.
- **`main.js` mínimo:** solo bootstrap; sin lógica de negocio ni DOM directo.
- **Ciclo de vida de componentes:** `mount()` / `unmount()` (Svelte gestiona esto con `onMount` / `onDestroy`).
- **ITP Safari/iOS:** `localStorage` puede borrarse tras 7 días de inactividad. La UI muestra un aviso en Safari/iOS.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Svelte 5 + Vite |
| PWA | `vite-plugin-pwa` (Service Worker con precaching) |
| Gráfica | D3.js modular (`d3-scale`, `d3-axis`, `d3-shape`, `d3-selection`) |
| Persistencia MVP | `localStorage` del navegador (`localStorageAdapter`) |
| Hosting | GitHub Pages (provisional) — sirve `dist/` construido por Vite |
| Backend (dev/tests) | Node.js + Express — **solo** entorno local y tests de integración |
| Tests unitarios / integración | Vitest + `@testing-library/svelte` |
| Tests E2E | Playwright |
