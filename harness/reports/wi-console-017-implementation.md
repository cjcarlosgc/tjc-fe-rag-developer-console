# WI-CONSOLE-017 — Reporte de implementación

Implementer · Haiku 5.5 Low (Cortes A y B), sin commit. Verificado por el Leader: eslint, `tsc -b --noEmit`, vitest completo (66 archivos, 645 pruebas) y build verdes; Contract Sync implementation-delivery y before-review corridos con `--record`.

Corte A: `app/src/evidence/{types,api,download,queries}.ts`, `mockGetEvidence`, `apiRequestText`/`fetchChecked`. Corte B: `EvidenceDownload.tsx` integrado en AnalysisRunDetailPage, ExperimentPage y RetrievalComparisonPage solo con sujeto terminal; CSS `.evidence-*`. Live = `PendingContractError` (activación en WI-CONSOLE-020). Reader puede descargar (INTEROP-2.7 §6.16). RunComparisonPage no integrada: el AC nombra solo las tres superficies.

## Preguntas abiertas para Core / WI-CONSOLE-020
- A) `analysisRun.projectVersionId` es no nulo pero `AnalysisRunDetailResponse` no lo expone (el mock usa `currentVersionId ?? ''`).
- B) En evidencia EXPERIMENT y RETRIEVAL_COMPARISON `analysisRun` queda null: el contrato no dice si se rellena con el Run de origen.
- C) `randomizationSeed` del mock es el texto fijo `demo-seed-no-core`.
- D) `pairPosition`/`attempt` solo se rellenan si el mock los tiene.
- E) Orden de claves/espacios de los bytes de Core no definidos: se entrega el texto crudo con `response.text()`.
