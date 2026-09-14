# 014 — Plan

## Dependencias

- **Bloqueante real:** `interoperability-contract.md` no define la forma
  `AnalysisRun`↔`ExperimentRun` (qué endpoint crea un `ExperimentRun` a
  partir de un `analysisRunId`, qué DTO tiene). Sin esa forma, este feature
  no puede pasar de `PROPOSED` a `SPEC_VERIFIED` real — la puerta de
  decisiones lo detectaría como dependencia inexistente. Hasta entonces, el
  trabajo posible es de diseño/mock puro, sin contrato que mockear con
  fidelidad.
- HU30/HU32 (repository binding, `AnalysisRun` por PR/HEAD) deben estar
  operando con datos reales antes de que HU48 tenga sentido en producción
  (§31 del handoff: "cuando el flujo empresarial pueda producir AnalysisRun
  reales y suficientemente estables, comenzar P1").
- `experiments/liveMapping.ts`, `experiments/ExperimentComparison.tsx`
  (clasificados `KEEP` en `console-experiments-analysisrun-classification.md`).

## Diseño técnico (borrador, sujeto a que exista contrato)

- Reusar `ExperimentResultViewModel`/`StrategyMetrics` tal cual — son
  agnósticos al origen de la unidad experimental.
- Reemplazar el input de creación: de `startExperiment(projectId, targetId,
  idempotencyKey)` a algo como `startExperimentFromRun(analysisRunId,
  idempotencyKey)` — nombre y forma exactos dependen del contrato que Core
  publique, no se fijan acá.
- `ExperimentPage.tsx` pierde el `<select>` de targets de inventario; gana un
  punto de entrada desde `AnalysisRunDetailPage` (o una lista de
  `AnalysisRun` elegibles dentro de `Experiments`).

## Reutilización del módulo 008 (ver clasificación completa en el reporte)

`KEEP`: `GENERALIST_AGENT`, métricas, comparación, `liveMapping.ts`.
`DROP/ADAPT`: selector de target por inventario, `startExperiment` actual.

## Cortes futuros (no se ordenan todavía — decisión posterior del usuario)

1. Core define y publica la forma `AnalysisRun`↔`ExperimentRun`.
2. HU48 mock-first en Console (fixtures nuevas, sin backend real).
3. HU48 live cuando Core lo implemente.
4. HU49 (P4), solo después de que HU48 esté operativo.
