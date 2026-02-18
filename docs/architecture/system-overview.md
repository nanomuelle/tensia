# System Overview

## Arquitectura

Frontend (UI)
    ↓ HTTP
Backend (API REST)
    ↓
Persistence Layer (Local Storage Adapter)

## Principios
- Separación estricta de capas
- Frontend no accede directamente a Local Storage
- Persistencia intercambiable en el futuro
