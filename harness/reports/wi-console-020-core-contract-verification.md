# WI-CONSOLE-020 — Verificación contractual contra Core local

Modelo: leader · configurado `gpt-6-luna` · esfuerzo `xhigh`

## Resultado

La suite local de Core pasó completa (`140` archivos, `2067` pruebas aprobadas, `6` omitidas). El servidor arrancó y `GET /health` respondió `200`.

La comprobación del contrato reveló una incompatibilidad efectiva y acotada en `POST /experiments` (OE5): Console publica el cuerpo V3 de INTEROP-2.7 §6.5, `{ analysisRunId, symbolFilePath, symbolQualifiedName }`, mientras que Core en `feature/jean` valida el DTO heredado `{ projectId, targetId }` y su guard de Writer busca `projectId`.

La diferencia no depende de los secretos ni de inventar una petición autenticada. Está presente tanto en el HEAD local de Core `7b0b8d81174f832958602a6fb362ef13264e162f` como en la revisión `129a9ab23886ade532071de389e5129a1e64f61f` usada por la puerta externa de este WI. La segunda es ancestro de la primera.

## Evidencia

- Console: `app/src/experiments/api.ts` construye y publica exclusivamente el cuerpo V3 en live; `app/src/experiments/api.live.test.ts` y `ExperimentPage.test.tsx` lo cubren.
- Contrato canónico: `spec/contracts/interoperability-contract.md`, `CreateExperimentRequest` en §6.5, declara los tres campos V3 y no declara `projectId` ni `targetId`.
- Core: `app/src/experiments/dto/create-experiment.dto.ts` en ambos SHAs exige `projectId` y `targetId`; `app/src/experiments/experiments.controller.ts` usa `ProjectTargets.body('project', 'projectId')`.
- Core: `pnpm test -- src/functional-knowledge/functional-knowledge.controller.spec.ts src/functional-knowledge/functional-knowledge.service.spec.ts src/retrieval-comparisons/retrieval-comparisons.http.spec.ts src/retrieval-comparisons/retrieval-comparisons.service.spec.ts src/analysis-runs/analysis-runs.controller.trace.spec.ts src/analysis-runs/analysis-run-trace.service.spec.ts src/evidence/evidence.controller.spec.ts src/evidence/evidence.service.spec.ts src/evidence/evidence-bundle.assembler.spec.ts src/experiments/experiments.service.spec.ts src/experiments/experiments.model-config.spec.ts` ejecutó la suite configurada completa y terminó verde: `2067` pruebas aprobadas.

## Decisión de corte

No se modifica Core ni se degrada Console al DTO heredado: ese cambio rompería el contrato canónico y el alcance aprobado. Se habilita la publicación de Contract Sync de este WI únicamente porque la diferencia ya quedó confirmada; no es un evento vacío.

Los adapters de Functional Knowledge/UNKNOWN, OE2, trace y evidencia se verificaron por la suite de Core. OE5 queda bloqueado hasta que Core acepte el request V3. Por ello WI-CONSOLE-020 permanece `W-IN_PROGRESS` y no se presenta como listo para aprobación humana.
