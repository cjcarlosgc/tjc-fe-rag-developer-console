# WI-CONSOLE-052 — implementación

Modelo: implementer · configurado claude-haiku-5-5 · atendido unknown · esfuerzo low

## Alcance implementado
Corte opcional aprobado: mostrar `layer` en el panel del candidato y `configuration.strategy` en el panel del target, con rótulos en español y fallback. `inclusionReason` NO se implementa (no existe en INTEROP-2.22/2.23 ni en Core `8c3eb0f`); queda aparcado y pendiente de decisión del leader/Cross.

## Archivos tocados (solo app/)
- `app/src/context-explorer/types.ts`: `RagDiscardReason` + `BELOW_RELEVANCE_THRESHOLD`; tipos `RagContextStrategy`, `RagContextLayer`; `RagCandidateNode.layer?: RagContextLayer | null`; `configuration` con `strategy?`, `relevanceThreshold?`, `declaringClassMaxTokens?`, `targetEvidenceMaxTokens?`.
- `app/src/context-explorer/rag/ragLabels.ts`: etiqueta de `BELOW_RELEVANCE_THRESHOLD`; mapas `ragLayerLabel`, `ragStrategyLabel`; funciones `ragLayerName`, `ragStrategyName` (fallback al valor crudo, nunca vacío) y `discardReasonName` (fallback «Descartado»). Lookup con `hasOwnProperty` para no caer en propiedades del prototipo.
- `app/src/context-explorer/rag/RagSidePanel.tsx`: fila «Capa» (candidato, entre «Decisión» y «Motivo de descarte», solo si `layer` es truthy); fila «Estrategia de contexto» (target, solo si `configuration.strategy` existe; sin inferir RANKED); motivo de descarte con `discardReasonName`.
- `app/src/api/mockBackend.ts`: solo la traza `trace_rag_order_total` lleva capas (`chunk-001` DECLARING_CLASS, `chunk-002` RELEVANT_SEMANTIC, `chunk-003` TARGET_EVIDENCE, solo SELECTED) y `configuration` con `strategy: 'LAYERED'`, `relevanceThreshold: 0.6`, `declaringClassMaxTokens: 600`, `targetEvidenceMaxTokens: 1200`. `chunk-012` pasa a `BELOW_RELEVANCE_THRESHOLD`. Trazas RAG del experimento sin campos nuevos. Conteos derivados del array (sin cambios manuales).
- Tests nuevos/ampliados: `app/src/context-explorer/rag/RagSidePanel.test.tsx` (nuevo), `app/src/context-explorer/rag/ragLabels.test.ts`, `app/src/context-explorer/api.test.ts`.

## Pruebas nuevas
- ragLabels: etiqueta del enum nuevo; fallback «Descartado» para motivo desconocido, vacío y `toString`; etiquetas de capa; crudo para capa desconocida y «No disponible» para vacío; etiquetas de estrategia y crudo desconocido.
- RagSidePanel: fila «Capa» con cada etiqueta; ausente / null / vacío sin fila; valor crudo desconocido; orden entre Decisión y Motivo; descarte nuevo con rótulo; motivo desconocido y de prototipo → «Descartado»; estrategia LAYERED con rótulo; estrategia ausente sin fila; estrategia desconocida cruda.
- api (mock): la traza demo trae capas en SELECTED, `LAYERED`, descarte `BELOW_RELEVANCE_THRESHOLD`, y conteos coherentes; las trazas del experimento no tienen capas ni estrategia.
- Glosario (`ui/glossary.test.ts`): pasa sin cambios.

## ROJO → VERDE (mutaciones temporales, restauradas y verificadas con diff)
| Mutación (lógica clave) | Resultado en ROJO | Tests fallidos |
|---|---|---|
| M1: motivo sin fallback (`discardReasonLabel[...]` en el panel) | 4 fallos | motivo nuevo, desconocido, prototipo, orden de fila |
| M2: fallback crudo devuelve `''` en `nameOrRaw` | 4 fallos | capa desconocida, estrategia desconocida, labels |
| M3: sin guarda de `layer` (`{true && …}`) | 5 fallos | ausente/null/vacío, orden, motivo, prototipo |
| M4: estrategia inferida como RANKED cuando falta | 1 fallo | «no infiere RANKED» |
| M5: enum `BELOW_RELEVANCE_THRESHOLD` sin etiqueta | 2 fallos | etiqueta del motivo |
Tras restaurar: `diff` idéntico a las copias de respaldo y 48/48 verdes en el paquete de context-explorer.

