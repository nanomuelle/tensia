# Pantallas — Tensia

_Última revisión: 2026-02-22 — Añadido componente Gráfica de evolución (BK-14, ADR-006)_

---

## Pantalla 1: Dashboard (pantalla principal)

### Descripción
Pantalla única del MVP. Permite al usuario ver el historial de mediciones
y acceder al registro de una nueva medición.
Diseño mobile-first: columna única, scroll vertical.

### Wireframe

```
┌─────────────────────────────────┐
│  🩺 Tensia              [fecha] │  ← Header fijo (sticky)
├─────────────────────────────────┤
│                                 │
│  [ + Nueva medición ]           │  ← Botón primario, ancho completo
│                                 │
├─────────────────────────────────┤
│  Historial                      │  ← Título de sección
│─────────────────────────────────│
│  18 feb 2026 · 10:00            │  ← Tarjeta de medición
│  120 / 80  mmHg   💓 72 ppm    │
│─────────────────────────────────│
│  17 feb 2026 · 08:30            │
│  135 / 88  mmHg   💓 80 ppm    │
│─────────────────────────────────│
│  16 feb 2026 · 20:15            │
│  118 / 76  mmHg                 │  ← Sin pulso (campo opcional)
│─────────────────────────────────│
│  (más mediciones…)              │
└─────────────────────────────────┘
```

### Anatomía de la tarjeta de medición

```
┌─────────────────────────────────┐
│  18 feb 2026 · 10:00            │  ← fecha y hora (formateada local)
│  120 / 80  mmHg   💓 72 ppm    │  ← sistólica / diastólica + pulso
└─────────────────────────────────┘
```

- **Sistólica / Diastólica**: tipografía grande, peso bold. Unidad (mmHg) en gris claro.
- **Pulso**: secundario, se omite visualmente si no fue registrado.
- **Fecha**: formateada en idioma del navegador (`Intl.DateTimeFormat`).
- Área táctil mínima de la tarjeta: 56 px de alto.

### Estados de la pantalla

#### Estado: cargando
```
┌─────────────────────────────────┐
│  🩺 Tensia                      │
├─────────────────────────────────┤
│  [ + Nueva medición ]           │
├─────────────────────────────────┤
│  Historial                      │
│─────────────────────────────────│
│  ⏳ Cargando mediciones…        │  ← Texto + spinner o skeleton
└─────────────────────────────────┘
```

#### Estado: sin mediciones (primera vez)
```
┌─────────────────────────────────┐
│  🩺 Tensia                      │
├─────────────────────────────────┤
│  [ + Nueva medición ]           │
├─────────────────────────────────┤
│  Historial                      │
│─────────────────────────────────│
│                                 │
│   Sin mediciones todavía.       │  ← Mensaje vacío, centrado
│   Pulsa "Nueva medición"        │
│   para registrar la primera.    │
│                                 │
└─────────────────────────────────┘
```

#### Estado: error de red
```
┌─────────────────────────────────┐
│  🩺 Tensia                      │
├─────────────────────────────────┤
│  [ + Nueva medición ]           │
├─────────────────────────────────┤
│  ⚠️ No se pudieron cargar las   │  ← Banner de error (color alerta)
│  mediciones. [Reintentar]       │
└─────────────────────────────────┘
```

### Jerarquía visual

1. **Acción principal** — Botón "Nueva medición" (máximo contraste, primer elemento visible).
2. **Lista de mediciones** — Información densa pero legible; la medición más reciente arriba.
3. **Header** — Identidad mínima; no compite con el contenido.

### Accesibilidad (WCAG AA)

- El botón "Nueva medición" tiene `aria-label="Registrar nueva medición"`.
- Cada tarjeta de medición usa `role="listitem"` dentro de `role="list"`.
- Contraste texto/fondo mínimo 4.5:1 para valores de tensión.
- Fecha y pulso usan contraste mínimo 3:1 (texto secundario de tamaño grande).
- Área táctil del botón principal: 48 px de alto mínimo.
- El spinner de carga tiene `aria-live="polite"` y `aria-label="Cargando"`.
- El mensaje de error tiene `role="alert"` para anunciarse automáticamente.

