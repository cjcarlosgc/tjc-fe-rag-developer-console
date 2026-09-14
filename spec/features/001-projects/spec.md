# 001-projects — Especificación

**Estado:** aprobado para SDD 1.0 salvo elementos marcados PENDING/PROPOSED.  
**Historias:** HU01

## Objetivo

Crear y seleccionar proyectos de análisis.

## Reglas y comportamiento

- Permitir crear un proyecto y navegar a su detalle.
- El DTO de RAG Core expone `currentVersionId`; no entrega un objeto `currentVersion` embebido.
- Mostrar estado/versión actual usa `currentVersionId` y el listado paginado de versiones ya cerrado en `INTEROP-2.1`.
- No confundir Project con ProjectVersion.
- Contratos vigentes: `POST /projects`, `GET /projects/:projectId` y `GET /projects?cursor&limit` según [`../../contracts/rag-core-api.md`](../../contracts/rag-core-api.md).
- El listado devuelve `Page<ProjectResponse>` con cursor opaco; no asumir un array directo.

## Fuera de alcance

- No ampliar a capacidades no mencionadas en esta spec.
- No convertir decisiones PENDING en implementación definitiva sin aprobación.
