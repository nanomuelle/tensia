# Pantallas — Tensia

_Última revisión: 2026-02-22 — Añadidos: modal formulario (BK-20/US-13) y layout columnas (BK-21/US-14)_

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

## Pantalla 2: Modal del formulario de registro (US-13, BK-20)

_Diseño validado: 2026-02-22 — BK-20 completado._

### Descripción

El formulario de nueva medición se muestra en una ventana modal que se superpone sobre el Dashboard. Al activarse, el resto del contenido queda bloqueado mediante un overlay semitransparente que impide la interacción con el fondo (teclado y puntero).

En móvil (< 640 px) la modal adopta el patrón **bottom sheet**: aparece anclada al borde inferior, ocupa el 100 % del ancho y presenta esquinas superiores redondeadas. En tablet/desktop (≥ 640 px) la modal se centra en pantalla con un ancho máximo de **480 px**.

---

### Wireframe — Estado: Abierta — Desktop / Tablet (≥ 640 px)

```
┌──────────────────────────────────────────────────┐  ← Overlay rgba(0,0,0,0.45)
│                                                  │
│   ┌──────────────────────────────────────────┐   │  ← Contenedor modal
│   │  Nueva medición                     [✕] │   │  ← Cabecera sticky
│   ├──────────────────────────────────────────┤   │    ✕ alineado al extremo derecho
│   │                                          │   │
│   │  Sistólica (mmHg) *                      │   │
│   │  ┌──────────────────────────────────┐    │   │
│   │  │  120                             │    │   │
│   │  └──────────────────────────────────┘    │   │
│   │                                          │   │
│   │  Diastólica (mmHg) *                     │   │
│   │  ┌──────────────────────────────────┐    │   │
│   │  │  80                              │    │   │
│   │  └──────────────────────────────────┘    │   │
│   │                                          │   │
│   │  Pulso (ppm)                             │   │  ← Campo opcional
│   │  ┌──────────────────────────────────┐    │   │
│   │  │  72                              │    │   │
│   │  └──────────────────────────────────┘    │   │
│   │                                          │   │
│   │  Fecha y hora *                          │   │
│   │  ┌──────────────────────────────────┐    │   │
│   │  │  2026-02-22T10:30                │    │   │
│   │  └──────────────────────────────────┘    │   │
│   │                                          │   │
│   │  ┌──────────────────────────────────┐    │   │
│   │  │     Guardar medición             │    │   │  ← Botón primario
│   │  └──────────────────────────────────┘    │   │
│   └──────────────────────────────────────────┘   │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Dimensiones del contenedor modal (desktop/tablet):**

| Propiedad | Valor |
|---|---|
| Ancho máximo | 480 px |
| Ancho mínimo | 320 px |
| Padding interior | 24 px |
| Border-radius | 12 px |
| Sombra | `0 20px 60px rgba(0,0,0,0.25)` |
| Posición vertical | centrada con `translate(-50%, -50%)` |
| Fondo contenedor | `#ffffff` |

---

### Wireframe — Estado: Abierta — Móvil (< 640 px) — Bottom sheet

```
┌─────────────────────────────────┐
│                                 │
│   (dashboard visible pero       │  ← Overlay rgba(0,0,0,0.45)
│    bloqueado al puntero)        │     El usuario no puede hacer scroll
│                                 │     ni tocar nada debajo del overlay
├─────────────────────────────────┤  ← Borde superior redondeado (16 px)
│          ══════                 │  ← Handle visual: pill gris claro,
│                                 │     centrado, 40 × 4 px, color #d1d5db
│  Nueva medición            [✕] │  ← Cabecera; ✕ a la derecha (24×24 px)
├─────────────────────────────────┤
│  Sistólica (mmHg) *             │
│  ┌─────────────────────────┐    │
│  │  120                    │    │
│  └─────────────────────────┘    │
│  Diastólica (mmHg) *            │
│  ┌─────────────────────────┐    │
│  │  80                     │    │
│  └─────────────────────────┘    │
│  Pulso (ppm)                    │
│  ┌─────────────────────────┐    │
│  │  72                     │    │
│  └─────────────────────────┘    │
│  Fecha y hora *                 │
│  ┌─────────────────────────┐    │
│  │  2026-02-22T10:30       │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │  ← Botón primario, ancho completo
│  │   Guardar medición      │    │
│  └─────────────────────────┘    │
└─────────────────────────────────┘
```

**Dimensiones del bottom sheet (móvil):**

