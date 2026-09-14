# Adapters live: Analysis Runs + historial de ProjectVersion (HU25/HU32)

**Estado:** DONE
**Repository:** `tjc-fe-rag-developer-console`
**Story IDs:** HU01, HU25, HU32
**Origen:** el usuario pidió implementar "las funciones que el backend expone en
SDD 2.1" tras la sincronización de contrato (`console-interop-2.1-sync.md`).
Antes de escribir código se leyeron los controllers reales de
`tjc-be-rag-core-api` (no solo el contrato aprobado) para saber exactamente qué
existe hoy vs qué solo está aprobado-pero-pendiente.

## Qué tiene Core implementado hoy (6 controllers, verificado leyendo el código)

`ProjectsController`, `ProjectVersionsController`, `AnalysisRunsController`,
`ExperimentsController`, `GithubWebhooksController`, `HealthController`. Nada
de repository binding, Checks/propuestas/publicación, Action Required,
Functional Knowledge ni context-traces tiene controller todavía — esos siguen
`PendingContractError`, correctamente, y no se tocaron.

## Adapters implementados en este corte

- **`control-plane/api.ts` → `getAnalysisRun`**: `GET /analysis-runs/{id}`. DTO
  verificado línea por línea contra `dto/analysis-run.response.ts` de Core —
  coincide exacto con `AnalysisRunDetailResponse`, sin drift. Un commit
  posterior de Core (`8bfec5b`, HU33/34, no pusheado a `origin` al momento de
  este corte) hizo que este endpoint empiece a devolver `symbols` reales en
  vez de un arreglo vacío fijo — no requirió ningún cambio de este lado.
- **`control-plane/api.ts` → `listAnalysisRuns`**: `GET /projects/{projectId}/analysis-runs?status&cursor`.
  **Matiz importante**: Core exige `projectId` en el path — no existe un
  listado global, ni en el contrato (`interoperability-contract.md` §6.10 dice
  `{projectId}` explícito) ni en el controller real. La vista "todos los Runs"
  que usan `RunsPage` (sin `?projectId=`) y el nuevo `ProjectsPage` (KPIs,
  actividad reciente) no tiene ruta live — se rechaza con un mensaje propio
  (`'un listado global de Analysis Runs — INTEROP-2.1 §6.10 solo aprueba el
  listado por proyecto'`) en vez de inventar una agregación cross-proyecto
  client-side que el contrato nunca definió. Esas dos pantallas siguen
  funcionando solo en modo mock hasta que Core publique (si alguna vez lo
  hace) un listado global, o se rediseñe esa vista para exigir un proyecto.
- **`analysis/api.ts` → `listAnalysisHistory`**: `GET /projects/{id}/versions?limit=100`.
  DTO (`ProjectVersionSummaryResponse`) verificado contra Core — mapeo directo
  campo a campo a `AnalysisHistoryItem` (sin renombres, solo un subconjunto de
  campos). Trae únicamente la primera página (100 ítems); la pantalla
  (`AnalysisHistoryPage`) no tiene UI de paginación todavía — no se agregó en
  este corte por no ser parte del pedido.

## No tocado (confirmado ya vigente o ya cubierto)

`projects/api.ts` (get/create/list), `analysis/api.ts` (`getAnalysisOperation`/
`getAnalysisResult`), `experiments/api.ts`, `inventory/api.ts` — los cuatro ya
tenían su rama live implementada antes de este corte, verificado por lectura
directa del código, no reimplementados.

## Fuera de alcance (decisión explícita del usuario en esta misma conversación)

- **ZIP/generación manual UI**: se deja tal cual (oculta detrás de
  `LegacyToolsPage`, sin link visible, código intacto) — ya cubierto en
  `console-interop-2.1-sync.md`.
- **Experiments — reorientación P1/P4**: no se implementa. El usuario compartió
  `~/Downloads/experimentos.md` (handoff también enviado a la sesión de Core)
  que pide explícitamente no interrumpir P0 para construir UI experimental
  nueva. Se entregó la clasificación KEEP/ADAPT/DEFER/DROP que pide el §43 de
  ese handoff en `harness/reports/console-experiments-analysisrun-classification.md`,
  sin tocar código de `experiments/`.

## Verificación

- `npx tsc --noEmit`, `pnpm run lint`, `pnpm test -- --run` (**223 pruebas**,
  todas en verde) y `pnpm run build` — limpios.
- Tests nuevos: `control-plane/api.test.ts` (casos live de `getAnalysisRun`/
  `listAnalysisRuns` con fetch mockeado, más el caso de rechazo del listado
  global) y `analysis/api.live.test.ts` (mapeo `Page<ProjectVersionSummaryResponse>`
  → `AnalysisHistoryItem[]`).
- No se hizo prueba end-to-end contra un Core real corriendo en local en esta
  sesión (no había instancia disponible); la verificación fue por lectura
  directa del código fuente de Core + tests con `fetch` mockeado imitando esas
  formas exactas.

## Commits de este corte

Ver `git log` de `feature/T-001` a partir del commit de sincronización 2.1
(`9e57297`). Ninguno pusheado.
