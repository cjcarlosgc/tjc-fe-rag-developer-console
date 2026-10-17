# Solicitud de Console a Core — correlationId en el estado de comparación de retrieval (OE2)

**Origen:** `WI-CONSOLE-014` (Console), decisión del Human Reviewer del 2026-10-08.
**Destino:** Core (`tjc-be-rag-core-api`), contrato `INTEROP-2.7 §6.15`.
**Estado:** `OPEN` — dependencia externa abierta; consumidor previsto `WI-CONSOLE-020`.
**Tipo:** necesidad contractual no rompiente (`breaking: false`), por escrito para llevar a Core. No es un evento `CONTRACT_SYNC` publicado.

## Por qué no es un evento Contract Sync

`harness/contract-sync.mjs publish` solo acepta un WI local con `contractImpact: true` y `publishesContract: true`; `WI-CONSOLE-014` declara ambos en `false` (Console consume INTEROP-2.7, no lo publica) y el alcance del comando es `spec/contracts/**`. El harness no soporta un evento saliente de este tipo desde un WI de consumo, y esta solicitud no cambia ningún espejo de contrato. Por eso se deja redactada aquí y registrada como dependencia externa abierta; el usuario la lleva a Core. Cuando Core la acepte, el cambio llegará a Console como `CS-CORE-YYYYMMDD-NNN` por la vía normal.

## Solicitud 1 — exponer `correlationId` (necesaria)

El criterio de aceptación 4 de `WI-CONSOLE-014` pide que una comparación `FAILED` muestre `failureCode`, `failureMessage` y `correlationId`. El DTO de estado de la comparación de retrieval (`§6.15`, `GET /projects/:projectId/runs/:analysisRunId/retrieval-comparisons/:comparisonId`) publica `failureCode` y `failureMessage` pero **no** `correlationId`. Console no inventa el campo.

Pedido: añadir `correlationId: string` al DTO de estado (al menos presente cuando `status = FAILED`; preferible siempre, igual que en los demás DTO de estado de Core) y reflejarlo en `SYSTEM`/`INTEROP`. Valor esperado: el mismo identificador que Core registra en logs y en el header de respuesta para esa operación, de modo que el soporte pueda rastrear la falla desde la UI.

Impacto en Console al publicarse: `WI-CONSOLE-020` mapea el campo en el adapter live y `RetrievalComparisonPage` lo pasa al `ErrorNote` de FAILED (hoy la UI soporta el campo opcional y el mock no lo produce).

## Solicitud 2 — pregunta abierta: código de error de los resultados de una comparación `FAILED`

El mock de Console responde `409 RETRIEVAL_COMPARISON_NOT_FINISHED` al pedir los resultados de una comparación cuyo estado es `FAILED`. `§6.15` no define el código para ese caso. La UI **no depende** de él (el estado FAILED se resuelve con el DTO de estado). Pregunta para Core, antes de `WI-CONSOLE-020`: qué código y HTTP status devuelve Core al pedir resultados de una comparación `FAILED` (¿`409 RETRIEVAL_COMPARISON_NOT_FINISHED`, un código propio como `RETRIEVAL_COMPARISON_FAILED`, u otro?). Console ajustará `control-plane/errors.ts` y el mock según la respuesta.

## Decisiones relacionadas del Human Reviewer (no son solicitudes a Core)

- La UI de OE2 **no** ofrece cargar verdad de terreno (prevalece el AC3); con el contrato actual `metrics` en live será `null` y se muestra «no disponible».

## Trazabilidad

- Origen: `harness/reports/wi-console-014-ux-review-2.md` (N4), `harness/reports/wi-console-014-contract-review.md`, `harness/reports/wi-console-014-user-review.md`.
- Registrada como criterio pendiente de dependencia externa en `WI-CONSOLE-014` (cierre) y como criterio de `WI-CONSOLE-020` en `harness/work-items.json`.