| Propiedad | Valor |
|---|---|
| Ancho | 100 % del viewport |
| Posición | anclado al borde inferior (`bottom: 0`) |
| Border-radius | 16 px top-left / top-right; 0 bottom |
| Padding interior | 16 px lateral, 20 px superior/inferior |
| Handle pill | 40 × 4 px, color `#d1d5db`, centrado, margin-top 8 px |
| Fondo contenedor | `#ffffff` |

---

### Estado: Cerrando (transición de salida)

La modal no desaparece al instante. Al activarse el cierre (✕, Escape o click en overlay), se reproduce la animación de salida **antes** de retirar el elemento del DOM; el atributo `hidden` o la clase `modal--hidden` se aplica **al finalizar** la transición.

```
Desktop/Tablet:
  opacity:   1.0  →  0.0   (200 ms, ease-in)
  transform: translateY(0)  →  translateY(16px)  (200 ms, ease-in)

Móvil (bottom sheet):
  transform: translateY(0)  →  translateY(100%)  (240 ms, ease-in)
  opacity:   1.0  →  0.0   (200 ms, ease-in, delay 40 ms)

Overlay (ambos casos):
  opacity:   0.45  →  0   (200 ms, ease-in)
```

> Durante la transición de cierre el botón ✕ queda deshabilitado (`pointer-events: none`) para evitar doble disparo. El foco **no se devuelve** al elemento de origen hasta que la transición finaliza (escuchar `transitionend`).

---

### Estado: Enviando (guardado en curso)

Mientras se ejecuta el guardado en `localStorage`, el formulario muestra el estado de progreso:

```
│   ┌──────────────────────────────────────────┐   │
│   │  Nueva medición                     [✕] │   │  ← ✕ sigue visible pero deshabilitado
│   ├──────────────────────────────────────────┤   │
│   │  Sistólica (mmHg) *                      │   │
│   │  ┌──────────────────────────────────┐    │   │
│   │  │  120                  [bloqueado] │   │   │  ← Inputs deshabilitados
│   │  └──────────────────────────────────┘    │   │
│   │  ...                                     │   │
│   │  ┌──────────────────────────────────┐    │   │
│   │  │  ⏳ Guardando…        [disabled] │    │   │  ← Botón deshabilitado + texto
│   │  └──────────────────────────────────┘    │   │
│   └──────────────────────────────────────────┘   │
```

- Los cuatro campos de entrada pasan a `disabled`.
- El botón "Guardar medición" cambia a "Guardando…" y queda `disabled`.
- El botón ✕ queda `disabled` y con `opacity: 0.4` (no se puede cerrar mientras se guarda).
- Pulsar `Escape` durante esta fase **no** cierra la modal.
- La operación sobre `localStorage` es síncrona y típicamente dura < 5 ms; aun así se aplica este estado para robustez visual y evitar dobles envíos.

---

### Estado: Error de validación

Los errores se muestran **inline**, justo debajo del campo afectado. La modal permanece abierta.

```
│   ┌──────────────────────────────────────────┐   │
│   │  Nueva medición                     [✕] │   │
│   ├──────────────────────────────────────────┤   │
│   │  Sistólica (mmHg) *                      │   │
│   │  ┌──────────────────────────────────┐    │   │
│   │  │                                  │    │   │  ← Campo vacío / borde rojo
│   │  └──────────────────────────────────┘    │   │
│   │  ⚠ Este campo es obligatorio.            │   │  ← Mensaje error, color #dc2626
│   │                                          │   │
│   │  Diastólica (mmHg) *                     │   │
│   │  ┌──────────────────────────────────┐    │   │
│   │  │  200                             │    │   │  ← Valor fuera de rango
│   │  └──────────────────────────────────┘    │   │
│   │  ⚠ La diastólica no puede ser ≥ sistólica│   │  ← Mensaje error contextual
│   │                                          │   │
│   │  ...                                     │   │
│   │  ┌──────────────────────────────────┐    │   │
│   │  │     Guardar medición             │    │   │  ← Botón vuelve a estar habilitado
│   │  └──────────────────────────────────┘    │   │
│   └──────────────────────────────────────────┘   │
```

**Reglas de estilo para errores inline:**

| Propiedad | Valor |
|---|---|
| Color del texto de error | `#dc2626` (rojo de alerta) |
| Icono | ⚠ (unicode, no imagen) |
| Tamaño de fuente del error | 13 px |
| Borde del campo con error | `2px solid #dc2626` |
| Fondo del campo con error | `#fef2f2` (rojo muy tenue) |
| Posición del mensaje | Debajo del input, `margin-top: 4 px` |
| `role` del mensaje | `role="alert"` para anunciarse por lectores de pantalla |

