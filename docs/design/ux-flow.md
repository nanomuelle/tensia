# Flujo UX — Tensia

---

## Flujo principal: Consultar historial

```
[Usuario abre la app]
        │
        ▼
[Dashboard — estado: cargando]
        │
        ├── GET /measurements OK ──▶ [Dashboard — lista de mediciones]
        │
        └── Error de red ──────────▶ [Dashboard — banner de error + botón Reintentar]
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
        │       ├── Validación OK → POST /measurements
        │       │         │
        │       │         ├── 201 Created ──▶ [Dashboard actualizado]
        │       │         │                   (nueva medición al inicio de la lista)
        │       │         │
        │       │         └── Error red/server ──▶ [Mensaje de error en formulario]
        │       │
        │       └── Validación KO ──▶ [Errores inline en cada campo]
        │
        └── [Cancelar] ──▶ [Dashboard sin cambios]
```

---

## Estados de la UI por acción

| Acción | Estado intermedio | Estado final OK | Estado final KO |
|---|---|---|---|
| Cargar historial | Spinner "Cargando…" | Lista de mediciones | Banner error + Reintentar |
| Guardar medición | Botón deshabilitado | Formulario oculto, lista actualizada | Mensaje de error inline |
| Reintentar carga | Spinner | Lista de mediciones | Banner error |

---

## Principios de navegación del MVP

- **Una sola página**: no hay routing. El formulario de registro se muestra/oculta sobre el dashboard.
- **Sin confirmación de borrado**: el MVP no incluye borrar mediciones.
- **Sin detalle de medición**: no hay pantalla de detalle; toda la info cabe en la tarjeta de la lista.
- **Retorno automático**: tras guardar con éxito, el formulario se cierra y la lista se refresca sola.
