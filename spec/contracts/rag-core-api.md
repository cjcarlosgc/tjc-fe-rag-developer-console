# Contrato de integración — RAG Core API

**Estado:** aprobado para consumo frontend, con disponibilidad indicada por operación.  
**Fuente:** SDD 1.2 y código de `tjc-be-rag-core-api`, contrastados el 2026-08-31.  
**Servicio:** `tjc-be-rag-core-api`; el navegador nunca consume directamente el Sandbox.

Este documento es la copia canónica local del contrato que necesita el frontend. Si RAG Core cambia una ruta, DTO, estado o error, este archivo y `CHANGELOG.md` deben actualizarse en el mismo cambio coordinado antes de adaptar la UI.

## Niveles de disponibilidad

- **IMPLEMENTADO:** existe en el backend y está cubierto por código o pruebas del servicio.
- **APROBADO:** forma parte de la spec canónica de RAG Core, pero puede estar aún en construcción.
- **PENDING:** RAG Core todavía no fijó la ruta o el DTO exacto. El frontend no debe inventarlo ni tratar un adapter provisional como definitivo.

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

### Listado de proyectos — PENDING

RAG Core no define ni implementa `GET /projects`. Hasta que el backend apruebe el contrato de listado, el frontend no puede asumir `ProjectResponse[]` ni `{ items: ProjectResponse[] }` como respuesta definitiva.

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

### Listado de ProjectVersions por proyecto — PENDING

RAG Core conserva múltiples versiones, pero todavía no publicó una ruta ni DTO
para listarlas por proyecto. El frontend no debe asumir una ruta como
`GET /projects/{projectId}/versions` ni una forma de paginación. La demo puede
representar este historial detrás del adapter mock.

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

## Generación — contrato HTTP parcial

Semántica aprobada:

```ts
type GenerationMode =
  | 'TARGET'
  | 'CLASS_ALL'
  | 'CLASS_MISSING'
  | 'PROJECT_MISSING'
  | 'PROJECT_ALL'

interface TestTarget {
  projectId: string
  filePath: string
  symbolName: string
  methodName?: string
  targetType: 'CLASS' | 'METHOD' | 'FUNCTION'
}
```

`TARGET` resuelve un target exacto `METHOD` o `FUNCTION`; no admite `CLASS`. El backend captura `currentVersionId` al crear el run. Ruta, request DTO definitivo, respuesta `202`, contrato de status/results y estructura por target permanecen **PENDING**. En particular, `POST /tests/generate` no está confirmado por RAG Core.

## Validación — DTO de transporte PENDING

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

`validation.valid=false` es un resultado normal de negocio/técnico, no un HTTP 5xx. El DTO debe permitir representar `compiled`, `executed`, `passed`, `valid` y `failureType`; nombres, nulabilidad y estructura final permanecen **PENDING**.

## Artifacts — contrato HTTP parcial

Entidad aprobada:

```ts
interface Artifact {
  id: string
  runId: string
  relativePath: string
  artifactType: 'CREATED' | 'MODIFIED'
  storageKey: string
  valid: boolean
}
```

RAG Core proveerá descarga individual, descarga total y diff, pero sus rutas, content types, filenames vía headers y DTO de diff permanecen **PENDING**. Solicitar diff de un artifact `CREATED` produce `409 DIFF_NOT_AVAILABLE`.

## Experimento RAG vs agente generalista — contrato HTTP PENDING

Está aprobado un único experimento entre RAG y un agente generalista, con tres repeticiones por target y estrategia por defecto y sin autorepair. El agente generalista explora el código y reúne sus propias referencias; no es un LLM aislado ni sin contexto. Mientras el DTO definitivo siga `PENDING`, el view model conserva `BASELINE` como identificador técnico interno y la UI lo presenta como `Agente generalista`. El resultado debe conservar:

- `compiled`, `executed`, `passed`, `valid`, `failureType`;
- `generationDurationMs`, `executionDurationMs`, `totalDurationMs`;
- `inputTokens`, `outputTokens`, `totalTokens`, `estimatedCost` cuando sea calculable;
- para RAG: `retrievedChunks`, `selectedChunks`, `contextTokens`;
- tasas, diferencia en puntos porcentuales, media/mediana y distribución de fallos.

Rutas, DTOs y estados de ejecución permanecen **PENDING**.

## Historial, WebSockets, reparación y retry — PENDING

RAG Core aprobó el comportamiento general, pero no fijó endpoints, eventos WebSocket ni DTOs. HTTP status/results seguirá existiendo como fallback cuando se incorpore WebSocket. El frontend no debe definir nombres de eventos ni comandos de retry antes del contrato backend.

## Matriz de disponibilidad para el frontend

| Capacidad | Contrato disponible | Puede integrarse sin supuestos |
|---|---|---:|
| Health | Implementado completo | sí |
| Crear proyecto | Implementado completo | sí |
| Consultar proyecto por id | Implementado completo | sí |
| Listar proyectos | PENDING | no |
| Iniciar indexación | Implementado completo | sí |
| Polling/resultados de ProjectVersion | Implementado completo | sí |
| Inventario | Implementado completo | sí |
| Generación/validación | Semántica parcial; HTTP/DTO PENDING | no |
| Artifacts | Semántica parcial; HTTP/DTO PENDING | no |
| Experimentos | Métricas aprobadas; HTTP/DTO PENDING | no |
| Historial/WebSocket/retry | PENDING | no |
