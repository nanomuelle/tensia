# MVP Scope

_Última revisión: 2026-02-19 — Actualizado para reflejar ADR-005 y confirmación de OCR como Post-MVP_

## Objetivo
Permitir a un usuario registrar y consultar sus mediciones de tensión arterial en modo **anónimo**, con datos almacenados en el propio dispositivo (`localStorage`), sin login ni servidores de datos.

## Incluido
- Registro manual de medición
- Persistencia en `localStorage` del navegador (gestionada desde el frontend mediante `localStorageAdapter`)
- Listado de mediciones ordenado por fecha descendente
- PWA instalable: `manifest.json` + Service Worker (cache del shell, uso offline)
- Aviso informativo en Safari/iOS sobre la limitación de 7 días de `localStorage` (política ITP)
- Arquitectura frontend/backend desacoplada (ADR-002, ADR-005)
- Tests con cobertura mínima del 70 %

## Excluido del MVP (no implementar sin confirmación)
- **Registro por foto (OCR)** — confirmado Post-MVP (US-02, BK-13)
- Login / autenticación
- Google Drive (persistencia multi-dispositivo)
- Recordatorios o notificaciones
- Gráficas de evolución temporal
- Diagnóstico médico o alertas clínicas
