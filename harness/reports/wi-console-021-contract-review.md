# WI-CONSOLE-021 — Revisión contractual independiente (corte C)

Modelo: contract-reviewer · esfuerzo low

Estado: APPROVED

## Alcance revisado

`CS-CORE-20261009-014` (forma congelada de `EvidenceBundleResponse` en INTEROP-2.7 §6.16) y `CS-CORE-20261009-016` a `-018` (Sandbox/PHP). Se revisaron los espejos, tipos, mocks y pruebas de Console. No se activó ningún adapter live ni se modificó Core.

## Resultado

- §6.16: `app/src/evidence/types.ts` reproduce la forma publicada de `schemaVersion: '1'`: nulabilidad de `analysisRun`, retrieval/config/candidates, context, generation, exploration, sandbox y experimental; añade `technicallyEvaluable` y `retrieval[].metrics`; y no declara campos prohibidos (contenido de código, `groundTruth`, `knowledgeId`, URLs o claves de Storage). Los tests cubren datos no observados como `null`, comparación `FAILED` con `retrieval: []`, perfiles PHP/PHPUnit y ausencia de campos sensibles. `snapshotRef` permanece como cadena opaca.
- La exportación `/evidence` continúa explícitamente en mock: `app/src/evidence/api.ts` devuelve `PendingContractError` en live. Es consistente con el corte actual y no simula integración efectiva; su activación pertenece a `WI-CONSOLE-020`.
- PHP: el modelo de Context Explorer tolera y etiqueta `SAME_NAMESPACE`, `FULLY_QUALIFIED_REFERENCE` y `DECLARING_CLASS`; OE2 no conserva la ruta simulada que rechazaba PHP; el escenario PHPUnit expone literalmente `PHP_LARAVEL_PHPUNIT` y `PHPUNIT`. `UNSUPPORTED_PROJECT` queda limitado al caso sin framework JEST/VITEST/PHPUNIT.
- Contract Sync: los cuatro eventos relevantes quedan `C-RESOLVED` con evidencia de acuse/resolución. El checkpoint `before-review` no reporta eventos relevantes pendientes.

Los hashes locales de los espejos son los registrados contra la revisión canónica consolidada `825e417`: SYSTEM-2.6 `670a1ef035d7c60be0a3385ca5f88e2a458b91f8ded2317e9dbbb97c58b07dc2`; INTEROP-2.7 `a70782ebc439f531765e26b03736f78e52049de081571aaa30e25c4cfb69988f`; GH-INTEROP-1.3 `d1779bbdc2445be8760c6b3eea3b73da4663618bab8d471f4d6e932fd7d0b964`.

## Hallazgos

No hay hallazgos bloqueantes ni solicitudes de cambio contractual.

Observación no bloqueante: la semilla DEMO `rcmp_demo_seed_php` cuelga de un Run TypeScript porque el mock aún no modela un Project/Run PHP completo. Está rotulada como simulada y sirve para compatibilidad de DTO/etiquetas; no debe presentarse como una validación live de la relación Run PHP ↔ comparación. Esa validación corresponde a `WI-CONSOLE-020` contra Core local.

## Evidencia ejecutada

```text
node harness/validate-harness.mjs
# Harness V3 validation passed.

node harness/contract-sync.mjs check --checkpoint before-review --work-item WI-CONSOLE-021
# relevantPendingSyncIds: []
# CS-CORE-20261009-014, -016, -017 y -018: C-RESOLVED

cd app && node node_modules/vitest/vitest.mjs run src/evidence/api.test.ts src/retrieval-comparison/api.test.ts src/experiments/ExperimentPage.test.tsx src/context-explorer/rag/ragLabels.test.ts --maxWorkers=2
# Test Files 4 passed (4); Tests 66 passed (66)

cd app && npx eslint . && npx tsc -b --noEmit
# exit 0

git diff --check
# exit 0
```

## Handoff

- status: APPROVED
- findings: []
- blockers: []
- filesAffected: `app/src/evidence/{types.ts,api.test.ts}`, `app/src/context-explorer/{types.ts,rag/ragLabels.ts}`, `app/src/retrieval-comparison/*`, `app/src/experiments/*`, `app/src/api/mockBackend.ts`, `harness/contract-sync/inbox/CS-CORE-20261009-014,-016,-017,-018.yaml`
- evidence: este informe; `harness/reports/wi-console-021-contract-sync-php-acknowledgement.md`; `harness/reports/wi-console-021-implementation.md`
- recommendedNextStep: Ejecutar/registrar el `before-review --record` por el leader, anexar la revisión UX y presentar el corte al Human Reviewer. No iniciar `WI-CONSOLE-020` hasta el cierre aprobado de `WI-CONSOLE-021`.
