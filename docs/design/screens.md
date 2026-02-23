# Pantallas — Tensia

_Última revisión: 2026-02-23_

---

## Pantalla 1: Dashboard (pantalla principal)

Pantalla única del MVP. Muestra el historial de mediciones y da acceso al registro de una nueva.  
Diseño mobile-first: columna única en móvil, dos columnas en desktop.

### Wireframe (móvil — columna única)

```
┌─────────────────────────────────┐
│  🩺 Tensia              [fecha] │  ← Header sticky
├─────────────────────────────────┤
│  [ + Nueva medición ]           │  ← Botón primario, ancho completo
├─────────────────────────────────┤
│  Evolución              [mmHg]  │  ← Gráfica (si < 2 mediciones: skeleton)
│  █ Sistólica  █ Diastólica     │
│  [SVG — 100 % ancho, 200 px]    │
├─────────────────────────────────┤
│  Historial                      │
│  ─────────────────────────────  │
│  18 feb 2026 · 10:00            │  ← Tarjeta de medición
│  120 / 80 mmHg   💓 72 ppm     │
│  ─────────────────────────────  │
│  17 feb 2026 · 08:30            │
│  135 / 88 mmHg   💓 80 ppm     │
│  ─────────────────────────────  │
│  16 feb 2026 · 20:15            │
│  118 / 76 mmHg                  │  ← Sin pulso (campo opcional)
└─────────────────────────────────┘
```

### Wireframe (desktop ≥ 768 px — dos columnas)

```
┌──────────────────────────────────────────────────────┐
│  🩺 Tensia                                  [fecha]  │  ← Header sticky
├──────────────────────────────────────────────────────┤
│  [ + Nueva medición ]                                │
├──────────────────────────┬───────────────────────────┤
│  Evolución       [mmHg]  │  Historial                │
│  █ Sistólica             │  ───────────────────────  │
│  █ Diastólica            │  18 feb · 120/80  💓72   │
│  [SVG — 240 px alto]     │  17 feb · 135/88  💓80   │
│                          │  16 feb · 118/76          │
│  [sticky al scroll]      │  ↕ scroll independiente   │
└──────────────────────────┴───────────────────────────┘
  ←──── 55 % ────────────→←──── 45 % ─────────────────→
```

El layout dos columnas se activa con la clase CSS `dashboard-content--columnas` cuando hay ≥ 1 medición.  
Con 0 mediciones se usa siempre columna única.

---

### Anatomía de la tarjeta de medición

```
┌─────────────────────────────────┐
│  18 feb 2026 · 10:00            │  ← Fecha/hora (Intl.DateTimeFormat)
│  120 / 80 mmHg   💓 72 ppm     │  ← Sistólica / Diastólica (bold) + pulso
└─────────────────────────────────┘
```

- Área táctil mínima: 56 px de alto.
- El pulso se omite visualmente si no fue registrado.
- Orden descendente: medición más reciente arriba.

---

### Estados del Dashboard

| Estado | Descripción visual |
|---|---|
| Cargando | Spinner/texto "Cargando…" en la sección de historial |
| Sin mediciones | Mensaje "Sin mediciones todavía. Pulsa Nueva medición para registrar la primera." Columna única. |
| Con mediciones | Gráfica + historial. Layout según viewport. |
| Error de lectura | Banner "⚠ No se pudieron cargar las mediciones. [Reintentar]" |

---

### Accesibilidad (WCAG AA)

- Botón "Nueva medición": `aria-label="Registrar nueva medición"`, área táctil ≥ 48 px.
- Historial: `role="list"` / `role="listitem"` en las tarjetas.
- Contraste valores de tensión (texto principal): ≥ 4.5:1.
- Contraste fecha y pulso (texto secundario): ≥ 3:1.
- Spinner: `aria-live="polite"`, `aria-label="Cargando"`.
- Banner de error: `role="alert"`.

---

## Componente: Gráfica de evolución

Integrada en el Dashboard, entre el botón "Nueva medición" y el historial.  
Implementada con D3.js sobre SVG (`MeasurementChart.svelte`).

### Wireframe

```
┌─────────────────────────────────┐
│  Evolución               [mmHg] │
│  █ Sistólica  █ Diastólica     │
│   │                             │
│140┤  ●─────────────●            │  ← Sistólica (rojo #ef4444)
│120┤●──────────────────●         │
│ 80┤○──────────────────○         │  ← Diastólica (azul #3b82f6)
│   └──────────────────────────── │
│    14/02   16/02   18/02        │  ← Eje X (máx 10 etiquetas)
└─────────────────────────────────┘
```

### Colores

| Elemento | Valor |
|---|---|
| Línea sistólica | `#ef4444` |
| Área rellena sistólica | `rgba(239,68,68,0.1)` |
| Línea diastólica | `#3b82f6` |
| Área rellena diastólica | `rgba(59,130,246,0.1)` |
| Grid / ejes | `#e5e7eb` |
| Etiquetas ejes | `#6b7280` |

### Dimensiones

| Propiedad | Valor |
|---|---|
| Alto SVG (móvil) | 200 px |
| Alto SVG (desktop) | 240 px |
| Ancho SVG | 100 % del contenedor |
| Grosor de línea | 2.5 px |
| Radio de punto | 4 px |
| Márgenes internos SVG | top 20 / right 20 / bottom 40 / left 44 (px) |

### Estados

| Estado | Descripción |
|---|---|
| Skeleton (< 2 mediciones) | `MeasurementChart` renderiza un placeholder interno. La sección no se oculta. |
| Visible (≥ 2 mediciones) | SVG con líneas sistólica y diastólica. |
| Actualización | SVG se regenera de forma síncrona al añadir una medición (sin animación). |
| Muchos puntos (> 30) | Máx 10 etiquetas en eje X; todos los puntos siguen visibles. |
| Resize | `ResizeObserver` redibuja el SVG al cambiar el ancho del contenedor. |

