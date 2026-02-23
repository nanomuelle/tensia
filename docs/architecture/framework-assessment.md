# Assessment: Selección de framework frontend para el crecimiento de Tensia

_Fecha: 2026-02-22_  
_Autor: Arquitecto — en respuesta a solicitud de evaluación estratégica_

---

## 1. Contexto y motivación

Tensia es hoy una PWA con 1 pantalla, 6 componentes de UI (~966 LOC), store reactivo manual,
router hash-based y ~3 300 LOC de tests. El proyecto se publica en **GitHub Pages** mediante
un flujo `push a main → GitHub Actions → dist/`. No hay servidor; toda la lógica vive en el
cliente.

Las siguientes features confirman que el proyecto **va a crecer en complejidad**:

| Feature | Implicaciones técnicas |
|---|---|
| **Login con Google (OAuth 2.0 + PKCE)** | Flujo de autenticación client-side, gestión segura de tokens, rutas protegidas, múltiples vistas (login, callback, perfil) |
| **AI / OCR (lectura de imagen de tensiómetro)** | Llamada a un API externo (o backend), manejo de binarios/File/Blob, estados intermedios (subiendo, procesando, error), integración en el formulario |
| **Google Drive como adaptador de persistencia** | Adaptador `googleDriveAdapter` con auth, refresh de tokens, manejo de conflictos offline |
| **Post-MVP en general** | Más vistas, más rutas protegidas, más estados globales, posiblemente notificaciones push |

Hoy el coste de añadir cada una de esas features en Vanilla JS es real pero gestionable.
Sin embargo, la **acumulación de complejidad** (flujos de auth, estados async, múltiples
vistas, manejo de errores, XSS) hace que sea el momento correcto de evaluar opciones antes
de que el coste de migración sea demasiado alto.

### Restricciones no negociables

1. **Publicar sigue siendo `merge PR → main`**: el workflow de GitHub Actions ya ejecuta
   `npm run build` y sube `dist/`. Cualquier opción evaluada debe mantener esta tubería.
2. **GitHub Pages = hosting estático puro**: sin SSR, sin servidor Node en producción.
   Las opciones server-side (Next.js con SSR, Nuxt con SSR) quedan descartadas de origen.
3. **PWA**: `manifest.json` + Service Worker deben seguir funcionando.
4. **No hay presupuesto de complejidad operacional**: Tensia es un proyecto personal;
   la infraestructura debe ser lo más simple posible.

---

## 2. Opciones evaluadas

| # | Opción | Versión de referencia |
|---|---|---|
| A | **Vanilla JS (status quo)** | ES Modules nativos, `scripts/build.js` |
| B | **Svelte 5 + Vite** | Svelte 5, Vite 6 |
| C | **Vue 3 + Vite** | Vue 3.5 (Composition API), Vite 6 |
| D | **React + Vite** | React 19, Vite 6 |

> **Nota sobre Next.js / Nuxt:** se descartan explícitamente porque su modelo de despliegue
> óptimo es un servidor Node (SSR). El modo _static export_ existe pero degrada muchas de
> sus ventajas principales y añade fricción de configuración. Para GitHub Pages + SPA, Vite
> es la elección correcta con cualquier framework.

---

## 3. Dimensiones de evaluación

### 3.1 Peso de la aplicación (bundle, producción)

El Service Worker de Tensia cachea el shell de la app para uso offline. Un bundle más pesado
implica primera descarga más lenta y caché SW más costosa — relevante para el uso en móvil.

| Opción | Runtime propio (gzip) | Bundle total estimado (app actual) | Impacto en SW cache |
|---|---|---|---|
| **A — Vanilla JS** | 0 KB | ~25 KB (JS propio + D3 vía CDN) | Mínimo |
| **B — Svelte 5** | ~2-3 KB (compiler output, no runtime a enviar) | ~35-45 KB | Muy bajo |
| **C — Vue 3** | ~22 KB | ~55-65 KB | Moderado |
| **D — React + Vite** | ~45 KB (React + ReactDOM) | ~80-95 KB | Alto |

Svelte compila toda la reactividad en tiempo de build: no existe runtime que el navegador
tenga que descargar. Lo que llega al usuario es JavaScript puro generado por el compilador.
Vue y React envían su runtime en cada despliegue.

