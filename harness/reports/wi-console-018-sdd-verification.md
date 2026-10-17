# WI-CONSOLE-018 — Verificación SDD

Modelo: sdd-analyst · configurado claude-sonnet-5-5 · atendido claude-sonnet-5-5 · esfuerzo low

Work item: WI-CONSOLE-018 «Presentación de la metadata de OE5» (ST-CONSOLE-020, HU17, sprint SMART V3). Solo verificación; no se editó código, state.json ni work-items.json.

## Veredicto: SUFFICIENT

Con una aclaración que el Leader debe fijar en el handoff (no es decisión del sistema): ver «Adapter live» (punto A).

## Decision gate
- Fuente: `spec/contracts/system-contract.md`.
- blockingDecisionIds: [] (ninguno).
- nonBlockingDecisionIds: `DEC-INF-001` (PENDING; Blocks: aprovisionamiento remoto), `DEC-VAL-001` (PENDING; Blocks: código/evidencia empresarial). Ninguna alcanza este WI (UI + mocks).
- Aplicables ya APROBADAS: `DEC-EXP-FK-001`, `DEC-EXP-003`, `DEC-EXP-004` (modelo/esfuerzo idénticos en ambos brazos, Console solo los muestra). Sin PROPOSED aplicables. Dependencia externa Core WI-CORE-017: gate G-PASSED en el WI.

## Campos publicados en INTEROP-2.7 §6.5.1 (lista exacta)
Contrato «Definido, pendiente de implementar y verificar» (WI-CORE-023/024/025). Los consumidores ignoran campos desconocidos.

Agregados a `ExperimentStatusResponse` (`GET /experiments/{id}`), todos NO nulos en el contrato:
| JSON | Tipo | Null | Semántica citada |
|---|---|---|---|
| `model` | `ExperimentModelConfigResponse` | no | configuración LLM común a ambos brazos |
| `model.provider` | string | no | — |
| `model.model` | string | no | `gpt-6-luna` vía OpenAI (DEC-EXP-004) |
| `model.modelVersion` | string | sí | — |
| `model.reasoningEffort` | string | sí | «efectivo y común a ambos brazos» |
| `model.temperature` | number | sí | — |
| `model.maxOutputTokens` | number | sí | — |
| `budget` | `ExperimentBudgetResponse` | no | presupuesto comparable |
| `budget.toolCallCap` | number | no | tope de tool calls |
| `budget.contextTokenBudget` | number | no | presupuesto de contexto |
| `budget.maxDurationMs` | number | no | duración máxima |
| `executionProfile` | string | no | perfil de Sandbox (sin enum publicado) |
| `runnerHint` | string | no | sin semántica definida |
| `randomizationSeed` | string | no | «orden dentro de cada par aleatorio y reproducible a partir de `randomizationSeed`, persistido por experimento» |

Agregados a `ExperimentRepetitionResponse` (`GET /experiments/{id}/results`):
| JSON | Tipo | Null | Semántica citada |
|---|---|---|---|
| `pairId` | `Id` | no | par (3 pares: 3 RAG + 3 GA) |
| `pairPosition` | `1 \| 2` | no | «posición de ejecución dentro del par, reproducible desde randomizationSeed» |
| `attempt` | number | no | «1 o 2» (máx. un reintento por fallo externo demostrado) |
| `technicallyEvaluable` | boolean | no | `false` = segundo fallo de infraestructura |

Ya existentes en el código (INTEROP-1.5, sin cambio): `toolCalls`, `filesInspected`, `retrievedChunks`, `selectedChunks`, `contextTokens`. Reglas: «Ningún DTO declara un ganador»; `validRate`/`passedRate` son «diagnóstico técnico» y no se derivan en CF/CO; las tasas usan `[0,1]` y «un valor no observable se representa con `null`, nunca con cero». El contrato no define `404/422` nuevos que la UI deba mapear aquí salvo `422 REASONING_EFFORT_UNSUPPORTED` en `POST /experiments` (ya cubierto por el manejo de error genérico; verificar que `bindingErrorMessage` lo muestre sin romper).