### Accesibilidad

- `<svg role="img" aria-label="Gráfica de evolución de tensión arterial">`.
- Pills de leyenda: `aria-hidden="true"`.
- Contraste líneas sobre blanco: sistólica 4.6:1 ✅, diastólica 4.8:1 ✅.
- El SVG no es interactivo; no recibe foco de teclado.

---

## Componente: Modal de registro (Nueva medición)

Formulario de registro en ventana modal sobre el Dashboard.  
Compuesto por `Modal.svelte` + `MeasurementForm.svelte`, orquestados desde `RegistroMedicionModal.svelte`.

### Wireframe — Desktop / Tablet (≥ 640 px)

```
┌──────────────────────────────────────────────────┐  ← Overlay rgba(0,0,0,0.45)
│                                                  │
│   ┌──────────────────────────────────────────┐   │  ← ancho máx 480 px, centrada
│   │  Nueva medición                     [✕] │   │  ← Cabecera sticky
│   ├──────────────────────────────────────────┤   │
│   │  Sistólica (mmHg) *                      │   │
│   │  ┌──────────────────────────────────┐    │   │
│   │  │  120                             │    │   │
│   │  └──────────────────────────────────┘    │   │
│   │  Diastólica (mmHg) *                     │   │
│   │  ┌──────────────────────────────────┐    │   │
│   │  │  80                              │    │   │
│   │  └──────────────────────────────────┘    │   │
│   │  Pulso (ppm)                    opcional │   │
│   │  ┌──────────────────────────────────┐    │   │
│   │  │  72                              │    │   │
│   │  └──────────────────────────────────┘    │   │
│   │  Fecha y hora *                          │   │
│   │  ┌──────────────────────────────────┐    │   │
│   │  │  2026-02-22T10:30                │    │   │
│   │  └──────────────────────────────────┘    │   │
│   │  ┌──────────────────────────────────┐    │   │
│   │  │     Guardar medición             │    │   │  ← Botón primario
│   │  └──────────────────────────────────┘    │   │
│   └──────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

Contenedor: ancho máx 480 px, padding 24 px, border-radius 12 px.

### Wireframe — Móvil (< 640 px) — Bottom sheet

```
├─────────────────────────────────┤  ← Borde superior redondeado (16 px)
│          ══════                 │  ← Handle decorativo (aria-hidden)
│  Nueva medición            [✕] │
├─────────────────────────────────┤
│  Sistólica (mmHg) *             │
│  Diastólica (mmHg) *            │
│  Pulso (ppm)           opcional │
│  Fecha y hora *                 │
│  [ Guardar medición ]           │
└─────────────────────────────────┘
```

100 % del ancho, anclada al borde inferior, border-radius 16 px arriba.

---

### Animaciones

| | Desktop/Tablet | Móvil (bottom sheet) |
|---|---|---|
| Apertura | `opacity 0→1` + `translateY(16px→0)`, 180 ms ease-out | `translateY(100%→0)`, 260 ms cubic-bezier(0.32,0.72,0,1) |
| Cierre | `opacity 1→0` + `translateY(0→16px)`, 200 ms ease-in | `translateY(0→100%)`, 240 ms ease-in |
| Overlay | `opacity 0→0.45` / `0.45→0`, 180–200 ms | Ídem |

El foco al primer campo se aplica **al finalizar** la animación de apertura. El foco regresa al botón de origen al finalizar el cierre.

---

### Estados del formulario

| Estado | Descripción |
|---|---|
| Abierto | Foco en campo Sistólica. Focus trap activo. |
| Enviando | Inputs y botones `disabled`. Botón muestra "Guardando…". Escape no cierra. |
| Error de validación | Modal permanece abierta. Errores inline bajo cada campo (`role="alert"`, borde `#dc2626`). |
| Éxito | Animación de cierre → toast de éxito → historial y gráfica actualizados. |

---

### Errores inline

| Propiedad | Valor |
|---|---|
| Color texto | `#dc2626` |
| Borde campo erróneo | `2px solid #dc2626` |
| Fondo campo erróneo | `#fef2f2` |
| Tamaño fuente | 13 px |
| `role` del mensaje | `alert` |

---

### Accesibilidad (WCAG AA)

- `role="dialog"`, `aria-modal="true"`, `aria-labelledby` al título.
- Focus trap: ciclo Sistólica → Diastólica → Pulso → Fecha → Guardar → ✕ → (vuelta).
- Al cerrar: foco retorna al botón "Nueva medición".
- Botón ✕: `aria-label="Cerrar modal"`, área táctil 44 × 44 px.
- Overlay: `aria-hidden="true"`.
- Todos los `<label>` asociados a su `<input>` vía `for`/`id`.

---

## Layout dos columnas — especificaciones CSS

| Propiedad | Valor |
|---|---|
| Breakpoint | ≥ 768 px y ≥ 1 medición (clase `dashboard-content--columnas`) |
| Grid | `grid-template-columns: 55% 1fr; gap: 24px` |
| Columna gráfica | `position: sticky; top: calc(var(--header-height) + 8px)` |
| Columna historial | `overflow-y: auto; max-height: calc(100vh - var(--header-height) - var(--btn-nueva-height) - 48px)` |
| Variables globales | `--header-height: 56px`, `--btn-nueva-height: 48px` |

Con 0 mediciones: columna única siempre (mensaje vacío a ancho completo).  
Con 1 medición en desktop: dos columnas activas; columna gráfica muestra skeleton.

---

## Post-MVP

> **Registro por foto (OCR)** y **pantalla de ajustes (`#/settings`)**: no diseñar hasta que el Product Owner los priorice.
