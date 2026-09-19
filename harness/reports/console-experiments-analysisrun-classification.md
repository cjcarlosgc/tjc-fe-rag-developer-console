# Clasificación del módulo Experiments contra el handoff de reorientación (P0/P1/P4)

**Estado:** DONE como entregable de clasificación (§43 del handoff) — **no implica implementar P1/P4 en este corte**
**Repository:** `tjc-fe-rag-developer-console`
**Origen:** `~/Downloads/experimentos.md`, handoff que el usuario también envió a la
sesión de `tjc-be-rag-core-api` — este reporte es la respuesta al §43 ("Antes de
implementar P1: entregar KEEP/ADAPT/DEFER/DROP del módulo actual"), no un
corte de implementación. El handoff es explícito: P0 (AnalysisRun/PR-driven,
ya en desarrollo — ver `console-interop-2.1-sync.md`) **no debe interrumpirse**
para implementar UI experimental; P1 arranca "cuando el flujo empresarial
pueda producir `AnalysisRun` reales y suficientemente estables" (§31); P4
queda al final del backlog. Este documento solo dejar preparado el terreno.

## Modelo de datos actual (`experiments/types.ts`)

`ExperimentStrategy` (`RAG|GENERALIST_AGENT`), `StrategyMetrics`,
`RepetitionResult`, `ExperimentResultViewModel { baseline, rag, repetitions }`,
`ExperimentStatus`, `ExperimentAccepted`, `ExperimentOperation`. Ninguno de
estos tipos referencia `targetId`/inventario directamente — son agnósticos a
cómo se obtuvo la unidad experimental. **Cambios requeridos para vincular con
`AnalysisRun`:** ninguno en el modelo de resultados; sí hace falta un nuevo
input de creación (hoy `startExperiment(projectId, targetId, idempotencyKey)`
en `experiments/api.ts`) que en P1 debería tomar un `analysisRunId` (o
`AnalysisRun` completo) en vez de un `targetId` de inventario — pendiente de
que Core publique el endpoint/forma real (`POST /experiments` con `targetId`
sigue siendo el único contrato aprobado hoy, INTEROP-2.1 no define todavía la
forma "por AnalysisRun").

## `GENERALIST_AGENT`

**Reusable: sí, sin cambios.** Es un valor de estrategia neutral al origen de
la unidad experimental; toda la lógica de comparación (`ExperimentComparison.tsx`,
`liveMapping.ts`) ya lo trata simétricametne con `RAG` vía `StrategyMetrics`.

## UI actual (`experiments/`)

| Componente | Archivo | Clasificación | Razón |
|---|---|---|---|
| Selector de target (`<select>` sobre inventario) | `ExperimentPage.tsx` líneas 16-23 | **DROP/ADAPT** — es exactamente el patrón "select METHOD/CLASS → Run experiment" que el handoff §7 marca como del modelo anterior | En P1 se reemplaza por selección de un `AnalysisRun` existente (§16: "Recent AnalysisRuns... [Run comparison]"), no un target de inventario |
| Botón "Ejecutar comparación" + `startExperiment` | `ExperimentPage.tsx` | **ADAPT** | Misma acción conceptual, pero el input pasa de `targetId` a `analysisRunId` |
| Progreso/polling (`experimentQuery`, `refetchInterval`) | `ExperimentPage.tsx` | **KEEP** | Agnóstico al origen de la unidad experimental |
| Tabla/gráfico de comparación | `ExperimentComparison.tsx` | **KEEP** | Ya opera sobre `ExperimentResultViewModel`, no sobre `targetId` |
| Mapeo live status/results | `liveMapping.ts` | **KEEP** | Igual razón — mapea `ExperimentStatusResponse`/`ExperimentResultsResponse`, sin acoplar a targetId |
| Persistencia/historial de experimentos | No existe historial dedicado hoy (cada experimento se ve solo por su id en la URL) | **DEFER** | El handoff (§19, "Replay") pide poder repetir sobre el mismo `AnalysisRun` — hoy no hay ni un listado de experimentos pasados; es trabajo nuevo de P1, no una adaptación |
| Acceso desde nav | `ProjectDetailPage.tsx` ("Modo experimental →") | **ADAPT** | El handoff (§33-34) pide que la entrada eventualmente viva también desde `AnalysisRun Detail` ("Run experimental comparison"), sin ser el CTA operacional principal — hoy solo se entra desde el proyecto, no desde un Run |

## No se toca en este corte

- No se implementa el flujo P1 ("Run comparison" desde un `AnalysisRun`
  existente, `ExperimentRun`/`ExperimentExecution` como conceptos separados de
  `AnalysisRun`, trials/repeticiones explícitas del handoff §12) — requiere
  primero que Core publique la forma real del vínculo `AnalysisRun`↔
  `ExperimentRun` en INTEROP; no existe ese contrato hoy.
- No se implementa P4 ("Capture next PR") — explícitamente al final del
  backlog por el propio handoff.
- **No se modifica `ExperimentPage.tsx` ni el flujo de creación actual.** Sigue
  funcionando en modo mock exactamente igual. En modo live, crear un
  experimento nuevo ya dependía de tener un `ProjectVersion`/inventario
  (legado ZIP) — eso no cambió con este reporte; queda igual de (no)
  funcional que antes de esta sesión. No se agregó ni se quitó ningún aviso
  en pantalla todavía.

## Relación con el trabajo P0 en curso

Ninguno de los adapters live que se están implementando en paralelo
(`getAnalysisRun`, `listAnalysisRuns` por proyecto, `listAnalysisHistory`) se
ve afectado por esta clasificación ni la bloquea — son independientes,
consistente con el handoff (§4: "P0 no debe depender del módulo experimental").
