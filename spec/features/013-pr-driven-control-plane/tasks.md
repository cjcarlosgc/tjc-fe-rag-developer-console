# 013 — Tareas

## Baseline T-001

- [x] Adoptar SYSTEM-2.0 e INTEROP-2.0.
- [x] Definir navegación, Focus Mode y nueve escenarios mock-first.
- [x] Marcar la demo GitHub anterior como superseded.
- [x] Registrar backlog, state, changelog y reporte de revisión.

## Implementación posterior — requiere selección humana

- [x] HU30/HU32: repository binding, Analysis Runs por PR/HEAD y obsolescencia —
      mock-first, 9 escenarios de `spec.md`. Ver
      `harness/reports/HU30-HU32-HU39-HU40-control-plane-mock.md`.
- [x] HU32 (parcial, live): `getAnalysisRun`/`listAnalysisRuns` conectados a los
      controllers reales de Core (`GET /analysis-runs/{id}`,
      `GET /projects/{projectId}/analysis-runs`). Repository binding (HU30) y
      Checks/propuestas/publicación (HU39/HU40) siguen sin controller en Core —
      continúan `PendingContractError`. Ver
      `harness/reports/console-analysisrun-live-adapters.md`.
- [ ] HU35-HU36: persistencia de Functional Knowledge y continuación real del Run (Core).
- [x] HU37-HU38: Focus Mode, bandeja Action Required y deep-link `returnTo` — mock-first,
      dos escenarios (action required, corrección/HEAD nuevo). Ver
      `harness/reports/HU37-HU38-focus-mode-action-required.md`.
- [x] HU39-HU40: Checks (representados en el detalle de Run), review, freshness y
      publicación por companion PR — mock-first. Ver
      `harness/reports/HU30-HU32-HU39-HU40-control-plane-mock.md`.
- [ ] HU44-HU45: retiro legacy y colaboración.

Con este corte, todo el mock-first del Developer Console para SDD 2.0 queda completo
salvo lo explícitamente Core-side (HU35/36) y P4 (HU44/45). Adapters live: Analysis
Runs y listado de `ProjectVersion` ya conectados contra Core real (ver arriba); el
resto (binding, Checks/propuestas/publicación, Action Required, Functional
Knowledge, context-traces) sigue `PendingContractError` — Core no publica esos
controllers todavía.
