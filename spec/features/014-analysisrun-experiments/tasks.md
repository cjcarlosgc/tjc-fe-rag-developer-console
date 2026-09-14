# 014 — Tareas

Ninguna iniciada — feature recién registrada (`PROPOSED`), sin
`SPEC_VERIFIED` porque depende de un contrato que Core todavía no publica
(ver `plan.md`).

## HU48 — Run comparison

- [ ] Core publica la forma `AnalysisRun`↔`ExperimentRun` en INTEROP.
- [ ] Tipos/fixtures mock-first en Console (`ExperimentRun`,
      `ExperimentExecution`, trials).
- [ ] Punto de entrada desde `AnalysisRunDetailPage`.
- [ ] Adaptar `ExperimentPage`/creación para tomar `analysisRunId` en vez de
      `targetId` de inventario.
- [ ] Replay ("Run again"/"New comparison") sobre el mismo `AnalysisRun`.

## HU49 — Capture next PR

- [ ] Depende de HU48 operativo primero (regla explícita del handoff).
- [ ] Estado `ARMED`/`OFF` y captura automática del próximo `AnalysisRun`
      elegible.