## Estado actual del código
- `experiments/types.ts`: `ExperimentOperation {id,status,progress,result?}`; `RepetitionResult {target,repetition,strategy,valid,failureType,durationMs,totalTokens,errorSummary}`. Sin campos OE5.
- `experiments/liveMapping.ts`: `ExperimentStatusResponse` y `ExperimentRepetitionResponse` sin campos 2.7; `toExperimentOperation` descarta cualquier campo extra.
- `ExperimentComparison.tsx` (una sola línea larga, línea 27): `rateRows` con `className={delta >= 0 ? 'positive-delta' : 'negative-delta'}`; tabla de repeticiones con columnas Target, Repetición, Estrategia, Válida, Failure type, Duración, Tokens, (Contexto oculta). Sin bloque «Configuración».
- `mockBackend.ts` `experimentResult()` (≈902) crea las 6 repeticiones y las tasas; `mockGetExperiment` devuelve `operation` con `result`. `experimentResult` lo comparte también la comparación por Run (`run-comparison`, ≈1000), y `run-comparison/types.ts` reutiliza `ExperimentResultViewModel`.
- Consumidores de `ExperimentComparison`: `ExperimentPage.tsx` y `RunComparisonPage.tsx` (nota `ExperimentConditionsNote` ya existe por WI-019).
- `styles.css`: `.positive-delta` / `.negative-delta` (líneas 241-242) usados solo en `ExperimentComparison.tsx` (grep en `app/src`).
- Prueba `noAutomaticVerdict.test.tsx` ya existe (WI-019): regex `paridad|ganador|superior|winner|veredicto|outperform|gana\b`, clases `winner/verdict`, tasas invertidas, banner DEMO.

## Adapter live: qué hace hoy y qué debe seguir haciendo (punto A, aclarar)
- Hallazgo: `experiments/api.ts` NO responde `PendingContractError` hoy; en modo live ya llama a `POST /experiments`, `GET /experiments/{id}` y `/results` (INTEROP-1.5) y está probado en `api.live.test.ts`. Los `PendingContractError` existentes viven en `context-explorer/api.ts` y `retrieval-comparison/api.ts`, no en experimentos.
- El criterio del WI («hasta entonces responde con el PendingContractError») no puede aplicarse literal sin romper un flujo live ya funcional y probado.
- Recomendación (a confirmar por el Leader): NO convertir `getExperiment`/`startExperiment` a `PendingContractError`. En `liveMapping.ts` declarar los campos 2.7 como opcionales en los tipos de respuesta y mapearlos si vienen (los tipos/nombres vienen de INTEROP-2.7, no se inventa nada); si faltan (Core sin implementar), el view model queda `undefined`/`null` y la UI muestra «no disponible». Así el adapter solo usa campos publicados en 2.7 y no regresiona la base 1.5. La activación y verificación live real es WI-CONSOLE-020. Alternativa más estricta (rechazada por regresión): devolver PendingContractError solo si faltan los campos 2.7; no recomendable porque bloquearía el resultado base.
- Mantener sin cambios los `PendingContractError` de context-explorer y retrieval-comparison.

## Alcance exacto de archivos
1. `app/src/experiments/types.ts`: `RepetitionResult` + `pairId: string | null`, `pairPosition: 1 | 2 | null`, `attempt: number | null`, `technicallyEvaluable: boolean | null` (opcionales/nulables para tolerar Core sin 2.7). `ExperimentOperation` (o un tipo `ExperimentConfiguration` exportado en el mismo módulo) + `model`, `budget`, `executionProfile`, `runnerHint`, `randomizationSeed`. Dado que el bloque «Configuración» necesita pasarse a `ExperimentComparison`, ubicar la config en `ExperimentResultViewModel` (p. ej. `configuration?: ExperimentConfiguration`) y poblarla desde el status; `ExperimentOperation` la expone igualmente. Tipos nuevos en el módulo de la feature (criterio 4).
2. `app/src/experiments/liveMapping.ts`: campos 2.7 opcionales en `ExperimentStatusResponse`/`ExperimentRepetitionResponse`; `toExperimentOperation` pasa la config del status al view model; `toExperimentResultViewModel` mapea los 4 campos por repetición (`?? null`).
3. `app/src/experiments/ExperimentComparison.tsx`: retirar clase de color; columnas Par, Posición, Intento, Evaluable; marca «técnicamente no evaluable»; bloque «Configuración».
4. `app/src/styles.css`: eliminar `.positive-delta`/`.negative-delta`; añadir estilos mínimos del bloque (reutilizar `retrieval-panel`/`dl`) y de la marca (borde/ícono + texto).
5. `app/src/api/mockBackend.ts`: `experimentResult()` agrega config 2.7 y por repetición `pairId` (3 pares, p. ej. `pair-1..3`), `pairPosition` alternando 1/2 coherente por par, `attempt` 1 (y una repetición con `attempt: 2`), y al menos una con `technicallyEvaluable: false` y otra con campos `null` para cubrir «no disponible». Seguir rotulado DEMO. `run-comparison` reutiliza el mismo resultado; no se toca su código salvo que los tipos exijan campos.
6. No tocar: `ExperimentPage.tsx` (salvo que se decida mostrar algo extra), `api.ts`, `spec/contracts/*`, `context-explorer`, `retrieval-comparison`.
7. Pruebas: actualizar `ExperimentComparison.test.tsx` (fixtures con campos nuevos; conservar «+25.0 pp»); `liveMapping.test.ts` (mapeo con y sin campos 2.7, null→null); `noAutomaticVerdict.test.tsx` (extender); `ExperimentPage.test.tsx` y `RunComparisonPage.test.tsx` solo si el mock cambia lo que asertan. `api.live.test.ts` sin cambios (debe seguir verde).

