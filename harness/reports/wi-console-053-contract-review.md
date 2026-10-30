# WI-CONSOLE-053 (HU18) · Revisión contractual

Modelo: contract-reviewer · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo low

Veredicto: APPROVED

## 1. Espejo
- `interoperability-contract.md` local = Core `55bf4241` : `b2f38452…1fdb651` (coincide con el esperado).
- `system-contract.md` `d0a492b4…`, `github-integration-contract.md` `dedf00fa…` y árbol `schemas/` `8079ab73…` sin cambio.
- `git diff` no toca `generated/`.
- `node harness/validate-harness.mjs` pasa.

## 2. Conformidad con §6.17 y AnalysisRunSummaryResponse
- `ExperimentCaptureResponse` y `ExperimentCapturePage`: campos y enum `ARMED|RESERVED|DISARMED` idénticos al contrato; no hay campos inventados.
- Rutas y métodos correctos:
  - `GET /projects/{id}/experiment-captures?cursor&limit`
  - `POST /projects/{id}/experiment-captures` (sin cuerpo ni `Idempotency-Key`)
  - `DELETE /projects/{id}/experiment-captures/current`
- Errores `EXPERIMENT_CAPTURE_ALREADY_ARMED` (409) y `EXPERIMENT_CAPTURE_NOT_ARMED` (404) mapeados; el mock los emite con esos status y códigos.
- Roles en el mock: Reader lista y Maintainer arma y desarma.
- `experimentCapture?: { captureId; reservedAt } | null`: opcional en el tipo (tolerancia a mocks y trazas anteriores), con `?? null` en el resumen del mock. Cumple el requiredAction.
- Sin cambio de schemas.

## 3. Contract Sync
- CS-CORE-20261030-001 y CS-CORE-20261026-001 están `C-RESOLVED`, con `acknowledgementEvidence` y `resolutionEvidence` apuntando a reportes de WI-053 que existen.
- BELOW_RELEVANCE_THRESHOLD, `layer`, `strategy`, ragLabels y tests están en el código y pertenecen a WI-CONSOLE-052. El pendiente del 26 está cubierto.
- Los 4 eventos históricos son `NOT_RELEVANT` con digest, razón y reporte; el validador del harness lo acepta.
- Referencias a 2.25 en spec (README, architecture, 013 plan y spec, 014 spec y tasks). La única mención restante a 2.23 está en `011/tasks.md` ST-054, una tarea histórica cerrada de WI-052 (correcta).

## Hallazgos (no bloqueantes)
1. CS-CORE-20261030-001 requiere "sin UI en este corte (WI de Console aparte)", mientras WI-053 incluye `ExperimentCapturePanel` y un mock. Es una discrepancia con el texto de Core, cubierta por `wi-console-053-scope-approval.md` (aprobación del usuario). No es un defecto contractual, pero conviene que la resolución lo mencione de forma explícita. La revisión de la UI corresponde a ux-reviewer.
2. Los archivos CS-CORE-20261026-001 y -20261030-001 están sin seguimiento en git (`??`): deben incluirse en el commit.