> D3.js (~60 KB gzip) se sigue cargando vía CDN/importmap independientemente de la opción
> elegida; no entra en el cálculo del bundle propio.

### 3.2 Dificultad de build y publicación (`merge → deploy`)

El flujo actual de publicación es:

```
PR → merge a main
  └─ GitHub Actions (deploy-pages.yml)
       ├─ npm ci
       ├─ npm run build  →  dist/
       └─ upload-pages-artifact → GitHub Pages
```

`npm run build` ejecuta hoy `scripts/build.js` (copia de ficheros + parcheo de rutas para
el subdirectorio `/tensia` de GitHub Pages).

Con Vite (`npm run build` → `vite build` → `dist/`), **el YAML de GitHub Actions no cambia
una sola línea**. Solo cambia el contenido de `npm run build`.

| Opción | Cambio en `deploy-pages.yml` | Config de build | Variables de entorno |
|---|---|---|---|
| **A — Vanilla JS** | Ninguno | `scripts/build.js` (ya funciona) | `BASE_PATH`, `BUILD_ID` |
| **B — Svelte 5** | Ninguno | `vite.config.js` ~20 líneas | Las mismas con prefijo `VITE_` |
| **C — Vue 3** | Ninguno | `vite.config.js` + Vue plugin | Las mismas con prefijo `VITE_` |
| **D — React + Vite** | Ninguno | `vite.config.js` + React plugin + JSX | Las mismas con prefijo `VITE_` |

Con cualquier opción basada en Vite:
- `BASE_PATH` se pasa como `base` en `vite.config.js` — equivalente al parcheo actual de rutas.
- El Service Worker puede generarse con `vite-plugin-pwa` (precaching automático, sin `sw.js` manual).
- `BUILD_ID` (SHA del commit) se mapea a `VITE_BUILD_ID` y queda embebido en el bundle.

**El flujo `merge a main → publicar` no se rompe con ninguna opción.**

### 3.3 Impacto de coste (esfuerzo de migración)

#### Qué se puede reusar sin tocar

Las capas de negocio y persistencia son **completamente independientes del framework de UI**:

| Módulo | Portable al 100% |
|---|---|
| `domain/measurement.js` | ✅ |
| `services/measurementService.js` | ✅ |
| `infra/localStorageAdapter.js` | ✅ |
| `infra/httpAdapter.js` | ✅ |
| `store/appStore.js` | ✅ con Vanilla/Svelte; adaptable en Vue/React |
| `shared/validators.js` | ✅ |
| `shared/formatters.js` | ✅ |
| `shared/constants.js` | ✅ |
| `shared/eventBus.js` | Parcialmente (Vue/React tienen su propio sistema) |

La separación de capas actual es el mayor activo de cara a una migración.

#### Qué se reescribe

| Módulo | A | B (Svelte) | C (Vue) | D (React) |
|---|---|---|---|---|
| 6 componentes UI | 0% | 100% (SFC `.svelte`) | 100% (SFC `.vue`) | 100% (JSX `.jsx`) |
| `router.js` | 0% | `svelte-spa-router` | Vue Router | React Router |
| `views/HomeView.js` | 0% | Componente Svelte | Componente Vue | Componente React |
| `appStore.js` | 0% | Svelte stores (~20 LOC) | Pinia (~30 LOC) | Zustand (~30 LOC) |
| Tests de componentes (~1 400 LOC) | 0% | Vitest + @testing-library/svelte | Vitest + @testing-library/vue | Vitest + @testing-library/react |
| Config (vite.config, etc.) | 0% | ~1-2 ficheros | ~2-3 ficheros | ~3-4 ficheros |

Los tests de `domain/`, `services/`, `infra/` y `shared/` **no se tocan** en ningún caso:
son JS puro y funcionan igual en Jest o Vitest.

#### Estimación de esfuerzo de migración (jornadas de trabajo)

