# 002-upload-analysis — Especificación

> **Retirado por SDD 2.1:** la carga ZIP (`POST /projects/index`) queda retirada como
> ruta de producto en Core (`INTEROP-2.1` §6.2, ver `CHANGELOG.md` de
> `tjc-be-rag-core-api`); no existe backend que la acepte, ni siquiera como
> compatibilidad legacy. El formulario/UI de esta spec (`analysis/UploadVersion.tsx`,
> alcanzable vía `LegacyToolsPage`) queda como código histórico sin ruta de backend
> real detrás — no se elimina de este repositorio, pero no orienta el producto
> vigente. Las lecturas de `ProjectVersion` que describe el resto de esta spec
> sí sobreviven, solo cambia su origen (snapshot por commit SHA vía
> `RepositoryBinding`, HU33/34, pendiente de implementación en Core). Ver
> `harness/reports/console-interop-2.1-sync.md`.

**Estado:** aprobado para SDD 1.0 salvo elementos marcados PENDING/PROPOSED.  
**Historias:** HU02, HU03, HU04, HU05, HU07

## Objetivo

Cargar ZIP, seguir indexación y presentar resultado de una ProjectVersion.

## Reglas y comportamiento

- Upload ZIP con validación cliente básica, sin reemplazar validación servidor.
- Mostrar errores estructurados `INVALID_ZIP`, `ZIP_TOO_LARGE`, `UNSUPPORTED_PROJECT`, etc.
- Iniciar con `POST /projects/index` multipart; RAG Core responde `projectId`, `projectVersionId`, `status=PENDING` y `pollAfterMs`.
- `projectVersionId` identifica también la operación; no asumir un `operationId` separado.
- Polling V1 usa `GET /project-versions/:projectVersionId`, parte del `pollAfterMs` inicial y termina en `COMPLETED`/`FAILED`.
- Obtener resultado con `GET /project-versions/:projectVersionId/results`; antes de completar se espera `409 ANALYSIS_NOT_FINISHED`.
- Estados intermedios: `PENDING`, `EXTRACTING`, `ANALYZING`, `CHUNKING`, `EMBEDDING`, `PERSISTING`.
- Reindexación crea nueva versión y conserva historial.
- En modo demo, el proyecto semilla expone al menos tres ProjectVersions
  completadas en un historial cronológico y permite consultar el inventario de
  cada una. La versión actual se identifica de forma explícita.
- Consultar una versión histórica es una operación de lectura; la generación
  normal continúa usando la `currentVersionId` del proyecto.
- El listado de ProjectVersions está cerrado como `GET /projects/{projectId}/versions?cursor&limit` → `Page<ProjectVersionSummaryResponse>`; el adapter live todavía debe implementarse.
- El DTO de status no repite `pollAfterMs` ni expone porcentaje; el resumen confirmado incluye archivos, chunks, framework e inventario agregado según [`../../contracts/rag-core-api.md`](../../contracts/rag-core-api.md).

## Fuera de alcance

- No ampliar a capacidades no mencionadas en esta spec.
- No convertir decisiones PENDING en implementación definitiva sin aprobación.
