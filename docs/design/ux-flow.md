# Flujo UX — Tensia

_Última revisión: 2026-02-22 — Actualizado para ADR-005 (sin HTTP para datos), gráfica de evolución (BK-14), modal del formulario (BK-20) y layout dos columnas (BK-21)_

---

## Flujo principal: Consultar historial y gráfica

```
[Usuario abre la app]
        │
        ▼
[Dashboard — estado: cargando]
(lectura síncrona de localStorage)
        │
        ├── 0 mediciones ──▶ [Dashboard — estado: vacío]
        │                      (mensaje "Sin mediciones todavía")
        │                      (gráfica NO se muestra)
        │
        ├── 1 medición ───▶ [Dashboard — 1 tarjeta en historial]
        │                      (gráfica NO se muestra; 1 punto no forma línea)
        │
        ├── ≥ 2 mediciones ▶ [Dashboard — historial + GRÁFICA visible]
        │
        └── Error localStorage ▶ [Dashboard — banner error + Reintentar]
```

---

## Flujo principal: Registrar medición manual

```
[Dashboard]
        │
  [+ Nueva medición]       ← el botón es el "opener" (recibe el foco al cerrar)
        │
        ▼
[Animación de apertura — overlay + modal aparecen]
(180 ms ease-out en desktop; 260 ms cubic-bezier en bottom-sheet móvil)
        │
        ▼
[Modal de registro — abierta]
  (foco va al campo Sistólica al terminar la animación)
  (focus trap activo: Tab/Shift+Tab ciclan dentro de la modal)
        │
        ├── [Rellenar: sistólica, diastólica, pulso?, fecha]
        │
        ├── [Guardar]
        │       │
        │       ├── Validación KO ▶ [Errores inline bajo cada campo afectado]
        │       │                    (modal permanece abierta; rol="alert")
        │       │
        │       └── Validación OK
        │               │
        │               ▼
        │       [Estado: Enviando — inputs y botón deshabilitados]
        │               │
        │               ▼
        │       [Escritura síncrona en localStorage]
        │               │
        │               ├── Éxito ──▶ [Animación de cierre de la modal]
        │               │             (foco vuelve al botón "Nueva medición")
        │               │             [Dashboard actualizado]
        │               │               (nueva tarjeta al inicio del historial)
        │               │               (gráfica se redibuja si ≥ 2 mediciones)
        │               │             [Toast de éxito — visible ~3 s]
        │               │
        │               └── Error ──▶ [Inputs y botón vuelven a habilitarse]
        │                             [Mensaje de error inline en el formulario]
        │
        ├── [✕ / Escape / click en overlay]   ← no disponible mientras se guarda
        │       │
        │       ▼
        │   [Animación de cierre de la modal]
        │   (foco vuelve al botón "Nueva medición" al terminar la animación)
        │   [Dashboard sin cambios]
        │
        └── [Tab hasta Guardar → Shift+Tab → cicla al campo Sistólica]
```

---

## Flujo: Aparición y actualización de la gráfica

```
[Dashboard se carga con N mediciones]
        │
        ├── N < 2 ▶ [Sección "Evolución" oculta (no existe en DOM)]
        │
        └── N ≥ 2 ▶ [Sección "Evolución" visible]
                         │
                         [renderChart(container, mediciones)]
                         │
                         [SVG insertado en #chart-mediciones]

[Usuario guarda nueva medición]
        │
        ▼
[Total mediciones pasa a N+1]
        │
        ├── N+1 = 2 ▶ [Gráfica aparece por primera vez]
        └── N+1 > 2 ▶ [Gráfica se redibuja con el nuevo punto]

[Usuario rota pantalla o redimensiona ventana]
        │
        ▼
[ResizeObserver detecta cambio en #chart-mediciones]
        │
        ▼
[renderChart() se llama de nuevo — SVG se regenera al nuevo ancho]
```

---

## Flujo: Apertura y cierre de la modal

