# Contrato de integración — RAG Core API

**Estado:** aprobado para consumo frontend, con disponibilidad indicada por operación.  
**Fuente:** RAG Core SDD 1.5 / SYSTEM-1.1 / INTEROP-1.0 y código implementado, contrastados el 2026-09-05.
**Servicio:** `tjc-be-rag-core-api`; el navegador nunca consume directamente el Sandbox.

Este documento registra disponibilidad y detalles implementados para el frontend. La autoridad de rutas, DTOs y semántica compartida es `interoperability-contract.md`; este archivo no puede redefinirla.

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
- No hay contrato de autenticación aprobado en el alcance actual.

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

### Listado de proyectos — APROBADO, NO IMPLEMENTADO

`GET /projects?cursor&limit` devuelve `Page<ProjectResponse>` conforme a `INTEROP-1.0`. El adapter live permanece pendiente hasta que RAG Core implemente la ruta.

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

### Listado de ProjectVersions por proyecto — APROBADO, NO IMPLEMENTADO

`GET /projects/{projectId}/versions?cursor&limit` devuelve `Page<ProjectVersionSummaryResponse>` conforme a `INTEROP-1.0`. La demo puede conservar su adapter mock hasta que RAG Core implemente la ruta.

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

## Generación — contrato INTEROP-1.0 aprobado, no implementado

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

`POST /test-runs` crea el run y captura `currentVersionId`; status y resultados se consultan en `GET /test-runs/{runId}` y `/results`. Las combinaciones de `mode` y `targetId` se rigen por `INTEROP-1.0`. El frontend no usa `POST /tests/generate`.

## Validación — contrato INTEROP-1.0 aprobado, no implementado

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

`validation.valid=false` es un resultado normal de negocio/técnico, no un HTTP 5xx. `ValidationResponse`, `TargetRunResultResponse` y `TestRunResultsResponse` quedan definidos en `INTEROP-1.0`.

## Artifacts — contrato INTEROP-1.0 aprobado, no implementado

Entidad aprobada:

```ts
interface Artifact {
  id: string
  runId: string
  relativePath: string
  artifactType: 'CREATED' | 'MODIFIED'
  valid: boolean
}
```

`INTEROP-1.0` define listado por run, descarga individual, ZIP total y diff. `storageKey` nunca pertenece al DTO del navegador. Solicitar diff de un artifact `CREATED` produce `409 DIFF_NOT_AVAILABLE`.

## Experimento RAG vs agente generalista — transporte aprobado; ejecución bloqueada

Está aprobado un único experimento entre `RAG` y `GENERALIST_AGENT`, con tres repeticiones por target y estrategia por defecto y sin autorepair. `INTEROP-1.0` define rutas y DTOs sin usar `BASELINE`. La implementación continúa bloqueada por `DEC-EXP-002`, que debe definir las herramientas y límites del agente generalista. El resultado conserva:

- `compiled`, `executed`, `passed`, `valid`, `failureType`;
- `generationDurationMs`, `executionDurationMs`, `totalDurationMs`;
- `inputTokens`, `outputTokens`, `totalTokens`, `estimatedCost` cuando sea calculable;
- para RAG: `retrievedChunks`, `selectedChunks`, `contextTokens`;
- para el agente: `toolCalls`, `filesInspected` y contexto/tokens atribuibles a exploración cuando sean observables;
- tasas, diferencia en puntos porcentuales, media/mediana y distribución de fallos.

Rutas, DTOs y estados de transporte están aprobados; la lógica de ejecución permanece bloqueada por `DEC-EXP-002`.

Mutation score/StrykerJS no forma parte de este DTO: `DEC-MET-001` permanece PENDING y solo bloqueará el work item futuro que intente incorporarlo.

## Uso para validación empresarial

Solo respuestas obtenidas por adapters `live` pueden contabilizarse como evidencia de la validación en empresa. El modo mock nunca se exporta ni mezcla con resultados experimentales reales. Antes de conectar repositorios empresariales debe resolverse `DEC-VAL-001` en el contrato de sistema.

## Historial, WebSockets, reparación y retry — PENDING

RAG Core aprobó el comportamiento general, pero no fijó endpoints, eventos WebSocket ni DTOs. HTTP status/results seguirá existiendo como fallback cuando se incorpore WebSocket. El frontend no debe definir nombres de eventos ni comandos de retry antes del contrato backend.

## Matriz de disponibilidad para el frontend

| Capacidad | Contrato disponible | Puede integrarse sin supuestos |
|---|---|---:|
| Health | Implementado completo | sí |
| Crear proyecto | Implementado completo | sí |
| Consultar proyecto por id | Implementado completo | sí |
| Listar proyectos | INTEROP-1.0 aprobado; backend pendiente | sí, cuando exista la ruta |
| Iniciar indexación | Implementado completo | sí |
| Polling/resultados de ProjectVersion | Implementado completo | sí |
| Inventario | Implementado completo | sí |
| Generación/validación | INTEROP-1.0 aprobado; backend pendiente | sí, cuando exista la ruta |
| Artifacts | INTEROP-1.0 aprobado; backend pendiente | sí, cuando exista la ruta |
| Experimentos | Transporte aprobado; `DEC-EXP-002` bloquea ejecución | no todavía |
| Historial/WebSocket/retry | PENDING | no |
