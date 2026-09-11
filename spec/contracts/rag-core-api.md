# Contrato de integración — RAG Core API

**Estado:** aprobado para consumo frontend, con disponibilidad indicada por operación.  
**Fuente:** RAG Core SDD 1.16 / SYSTEM-1.6 / INTEROP-1.6 y código implementado, contrastados el 2026-09-11.
**Servicio:** `tjc-be-rag-core-api`; el navegador nunca consume directamente el Sandbox.

Este documento registra disponibilidad y detalles implementados para el frontend. La autoridad de rutas, DTOs y semántica compartida es `interoperability-contract.md`; este archivo no puede redefinirla.

El navegador entrega ZIPs a RAG Core mediante `POST /projects/index`. No accede a Supabase, no recibe `storageKey` ni URLs firmadas Core↔Sandbox y no persiste infraestructura del backend.

## Niveles de disponibilidad

- **IMPLEMENTADO:** existe en el backend y está cubierto por código o pruebas del servicio.
- **APROBADO:** forma parte de la spec canónica de RAG Core, pero puede estar aún en construcción.
- **PENDING:** contrato aprobado pero adapter/backend todavía no implementado, o feature bloqueada por una decisión explícita. El frontend no debe presentar un mock como implementación live.

## Convenciones comunes — IMPLEMENTADO

- Base URL: configurable mediante `VITE_CORE_API_URL`, sin prefijo de API adicional confirmado.
- JSON para requests/responses salvo upload multipart y descargas binarias.
- Correlación: header `x-correlation-id`. El cliente puede enviarlo; RAG Core lo devuelve y genera uno cuando falta.
- Las respuestas exitosas no usan un envelope común.
- Fechas confirmadas en responses implementadas: strings ISO 8601.
- Salvo `GET /health`, el navegador envía el access token de Supabase Auth como `Authorization: Bearer`. Core valida identidad y propietario; no se envía el token de usuario al Sandbox.
- `Idempotency-Key` UUID es obligatorio en los POST de generación, experimento y retry manual. El frontend crea una key por acción lógica y la reutiliza en retries de transporte.
- `SANDBOX_SERVICE_TOKEN` pertenece exclusivamente a Core↔Sandbox; el navegador no lo recibe ni almacena.

### ErrorEnvelope

Todo error HTTP normalizado por RAG Core tiene esta forma:

```ts
interface ErrorEnvelope {
  statusCode: number
  code: ErrorCode
  message: string
  details: unknown | null
  correlationId: string
  timestamp: string
  path: string
}
```

El frontend debe mostrar `message` y conservar `correlationId` para soporte. No debe esperar `requestId` en el body.

```ts
type ErrorCode =
  | 'INVALID_REQUEST'
  | 'ZIP_REQUIRED'
  | 'INVALID_ZIP'
  | 'INVALID_GENERATION_TARGET'
  | 'PROJECT_NOT_FOUND'
  | 'PROJECT_VERSION_NOT_FOUND'
  | 'TEST_RUN_NOT_FOUND'
  | 'ARTIFACT_NOT_FOUND'
  | 'PROJECT_NOT_READY'
  | 'PROJECT_INDEXING_IN_PROGRESS'
  | 'ANALYSIS_NOT_FINISHED'
  | 'TEST_RUN_NOT_FINISHED'
  | 'DIFF_NOT_AVAILABLE'
  | 'ZIP_TOO_LARGE'
  | 'UNSUPPORTED_PROJECT'
  | 'UNRESOLVABLE_TARGET'
  | 'INDEXING_FAILED'
  | 'GENERATION_FAILED'
  | 'ARTIFACT_PERSISTENCE_FAILED'
  | 'INTERNAL_ERROR'
  | 'SANDBOX_UNAVAILABLE'
  | 'STORAGE_UNAVAILABLE'
  | 'LLM_PROVIDER_UNAVAILABLE'
  | 'IDEMPOTENCY_KEY_REQUIRED'
  | 'INVALID_IDEMPOTENCY_KEY'
  | 'IDEMPOTENCY_CONFLICT'
  | 'TARGET_RETRY_NOT_ALLOWED'
  | 'UNSUPPORTED_PACKAGE_MANAGER'
  | 'AUTH_REQUIRED'
  | 'INVALID_ACCESS_TOKEN'
  | 'CONTEXT_TRACE_NOT_FOUND'
  | 'CONTEXT_TRACE_NOT_FINISHED'
```