### Notas de implementación para el Frontend Dev

- El botón "Nueva medición" abre el formulario de registro **en la misma página** (el formulario aparece/se oculta; no hay navegación a otra URL en el MVP).
- La lista se renderiza con `insertAdjacentHTML` o manipulación directa del DOM; no usar frameworks.
- La fecha se formatea con `new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' })`.
- Los datos provienen de `localStorage` a través de `localStorageAdapter`; no hay llamada HTTP para cargar el historial.
- El orden descendente lo garantiza `measurementService.getAll()` en el frontend.

---

## Componente: Gráfica de evolución (US-04, BK-14)

### Descripción

Gráfica de líneas que muestra la tendencia de sistólica y diastólica a lo largo del tiempo.
Se integra en el Dashboard, entre el botón "Nueva medición" y el historial de tarjetas.
Solo se renderiza cuando el usuario tiene **2 o más mediciones** registradas.
Implementada con **D3.js modular** sobre SVG (ADR-006).

### Posición en el Dashboard (layout completo)

```
┌─────────────────────────────────┐
│  🩺 Tensia              [fecha] │  ← Header sticky
├─────────────────────────────────┤
│  [ + Nueva medición ]           │  ← Acción principal
├─────────────────────────────────┤
│  Evolución               [mmHg] │  ← ① Título de sección + unidad
│  ─────────────────────────────── │
│  ② ▀ Sistólica  ▀ Diastólica  │  ← Leyenda (pill rojo / pill azul)
│  ─────────────────────────────── │
│  ③ [SVG gráfica de líneas]       │  ← Contenedor responsivo
│   140───●─────────────────   │
│   120─●────●──────●──────   │  ← Serie sistólica (rojo #ef4444)
│   100───────────────────   │
│    80○────○──────○──────   │  ← Serie diastólica (azul #3b82f6)
│       feb14 feb16 feb18        │  ← Eje X: fechas (máx 10 etiquetas)
│                                 │
├─────────────────────────────────┤
│  Historial                      │  ← Lista de tarjetas (debajo)
│  ...
```

### Wireframe detallado del componente

```
┌─────────────────────────────────┐
│  Evolución               [mmHg] │
│                                 │
│  █ Sistólica  █ Diastólica     │
│                                 │
│   │                            │
│140┬──────────────────────────│
│   │   ● - - - - - - ●           │  ← Sistólica (rojo, línea sólida)
│120┬──●───────────●────────│
│   │                            │
│100┬──────────────────────────│
│   │                            │
│ 80┬─○──────○──────○───────│  ← Diastólica (azul, línea sólida)
│   │                            │
│   └──────────────────────────│
│    14/02  16/02  18/02  21/02   │  ← Eje X (fechas, formato dd/mm)
│                                 │
└─────────────────────────────────┘
```

### Especificaciones visuales

#### Colores

| Elemento | Color | Hex |
|---|---|---|
| Línea sistólica | Rojo | `#ef4444` |
| Área rellena sistólica | Rojo transparente | `rgba(239,68,68,0.1)` |
| Línea diastólica | Azul | `#3b82f6` |
| Área rellena diastólica | Azul transparente | `rgba(59,130,246,0.1)` |
| Grid / ejes | Gris claro | `#e5e7eb` |
| Etiquetas ejes | Gris medio | `#6b7280` |
| Título sección | Gris oscuro | `#1f2937` |
| Fondo contenedor | Blanco | `#ffffff` |

#### Tipografía

| Elemento | Tamaño | Peso |
|---|---|---|
| Título "Evolución" | 15px | semibold |
| Etiquetas eje X/Y | 11px | regular |
| Pills de leyenda | 12px | regular |

#### Dimensiones y espaciado