---

### Animación de apertura

```
Desktop/Tablet:
  opacity:   0.0  →  1.0   (180 ms, ease-out)
  transform: translateY(16px)  →  translateY(0)  (180 ms, ease-out)

Móvil (bottom sheet):
  transform: translateY(100%)  →  translateY(0)  (260 ms, cubic-bezier(0.32,0.72,0,1))
  opacity:   0.0  →  1.0   (180 ms, ease-out, delay 20 ms)

Overlay (ambos casos):
  opacity:   0  →  0.45   (180 ms, ease-out)
```

> El primer campo (`Sistólica`) recibe el foco **al finalizar** la animación de apertura, no antes, para evitar interferencias con la transición CSS.

---

### Especificaciones visuales del botón de cierre (✕)

```
┌──────────────────────────────────────────┐
│  Nueva medición                     [✕] │
│                                          │
```

| Propiedad | Valor |
|---|---|
| Símbolo | `×` (U+00D7) o icono SVG 16 × 16 px |
| Tamaño del área táctil | 44 × 44 px (centrada sobre el símbolo) |
| Color del símbolo | `#6b7280` (gris neutro) |
| Color en hover | `#111827` (gris oscuro) |
| Color en disabled | `#d1d5db`, `opacity: 0.4` |
| Posición | Esquina superior derecha del encabezado, padding 12 px |
| `aria-label` | `"Cerrar modal"` |
| Borde | Ninguno; fondo transparente |
| Border-radius al hacer focus | 8 px (foco visible con `outline`) |

---

### Comportamiento — Tabla de interacciones

| Acción | Estado en curso | Resultado |
|---|---|---|
| Pulsar "Nueva medición" | — | Modal se abre con animación; foco a campo Sistólica |
| Pulsar `Escape` (abierta) | Normal o error | Modal se cierra; foco vuelve al botón "Nueva medición" |
| Pulsar `Escape` (enviando) | Enviando | Sin efecto (la modal no se cierra) |
| Pulsar overlay (fuera de la modal) | Normal o error | Modal se cierra; foco vuelve al botón "Nueva medición" |
| Pulsar overlay (enviando) | Enviando | Sin efecto |
| Pulsar botón ✕ | Normal o error | Modal se cierra; foco vuelve al botón "Nueva medición" |
| Pulsar botón ✕ | Enviando | Sin efecto (botón deshabilitado) |
| `Tab` / `Shift+Tab` dentro de la modal | — | El foco cicla entre los controles internos (focus trap) |
| Guardar con datos válidos | — | Animación cierre → toast éxito → historial y gráfica actualizados |
| Guardar con datos inválidos | — | Modal permanece abierta; errores inline en los campos afectados |

---

### Focus trap — Orden de tabulación

El foco queda confinado dentro de la modal mientras está abierta. El orden de tabulación (Tab) es:

1. Campo **Sistólica**
2. Campo **Diastólica**
3. Campo **Pulso**
4. Campo **Fecha y hora**
5. Botón **Guardar medición**
6. Botón **✕ Cerrar** → vuelve a 1 (ciclo)

`Shift+Tab` invierte el orden.

---

### Accesibilidad (WCAG AA)

- El elemento raíz de la modal tiene `role="dialog"`, `aria-modal="true"` y `aria-labelledby="modal-title"` (donde `modal-title` es el id del h2 "Nueva medición").
- **Focus trap** activo durante toda la vida del modal abierto.
- Al cerrar la modal, el foco retorna al botón "Nueva medición" que la abrió.
- El overlay tiene `aria-hidden="true"` para los lectores de pantalla (no es un control interactivo).
- El botón ✕ tiene `aria-label="Cerrar modal"`.
- Los mensajes de error inline tienen `role="alert"` para ser anunciados por lectores de pantalla sin necesidad de foco explícito.
- La cabecera de la modal es un `<h2>` con contraste de color mínimo 4.5:1 sobre el fondo blanco.
- Todos los `<label>` están asociados explícitamente a su `<input>` mediante `for`/`id`.
- Áreas táctiles mínimas: 48 px de alto para el botón "Guardar medición", 44 × 44 px para el botón ✕.
- El handle visual del bottom sheet en móvil es puramente decorativo: `aria-hidden="true"`, sin rol interactivo.

---

