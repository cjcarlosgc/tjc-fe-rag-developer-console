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

## Propuestas registradas 2026-09-14 (HU50-53, HU55)

Ver detalle de cada una en `spec.md` y en `harness/reports/console-backlog-formalization.md`.
Contrato de HU51/HU53/HU55 definido por Core el 2026-09-15 (ya no `PROPOSED`
sin contrato) — HU50/HU52 siguen sin contrato.

- [x] HU50: indicador de cobertura previa en Run Detail — especulativo (sin
      contrato), `control-plane/speculative/priorCoverage.ts`.
- [x] HU51: detección de conflicto de Functional Knowledge en Focus Mode —
      contrato definido (INTEROP-2.1 §6.11), implementado mock-first en
      Console; pendiente de implementación real en Core.
- [x] HU52: trazabilidad inversa "Runs que usaron esta regla" — especulativo
      (sin contrato), `action-required/speculative/ruleUsage.ts`. Coincidencia
      local por símbolo == `targetRef` dentro del mismo proyecto, panel nuevo
      en `FunctionalKnowledgeDetailPage`.
- [x] HU53: historial de transiciones de estado de un AnalysisRun — contrato
      definido (INTEROP-2.1 §6.10), implementado mock-first en Console
      (campo opcional en el mirror, live adapter existente tolera su
      ausencia hasta que Core lo implemente).
- [x] HU55: listado de Analysis Runs cross-proyecto — contrato definido
      (`GET /analysis-runs?status&cursor&limit`). Sin código nuevo: el mock
      ya cubría esto completo; solo se corrigió el mensaje desactualizado
      de `PendingContractError` en `control-plane/api.ts`. Pendiente de
      implementación en Core (antes bloqueado: no existía ruta global — ver
      `console-analysisrun-live-adapters.md`).

Con este corte, todo el mock-first del Developer Console para SDD 2.0 queda completo
salvo lo explícitamente Core-side (HU35/36) y P4 (HU44/45). Adapters live: Analysis
Runs y listado de `ProjectVersion` ya conectados contra Core real (ver arriba); el
resto (binding, Checks/propuestas/publicación, Action Required, Functional
Knowledge, context-traces) sigue `PendingContractError` — Core no publica esos
controllers todavía.
