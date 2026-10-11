# WI-CONSOLE-020 — Revisión contractual, ciclo 2

## Modelo

Contract Reviewer · `gpt-6-luna` / `high`

## Veredicto

`APPROVED`

La corrección del P1 satisface el contrato en la ruta live usada por Focus Mode. Los adapters revisados usan rutas y campos publicados por INTEROP-2.7 §§3, 6.5, 6.5.1, 6.11, 6.13, 6.15 y 6.16; no encontré una nueva discrepancia contractual en el diff actual. Esta aprobación es estática y no acredita una integración live con Core.

## Findings

- Ninguno abierto en el alcance de esta revisión.
- El P1 del ciclo 1 queda resuelto: `submitFunctionalAnswer` adjunta `Idempotency-Key` UUID en live para `UNKNOWN` y respuestas convencionales. El hook `useSubmitFunctionalAnswer` obtiene la clave de `useIdempotencyKeys`, que la retiene para el mismo `questionId` y payload mientras la acción falla, y la elimina en `onSuccess`; una resolución de conflicto forma una acción distinta y obtiene otra clave. `apiRequest` sigue adjuntando `Authorization: Bearer` y convirtiendo errores HTTP a `ApiError`, preservando `code`, `details` y `correlationId`.
- El criterio del WI y su resolución ya indican publicar `CS-CONSOLE` solo si se confirma una diferencia contractual; `publishesContract` continúa en `false`. No se inventó ni se emitió un evento vacío.

## Blockers

- Ninguno para la compatibilidad estática de los adapters.
- La comprobación contra Core real sigue pendiente según el WI y no queda cubierta por este veredicto.

## Files affected

- `app/src/action-required/api.ts`
- `app/src/action-required/queries.ts`
- `app/src/action-required/api.test.ts`
- `app/src/api/idempotency.ts`
- `app/src/api/client.ts`
- `app/src/experiments/api.ts`
- `app/src/experiments/liveMapping.ts`
- `app/src/retrieval-comparison/api.ts`
- `app/src/evidence/api.ts`
- `app/src/evidence/types.ts`
- `harness/work-items.json`
- `harness/reports/wi-console-020-contract-sync-criterion-resolution.md`

## Evidence

- **§3:** el POST de respuestas funcionales exige UUID `Idempotency-Key`. El hook usa una key por acción lógica y la conserva mientras el resultado no sea exitoso; el éxito limpia esa entrada. `api.ts` también genera un UUID si una llamada live no entrega uno explícitamente.
- **§6.5 / §6.5.1:** la creación de experimentos usa `POST /experiments`, envía la key recibida y construye el cuerpo desde `analysisRunId` y el símbolo publicado. La conversión de status/results consume los campos nuevos como nullable y conserva los contadores de evaluabilidad.
- **§6.11:** las rutas live de Action Required y Functional Knowledge coinciden con el contrato. El body omite `answer` cuando es nulo, conserva `conflictResolution` y admite `UNKNOWN`. La autorización de Maintainer/Admin y la respuesta `403 PROJECT_ROLE_INSUFFICIENT` siguen siendo decisión de Core. Los errores se manejan por `apiRequest`/`ApiError` sin interceptación específica que los degrade.
- **§6.13:** las llamadas navegador→Core usan `apiRequest`; el cliente agrega el bearer token de sesión cuando está disponible, activa el manejador de errores de sesión para los códigos de autenticación establecidos y propaga `ApiError` con los datos del envelope. No se cambia la autoridad de roles en el navegador.
- **§6.15:** OE2 usa las cuatro rutas documentadas; el POST adjunta `Idempotency-Key` y envía solo el ancla de Run y símbolo. La lista serializa `cursor`; los resultados/status pasan por el transporte autenticado. La restricción local de `groundTruth` está limitada a 200.
- **§6.16:** trace y exportación usan las rutas documentadas. `EvidenceSandbox.facts` tiene forma estáticamente cerrada mediante `Partial<Record<EvidenceSandboxFactKey, EvidenceSandboxFactValue>>`; las 14 claves permitidas son `executionProfile`, `runner`, `compiled`, `executed`, `passed`, `totalTests`, `passedTests`, `failedTests`, `skippedTests`, `testCasesTruncated`, `failureStage`, `failureCategory`, `failureCode` y `failureMessage`. Los valores quedan limitados a `string | number | boolean | null`, y los hechos no observables pueden omitirse. El adapter live conserva el JSON crudo de Core.
- **Contract Sync:** `harness/work-items.json` mantiene `publishesContract: false`; el criterio corregido exige un evento solo ante diferencia confirmada. El reporte de resolución documenta esa decisión. No se publicó ningún evento nuevo durante esta revisión.
- Revisé el diff, las pruebas y los tipos existentes; no ejecuté tests ni llamé a Core. No se declara validación live.

## Recommended next step

Mantener pendiente la verificación de cada flujo contra Core real o su suite de contrato y registrar evidencia al completarla. Si esa verificación confirma una diferencia, abrir/publicar el Contract Sync correspondiente conforme al Harness; con el material estático actual no hace falta crear uno.
