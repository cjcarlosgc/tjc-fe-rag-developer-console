# WI-CONSOLE-027 — verificación de suficiencia SDD

Modelo: sdd-analyst · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo low

## Status
READY (alcance suficiente; sin bloqueos). Hallazgo principal: B1 ya está implementado y probado desde WI-CONSOLE-026 (ST-CONSOLE-028); el trabajo real es B2, B3 y D, más reforzar/verificar B1.

## Findings
1. **B1 ya cubierto en código y pruebas.** `app/src/experiments/ExperimentPage.tsx`: con `operation.status === 'FAILED'` renderiza `<div role="alert">` con `experimentFailureTitle()`, `experimentFailureMessage(failureCode)`, detalle `failureMessage` y rótulo `DEMO · DATOS SIMULADOS`; el bloque «Preparando experimento»/`role="status"` solo aparece si `status !== 'FAILED'`; `refetchInterval` es `false` en FAILED; la evidencia se ofrece como terminal. `ExperimentPage.test.tsx` (líneas ~176-200) ya afirma alerta, ausencia de «Preparando», de `role=status`, de botón «reanudar» y de «Huella de retrieval» (ganador/resultado) para worker-lost, experiment-failed y código desconocido. La entrada «Preparando experimento» de `console-deferred-corrections.md` (B, 017) está obsoleta. Acción: verificar y, si el reviewer lo pide, añadir aserción explícita de ausencia de spinner (`.live-indicator`/barra de progreso); no se espera cambio de producción.
2. **B2 pendiente.** `app/src/retrieval-comparison/failureMessages.ts` dice «Se interrumpió el procesamiento de la comparación antes de terminar.»; `EXPERIMENT_WORKER_LOST` dice «El experimento se interrumpió; vuelve a crearlo.». Propuesta de texto: «La comparación se interrumpió; vuelve a crearla.» Actualizar `app/src/retrieval-comparison/api.test.ts:220` (`toMatch(/interrumpió/)` → conservar `/interrumpió/` y añadir `/vuelve a crearla/`). Revisar también `RetrievalComparisonPage.test.tsx` y mockBackend por literales del texto antiguo (grep sobre `WORKER_LOST` en `app/src` solo halló failureMessages.ts y api.test.ts para retrieval).
3. **B3 factible.** Consumidores reales de `useEvidence` (grep en `app/src`): solo `app/src/evidence/queries.test.tsx`. `EvidenceDownload.tsx` importa `evidenceRetryDelayMs` y `shouldRetryEvidence`; `EvidenceDownload.test.tsx` importa `EVIDENCE_NOT_FINISHED_MAX_RETRIES`. Por tanto: eliminar `useEvidence` (y el import de `useQuery`/`getEvidence`/`EvidenceKind` si quedan sin uso) y el bloque `describe('useEvidence')` (3 pruebas: reintento 409 hasta terminar, 404 sin reintento, `enabled=false` sin consulta). Se conserva `describe('shouldRetryEvidence')` (2 pruebas). Conservar `evidenceKeys` solo si algo lo usa (verificar con grep; si no, retirarlo con cuidado) y `evidenceRetryDelayMs`/`EVIDENCE_NOT_FINISHED_MAX_RETRIES`. Eliminar `setMockAnalysisRunForTests`/`act`/`renderHook`/`waitFor` imports no usados del test. No debilita cobertura: el comportamiento 409/404 de la descarga ya lo cubre `EvidenceDownload.test.tsx` (confirmar en la revisión que cubre reintento 409 y 404; si no, mantener esa prueba migrada al componente en vez de borrarla).
4. **D (suite intermitente).** `app/vite.config.ts` solo define `environment: 'jsdom'`, `setupFiles`, `css: true`; sin timeouts ni límite de workers. Hay `app/vite.config.js` y `.d.ts` generados (posible doble configuración; verificar cuál toma vitest — `vite.config.ts` y `.js` coexisten, vitest prefiere `.ts` según orden de resolución, pero confirmar). Causas probables: `css: true` (procesa CSS global pesado en cada archivo), `testTimeout` 5 s por defecto frente a `findBy*` con `refetchInterval` de 10 ms y `timeout` de 2-3 s en pruebas, y concurrencia = núcleos. Diagnóstico requerido: ejecutar la suite completa N veces con y sin `--maxWorkers=2`, registrar fallos por archivo y el tiempo de cada prueba fallida; el mínimo cambio candidato es `test.testTimeout`/`hookTimeout` y/o `maxWorkers`/`fileParallelism` en `vite.config.ts`, y evaluar `css: false` solo si ninguna aserción depende de estilos computados. Prohibido: `skip`, bajar aserciones, `retry` de vitest que oculte fallos.
5. **Spec.** `spec/features/014-analysisrun-experiments` no tiene un requisito de redacción específico del estado FAILED más allá de lo ya implementado en WI-CONSOLE-026; INTEROP §6.5.1/línea 284 fija `failureCode` abierto (`EXPERIMENT_FAILED`, `EXPERIMENT_WORKER_LOST`, desconocidos tolerados) y no define ruta de reanudación; §6.15 define los tres códigos de OE2 (`RETRIEVAL_TARGET_UNRESOLVABLE`, `RETRIEVAL_COMPARISON_FAILED`, `RETRIEVAL_COMPARISON_WORKER_LOST`) como abiertos. El copy es decisión de UI, no contractual. ST-CONSOLE-029 ya existe en tasks.md como `[ ] [T-READY]`; al cerrar debe marcarse con evidencia.
6. **Contrato.** Impacto contractual: ninguno (`contractImpact: false`, `publishesContract: false` correctos). No tocar DTO, adapters live ni espejos.