| Opción | UI | Tests de componente | Config + integraciones | **Total estimado** |
|---|---|---|---|---|
| **A — Vanilla JS** | 0 | 0 | 0 | **0 jornadas** |
| **B — Svelte 5** | 4-5 | 3-4 | 1 | **8-10 jornadas** |
| **C — Vue 3** | 5-6 | 3-4 | 1-2 | **9-12 jornadas** |
| **D — React + Vite** | 6-8 | 4-5 | 2-3 | **12-16 jornadas** |

### 3.4 Escalabilidad para las features entrantes

#### Google OAuth 2.0 + PKCE

| Aspecto | A | B (Svelte) | C (Vue) | D (React) |
|---|---|---|---|---|
| Flujo PKCE (client-side) | Manual con `crypto.subtle` | Igual + librerías SPA | `@auth/vue` / manual | `@auth/react` / `oidc-client-ts` |
| Rutas protegidas | Guards manuales en router propio | `svelte-spa-router` guards | Vue Router `beforeEach` | React Router `<PrivateRoute>` |
| Gestión de tokens (refresh, expiración) | Manual en `httpAdapter` | Igual | Igual | Igual |
| Contexto de sesión global | Store manual | Svelte store nativo | Pinia store | Zustand / Context API |

El flujo PKCE es código puro (interacción con `location.href`, `crypto`, `sessionStorage`),
independiente del framework. La diferencia real está en cuánta fricción añade cada opción
para **proteger rutas** y **distribuir el estado de sesión** entre componentes.

#### AI / OCR (lectura de imagen)

La llamada a la API de AI es `fetch` puro. Lo que cambia es cómo se gestionan los
**estados intermedios complejos** del componente de captura:

| Estado | A (Vanilla) | B / C / D |
|---|---|---|
| `idle` → `subiendo` → `procesando` → `confirmando` → `guardado` | Gestión imperativa: variables de estado + llamadas manuales a `update()` | Reactividad declarativa: el template se actualiza solo con `$state` / `ref` / `useState` |
| Errores parciales (reconocimiento incorrecto, corrección manual) | Variables booleanas + condicionales en `innerHTML` | Condicionales en template, más legibles y menos propensos a XSS |

Con Vanilla JS, este componente será el más complejo del proyecto. Con cualquiera de los
framworks declarativos, sigue siendo complejo pero predecible.

#### Seguridad

| Riesgo | A (Vanilla JS) | B (Svelte) | C (Vue) | D (React) |
|---|---|---|---|---|
| **XSS vía `innerHTML`** | ⚠️ Presente: `MeasurementList.mostrarLista()` y `MeasurementForm.mount()` construyen HTML con datos externos | ✅ Escaping automático en templates | ✅ Escaping automático | ✅ Escaping automático en JSX |
| **CSP (Content Security Policy)** | ⚠️ Difícil: `innerHTML` + CDN importmap requieren `unsafe-inline` o nonces complejos | ✅ Bundle estático: CSP trivial con Vite | ✅ Igual | ✅ Igual |
| **Token storage (OAuth)** | Manual (`sessionStorage` / `localStorage`) | Igual (decisión del dev) | Igual | Igual |
| **Superficie de ataque de dependencias** | Mínima (0 deps de UI) | Baja (Svelte en devDeps, no en runtime) | Media | Alta (ecosistema React) |

> ⚠️ **Riesgo XSS actual**: Hoy los datos vienen del localStorage propio del usuario, por lo
> que el impacto práctico es limitado. Con Google Drive (datos multi-dispositivo o
> potencialmente de terceros) y OCR (datos externos no confiables), el riesgo se vuelve real
> y exige escape sistemático. Cualquier framework con templates declarativos (B, C, D) lo
> elimina estructuralmente sin esfuerzo extra.

### 3.5 Claridad de estructura de código

| Aspecto | A (Vanilla) | B (Svelte) | C (Vue) | D (React) |
|---|---|---|---|---|
| Colocalización lógica + template + estilo | No: HTML en cadenas JS o `innerHTML` | ✅ SFC: `<script>`, `<template>`, `<style>` en un fichero `.svelte` | ✅ SFC: igual que Svelte | Parcial: JSX mezcla lógica y template; CSS separado |
| Reactividad declarativa | No: llamadas manuales a `update()` y `ocultarEstados()` | ✅ Runes: `$state`, `$derived` | ✅ `ref`, `computed` | Hooks: `useState`, `useEffect` (más verboso) |
| Proximidad a HTML/JS estándar | ✅ Total | ✅ Muy alta (SFC ≈ HTML ampliado) | ✅ Alta | Media (JSX requiere transformación mental) |
| Curva de onboarding | Media (patrón propio no estándar) | Baja-media | Baja-media | Media-alta |
| Consistencia forzada por la herramienta | No (depende de disciplina) | Sí (compilador) | Sí (framework) | Parcial |

