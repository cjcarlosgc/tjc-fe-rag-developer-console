# 014 — Tareas

HU48: contrato publicado por Core 2026-09-15 y consolidado en INTEROP-2.2 §6.5; mock-first
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
- [x] Selector de símbolo cuando el Run tiene más de uno elegible (2026-09-17):
      `findEligibleSymbols` en `run-comparison/types.ts` devuelve todos los
      candidatos; con exactamente uno, `RunComparisonPage` sigue arrancando
      sola (comportamiento previo intacto); con más de uno, muestra un
      `<select>` y requiere elegir antes de iniciar.
- [x] Replay ("Run again"/"New comparison") sobre el mismo `AnalysisRun`
      (2026-09-17): `listRunComparisons`/`mockListRunComparisons`
      (`GET /analysis-runs/{id}/experiments`, §6.5) listan todos los trials
      ya lanzados; cada uno sondea su propio progreso de forma independiente
      (`TrialCard`), sin perder los anteriores. Botón "Repetir comparación
      (Replay)" reutiliza el símbolo seleccionado para lanzar un nuevo trial.

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