## Blockers
Ninguno.

## filesAffected (probables)
- `app/src/retrieval-comparison/failureMessages.ts` y `app/src/retrieval-comparison/api.test.ts` (B2)
- `app/src/evidence/queries.ts` y `app/src/evidence/queries.test.tsx` (B3)
- `app/vite.config.ts` y, si el diagnóstico lo exige, archivos de prueba lentos (D)
- `app/src/experiments/ExperimentPage.test.tsx` (solo si se añade aserción de spinner; B1)
- `spec/features/014-analysisrun-experiments/tasks.md`, `CHANGELOG.md`, `harness/reports/console-deferred-corrections.md` (cierre/registro)
- No cambia: `ExperimentPage.tsx`, `failureMessages.ts` de experimentos, `mockBackend.ts` (escenarios `demo-scenario-failed-*` ya existen).

## Riesgos
- Implementer podría «rehacer» B1; indicar que ya existe y solo verificar.
- Eliminar `evidenceKeys`/helpers aún importados rompe `EvidenceDownload`; verificar con grep y `tsc -b --noEmit`.
- Estabilización: no concluir sin evidencia de repetición bajo carga; reportar si la intermitencia es del entorno.
- ux-reviewer: B1/B2 cambian copy/alerta visible (contraste con color computado real).

## Evidence
- grep `useEvidence` en `app/src`: `queries.ts` (definición) y `queries.test.tsx` (único uso).
- `ExperimentPage.tsx` y `ExperimentPage.test.tsx` inspeccionados (alerta FAILED y pruebas existentes).
- `failureMessages.ts` (experiments y retrieval-comparison) y `api.test.ts:220` leídos.
- `app/vite.config.ts` leído.
- `node harness/validate-harness.mjs`: «Harness V3 validation passed.»

## recommendedNextStep
Aprobar alcance (ya aprobado por el usuario) y delegar a `implementer`: B2, B3, D con diagnóstico, y verificación/ajuste mínimo de pruebas B1; luego gates (lint, `tsc -b --noEmit`, vitest con y sin `--maxWorkers=2` varias veces, build), ux-reviewer y reviewer.

## decisionGate
checked: true; blockingDecisionIds: []; nonBlockingDecisionIds: []. No hay decisión PENDING/PROPOSED cuyo `Blocks` alcance WI-CONSOLE-027 (DEC-VAL-001 pendiente es de código empresarial, fuera de alcance). Sin DECISION_REQUIRED.
