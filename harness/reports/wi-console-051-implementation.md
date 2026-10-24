# WI-CONSOLE-051 · Reporte de implementación

Modelo: implementer · configurado claude-haiku-5-5 · atendido unknown · esfuerzo low

## Alcance

Alinear el tipo local `ExperimentResultsResponse` con INTEROP-2.20 §6.5 (`spec/contracts/interoperability-contract.md`). Sin cambio de comportamiento, DTOs de producto, UI ni rutas.

## Análisis de consumidores

- `grep` de `analysisRunId` y `symbol` sobre `app/src` (excluye tests): ningún lector de `ExperimentResultsResponse`.
- La única coincidencia `results.symbol.qualifiedName` (`app/src/retrieval-comparison/RetrievalComparisonPage.tsx:288`) pertenece a `RetrievalComparisonResultsResponse`, otro tipo.
- `app/src/experiments/api.ts:47` solo tipa la respuesta; no lee los campos opcionales.
- Conclusión: el cambio no rompe consumidores ni cambia comportamiento. No se requirió DECISION_REQUIRED.

## Archivos tocados

| Archivo | Cambio |
|---|---|
| `app/src/experiments/liveMapping.ts` (líneas 98–109) | Añade comentario que cita INTEROP-2.20 §6.5; `targetId: string` requerido; `analysisRunId?: string` y `symbol?` opcionales (líneas 106–108). |
| `app/src/experiments/liveMapping.test.ts` | `targetId: 't-1'` en fixtures literales `results` (línea 28) y `resultsWith27` (línea 128). Nueva prueba INTEROP-2.20 al final (líneas 401–415). |

Nota de alcance: el fixture `as unknown` de `withInterop213` (y los spreads `withExecution`, `noEval`) heredan `targetId` de `resultsWith27` por spread; no se añadió línea explícita. `tsc` verifica el tipo.

## Prueba nueva

`INTEROP-2.20: sin analysisRunId ni symbol y con targetId el mapeo produce las mismas métricas`: construye un `ExperimentResultsResponse` sin `analysisRunId`/`symbol`, con `targetId`; compara `toExperimentOperation(...).result` con el de `resultsWith27` (toEqual) y verifica métricas de RAG. Sin reloj real.

## Gates (ejecutados en `app/`, Node 22 vía `$HOME/.local/node22/bin`)

| Comando | Resultado |
|---|---|
| `pnpm lint` | exit 0 (`eslint .`, sin salida de error) |
| `pnpm exec tsc -b --noEmit` | exit 0 |
| `pnpm test --maxWorkers=4` | exit 0 · Test Files 94 passed (94) · Tests 964 passed (964) |
| `pnpm format:check` | exit 0 · "All matched files use Prettier code style!" |
| `pnpm contracts:check` | exit 0 |

## Pendiente / fuera de alcance

- No se hizo commit, push ni cambios en `harness/` (salvo este reporte), `spec/` ni CHANGELOG.
- Los campos `analysisRunId` y `symbol` siguen pendientes de HU17; el leader decide su registro en el WI.

## Espejo de contratos (leader)

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

Origen: Core `/Users/cjcarlosgc/Development/Tesis/tjc-be-rag-core-api`, revisión `2318b9df292b337db4998f04b66b0457f1df8e3f`, con `git show "${REV}:<ruta>"` (no el working tree) y `git archive` para el árbol. Un solo paso, sin pasar por 2.20/2.15. `cmp` contra `git show` idéntico en los tres contratos; `diff -r` del árbol de esquemas contra `git archive` sin diferencias.

| Artefacto | Versión | SHA-256 (Console = Core 2318b9df) |
|---|---|---|
| `interoperability-contract.md` | INTEROP-2.21 | `7f946d55b24cf13dad180927108cf777b8dde036ce2185d37590e6c072d0d29d` |
| `system-contract.md` | SYSTEM-2.16 | `d0a492b4484c8883d65e709f76d8c7ff2462b0eb8c832649cf75723b9543ea77` |
| `github-integration-contract.md` | GH-INTEROP-1.9 | `dedf00fa2f0f5be928cfaf1e5a12ff19f96e7579524a0a689757f1077bfc6e4e` |
| árbol `spec/contracts/schemas` (receta `find . -type f \| LC_ALL=C sort \| xargs shasum -a 256 \| shasum -a 256`) | 34 archivos | `8079ab73887e3a74b2dba57fa5ae5c146e47eb21231f9965718a85a3a2619718` |

Cruce con la revisión intermedia `208c3bdfe21bfc4b294da118d8ab1318f0432ca5` (declarada en `CS-CORE-20261024-003`), calculado por el leader con `git show`/`git archive`: INTEROP-2.20 `f0b395785eed3a42818c2a81f020edecc0cc0eaac912961e81aba2a9ff8e4a6a`, SYSTEM-2.15 `f3b61da59fcff613b86c0e2945c165fbf808eb44b48504bfe86521fe78f728ce` (ambos intermedios, no espejados), GH-INTEROP-1.9 `dedf00fa…` y schemas `8079ab73…`: GH y schemas idénticos a `2318b9df`. Coinciden con lo declarado en los eventos.

Esquemas: nuevo `github-webhook-event.schema.json` y 15 ejemplos `github-webhook-event.*`; `manifest.json` y `sandbox-result.failed.json` (`DEPENDENCY_INSTALL_FAILED`) actualizados. `pnpm contracts:generate` regeneró `app/src/contracts/generated/contract-schemas.ts` y `contract-types.ts` (solo añaden el esquema nuevo); `pnpm contracts:check` queda limpio.

Referencias vigentes actualizadas (SYSTEM-2.14→2.16, INTEROP-2.19→2.21, GH-INTEROP-1.8→1.9): `spec/README.md`, `spec/constitution/architecture.md`, `spec/features/013-pr-driven-control-plane/{plan,spec}.md`. No se tocan: espejos, historia (ST antiguas, CHANGELOG pasado, reportes), ni los comentarios de código `INTEROP-2.18 §…`/`2.19 §…` (`socket.ts`, `ExperimentPage.tsx`, `useExperimentRealtime.ts`, `queries.ts`, `useAnalysisRunRealtime.ts`, etc.): son referencias a la sección donde nació la regla, que no cambian en 2.20/2.21 (mismo criterio que WI-CONSOLE-045). El comentario de `liveMapping.ts` sí cita ahora INTEROP-2.20 §6.5.

## Resolución del Contract Sync (leader)

`CS-CORE-20261024-003` y `-004` se resuelven con esta evidencia: contratos y esquemas re-espejados byte a byte y cruzados los digests (arriba), tipos regenerados con `contracts:check` limpio, tipo local `ExperimentResultsResponse` alineado con INTEROP-2.20 con prueba mínima y sin cambio de comportamiento. `-004` supera a `CS-CORE-20261021-001..004` y `CS-CORE-20261024-001..003` en INTEROP/SYSTEM (el espejo fue directo a 2.21/2.16); no se acusa por Integration ni Sandbox. Pendiente aparte: `reasoningEffortMessage` (`app/src/control-plane/errors.ts`) atribuye el 422 `REASONING_EFFORT_UNSUPPORTED` al modelo; la prosa de INTEROP-2.21 presenta reasoning como comportamiento del adaptador configurado; ajustar copy exige un WI aparte con aprobación de alcance.