---

## 4. Tabla de decisión consolidada

| Criterio | Peso | A Vanilla JS | B Svelte 5 | C Vue 3 | D React |
|---|---|---|---|---|---|
| Coste de migración | 🔴 Crítico | ✅ 0 | ✅ Bajo | ✅ Bajo-Medio | ⚠️ Medio-Alto |
| Bundle (PWA móvil) | 🔴 Crítico | ✅ Óptimo | ✅ Excelente | ✅ Bueno | ⚠️ Aceptable |
| Build y publicación sin cambiar pipeline | 🔴 Crítico | ✅ Sin cambios | ✅ Sin cambios | ✅ Sin cambios | ✅ Sin cambios |
| Seguridad estructural (XSS, CSP) | 🔴 Crítico | ⚠️ Riesgo real con OCR + GDrive | ✅ Safe by default | ✅ Safe by default | ✅ Safe by default |
| Escalabilidad OAuth + AI | 🟠 Alto | ⚠️ Manual, más código | ✅ Adecuada | ✅ Adecuada | ✅ Adecuada con ecosistema |
| Claridad de código | 🟠 Alto | ⚠️ Patrón propio | ✅ Alta | ✅ Alta | ✅ Media-Alta |
| Ecosistema auth / AI | 🟡 Medio | ⚠️ Todo manual | ✅ Suficiente (SPA) | ✅ Muy maduro | ✅ Muy maduro |
| Mantenibilidad a largo plazo | 🔴 Crítico | ⚠️ Crece con el UI | ✅ Alta | ✅ Alta | ✅ Alta |

---

## 5. Recomendación

### Opción recomendada: **B — Svelte 5 + Vite**

Svelte es la opción que mejor equilibra **todos los criterios críticos** para la fase actual
de Tensia:

1. **Bundle mínimo para PWA móvil**: Svelte no envía runtime al navegador. El compilador
   genera JS puro optimizado — la consecuencia directa es que la app instalada en móvil
   pesa menos y arranca más rápido que con cualquier opción que envíe runtime.

2. **El flujo `merge → deploy` no cambia**: `vite build` produce `dist/`; el YAML de GitHub
   Actions sigue igual. `BASE_PATH` se pasa como `base` en `vite.config.js` (1 línea).

3. **Elimina el riesgo XSS de forma estructural**: los templates Svelte escapan por defecto,
   sin disciplina adicional. Crítico antes de que lleguen datos de OCR o Google Drive.

4. **Coste de migración mínimo entre las opciones que aportan reactividad**: 8-10 jornadas
   distribuibles en sprints, sin interrumpir el producto. Las capas `domain/`, `services/`,
   `infra/` y `store/` son portables al 100% sin modificar.

5. **OAuth + PKCE escalable**: el modelo de stores de Svelte (`$state`, `$derived`,
   `writable`) encaja directamente con el `appStore` actual. Añadir una `sessionStore` para
   el token Google es trivial y explícito.

6. **Componente de OCR/AI legible**: los estados intermedios complejos (subiendo,
   procesando, confirmando) se expresan con condicionales en template, no con
   `ocultarEstados()` + `innerHTML`.

7. **`vite-plugin-pwa`**: reemplaza el `sw.js` manual por un Service Worker con precaching
   automático y estrategias de red configurables — más robusto para la feature de uso offline.

8. **Sintaxis cercana a HTML/JS nativo**: un SFC `.svelte` es ≈ un fichero HTML con
   `<script>` y `<style>`. La curva de onboarding es la más baja entre las opciones
   con reactividad declarativa.

### ¿Por qué no Vue 3?