## Health — IMPLEMENTADO

### `GET /health`

Respuesta `200 application/json`:

```ts
interface HealthResponse {
  status: 'ok'
  timestamp: string
}
```

## Proyectos — IMPLEMENTADO

### `POST /projects`

Request `application/json`:

```ts
interface CreateProjectRequest {
  name: string // 1..200 caracteres; RAG Core persiste trim(name)
}
```

Respuesta `201 application/json`:

```ts
interface ProjectResponse {
  id: string
  name: string
  currentVersionId: string | null
  createdAt: string
  updatedAt: string
}
```

Errores confirmados:

- `400 INVALID_REQUEST` cuando el body no cumple el DTO.

### `GET /projects/{projectId}`

Respuesta `200`: `ProjectResponse`.

Errores confirmados:

- `404 PROJECT_NOT_FOUND` cuando no existe el id.

### Listado de proyectos — IMPLEMENTADO

`GET /projects?cursor&limit` devuelve `Page<ProjectResponse>` conforme a `INTEROP-1.6`.

## Indexación de ProjectVersion — IMPLEMENTADO

La identidad de la operación de indexación es `projectVersionId`; no existe un `operationId` separado en el contrato aprobado.

```ts
type ProjectVersionStatus =
  | 'PENDING'
  | 'EXTRACTING'
  | 'ANALYZING'
  | 'CHUNKING'
  | 'EMBEDDING'
  | 'PERSISTING'
  | 'COMPLETED'
  | 'FAILED'
```

### `POST /projects/index`

Request `multipart/form-data`:

| Campo | Tipo | Requerido | Significado |
|---|---|---:|---|
| `file` | ZIP binario | sí | Snapshot a validar e indexar. |
| `projectId` | string | no | Proyecto existente al que se agrega una versión. |
| `name` | string | no | Nombre para el flujo que crea proyecto. |

Si se envía `projectId`, RAG Core agrega una versión al proyecto existente e ignora `name`. Si no se envía `projectId`, crea un proyecto con `trim(name)` o con `Proyecto sin nombre` cuando `name` está ausente/vacío.

Respuesta `202 application/json`:

```ts
interface IndexProjectAcceptedResponse {
  projectId: string
  projectVersionId: string
  status: 'PENDING'
  pollAfterMs: number
}
```

Errores confirmados para este flujo:

- `400 ZIP_REQUIRED` o `INVALID_ZIP`.
- `404 PROJECT_NOT_FOUND` cuando se envía un `projectId` inexistente.
- `409 PROJECT_INDEXING_IN_PROGRESS` si ya existe una indexación activa para el proyecto.
- `400 ZIP_TOO_LARGE`.
- `422 UNSUPPORTED_PROJECT`.
- Los fallos de infraestructura al iniciar el snapshot se normalizan mediante `ErrorEnvelope`; RAG Core todavía no usa `STORAGE_UNAVAILABLE` en todos esos caminos.

### `GET /project-versions/{projectVersionId}`

Respuesta `200 application/json`:

```ts
interface ProjectVersionResponse {
  id: string
  projectId: string
  status: ProjectVersionStatus
  originalFileName: string | null
  sizeBytes: number | null
  filesProcessed: number | null
  chunksCount: number | null
  failureReason: string | null
  startedAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}
```

El polling conserva el `pollAfterMs` recibido en el `202`; el DTO de status no lo repite ni expone porcentaje numérico.

Estados terminales: `COMPLETED` y `FAILED`.

Errores aprobados:

- `404 PROJECT_VERSION_NOT_FOUND`.

### `GET /project-versions/{projectVersionId}/results`

Respuesta `200 application/json`:

```ts
interface ProjectVersionResultsResponse {
  id: string
  projectId: string
  status: 'COMPLETED'
  filesProcessed: number
  chunksCount: number
  detectedFramework: string | null
  targetsTotal: number
  targetsWithTest: number
  targetsMissingTest: number
  completedAt: string | null
}
```

