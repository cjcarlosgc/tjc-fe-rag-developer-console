# 001-projects — Especificación

**Estado:** vigente para el flujo PR-driven; aceptación live pendiente de reauditar.
**Historias:** HU01

## Objetivo

Crear y seleccionar proyectos de análisis.

## Reglas y comportamiento

- Permitir crear un proyecto y navegar a su detalle.
- El DTO de RAG Core expone `currentVersionId`; no entrega un objeto `currentVersion` embebido.
- Mostrar estado/versión interna actual usa `currentVersionId` y el listado paginado de versiones del contrato vigente; no ofrece carga de versiones por ZIP.
- No confundir Project con ProjectVersion.
- Contratos vigentes: `POST /projects`, `GET /projects/{projectId}` y `GET /projects?cursor&limit` según [`../../contracts/interoperability-contract.md`](../../contracts/interoperability-contract.md).
- El listado devuelve `Page<ProjectResponse>` con cursor opaco; no asumir un array directo.

## Fuera de alcance

- No ampliar a capacidades no mencionadas en esta spec.
- No convertir decisiones PENDING en implementación definitiva sin aprobación.
