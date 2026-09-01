# 001-projects — Especificación

**Estado:** aprobado para SDD 1.0 salvo elementos marcados PENDING/PROPOSED.  
**Historias:** HU01

## Objetivo

Crear y seleccionar proyectos de análisis.

## Reglas y comportamiento

- Permitir crear un proyecto y navegar a su detalle.
- El DTO de RAG Core expone `currentVersionId`; no entrega un objeto `currentVersion` embebido.
- Mostrar estado/versión actual cuando exista requiere consultar el contrato de ProjectVersion una vez cerrado.
- No confundir Project con ProjectVersion.
- Contratos vigentes: `POST /projects` y `GET /projects/:projectId` según [`../../contracts/rag-core-api.md`](../../contracts/rag-core-api.md).
- El listado `GET /projects` está `PENDING`; no asumir array ni envelope de paginación.

## Fuera de alcance

- No ampliar a capacidades no mencionadas en esta spec.
- No convertir decisiones PENDING en implementación definitiva sin aprobación.
