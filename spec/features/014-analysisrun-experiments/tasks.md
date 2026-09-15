# 014 — Tareas

HU48: contrato publicado por Core 2026-09-15 (INTEROP-2.1 §6.5) y mock-first
implementado en Console (`feature/T-001`). HU49 sigue sin iniciar, sin
contrato propio y dependiente de HU48 operativo (ver `plan.md`).

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

- [ ] Depende de HU48 operativo primero (regla explícita del handoff).
- [ ] Estado `ARMED`/`OFF` y captura automática del próximo `AnalysisRun`
      elegible.