## Gates (en app/, con `PATH=$HOME/.local/node22/bin`)
| Gate | Resultado |
|---|---|
| `pnpm lint` | exit 0 |
| `pnpm exec tsc -b --noEmit` | exit 0 |
| `pnpm test --maxWorkers=4` | exit 0 · 95 ficheros, 985 tests |
| `pnpm build` | exit 0 |
| `pnpm format:check` | exit 0 (tras `prettier --write` sobre mis archivos) |
| `pnpm contracts:check` | exit 0 (sin cambio en `generated/`) |

## Pendiente / notas
- No verificado visualmente a 375 px ni 1280 px (no se levantó servidor ni navegador). La dd de `.side-panel-meta` ya tiene `overflow-wrap: anywhere`, por lo que el rótulo largo debería envolver; falta comprobarlo en navegador.
- Los scores del mock son valores de demostración: `chunk-012` (0.41) es descartado por `BELOW_RELEVANCE_THRESHOLD` aunque `minimumScore` sea 0.5; la incoherencia ya existía en el mock (otros descartes) y no se ha reescrito.
- `inclusionReason`: no implementado (aparcado, decisión del leader).
- No se tocó `harness/`, `spec/` ni `CHANGELOG`. No hay commit, push, PR ni merge. No quedaron dev servers arrancados.

## Espejo de contratos y resolución de Contract Sync (leader)

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

Origen: Core `/Users/cjcarlosgc/Development/Tesis/tjc-be-rag-core-api`, revisión `8c3eb0f73b805492ee46887e6024dc33254dbe6d`, con `git show <rev>:spec/contracts/interoperability-contract.md` (no el working tree), un solo paso directo desde INTEROP-2.21 a 2.23.

| Artefacto | Versión | SHA-256 (Console = Core 8c3eb0f) |
|---|---|---|
| `interoperability-contract.md` | INTEROP-2.23 | `5de10cb7c9717e10fed8ae34f462d4646f1ee768e60e8660feb61dfc6a468d83` |
| `system-contract.md` (sin cambio) | SYSTEM-2.16 | `d0a492b4484c8883d65e709f76d8c7ff2462b0eb8c832649cf75723b9543ea77` |
| `github-integration-contract.md` (sin cambio) | GH-INTEROP-1.9 | `dedf00fa2f0f5be928cfaf1e5a12ff19f96e7579524a0a689757f1077bfc6e4e` |
| árbol `spec/contracts/schemas` (sin cambio) | — | `8079ab73887e3a74b2dba57fa5ae5c146e47eb21231f9965718a85a3a2619718` |

Cruce: en `8c3eb0f`, `e4d6dd8b…` (INTEROP-2.22 intermedio, `76f5e77431969995d359fb973f58c9d94ccd43c12c3429557e45806a72a29c43`, no espejado) y `2318b9df…`, SYSTEM, GH y el árbol de schemas dan el mismo digest que arriba (calculado por el leader con `git show`/`git archive`). `pnpm contracts:check` limpio y `app/src/contracts/generated` sin cambios. Referencias vigentes INTEROP-2.21→2.23 actualizadas en `spec/README.md`, `spec/constitution/architecture.md` y `spec/features/013-pr-driven-control-plane/{spec,plan}.md`; no se tocan reportes históricos ni comentarios de código con secciones (`INTEROP-2.18 §…`, `2.20 §6.5`).

Gates reproducidos por el leader en `app/`: `pnpm lint`, `pnpm exec tsc -b --noEmit`, `pnpm test --maxWorkers=4` (95 archivos, 985 pruebas), `pnpm build`, `pnpm format:check` y `pnpm contracts:check`, todos exit 0.

`inclusionReason` no existe en el contrato ni en Core `8c3eb0f`: no se implementa (aparcado, informado a cross). `dependencyContext` no se consume; su `tokenCount` puede llegar a 500 (tolerado: Console no lo lee).

## Resolución del Contract Sync (leader)

`CS-CORE-20261025-001` y `-002` se resuelven con esta evidencia: espejo byte a byte directo a INTEROP-2.23 con digests cruzados, `contracts:check` limpio, motivo `BELOW_RELEVANCE_THRESHOLD` etiquetado con fallback robusto, tipos opcionales (`layer`, `strategy`, `relevanceThreshold`, `declaringClassMaxTokens`, `targetEvidenceMaxTokens`) y fila de capa/estrategia en el panel RAG. `-002` subsume a `-001` en INTEROP (el espejo no pasó por 2.22). No se acusa por Integration ni Sandbox.