Vue 3 es una alternativa igualmente válida. Su diferenciador negativo es el **bundle de
runtime (~22 KB gzip)** y una curva de conceptos (Options API vs Composition API, emits,
provide/inject) mayor que Svelte. Si el equipo tuviera experiencia previa en Vue sería la
segunda opción natural.

### ¿Por qué no React?

React es la opción más costosa en bundle (~45 KB runtime), en esfuerzo de migración
(12-16 jornadas) y en convenciones a aprender (JSX, hooks, patrones de estado). Su
ecosistema extenso es una ventaja en proyectos con múltiples desarrolladores frontend
especializados; en un proyecto personal añade complejidad sin beneficio proporcional.

### ¿Y Vanilla JS?

Seguir en Vanilla JS es viable aplicando mejoras incrementales. Sin embargo:

- El **riesgo XSS de `innerHTML`** se vuelve inaceptable cuando lleguen datos de OCR
  (texto extraído de una imagen, potencialmente malicioso) y de Google Drive (datos
  que viajan por red).
- El flujo de **OAuth 2.0** (rutas protegidas, contexto de sesión reactivo, redirecciones)
  es código imperativo denso sin reactividad declarativa, propenso a estados inconsistentes.
- El **componente de captura de imagen con AI** acumulará la mayor complejidad de UI del
  proyecto; sin templates declarativos será el fichero más difícil de mantener.

---

## 6. Ruta de migración propuesta (si se acepta B)

La migración puede hacerse **de forma incremental** sin interrumpir el producto ni el
pipeline de publicación:

### Fase 0 — Integrar Vite sin migrar componentes (~1 jornada)
- Añadir `vite.config.js` con `base: process.env.VITE_BASE_PATH`.
- Reemplazar `scripts/build.js` por `vite build`.
- Verificar que GitHub Actions produce el mismo `dist/` que el build actual.
- El código Vanilla JS existente sigue funcionando servido por Vite (modo interop).

### Fase 1 — Migrar componentes hoja (~3 jornadas)
Componentes sin dependencias de otros componentes propios:
`Toast` → `IosWarning` → `MeasurementList` → `MeasurementChart`

### Fase 2 — Migrar componentes compuestos (~2 jornadas)
`MeasurementForm` → `Modal`

### Fase 3 — Migrar la vista y el store (~2 jornadas)
`appStore` → `HomeView` → `router`

### Fase 4 — Tests y limpieza (~2 jornadas)
Reescribir tests de componentes con **Vitest + @testing-library/svelte**.
Tests de `domain/`, `services/`, `infra/` y `shared/`: sin cambios (solo cambiar runner
de Jest a Vitest, que es compatible con la misma sintaxis `describe/it/expect`).

En cada fase la app se despliega sin regresiones.

---

## 7. Impacto sobre decisiones arquitectónicas existentes

| ADR vigente | Impacto de opción B |
|---|---|
| **ADR-002** (persistencia intercambiable) | Sin cambio: el contrato `getAll/save` del adaptador es JS puro |
| **ADR-003** (Vanilla JS) | Supersedido: documentar **ADR-007** — migración a Svelte 5 + Vite |
| **ADR-004** (Playwright E2E) | Sin cambio: Playwright prueba el DOM, es agnóstico al framework |
| **ADR-005** (localStorage PWA) | Sin cambio: `localStorageAdapter` no cambia |
| **ADR-006** (D3.js) | Sin cambio: D3 se importa en el componente Svelte como módulo puro |

---

## 8. Próximos pasos si se acepta la recomendación

1. **Crear ADR-007** en `docs/architecture/decisions.md`: _"Migración del frontend a Svelte 5 + Vite"_, estado Propuesto.
2. **Añadir BK-24** al backlog: _"Fase 0 — Integrar Vite sin migrar componentes"_, para validar la tubería antes de comprometer la reescritura de componentes.
3. **Decidir el timing**: la migración puede iniciarse antes o después del sprint de Google OAuth. Migrar primero simplifica la implementación del flujo de auth con Svelte stores.

---

_Ver también: [ADR-003](decisions.md#adr-003-vanilla-js-como-stack-del-frontend-para-el-mvp) · [decisions.md](decisions.md) · [system-overview.md](system-overview.md)_
