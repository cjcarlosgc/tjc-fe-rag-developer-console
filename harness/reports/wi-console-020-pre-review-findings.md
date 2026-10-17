# WI-CONSOLE-020 — Pre-revisión visual y de contrato del leader

Modelo: leader · configurado gpt-6-luna · atendido unknown · esfuerzo xhigh

Estado: hallazgos preliminares; no sustituye handoff de `ux-reviewer` ni `contract-reviewer` y no aprueba sus gates.

## UX en mock

- Console se abrió con `VITE_AUTH_MODE=mock` y `VITE_DATA_SOURCE=mock`; las páginas muestran `DEMO · DATOS SIMULADOS`.
- Revisados Runs, detalle del Run `arun_checkout_pr50` y Modo experimental con `analysisRunId`.
- Hallazgo: en viewport estrecho, las tres acciones del encabezado del Run más el sello DEMO compiten en una fila y la tercera acción queda parcialmente cortada. Recomiendo envolver/estacar las acciones en móvil y repetir la inspección.
- El flujo experimental identifica escenarios con prefijo `DEMO`; además advierte que las métricas narrativas no son evidencia de tesis.

## Contrato contra spec y suite

- OE5 envía `analysisRunId`, `symbolFilePath` y `symbolQualifiedName`, con `Idempotency-Key`; las pruebas live de adapter verifican ruta, cuerpo y cabecera.
- `/evidence` usa las tres rutas de §6.16 y conserva el cuerpo JSON crudo; las pruebas cubren `409 EVIDENCE_NOT_FINISHED`, `FAILED`, valores nulos y omisión de campos prohibidos.
- Hallazgo: `EvidenceSandbox.facts` está tipado como `Record<string, ...>`, aunque §6.16 limita sus claves a un conjunto cerrado. Solicito que el `contract-reviewer` confirme y recomiende un tipo cerrado para evitar que el DTO cliente sugiera claves arbitrarias.
- Se corrigieron dos comentarios obsoletos en `evidence/api.ts` y `EvidenceDownload.tsx` sobre activación live y posible contenido de código.
- Sin verificación HTTP contra Core en este pre-review. La prueba live final permanece para después de revisión y resolución del DTO local.

## Estado de gates

`uxReviewed`, `contractReviewed`, `interopSyncChecked` y `independentReviewPassed` siguen abiertos. `WI-CONSOLE-020` permanece `W-IN_PROGRESS`.
