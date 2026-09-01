# Evidencia — sincronización de contrato RAG Core

**Fecha:** 2026-08-31  
**Alcance:** contratos consumidos por `tjc-fe-rag-developer-console`

## Fuentes contrastadas

- SDD canónica de `tjc-be-rag-core-api` para proyectos, ProjectVersion, inventario, generación, validación, artifacts, experimento e historial.
- Controllers, DTOs, filtro de errores, middleware de correlación y pruebas e2e actualmente implementados en RAG Core.
- Adapters y tipos provisionales de `app/src` en este repositorio.

## Resultado

Se incorporó `spec/contracts/rag-core-api.md` como copia local versionada, con tres niveles: IMPLEMENTADO, APROBADO y PENDING. Esto evita presentar como cerrado un endpoint o DTO que el backend todavía no definió.

## Diferencias detectadas y estado actual

| Diferencia original | Contrato RAG Core | Estado |
|---|---|---|
| `GET /projects` con array o `{ items }` | Endpoint PENDING/no implementado | Aislado: la UI no lo consulta. |
| `Project.currentVersion` embebido | `Project.currentVersionId` | Resuelto. |
| `POST /projects/:id/versions` | `POST /projects/index` multipart | Resuelto. |
| `operationId` + `versionId` | `projectVersionId` identifica la operación | Resuelto. |
| `GET /analysis/:id[/results]` | `GET /project-versions/:id[/results]` | Resuelto. |
| Estados genéricos de análisis | Catálogo de `ProjectVersionStatus` | Resuelto. |
| Error body `requestId` | Body/header `correlationId` / `x-correlation-id` | Resuelto. |
| Resultado e inventario aislados por DTO PENDING | DTOs y rutas implementados en RAG Core SDD 1.2 | Resuelto y conectado. |
| Modo puntual `METHOD` | `TARGET` para METHOD o FUNCTION | Resuelto. |

## Bloqueos contractuales que permanecen en RAG Core

- Listado de proyectos.
- Rutas/DTO de generación, validación, artifacts, experimentos, WebSockets y retry.

La segunda sincronización conectó `app/` a status, resultados e inventario, manteniendo sin requests las capacidades que continúan PENDING.

## Validación

- `node scripts/sdd-check.mjs`: OK.
- `git diff --check`: OK.
- `npm run lint`: OK.
- `npm test -- --run`: OK, 12 archivos y 29 pruebas.
- `npm run build`: OK.
