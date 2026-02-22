# Flujo UX — Tensia

_Última revisión: 2026-02-22 — Actualizado para ADR-005 (sin HTTP para datos) y gráfica de evolución (BK-14)_

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
  [+ Nueva medición]
        │
        ▼
[Formulario de registro — aparece en la misma página]
        │
        ├── [Rellenar: sistólica, diastólica, pulso?, fecha]
        │
        ├── [Guardar]
        │       │
        │       ├── Validación KO ▶ [Errores inline en cada campo]
        │       │
        │       └── Validación OK ──▶ [Escritura en localStorage]
        │                             │
        │                             ├── Éxito ▶ [Dashboard actualizado]
        │                             │          (nueva tarjeta al inicio del historial)
        │                             │          (gráfica se redibuja si ≥ 2 mediciones)
        │                             │
        │                             └── Error ▶ [Mensaje error en formulario]
        │
        └── [Cancelar] ▶ [Dashboard sin cambios]
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

## Estados de la UI por acción

| Acción | Estado intermedio | Estado final OK | Estado final KO |
|---|---|---|---|
| Cargar historial | "Cargando…" (síncrono, muy breve) | Lista + gráfica (si ≥ 2) | Banner error + Reintentar |
| Guardar medición | Botón deshabilitado | Formulario oculto, lista + gráfica actualizadas | Mensaje de error inline |
| Reintentar carga | "Cargando…" | Lista + gráfica (si ≥ 2) | Banner error |
| Rotar pantalla | — | Gráfica redibujada al nuevo ancho | — |

---

## Principios de navegación del MVP

- **Una sola página**: no hay routing. El formulario de registro se muestra/oculta sobre el dashboard.
- **Sin llamadas HTTP para datos**: la carga y guardado son operaciones síncronas de `localStorage` (ADR-005).
- **Sin confirmación de borrado**: el MVP no incluye borrar mediciones.
- **Sin detalle de medición**: no hay pantalla de detalle; toda la info cabe en la tarjeta de la lista.
- **Retorno automático**: tras guardar con éxito, el formulario se cierra y la lista + gráfica se refrescan solas.
