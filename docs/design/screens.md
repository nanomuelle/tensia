# Pantallas — Tensia

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
- El orden lo garantiza el backend (`GET /measurements` devuelve descendente); el frontend no ordena.

---

## Pantalla 2: Formulario de registro manual

> Pendiente de diseño detallado — se define en la siguiente iteración.

---

## Pantalla 3: Registro por foto (OCR)

> Post-MVP — no diseñar hasta que el Product Owner lo priorice.