- Antes de `COMPLETED`: `409 ANALYSIS_NOT_FINISHED`.
- Id inexistente: `404 PROJECT_VERSION_NOT_FOUND`.

### Listado de ProjectVersions por proyecto — IMPLEMENTADO

`GET /projects/{projectId}/versions?cursor&limit` devuelve `Page<ProjectVersionSummaryResponse>` conforme a `INTEROP-1.6`. La demo puede conservar su adapter mock, pero no confundirlo con live.

## Inventario de tests — IMPLEMENTADO

### `GET /project-versions/{projectVersionId}/test-inventory`

Respuesta `200 application/json`:

```ts
type TestTargetType = 'CLASS' | 'METHOD' | 'FUNCTION'

interface TestTargetResponse {
  id: string
  filePath: string
  symbolName: string
  methodName: string | null
  targetType: TestTargetType
  hasTest: boolean
  testFilePaths: string[]
}

interface TestInventoryResponse {
  projectVersionId: string
  detectedFramework: string | null
  targetsTotal: number
  targetsWithTest: number
  targetsMissingTest: number
  targets: TestTargetResponse[]
}
```

- Antes de `COMPLETED`: `409 ANALYSIS_NOT_FINISHED`.
- Id inexistente: `404 PROJECT_VERSION_NOT_FOUND`.

## Generación — IMPLEMENTADA E INTEGRADA

Semántica aprobada:

```ts
type GenerationMode =
  | 'TARGET'
  | 'CLASS_ALL'
  | 'CLASS_MISSING'
  | 'PROJECT_MISSING'
  | 'PROJECT_ALL'

interface CreateTestRunRequest {
  projectId: string
  mode: GenerationMode
  targetId?: string
}
```

`POST /test-runs` crea el run y captura `currentVersionId`; status y resultados se consultan en `GET /test-runs/{runId}` y `/results`. Las combinaciones de `mode` y `targetId` se rigen por `INTEROP-1.6`. El frontend no usa `POST /tests/generate`.

El contrato exige `Idempotency-Key`; Core implementa deduplicación durable. El adapter frontend crea una key por acción lógica y la reutiliza solo para retries de esa acción.

## Validación — IMPLEMENTADA E INTEGRADA

Semántica aprobada:

```ts
type FailureType =
  | 'NONE'
  | 'COMPILATION'
  | 'TEST_ASSERTION'
  | 'TEST_RUNTIME'
  | 'DEPENDENCY'
  | 'CONFIGURATION'
  | 'INFRASTRUCTURE'
  | 'UNKNOWN'
```

`validation.valid=false` es un resultado normal de negocio/técnico, no un HTTP 5xx. `ValidationResponse`, `TargetRunResultResponse` y `TestRunResultsResponse` quedan definidos en `INTEROP-1.6`. La autenticación Core↔Sandbox es independiente del token del usuario.

## Artifacts — IMPLEMENTADOS EN CORE; ADAPTER FRONTEND PENDIENTE

Entidad aprobada:

```ts
interface ArtifactResponse {
  id: string
  runId: string
  relativePath: string
  artifactType: 'CREATED' | 'MODIFIED'
  valid: boolean
  targetIds: string[]
}
```

`INTEROP-1.6` define listado por run, descarga individual, ZIP total y diff. `storageKey` nunca pertenece al DTO del navegador. Solicitar diff de un artifact `CREATED` produce `409 DIFF_NOT_AVAILABLE`.

## Experimento RAG vs agente generalista — IMPLEMENTADO E INTEGRADO

Está aprobado un único experimento entre `RAG` y `GENERALIST_AGENT`, con tres repeticiones por target y estrategia por defecto y sin autorepair. `INTEROP-1.6` define rutas y DTOs sin usar `BASELINE`. `DEC-EXP-002` está APROBADO y el backend existe. El POST exige `Idempotency-Key` y Core implementa su deduplicación durable. El resultado conserva:

