# WI-CONSOLE-017 — Veredicto del Human Reviewer

Revisor: human-reviewer (usuario, distinto del implementer). Fecha: 2026-10-09. Sin modelo (revisión humana).

**Veredicto:** `APPROVED`, con las decisiones siguientes tomadas en el chat (aceptó las tres recomendaciones del Leader).

## Decisiones

1. **Dudas de contrato A–E** (`wi-console-017-implementation.md`): `projectVersionId` no expuesto en el detalle del Run; `analysisRun` null en la evidencia de EXPERIMENT y RETRIEVAL_COMPARISON; `randomizationSeed` del mock como texto fijo; `pairPosition`/`attempt` solo si el mock los tiene; orden de claves y espacios de bytes de Core no definidos (se entrega `response.text()`). Quedan como preguntas abiertas para Core y como criterio/dependencia externa abierta de `WI-CONSOLE-020` y en el CHANGELOG.
2. **`RunComparisonPage` sin botón de evidencia:** la comparación de experimento ya se descarga desde `ExperimentPage`.
3. **Sin caché de React Query para la evidencia**, para no retener fragmentos de código; el hook `useEvidence` queda sin uso en la UI (limpieza futura).

Ciclos de corrección: 1 de 2. La aprobación no autoriza push, PR, deploy ni cambios de infraestructura externa.

Evidencia relacionada: `wi-console-017-sdd-verification.md`, `wi-console-017-implementation.md`, `wi-console-017-ux-review.md`, `wi-console-017-contract-sync-scope-review.md`, `wi-console-017-closure.md`.
