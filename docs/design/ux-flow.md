# Flujo UX — Tensia

_Última revisión: 2026-02-23_

---

## Flujo principal: Cargar el historial

```
[Usuario abre la app]
        │
        ▼
[Dashboard — lectura de localStorage]
        │
        ├── 0 mediciones ──▶ [Estado vacío: mensaje + columna única]
        │
        ├── 1 medición ───▶ [Lista con 1 tarjeta + skeleton de gráfica]
        │                    (layout dos columnas si viewport ≥ 768 px)
        │
        ├── ≥ 2 mediciones ▶ [Lista + gráfica de líneas]
        │                    (layout dos columnas si viewport ≥ 768 px)
        │
        └── Error localStorage ▶ [Banner error + botón Reintentar]
```

---

## Flujo principal: Registrar medición manual

```
[Dashboard]
        │
  [+ Nueva medición]
        │
        ▼
[Modal se abre con animación]
[Foco va al campo Sistólica]
[Focus trap activo]
        │
        ├── [Rellenar campos + Guardar]
        │       │
        │       ├── Validación KO ──▶ [Errores inline, modal permanece abierta]
        │       │
        │       └── Validación OK
        │               │
        │         [Estado Enviando: inputs + botón disabled]
        │               │
        │         [Escritura en localStorage]
        │               │
        │               ├── Éxito ──▶ [Modal se cierra]
        │               │             [Foco vuelve al botón "Nueva medición"]
        │               │             [Historial y gráfica se actualizan]
        │               │             [Toast de éxito ~3 s]
        │               │
        │               └── Error ──▶ [Inputs y botón vuelven a habilitarse]
        │                             [Mensaje de error en el formulario]
        │
        └── [✕ / Escape / click en overlay]  (no disponible mientras se guarda)
                │
                ▼
            [Modal se cierra con animación]
            [Foco vuelve al botón "Nueva medición"]
            [Dashboard sin cambios]
```

---

## Flujo: Gráfica de evolución

```
[Dashboard se carga o se añade una medición]
        │
        ├── N < 2 ──▶ [MeasurementChart muestra skeleton "Sin datos suficientes"]
        │
        └── N ≥ 2 ──▶ [SVG con líneas sistólica y diastólica]

[Usuario rota pantalla o redimensiona ventana]
        │
        ▼
[ResizeObserver detecta cambio en el contenedor]
        │
        ▼
[renderChart() redibuja el SVG al nuevo ancho]
```

---

## Flujo: Layout responsivo

```
[Dashboard con ≥ 1 medición]
        │
        ├── Viewport < 768 px ──▶ [Columna única: skeleton/gráfica encima, historial debajo]
        │
        └── Viewport ≥ 768 px ──▶ [Dos columnas]
                                    Izquierda (55 %): gráfica o skeleton — sticky
                                    Derecha (45 %): historial — scroll independiente

[0 mediciones] ──▶ [Columna única siempre, mensaje vacío a ancho completo]
```

---

## Tabla de estados por acción

| Acción | Estado intermedio | OK | KO |
|---|---|---|---|
| Cargar historial | "Cargando…" (síncrono, muy breve) | Lista + gráfica | Banner error + Reintentar |
| Abrir modal | Animación apertura | Modal abierta, foco en Sistólica | — |
| Cerrar modal (✕ / Escape / overlay) | Animación cierre | Dashboard sin cambios, foco en botón | — |
| Guardar — validación KO | — | Modal abierta con errores inline | — |
| Guardar — validación OK | Enviando (inputs + botón disabled) | Modal cerrada, lista actualizada, toast éxito | Error inline, inputs re-habilitados |
| Reintentar carga | "Cargando…" | Lista + gráfica | Banner error |
| Rotar / redimensionar pantalla | — | Gráfica redibujada, layout adaptado | — |

---

## Principios de navegación del MVP

- **Una sola vista**: router hash-based (`#/`). No hay navegación entre páginas en el MVP.
- **Sin HTTP para datos**: carga y guardado son operaciones síncronas sobre `localStorage`.
- **Sin borrado de mediciones**: no existe flujo de borrado en el MVP.
- **Sin detalle de medición**: toda la información cabe en la tarjeta del historial.
- **Retorno automático**: tras guardar con éxito, la modal se cierra y la UI se actualiza sola (store reactivo de Svelte).
