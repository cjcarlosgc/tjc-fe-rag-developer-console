# 014 — Experimentos ligados a AnalysisRun

**Estado:** PROPOSED — registrada 2026-09-14. Se formaliza la historia para
que quede en el SDD; **no se aprueba todavía alcance de implementación**.
**Story IDs:** HU48 (P1), HU49 (P4)
**Origen:** handoff del usuario `~/Downloads/experimentos.md` ("Reorientación
de Experimentos en SDD 2.0"), enviado también a `tjc-be-rag-core-api`.
**Contrato:** ninguno todavía. `interoperability-contract.md` no define la
forma `AnalysisRun`↔`ExperimentRun` — este feature no puede pasar a
`SPEC_VERIFIED` real hasta que Core publique esa forma (ver `plan.md`).

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

Flujo: `AnalysisRun` existente → acción "Run comparison" → se crea un
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
