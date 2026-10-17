# WI-CONSOLE-020 — Verificación local del leader

Modelo: leader · configurado gpt-6-luna · atendido unknown · esfuerzo xhigh

## Console

- `npm run lint`: PASS.
- `npm test`: PASS, 67 archivos y 716 tests. Se actualizó una expectativa obsoleta que todavía esperaba `PendingContractError` para Functional Knowledge live; el test nuevo comprueba la ruta publicada y su estado vacío.
- `npm run build`: PASS. Vite muestra la advertencia existente de chunk >500 kB.
- `node harness/validate-harness.mjs`, `node harness/validate-work-items.mjs` y `git diff --check`: PASS.
- Smoke visual en modo estrictamente mock (`VITE_AUTH_MODE=mock`, `VITE_DATA_SOURCE=mock`): el Run `arun_checkout_pr50` muestra `DEMO · DATOS SIMULADOS`; su enlace lleva a `/projects/prj_checkout_demo/experimental?analysisRunId=arun_checkout_pr50`. La pantalla experimental conserva escenarios rotulados DEMO. Esto no verifica el comportamiento live ni sustituye la revisión UX independiente.

## Contract Sync heredados

Clasifico para este WI como `NOT_RELEVANT` los eventos antiguos `CS-20260920-003` y `CS-20260921-001/002/003`: cubren ciclo de vida de Project/binding, identidad, workspaces y matriz de acceso. WI-CONSOLE-020 no cambia esos contratos ni su implementación de sesión/autorización; reutiliza el cliente autenticado y las guardas de rol existentes mientras activa las rutas SMART V3. La aplicabilidad se limita a este WI; no se cambian los eventos ni sus acciones para otros cortes. El contract-reviewer debe validar esta clasificación en su revisión posterior.

## Core local

- `curl http://localhost:3000/health`: conexión rechazada (curl 7); no hubo petición live.
- Checkout local de `tjc-be-rag-core-api`: rama `feature/jean`, HEAD `5e15577`. Su `CreateExperimentDto` usa `projectId`/`targetId`.
- `origin/feature/php-core` (`7855799`) y el SHA `129a9ab` citado por la puerta externa también usan `projectId`/`targetId`. Ese SHA contiene el contrato con hash `fcfbd6d6301e7d15ad508b7745bd73c54a3ca06cba03f9372bd3fe9801ec109a`, que publica `analysisRunId`/`symbolFilePath`/`symbolQualifiedName`.
- No se modificó Core. La verificación HTTP de los adapters contra una instancia Core compatible sigue pendiente; no se presenta el mock como live.

## Límite del handoff

Las pruebas y el build locales pasan. No se declara `W-IN_REVIEW` ni se aprueban gates UX/contract: las delegaciones post-implementación terminaron por límite de uso antes de entregar sus revisiones. `WI-CONSOLE-020` permanece `W-IN_PROGRESS`.