## Qué NO está definido (no inventar; diferir o DECISION_REQUIRED al Leader)
- Texto/formato de `pairId` (Id opaco): mostrarlo tal cual o abreviado; no inferir numeración «Par 1/2/3».
- Presentación de `pairPosition` y `attempt` (p. ej. «1 de 2», «2.º»): wording libre del implementer, sin interpretar «orden de ejecución global».
- Valor concreto de `reasoningEffort` (el contrato dice «máximo soportado»; no hay enum): el mock usa un valor ilustrativo marcado como demo; no inventar escala. Con `null` → «no disponible».
- `runnerHint`: sin semántica ni criterio de aceptación; recomendado NO mostrarlo (o solo en `title`/detalle técnico) y diferirlo; tipar y mapear sí.
- `executionProfile`: sin enum; mostrar el string tal cual.
- Cómo tratar `technicallyEvaluable: false` en tasas/promedios: el contrato no lo define; Console NO recalcula ni excluye (las tasas vienen de Core). Solo marca la fila. Si se quiere advertir «tasas calculadas sobre repeticiones evaluables», es DECISION_REQUIRED; diferir.
- Unidades/etiquetas de `toolCallCap`, `contextTokenBudget`, `maxDurationMs`: usar nombres técnicos y unidades obvias (tokens, ms con `formatDuration`).
- CF/CO y jerarquía de métricas: no hay campos publicados; no mostrar nada ni derivarlos. Precision/Recall: no deben aparecer en OE5.
- `422 REASONING_EFFORT_UNSUPPORTED`: mensaje de UI no especificado; usar el mensaje que ya muestra el manejo de errores del binding; texto dedicado = diferir.
- Etiquetas de columna «Par», «Posición», «Intento», «Evaluable», bloque «Configuración», «no disponible», «técnicamente no evaluable»: sí definidas por el criterio de aceptación.

## Cómo mostrar null como «no disponible»
- Helper local en el módulo de la feature (p. ej. `formatOrUnavailable(value, fmt?)`): `null`/`undefined` → «no disponible»; cero legítimo se muestra «0».
- Aplicar a: `pairId`, `pairPosition`, `attempt`, `technicallyEvaluable` (null → «no disponible», no «Sí/No»), `model.modelVersion`, `reasoningEffort`, `temperature`, `maxOutputTokens`, y a toda la config si viene `undefined`.
- Las tasas (`validRate`…) son `number` hoy; el contrato dice que un valor no observable es `null`. Si el tipo se amplía a `number | null`, el cálculo de delta debe usar «no disponible»; si no, queda fuera de este WI (no cambiar firma de tasas sin necesidad). Los guiones «—» ya existentes en tokens/costo pueden permanecer o unificarse a «no disponible» (decisión de copy menor; mantener consistencia dentro del WI).
- Prueba: fixture con todos los campos nuevos `null` → aparece «no disponible» y no aparece «0» en esas celdas.

## Retirar positive-delta / negative-delta sin romper otros usos
- Solo hay un uso (`ExperimentComparison.tsx` línea 27, mismo `span` de la fila de tasas) y dos reglas en `styles.css:241-242`. Eliminar la clase condicional del `span` (sin `className` o con una clase neutra nueva, p. ej. `rate-delta`, color heredado/`--muted`) y borrar las dos reglas; mantener el signo «+»/«−» y «pp» (el signo es el portador del estado, no el color).
- Verificar con `grep -rn "positive-delta\|negative-delta" app/src` = 0 antes de cerrar; la prueba existente `+25.0 pp` sigue válida.
- Prueba negativa nueva: ningún elemento tiene esas clases y las filas de tasas no tienen color de éxito/peligro (p. ej. `container.querySelector('.positive-delta, .negative-delta')` null).
- Prueba negativa Precision/Recall: `expect(container.textContent).not.toMatch(/precision|recall/i)` en ExperimentPage y RunComparisonPage; hoy hay 0 coincidencias en `experiments/` y `run-comparison/`.