### Notas de implementación para el Frontend Dev (BK-22)

- El overlay (`<div class="modal-overlay">`) se inserta como hijo directo de `#app`, **fuera** del flujo del historial y de la gráfica, para evitar conflictos de `z-index` con el SVG de D3.
- El contenedor modal (`<div class="modal" role="dialog" …>`) es hijo del overlay o hermano a `#app`; se recomienda `z-index: 200` para el overlay y `z-index: 201` para la modal.
- Las transiciones de apertura/cierre se implementan con CSS (`transition: opacity, transform`); la apertura añade la clase `modal--open`; el cierre añade `modal--closing` y, tras `transitionend`, aplica `hidden`.
- En móvil, la clase `modal--bottom-sheet` se activa con `@media (max-width: 639px)`.
- El focus trap se implementa capturando el evento `keydown` con `Tab`/`Shift+Tab` dentro de la modal y redirigiendo el foco al primer/último elemento focusable cuando se sale de los extremos.
- La lista de elementos focusables dentro de la modal: `input:not([disabled])`, `button:not([disabled])`.
- Al abrir la modal, guardar en una variable la referencia al elemento que tenía el foco previamente (el botón "Nueva medición") y restaurarlo al cerrar.
- La transición `cubic-bezier(0.32, 0.72, 0, 1)` para el bottom sheet en móvil imita el comportamiento de las sheets nativas de iOS.
- La operación de guardado es síncrona sobre `localStorage`; el estado "Enviando" se activa antes de llamar al servicio y se desactiva al finalizar (éxito o error).

---

## Layout: Gráfica + Historial en columnas (US-14, BK-21)

_Diseño validado: 2026-02-22 — BK-21 completado._

### Descripción

En pantallas con viewport ≥ 768 px, el Dashboard organiza la gráfica y el historial en **dos columnas** para aprovechar el espacio horizontal disponible. La columna izquierda aloja la gráfica de evolución con comportamiento `sticky`, de modo que permanece visible al hacer scroll. La columna derecha contiene el historial con scroll independiente.

En móvil y tablet estrecha (< 768 px) el layout colapsa a **columna única**: gráfica encima, historial debajo (comportamiento actual del MVP sin cambios).

---

### Breakpoints

| Rango de viewport | Layout | Descripción |
|---|---|---|
| < 768 px | Columna única | Comportamiento MVP actual; gráfica encima, historial debajo |
| ≥ 768 px | Dos columnas | Gráfica sticky a la izquierda (55 %), historial scrollable a la derecha (45 %) |

> Se elige 768 px como breakpoint porque coincide con el punto en que el dispositivo tiene suficiente ancho para mostrar la gráfica legible (≥ 420 px) y el historial con sus tarjetas sin truncar texto.

---

### Wireframe — Columna única (< 768 px)

Sin cambios respecto al layout actual del MVP:

```
┌─────────────────────────────────┐
│  🩺 Tensia              [fecha] │  ← Header sticky (--header-height: 56px)
├─────────────────────────────────┤
│  [ + Nueva medición ]           │  ← Botón ancho completo
├─────────────────────────────────┤
│  Evolución              [mmHg]  │
│  █ Sistólica  █ Diastólica     │
│  [SVG gráfica — 100% ancho]     │  ← Alto fijo 200px en móvil
├─────────────────────────────────┤
│  Historial                      │
│  ─────────────────────────────  │
│  18 feb 2026 · 10:00            │  ← Tarjetas
│  120 / 80 mmHg  💓 72 ppm      │
│  ─────────────────────────────  │
│  (scroll de página normal)      │
└─────────────────────────────────┘
```

---

### Wireframe — Dos columnas (≥ 768 px)

```
┌─────────────────────────────────────────────────────────┐
│  🩺 Tensia                                     [fecha]  │  ← Header sticky
├─────────────────────────────────────────────────────────┤
│  [ + Nueva medición ]                                   │  ← Botón ancho completo
├─────────────────────────────┬───────────────────────────┤
│                             │                           │
│  Evolución         [mmHg]   │  Historial                │
│                             │  ───────────────────────  │
│  █ Sistólica                │  18 feb 2026 · 10:00      │
│  █ Diastólica               │  120/80 mmHg  💓 72 ppm  │
│                             │  ───────────────────────  │
│  ┌─────────────────────┐    │  17 feb 2026 · 08:30      │
│  │ SVG gráfica de      │    │  135/88 mmHg  💓 80 ppm  │
│  │ líneas (D3)         │    │  ───────────────────────  │
│  │ alto: 240px         │    │  16 feb 2026 · 20:15      │
│  └─────────────────────┘    │  118/76 mmHg              │
│                             │  ───────────────────────  │
│  [ sticky: permanece        │  (más mediciones…)        │
│    visible al hacer         │                           │
│    scroll del historial ]   │  ↕ scroll independiente   │
│                             │                           │
└─────────────────────────────┴───────────────────────────┘
  ←────── 55 % del ancho ──────→←───── 45 % del ancho ────→
  ←──── gap: 24 px ────────────→
```

