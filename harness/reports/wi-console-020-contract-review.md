# WI-CONSOLE-020 — Revisión contractual

## Modelo

Contract Reviewer · `gpt-6-luna` / `high`

## Veredicto

`CHANGES_REQUESTED`

Los adapters revisados consumen, en general, las rutas y formas publicadas en INTEROP-2.7. Hay un incumplimiento de header en el envío de respuestas funcionales —incluida la nueva ruta live de `UNKNOWN`— y una contradicción interna en el criterio de Contract Sync del WI. La revisión valida compatibilidad estática con spec y pruebas existentes; no declara integración live con Core.

## Findings

1. **P1 — Falta `Idempotency-Key` en las respuestas funcionales.** `submitFunctionalAnswer` activa ahora en live la opción `UNKNOWN`, pero el `POST /analysis-runs/{analysisRunId}/context-questions/{questionId}/answers` no envía `Idempotency-Key` ([api.ts](/Users/jean/Tesis/workspaces/tjc-fe-rag-developer-console/app/src/action-required/api.ts:46)). INTEROP-2.7 §3 exige UUID en respuestas funcionales y establece `400 IDEMPOTENCY_KEY_REQUIRED`/`INVALID_IDEMPOTENCY_KEY` (§3, líneas 45–46); §6.11 define esa operación como `202` y admite `UNKNOWN` auditado. El código y las pruebas live actuales no generan ni verifican una clave estable por acción lógica para esta operación. La autorización de rol se delega correctamente a Core y los errores HTTP se conservan como `ApiError` con `code`/`details`, pero eso no corrige el header ausente. **Acción:** añadir una key UUID estable a la operación y probar header/reintento de transporte, para respuestas `UNKNOWN` y demás respuestas funcionales.

2. **P2 — Criterio de Contract Sync incompatible con el registro del WI.** El criterio de aceptación dice que al completar se emite un `CS-CONSOLE-…` dirigido a Core, incluso si no hubo diferencia contractual; a la vez, WI-CONSOLE-020 tiene `publishesContract: false` ([work-items.json](/Users/jean/Tesis/workspaces/tjc-fe-rag-developer-console/harness/work-items.json:1424), criterio en línea 1431). `harness/WORKFLOW.md` reserva `contractSyncPublished` y el comando `publish` a WIs con `publishesContract=true`. Los eventos importados de Core se encuentran acusados/resueltos y la revisión no identificó una nueva necesidad contractual para Core. Por tanto, no emití un evento inventado ni cambié el registro. **Acción:** resolver el criterio/registro antes del cierre: o retirar el requisito de emisión cuando solo se confirma compatibilidad, o aprobar y registrar una necesidad contractual concreta y habilitar publicación en el WI. No requiere decisión sobre el comportamiento de INTEROP-2.7; sí requiere corregir la inconsistencia del WI para satisfacer su criterio de cierre.

## Blockers

- El punto 1 debe corregirse antes de aprobar el contrato del adapter.
- El criterio/registro discrepante del punto 2 debe resolverse antes de marcar Contract Sync y WI como cerrados.

## Files affected

- `app/src/action-required/api.ts`
- `app/src/action-required/api.test.ts`
- `app/src/experiments/api.ts`
- `app/src/experiments/liveMapping.ts`
- `app/src/experiments/api.live.test.ts`
- `app/src/experiments/liveMapping.test.ts`
- `app/src/control-plane/api.ts`
- `app/src/control-plane/operationalTrace.test.ts`
- `app/src/retrieval-comparison/api.ts`
- `app/src/retrieval-comparison/api.test.ts`
- `app/src/evidence/api.ts`
- `app/src/evidence/api.test.ts`
- `app/src/evidence/types.ts`
- `harness/work-items.json` (discrepancia del criterio/registro; no modificado)

## Evidence

- **§6.5 / §6.5.1, OE5:** el live POST forma `{ analysisRunId, symbolFilePath, symbolQualifiedName }` y adjunta `Idempotency-Key`; status/results usan los IDs y `symbol` publicados. `liveMapping` preserva `number | null`, metadata opcional/nullable, contadores de evaluabilidad y valores abiertos de `failureCode`. Las pruebas live validan el body y el header; las pruebas de mapping cubren nulls, configuración parcial y fallos.
- **§6.11:** listar Functional Knowledge usa `GET /projects/{id}/functional-knowledge` con filtro. El answer POST omite `answer` cuando no aplica, conserva `conflictResolution`, propaga errores y ahora permite `UNKNOWN`; falla únicamente la key obligatoria descrita en el finding 1.
- **§6.13 / auth:** los adapters usan `apiRequest`, que adjunta `Authorization: Bearer` de sesión y mapea respuestas de error de Core a `ApiError`; el contrato exige auth en toda ruta navegador→Core. No hay cambios a identidad ni a la decisión de autorización, que permanece en Core. La fila de `UNKNOWN` limita la acción a Maintainer/Admin y Core debe devolver `403 PROJECT_ROLE_INSUFFICIENT` a Writer/Reader.
- **§6.15, OE2:** las cuatro operaciones usan las rutas publicadas. POST conserva `Idempotency-Key` y emite solo los tres campos de anclaje Run/símbolo. La guardia local fija `groundTruth` en 200; como la UI no envía esa verdad, el caso de exceso se prueba en el builder. Los errores 409/422/404 y la política de polling se cubren en pruebas existentes.
- **§6.16, trace/evidence:** trace consulta `/analysis-runs/{id}/trace`. Evidence selecciona las tres rutas por tipo, usa transporte autenticado y conserva el texto de respuesta sin reserializar. Los tipos modelan nulls, `technicallyEvaluable` y las claves cerradas de `sandbox[].facts`; pruebas existentes cubren allowlist, `retrieval: []` en FAILED, omisiones sensibles y preservación de JSON crudo. El test live mostrado verifica ANALYSIS_RUN, pero no ejercita por separado las ramas EXPERIMENT y RETRIEVAL_COMPARISON.
- El diff contiene pruebas de adapters live y de mapping; no ejecuté tests durante esta revisión.
- `wi-console-020-implementation.md` registra que `localhost:3000` no estaba activo y que el checkout local de Core aún exponía el DTO histórico. Según el alcance indicado, esto no bloquea la comparación contractual ni se toma como verificación live. No se afirma que Core local o remoto se haya probado en esta revisión.
- El reporte de puerta externa registra los Contract Sync importados y los hashes de los espejos de la revisión Core. No encontré un evento nuevo que notificar a Core a raíz de esta revisión.

## Recommended next step

Corregir `Idempotency-Key` en respuestas funcionales y añadir cobertura de su estabilidad; decidir cómo reconciliar la emisión obligatoria de CS-CONSOLE con `publishesContract: false` sin publicar una necesidad inexistente; luego repetir Contract Reviewer sobre el diff actualizado. Mantener la verificación live contra Core como pendiente separada.