## Accesibilidad / contraste
- Estados no solo por color: la marca «técnicamente no evaluable» con texto visible (y opcionalmente ícono), no solo color o atenuado. `Evaluable` Sí/No/«no disponible» en texto.
- Tabla: 4 columnas más en una tabla ya de 8; `table-frame` debe permitir scroll horizontal accesible por teclado (`tabindex=0`, `role=region` + `aria-label`) si desborda; mantener `<th>` con `scope="col"`.
- Bloque «Configuración»: `<section aria-labelledby>` con `<h3>` y `<dl>`; textos en `--muted`/`--text-dim` deben cumplir AA (4.5:1) sobre `#050506`/`#0b0b0d` (`--text-dim: #716f82` ≈ 4.2:1 sobre #0b0b0d: no usarlo para texto informativo).
- Retirar verde/rojo reduce el riesgo de declarar ganador implícito y el de daltonismo; las diferencias se muestran en color neutro.
- Polling/errores: `role="status"` de progreso y `role="alert"` de error ya existen en `ExperimentPage`; no tocarlos. Foco visible global ya aplicado (contorno ≥ 2 px).
- Riesgo residual preexistente (fuera de alcance): `role="table"` de comparación con filas sin celdas ARIA; no corregir aquí.

## Riesgos
- Ambigüedad del criterio de PendingContractError vs adapter live ya activo (punto A): requiere confirmación del Leader.
- Mocks con campos opcionales: si los tipos son obligatorios, hay que actualizar todos los fixtures (`ExperimentComparison.test`, `liveMapping.test`, `noAutomaticVerdict` vía mock, `run-comparison`).
- `experimentResult()` compartido con la comparación por Run: el mock nuevo debe seguir sirviendo a ambas pantallas.
- La nota de WI-019 («condiciones experimentales externas controladas») debe permanecer; no usar «paridad» ni «mejor/peor» en los textos nuevos.

## UI visible / revisión
- UI visible: sí → `ux-reviewer` obligatorio antes de la revisión humana; lint, test, build y `node harness/validate-harness.mjs`.
- contract-reviewer: NO necesario. `contractImpact: false`, `publishesContract: false`; Console solo consume campos ya publicados en INTEROP-2.7 y no cambia DTOs, rutas ni errores del contrato. Se reconsideraría solo si Core publica un Contract Sync posterior (WI-CORE-023/024/025 → eventos de 2.7 relevantes) o si el Leader decide devolver PendingContractError en `api.ts` (cambio de comportamiento del adapter), en cuyo caso conviene una revisión rápida del Leader, no un contract-reviewer.

## Siguiente paso recomendado
Leader: registrar `decisionGate` (blocking: [], nonBlocking: [DEC-INF-001, DEC-VAL-001]), confirmar el punto A (adapter live sin regresión, campos 2.7 opcionales), pasar a W-SPEC_VERIFIED y delegar a `implementer` (Low) con el alcance anterior; luego `ux-reviewer` y revisión del Human Reviewer.

## Decisión del Leader (2026-10-09) — punto A, adapter live de experimentos
Decisión tomada por el Leader siguiendo la recomendación del sdd-analyst (opción 1) y aceptada por defecto por el usuario; el usuario la confirma al revisar. Es reversible.
- `getExperiment`/`startExperiment` NO se convierten en `PendingContractError` (ya funcionan en live contra INTEROP-1.5 y están probados en `api.live.test.ts`).
- Se reinterpreta el criterio del WI («hasta entonces responde con el PendingContractError») como «el adapter no usa campos no publicados»: los campos de INTEROP-2.7 §6.5.1 son opcionales en `liveMapping.ts`; si Core no los envía la UI muestra «no disponible», nunca cero.
- `runnerHint` se tipa y mapea pero no se muestra.
- contract-reviewer no necesario (`contractImpact: false`).
- Si el usuario prefiere el criterio literal, se revierte en un corte posterior.