---

### Especificaciones de layout

#### Proporciones de columnas

| Propiedad | Valor |
|---|---|
| Columna izquierda (gráfica) | `55%` — garantiza ≥ 420 px en viewport de 768 px |
| Columna derecha (historial) | `1fr` (aproximadamente 45 % menos el gap) |
| Gap entre columnas | `24 px` |
| Sistema de layout | `display: grid; grid-template-columns: 55% 1fr` |
| `align-items` del grid | `start` (ambas columnas se alinean al tope) |

> La proporción 55/45 proporciona a la gráfica espacio suficiente para ser legible, y al historial el mínimo de ~320 px para mostrar tarjetas sin truncar. Si en tests visuales la gráfica resulta demasiado grande, se puede ajustar a 50/50 sin impacto en el resto del diseño.

#### Columna izquierda — Gráfica sticky

| Propiedad | Valor |
|---|---|
| `position` | `sticky` |
| `top` | `calc(var(--header-height) + 8px)` |
| Comportamiento | La gráfica permanece visible en el viewport al hacer scroll del historial |
| Alto del SVG | `240 px` (igual que en desktop de columna única) |
| Ancho del SVG | `100 %` del contenedor de columna |
| `ResizeObserver` | Ya existente; se redibuja al cambiar el ancho de la columna |
| `overflow` | `visible` (no recortar el SVG) |

#### Columna derecha — Historial scrollable

| Propiedad | Valor |
|---|---|
| `overflow-y` | `auto` |
| `max-height` | `calc(100vh - var(--header-height) - var(--btn-nueva-height) - 48px)` |
| Scroll visual | Scrollbar del sistema (nativa); no personalizar en el MVP |
| `padding-right` | `4 px` (para que la scrollbar no solape el borde de las tarjetas) |

> El valor `48px` del `max-height` absorbe el padding vertical del contenedor principal y el gap entre el botón y el área de dos columnas.

#### Variables CSS requeridas

Deben definirse en `main.css` o `:root`:

| Variable | Valor por defecto |
|---|---|
| `--header-height` | `56px` |
| `--btn-nueva-height` | `48px` |

---

### Wireframe — Estado: skeleton (< 2 mediciones) en layout dos columnas

Cuando hay < 2 mediciones no se muestra la gráfica. El área izquierda permanece visible con el **skeleton** (mensaje "Sin datos suficientes") para no crear un desequilibrio visual excesivo. El historial ocupa la columna derecha con normalidad.

```
┌─────────────────────────────────────────────────────────┐
│  🩺 Tensia                                     [fecha]  │
├─────────────────────────────────────────────────────────┤
│  [ + Nueva medición ]                                   │
├─────────────────────────────┬───────────────────────────┤
│                             │                           │
│  ┌─────────────────────┐    │  Historial                │
│  │                     │    │  ───────────────────────  │
│  │  Sin datos          │    │  18 feb 2026 · 10:00      │
│  │  suficientes para   │    │  120/80 mmHg              │
│  │  mostrar la         │    │  ───────────────────────  │
│  │  gráfica            │    │  Sin más mediciones       │
│  │                     │    │                           │
│  └─────────────────────┘    │                           │
│  [ sticky ]                 │                           │
└─────────────────────────────┴───────────────────────────┘
```

- El `div.chart-skeleton` ocupa la columna izquierda con `min-height: 120 px` para evitar que quede demasiado pequeño.
- El skeleton es sticky igual que la gráfica real: permanece visible si el historial crece.

---

### Wireframe — Estado: sin gráfica ni skeleton (0 mediciones)

Con 0 mediciones no hay gráfica ni skeleton: la columna izquierda queda vacía. Para evitar el desequilibrio visual, en 0 mediciones el layout **vuelve a columna única** (gráfica y historial apilados) aunque el viewport sea ≥ 768 px. El mensaje "Sin mediciones todavía" ocupa el ancho completo.

