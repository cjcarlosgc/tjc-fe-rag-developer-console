# 014 — Experimentos ligados a AnalysisRun

**Estado:** HU48 con contrato **definido** (INTEROP-2.2 §6.5, 2026-09-15;
Core todavía no implementó el controller) — mock-first implementado en
Console contra esa forma, adapter live pendiente. HU49 sigue `PROPOSED` (sin
contrato propio, depende de HU48) — **implementada en Console como capa
especulativa** sobre el mock-first de HU48 (2026-09-16).
**Story IDs:** HU48 (P1), HU49 (P4)
**Origen:** handoff del usuario `~/Downloads/experimentos.md` ("Reorientación
de Experimentos en SDD 2.0"), enviado también a `tjc-be-rag-core-api`.
**Contrato:** HU48 — `interoperability-contract.md` §6.5 define
`CreateExperimentRequest{analysisRunId, symbolFilePath, symbolQualifiedName}`
y `ExperimentStatusResponse`/`ExperimentResultsResponse` con `analysisRunId`+
`symbol: AnalysisSymbolResponse` (reemplaza `projectId`/`targetId`); más
`GET /analysis-runs/{analysisRunId}/experiments`. **Definido, pendiente de
implementación** — no hay adapter live todavía (`PendingContractError`).
HU49 no tiene forma de contrato propia.

## Objetivo

Reformular cómo se obtiene la unidad experimental de HU19 (`RAG` vs
`GENERALIST_AGENT`) para que sea coherente con la arquitectura PR-driven: en
vez de seleccionar manualmente un `METHOD`/`CLASS`/`PROJECT` de un
`ProjectVersion` (modelo ZIP, ya retirado como ruta de producto en
INTEROP-2.1), la comparación académica parte de un `AnalysisRun` real
producido por un Pull Request.

El experimento (`RAG` vs `GENERALIST_AGENT`) **se conserva** — no se
descarta HU19, se reorienta su forma de entrada.

## HU48 (P1) — Run comparison

**Implementado en Console (mock-first, `feature/T-001`):** `run-comparison/`
(`types.ts`/`api.ts`/`RunComparisonPage.tsx`), entrada desde
`AnalysisRunDetailPage` cuando hay un símbolo `DIRECTLY_CHANGED`
`METHOD`/`FUNCTION` elegible. Con exactamente un símbolo elegible, arranca
automáticamente al entrar (comportamiento original, sin cambios); con más de
uno, muestra un selector y requiere elegir antes de iniciar — cubre la regla
de `ACTION_REQUIRED` del handoff (símbolo obligatorio, no ambiguo). Selector
de símbolo y Replay (2026-09-17): `listRunComparisons` (§6.5,
`GET /analysis-runs/{id}/experiments`) lista todos los trials ya lanzados
sobre el Run; el botón "Repetir comparación (Replay)" lanza uno nuevo sin
perder los anteriores, cada uno con su propio progreso independiente.

Flujo objetivo (contrato, no todo implementado en la demo): `AnalysisRun`
existente → acción "Run comparison" → se crea un
`ExperimentRun` con dos `ExperimentExecution` (`RAG` y `GENERALIST_AGENT`)
que comparten HEAD SHA, snapshot, changeset y target set — misma unidad de
entrada para ambos brazos, para que la comparación sea defendible
metodológicamente.

Reglas del handoff a preservar textualmente:
- No mezclar `ExperimentRun` con `AnalysisRun`: el primero es una capa
  académica opcional sobre el segundo, que sigue siendo 100% operacional sin
  necesitar ningún experimento.
- Debe permitir más de una ejecución (`trial`) sobre el mismo `AnalysisRun`,
  y repetirla más adelante ("Replay"/"Run again") conservando el vínculo al
  mismo HEAD.
- Si el `AnalysisRun` operacional todavía está `ACTION_REQUIRED`, no se
  ejecuta la comparación — primero se resuelve el contexto funcional.
- Si el brazo `RAG` usa `FunctionalKnowledge`, debe decidirse explícitamente
  qué recibe `GENERALIST_AGENT` para no sesgar la variable medida; el handoff
  marca esto como decisión metodológica pendiente, no la resuelve.
- Cada `ExperimentRun` debe poder navegarse hacia atrás hasta PR/HEAD
  SHA/changeset/targets/ejecuciones, para sustentación de tesis.

## HU49 (P4) — Capture next PR

Mecanismo one-shot para demo en vivo: `Experiments` → botón "Capture next
PR" → estado `ARMED` (espera el próximo `AnalysisRun` elegible del flujo
normal) → al llegar, crea automáticamente el `ExperimentRun` → vuelve a
`OFF`. No es un toggle permanente ("Experimental Mode = ON" que corra ambos
brazos en cada PR está explícitamente prohibido por el handoff). Reusa el
mismo modelo de HU48, no un motor experimental paralelo.

**Implementado en Console (2026-09-16) como capa especulativa** (sin
contrato, `ProposedCapabilityError` en live):
`run-comparison/speculative/captureNextPr.ts` + panel `CaptureNextPrPanel` en
`ExperimentPage` ("Modo experimental"), estado `ARMED`/`OFF` por proyecto. Al
capturar, navega a `RunComparisonPage` (HU48) sin duplicar su lógica de
inicio. **Desviación de demo deliberada respecto al flujo objetivo:** no
existe un webhook real que dispare "el próximo PR elegible" — mientras está
`ARMED`, la Console expone un botón "Simular llegada del PR (demo)" que
fabrica ese `AnalysisRun` explícitamente, en vez de esperar pasivamente un
evento que hoy no puede llegar. No sustituye el mecanismo final descrito
arriba, solo permite demostrar el flujo `ARMED`→captura→`OFF` en vivo.

## Restricciones explícitas del handoff (§39, "No hacer")

No ejecutar `GENERALIST_AGENT` en cada PR empresarial; no volver
`ExperimentRun` obligatorio para que un `AnalysisRun` funcione; no publicar
los brazos experimentales como GitHub Checks separados; no volver a usar
`METHOD`/`CLASS` como unidad experimental oficial; no crear un toggle
"Experimental Mode" permanente; no bloquear P0 para implementar esto; no
implementar HU49 antes que HU48.

## UI (referencia, sin aprobar todavía)

`Experiments` se mantiene como ítem de nav propio (no domina el producto
empresarial). Entrada adicional futura desde `AnalysisRunDetailPage` ("Run
experimental comparison"), no como CTA operacional principal. Ver
`harness/reports/console-experiments-analysisrun-classification.md` para el
detalle de qué componentes actuales son reutilizables (`KEEP`) y cuáles
quedan `DROP/ADAPT` (el selector de target manual).