```
[Botón "Nueva medición" en Dashboard]
        │
        ▼
[Overlay + modal aparecen con animación de apertura]
[Focus trap se activa]
[Foco va al campo Sistólica]
        │
        ├── [Escape] ────────────────────────────────┐
        ├── [Click en overlay] ─────────────────────┤
        ├── [Botón ✕] ──────────────────────────────┤
        │                                            ▼
        │                     [Animación de cierre (200-240 ms)]
        │                     [Focus trap se desactiva]
        │                     [Foco vuelve al botón "Nueva medición"]
        │
        └── [Guardar con éxito] ────────────────────▶ (igual que arriba)
```

---

## Flujo: Layout responsivo — dos columnas (≥ 768 px)

```
[Dashboard se carga con viewport ≥ 768 px y ≥ 1 medición]
        │
        ▼
[CSS activa display:grid — columna izquierda: gráfica / columna derecha: historial]
        │
        ├── 0 mediciones ──▶ [Columna única (clase dashboard-content--vacio)]
        │                      Mensaje "Sin mediciones todavía" — ancho completo
        │
        ├── 1 medición ───▶ [Dos columnas activadas]
        │                      Columna izquierda: skeleton "Sin datos suficientes"
        │                      Columna derecha: historial con 1 tarjeta
        │
        └── ≥ 2 mediciones ▶ [Dos columnas activadas]
                               Columna izquierda: gráfica SVG (sticky)
                               Columna derecha: historial scrollable

[Usuario hace scroll del historial]
        │
        ▼
[La gráfica queda fija gracias a position:sticky]
[El historial desplaza de forma independiente]

[Usuario redimensiona ventana o rota dispositivo]
        │
        ├── Viewport pasa a < 768 px ──▶ [CSS desactiva el grid — columna única inmediata]
        │
        └── Viewport permanece ≥ 768 px ▶ [ResizeObserver redibuja SVG al nuevo ancho]
                                           [Layout mantiene las dos columnas]

[Usuario guarda nueva medición desde modal]
        │
        ├── Total pasa a 1 medición ──▶ [Dos columnas se activan (si viewport ≥ 768 px)]
        │                               [Skeleton en columna izquierda]
        │
        └── Total pasa a ≥ 2 mediciones ▶ [Gráfica aparece/se redibuja en columna izquierda]
```

---

## Estados de la UI por acción

| Acción | Estado intermedio | Estado final OK | Estado final KO |
|---|---|---|---|
| Cargar historial | "Cargando…" (síncrono, muy breve) | Lista + gráfica (si ≥ 2) | Banner error + Reintentar |
| Abrir modal | Animación apertura (180-260 ms) | Modal abierta, foco en Sistólica | — |
| Cerrar modal (✕ / Escape / overlay) | Animación cierre (200-240 ms) | Dashboard sin cambios, foco en botón | — |
| Guardar medición — validación KO | — | Modal permanece abierta, errores inline | — |
| Guardar medición — validación OK | Enviando (inputs + botón disabled) | Modal cerrada, lista + gráfica actualizadas, toast éxito | Mensaje error inline, inputs + botón re-enabled |
| Reintentar carga | "Cargando…" | Lista + gráfica (si ≥ 2) | Banner error |
| Rotar pantalla | — | Gráfica redibujada al nuevo ancho | — |

---

## Principios de navegación del MVP

- **Una sola página**: no hay routing. El formulario de registro se muestra/oculta sobre el dashboard.
- **Sin llamadas HTTP para datos**: la carga y guardado son operaciones síncronas de `localStorage` (ADR-005).
- **Sin confirmación de borrado**: el MVP no incluye borrar mediciones.
- **Sin detalle de medición**: no hay pantalla de detalle; toda la info cabe en la tarjeta de la lista.
- **Retorno automático**: tras guardar con éxito, el formulario se cierra y la lista + gráfica se refrescan solas.
