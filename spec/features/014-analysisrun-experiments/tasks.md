# 014 — Tareas

HU48: contrato publicado por Core 2026-09-15 (INTEROP-2.1 §6.5) y mock-first
implementado en Console (`feature/T-001`). HU49 sigue `PROPOSED`, sin
contrato propio — implementada como capa especulativa sobre el mock-first de
HU48 (ver `plan.md` y sección propia abajo).

## HU48 — Run comparison

- [x] Core publica la forma `AnalysisRun`↔símbolo en INTEROP (§6.5,
      `CreateExperimentRequest{analysisRunId, symbolFilePath,
      symbolQualifiedName}`; `GET /analysis-runs/{id}/experiments`).
- [x] Tipos/fixtures mock-first en Console (`run-comparison/types.ts`,
      `mockStartRunComparison`/`mockGetRunComparison` en `mockBackend.ts`).
- [x] Punto de entrada desde `AnalysisRunDetailPage` (botón condicionado a
      símbolo `DIRECTLY_CHANGED` `METHOD`/`FUNCTION` elegible y Run no
      `ACTION_REQUIRED`).
- [ ] Core implementa el controller real — Console rechaza en modo live con
      `PendingContractError` hasta entonces.
- [ ] Selector de símbolo cuando el Run tiene más de uno elegible (la demo
      actual toma el primero automáticamente).
- [ ] Replay ("Run again"/"New comparison") sobre el mismo `AnalysisRun`.

## HU49 — Capture next PR

- [x] Capa especulativa (sin contrato) sobre HU48 mock-first:
      `run-comparison/speculative/captureNextPr.ts`, `ProposedCapabilityError`
      en live. Estado `ARMED`/`OFF` por proyecto, panel `CaptureNextPrPanel`
      en `ExperimentPage` ("Modo experimental").
- [x] Al capturar, navega a `RunComparisonPage` (HU48) — reusa el mismo
      modelo, no un motor experimental paralelo.
- [ ] Sin webhook real: no hay forma de que "el próximo AnalysisRun elegible
      del flujo normal" llegue solo. El mock expone un disparador de demo
      explícito (`simulateNextEligiblePullRequest`, botón "Simular llegada
      del PR (demo)") en vez de esperar pasivamente — simplificación
      documentada, no el mecanismo final.
- [ ] Depende de que HU48 tenga adapter live antes de que esto tenga sentido
      en producción (regla explícita del handoff).