- `compiled`, `executed`, `passed`, `valid`, `failureType`;
- `generationDurationMs`, `executionDurationMs`, `totalDurationMs`;
- `inputTokens`, `outputTokens`, `totalTokens`, `estimatedCost` cuando sea calculable;
- para RAG: `retrievedChunks`, `selectedChunks`, `contextTokens`;
- para el agente: `toolCalls`, `filesInspected` y contexto/tokens atribuibles a exploración cuando sean observables;
- tasas, diferencia en puntos porcentuales, media/mediana y distribución de fallos.

Rutas, DTOs, estados de transporte, contrato operativo del agente y backend están disponibles. El frontend puede implementar el adapter live sin inventar contrato.

Mutation score/StrykerJS no forma parte de este DTO: `DEC-MET-001` permanece PENDING y solo bloqueará el work item futuro que intente incorporarlo.

## Uso para validación empresarial

Solo respuestas obtenidas por adapters `live` pueden contabilizarse como evidencia de la validación en empresa. El modo mock nunca se exporta ni mezcla con resultados experimentales reales. Antes de conectar repositorios empresariales debe resolverse `DEC-VAL-001` en el contrato de sistema.

## Explorador de contexto — APROBADO; IMPLEMENTACIÓN PENDIENTE

`INTEROP-1.6` sección 6.7 define listados/detalle para runs y experimentos, paginación de archivos descubiertos y la unión discriminada `RAG|AGENT`. El frontend puede construir adapters live sin inventar DTOs, pero debe tratar estas rutas como no disponibles hasta que Core publique su implementación.

- RAG entrega candidatos seleccionados y descartados, señales, scores, tokens y motivo de descarte.
- AGENT entrega trayectoria cronológica observable, tool calls y excerpts; no entrega chain-of-thought ni afirma contexto utilizado.
- Los listados muestran el último intento por defecto y aceptan `includeSuperseded=true`.
- `ArtifactResponse.targetIds` permite abrir el explorador filtrado desde un artifact.

## Autenticación web — APROBADA; IMPLEMENTACIÓN PENDIENTE

Supabase Auth resuelve la sesión del navegador. Core exige Bearer para recursos privados, guarda propietario en `Project` y responde `404` tanto para recursos inexistentes como ajenos. `AUTH_REQUIRED` e `INVALID_ACCESS_TOKEN` son errores `401`. Un bypass solo se admite en configuración local/mock y debe impedir el arranque productivo.

## Historial, WebSockets y retry manual — IMPLEMENTADOS EN CORE

`INTEROP-1.6` fija e implementa historial paginado (`GET /project-versions/{projectVersionId}/test-runs`), suscripciones Socket.IO por id y eventos `project-version:update`/`test-run:update`, manteniendo HTTP como fallback. HU24 usa `POST /test-runs/{runId}/targets/{targetId}/retry` sobre un target `INVALID`/`FAILED` de un run terminal y exige `Idempotency-Key`.

HU23 está descartada definitivamente: no existen reparación automática, attempts ni corrección vía LLM. El frontend debe eliminar cualquier supuesto anterior al respecto.

## Matriz de disponibilidad para el frontend

| Capacidad | Contrato disponible | Puede integrarse sin supuestos |
|---|---|---:|
| Health | Implementado completo | sí |
| Crear proyecto | Implementado completo | sí |
| Consultar proyecto por id | Implementado completo | sí |
| Listar proyectos | Implementado en Core | sí |
| Iniciar indexación | Implementado completo | sí |
| Polling/resultados de ProjectVersion | Implementado completo | sí |
| Inventario | Implementado completo | sí |
| Generación/validación | Implementado e integrado end-to-end | sí |
| Artifacts | Implementado en Core | sí |
| Experimentos | Implementado e integrado; idempotencia durable | sí |
| Historial/WebSocket/retry | Implementado en Core y Developer Console | sí |
| Explorador de contexto RAG/agente | Aprobado en `INTEROP-1.6`; Core pendiente | sí, cuando Core publique las rutas |
| Autenticación correo + propiedad | Aprobada en `INTEROP-1.6`; Core/FE pendientes | sí |
| GitHub real | `DEC-GH-001` PENDING | no |
| GitHub simulado | Contrato de demo frontend | sí, solo mock y rotulado |