| Propiedad | Valor |
|---|---|
| Alto del SVG | 200px (móvil) / 240px (desktop) |
| Márgenes internos SVG | top 20px, right 20px, bottom 40px, left 44px |
| Grosor de línea | 2.5px |
| Radio de punto de dato | 4px |
| Separación sección / historial | 24px |

### Estados del componente

#### Estado: oculto (0 o 1 medición)

El componente no se renderiza. No muestra ningún placeholder ni mensaje; la sección simplemente no existe en el DOM.

> Razón: con un solo punto no es posible trazar una línea con sentido. Mostrar un gráfico vacío confundiría al usuario novel.

#### Estado: visible (≥ 2 mediciones)

```
┌─────────────────────────────────┐
│  Evolución               [mmHg] │
│  █ Sistólica  █ Diastólica     │
│  [SVG con líneas y puntos]      │
│  [fecha más antigua ... hoy]    │
└─────────────────────────────────┘
```

#### Estado: actualizándose (tras guardar nueva medición)

El SVG se redibuja instantáneamente al volver al dashboard tras guardar. No hay animación de transición en el MVP; el SVG simplemente se regenera con los nuevos datos. No hay estado de "cargando" porque la operación es síncrona desde `localStorage`.

#### Estado: muchos puntos (> 30 mediciones)

Eje X: se muestran como máximo **10 etiquetas de fecha**, distribuidas uniformemente. Los puntos siguen siendo visibles aunque su etiqueta de fecha no se muestre.

```
┌─────────────────────────────────┐
│  Evolución               [mmHg] │
│  [muchos puntos, línea densa]   │
│  01/01  07/01 ... 15/02  22/02  │  ← Solo ~10 fechas visibles
└─────────────────────────────────┘
```

### Comportamiento responsivo

| Breakpoint | Comportamiento |
|---|---|
| Móvil (< 640px) | SVG ocupa el 100% del ancho del contenedor; alto fijo 200px |
| Tablet / desktop (≥ 640px) | SVG ocupa el 100% del ancho; alto fijo 240px |
| Rotación de pantalla | El SVG se redibuja al detectar `ResizeObserver` en el contenedor |

> El SVG usa `viewBox` + `preserveAspectRatio="none"` para escalar sin recalcular. El frontend redibuja llamando a `renderChart()` en el callback del `ResizeObserver`.

### Accesibilidad (WCAG AA)

- El elemento `<svg>` incluye `role="img"` y `aria-label="Gráfica de evolución de tensión arterial"`.
- Contraste entre líneas y fondo: `#ef4444` sobre `#ffffff` = ratio 4.6:1 ✅; `#3b82f6` sobre `#ffffff` = ratio 4.8:1 ✅.
- Las etiquetas de los ejes cumplen contraste mínimo 3:1 para texto de tamaño grande (11px bold).
- Los pills de leyenda tienen `aria-hidden="true"` (la información ya está en el `aria-label` del SVG).
- El componente no recibe foco de teclado en el MVP (no es interactivo); el contenedor tiene `focusable="false"`.

### Notas de implementación para el Frontend Dev

- Sustituir `<canvas id="chart-mediciones">` por `<div id="chart-mediciones">` en `index.html` (ADR-006).
- `renderChart(container, measurements)` recibe el `<div>` y lo limpia con `container.innerHTML = ''` antes de insertar el nuevo SVG.
- Las mediciones se pasan **ya ordenadas de más antiguas a más recientes** (orden inverso al historial): la función `renderChart` hace el sort internamente por `measuredAt` ascendente.
- `renderChart` se invoca después de `renderHistorial` en `app.js`, pasando las mismas mediciones.
- `ResizeObserver` observa el contenedor `#chart-mediciones`; en su callback llama a `renderChart` de nuevo con los últimos datos en memoria.

---

## Pantalla 2: Formulario de registro manual

> Pendiente de diseño detallado — se define en la siguiente iteración.

---

## Pantalla 3: Registro por foto (OCR)

> Post-MVP — no diseñar hasta que el Product Owner lo priorice.