```
┌─────────────────────────────────────────────────────────┐
│  🩺 Tensia                                     [fecha]  │
├─────────────────────────────────────────────────────────┤
│  [ + Nueva medición ]                                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   Sin mediciones todavía.                               │  ← Columna única
│   Pulsa "Nueva medición" para registrar la primera.     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

> **Regla**: el layout dos columnas solo se activa si hay al menos 1 medición registrada (el historial tiene contenido). Con 0 mediciones se usa siempre columna única independientemente del viewport.

---

### Espaciado y alineación

| Elemento | Espaciado |
|---|---|
| Padding exterior del contenedor principal | `16 px` lateral en móvil; `24 px` lateral en ≥ 768 px |
| Gap entre botón "Nueva medición" y el área de columnas | `24 px` (margin-top del contenedor `.dashboard-content`) |
| Separación entre tarjetas del historial | `1 px` (borde / divisor) o `8 px` vertical si se usan tarjetas con fondo |
| Padding interno de cada tarjeta | `12 px` vertical, `16 px` horizontal |
| Título de sección ("Historial", "Evolución") | `font-size: 15 px`, `font-weight: 600`, `margin-bottom: 12 px` |
| Margen entre título de sección y primer elemento | `8 px` |

---

### Comportamiento responsivo al cambiar tamaño

| Evento | Comportamiento |
|---|---|
| Viewport pasa de < 768 px a ≥ 768 px | CSS activa el grid automáticamente; no se requiere JS |
| Viewport pasa de ≥ 768 px a < 768 px | CSS desactiva el grid; columna única inmediata |
| Rotación del dispositivo | Si el nuevo viewport ≥ 768 px, el layout cambia a dos columnas; `ResizeObserver` redibuja la gráfica |
| Cambio de tamaño de ventana (desktop) | `ResizeObserver` redibuja la gráfica al nuevo ancho de columna, sin necesidad de lógica de layout adicional |

---

### Accesibilidad (WCAG AA)

- El contenedor `.dashboard-content` es un `<div>` neutro, sin rol semántico propio (no es `<main>` o `<section>`); la semántica la aportan los componentes hijos ya documentados.
- El scroll independiente del historial no introduce trampas de teclado: el foco puede salir de la columna con `Tab` normalmente.
- El historial con scroll propio no oculta el foco visualmente al tabular hacia una tarjeta fuera del viewport visible; el navegador debe hacer scroll automático (`scroll-into-view`) en tarjetas focuseadas.
- La gráfica sticky no superpone contenido interactivo al scrollear (el SVG no tiene controles interactivos en el MVP).
- No usar `overflow: hidden` en la columna de la gráfica para no recortar el sticky.

---

### Notas de implementación para el Frontend Dev (BK-23)

- Envolver `#chart-mediciones` y `#historial` en `<div class="dashboard-content">` dentro de `HomeView.js`.
- Asignar las clases `dashboard-content__chart` y `dashboard-content__historial` a cada columna respectivamente.
- La activación del grid solo aplica si hay ≥ 1 medición. Con 0 mediciones, añadir la clase `dashboard-content--vacio` al contenedor para sobrescribir el grid con `display: block`.
- El CSS del grid puede vivir en un nuevo parcial `apps/frontend/public/styles/components/DashboardLayout.css` importado desde `main.css`, o añadirse a `main.css` directamente.
- Snippet de referencia CSS:

```css
/* DashboardLayout.css */
.dashboard-content {
  margin-top: 24px;
}

@media (min-width: 768px) {
  .dashboard-content:not(.dashboard-content--vacio) {
    display: grid;
    grid-template-columns: 55% 1fr;
    gap: 24px;
    align-items: start;
  }

  .dashboard-content__chart {
    position: sticky;
    top: calc(var(--header-height) + 8px);
    overflow: visible;
  }

  .dashboard-content__historial {
    overflow-y: auto;
    max-height: calc(100vh - var(--header-height) - var(--btn-nueva-height) - 48px);
    padding-right: 4px;
  }
}
```

- Variables `--header-height: 56px` y `--btn-nueva-height: 48px` en `:root` de `main.css`.
- El `ResizeObserver` de `chart.js` ya observa `#chart-mediciones`; no requiere cambios.
- Verificar que el skeleton (`div.chart-skeleton`) tiene `min-height: 120px` para no colapsar la columna izquierda.

## Pantalla 3: Registro por foto (OCR)

> Post-MVP — no diseñar hasta que el Product Owner lo priorice.
