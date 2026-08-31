# 002-upload-analysis — Especificación

**Estado:** aprobado para SDD 1.0 salvo elementos marcados PENDING/PROPOSED.  
**Historias:** HU02, HU03, HU04, HU05, HU07

## Objetivo

Cargar ZIP, seguir indexación y presentar resultado de una ProjectVersion.

## Reglas y comportamiento

- Upload ZIP con validación cliente básica, sin reemplazar validación servidor.
- Mostrar errores estructurados `INVALID_ZIP`, `ZIP_TOO_LARGE`, `UNSUPPORTED_PROJECT`, etc.
- Polling V1 usa pollAfterMs y termina en COMPLETED/FAILED.
- Reindexación crea nueva versión y conserva historial.

## Fuera de alcance

- No ampliar a capacidades no mencionadas en esta spec.
- No convertir decisiones PENDING en implementación definitiva sin aprobación.
