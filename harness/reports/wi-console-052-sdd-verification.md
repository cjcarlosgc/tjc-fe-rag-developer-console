# WI-CONSOLE-052 — verificación SDD

Modelo: sdd-analyst · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo low

## Veredicto: SUFICIENTE_CON_NOTAS

## 1. Decisiones (`Blocks`)
- Revisadas las `DEC` de `spec/contracts/system-contract.md` (todas con `Blocks: NONE`, salvo DEC-VAL-001, que bloquea ingestión/despliegue con código empresarial). Ninguna alcanza este WI (UI de lectura sobre campos opcionales de traza). `DEC-RAG-001` es de Core y no aplica. `blockingDecisionIds` vacío.
- `inclusionReason` no existe en INTEROP-2.22/2.23 (verificado en el texto canónico §6.7): queda aparcado, ya informado en la nota del leader. No hay que inventarlo.

## 2. Specs a actualizar
Hoy ninguna describe capa, estrategia ni el motivo nuevo.
- `spec/features/011-context-explorer/spec.md`, línea 20 (hover explica descartes): cambiar «explica `BELOW_MINIMUM_SCORE`, `TOP_K_LIMIT` o `TOKEN_BUDGET`» por «explica `BELOW_MINIMUM_SCORE`, `BELOW_RELEVANCE_THRESHOLD`, `TOP_K_LIMIT` o `TOKEN_BUDGET`; un valor desconocido se rotula «Descartado» sin romper la vista».
- Mismo archivo, tras la línea 22 (detalle lateral), añadir viñeta: «Cuando la traza lo trae (INTEROP-2.22 §6.7), el detalle del candidato muestra la **Capa** que lo seleccionó (`layer`: Clase declarante, Evidencia del target, Semántico relevante) y la cabecera del grafo/panel indica la **Estrategia** (`configuration.strategy`: Por capas / Por ranking). Los campos son opcionales: en trazas anteriores y en TypeScript no se muestran filas vacías. Los umbrales y topes de `configuration` no se muestran. Un valor desconocido se muestra crudo.»
- Mismo archivo, línea 19: «Retenido/Descartado» no cambia (la capa no es un cuarto eje: es atributo del eje decisión). Aclararlo en la viñeta.
- `spec/transversal/design-system/spec.md`: el glosario no requiere cambio (sin términos ingleses nuevos; «capa» y «estrategia» son español). Sí añadir una línea junto a la lista de rótulos que fije la fuente única: «Los rótulos de capa y estrategia RAG salen de `context-explorer/rag/ragLabels.ts`».
- `ui/glossary.test.ts`: sin patrón nuevo obligatorio. Opcional: guardas `Layer`/`Strategy` visibles (`/>(Layer|Strategy)</`) para evitar rótulos en inglés.
- Referencias de versión que actualizar al espejar 2.23: `spec/README.md:10`, `spec/features/013-pr-driven-control-plane/{spec.md:5, plan.md:5}`, `spec/constitution/architecture.md:3` (INTEROP-2.21 → 2.23; mantener SYSTEM-2.16 y GH-INTEROP-1.9), cabecera de `interoperability-contract.md` (llega por espejo) y la tarea ST-CONSOLE-053 de 013/tasks.md solo como historia. `liveMapping.ts` cita INTEROP-2.20 en comentario: sin cambio. Añadir ST de 011/tasks.md enlazado a WI-CONSOLE-052 (el `tasks.md` de 011 ya está modificado en el árbol de trabajo).

## 3. Rótulos propuestos (españoles, sin términos ingleses nuevos)
`discardReasonLabel` mantiene el prefijo «Descartado: …»:

| Valor | Rótulo |
|---|---|
| `BELOW_RELEVANCE_THRESHOLD` | `Descartado: por debajo del umbral de relevancia` |
| `DECLARING_CLASS` | `Clase declarante` |
| `TARGET_EVIDENCE` | `Evidencia del target` |
| `RELEVANT_SEMANTIC` | `Semántico relevante` |
| `LAYERED` | `Por capas` |
| `RANKED` | `Por ranking` |

- Nuevos mapas `ragLayerLabel` y `ragStrategyLabel` en `ragLabels.ts` con fallback al valor crudo (`?? value`). Evitar «Relleno semántico» como rótulo corto: «Semántico relevante» es más claro como valor de una fila «Capa».
- Filas del panel (candidato): tras «Decisión» y antes del motivo, `<dt>Capa</dt><dd>{ragLayerLabel[layer] ?? layer}</dd>`, **solo si `layer` es no nulo**. Un descartado trae `layer: null`, así que no muestra fila.
- Estrategia: `<dt>Estrategia de contexto</dt>` en el panel del **target** (`RagSidePanel` rama target), solo si `detail.configuration.strategy` existe; no en cada candidato. Así no se toca el grafo. Ausente = RANKED según el contrato; recomiendo no mostrar nada si falta (no inferir).
- `RagSidePanel.tsx:103` hoy no tiene fallback: usar `discardReasonLabel[reason] ?? 'Descartado'` (ya existe en grafo y página).
- No mostrar `relevanceThreshold`, `declaringClassMaxTokens` ni `targetEvidenceMaxTokens` (el alcance aprobado solo cita `strategy`). Si el leader los quisiera, filas «Umbral de relevancia» y «Tope de tokens …», fuera del alcance actual.

## 4. Riesgos
- **Desborde:** `RagSidePanel` usa `dl.side-panel-meta` en `styles/context-explorer.css`; los valores nuevos son cortos y caben a 375 px. El texto largo es el rótulo del descarte en `node-badge` del grafo (`RagGraph.tsx:73`): «Descartado: por debajo del umbral de relevancia» es el más largo (~47 caracteres). Comprobar badge y hover-preview a 375 y 1280 px; si desborda, `overflow-wrap`/elipsis o acortar a «Descartado: bajo el umbral de relevancia».
- **Tests/mock:** `context-explorer/api.test.ts` solo afirma `toHaveLength(6)` (lista de trazas) y que algún candidato sea `SELECTED`; no cuenta candidatos ni rótulos. Añadir al mock un candidato con `layer` y un descarte `BELOW_RELEVANCE_THRESHOLD` en `mockBackend.ts` (`orderTotalCandidates` ~522–726 y/o `ragCandidates`) **no rompe** esas aserciones, pero cambia `retrievedChunks`/`selectedChunks`/`contextTokens`, derivados del array (verificar `RagGraph.test.tsx` y `ragLabels.test.ts`, que usan fixtures propios: no se ven afectados). Los literales `configuration` del mock están en `mockBackend.ts:779` y `:3547`; añadir `strategy: 'LAYERED'` solo en la traza que lleve capas. Mantener rótulos DEMO sin cambios (regla de glosario).
- **Tipos:** `RagCandidateNode`, `RagDiscardReason` y `configuration` en `context-explorer/types.ts:41–69` son locales; `types.ts` no usa los generados. Los campos nuevos van opcionales (`layer?: … | null`) y `configuration` con `strategy?`, etc.; `dependencyContext` no se consume. `discardReasonLabel` es `Record<string,string>`: el cambio de tipo no rompe consumidores; `RagSidePanel` indexa con la unión, TS lo acepta.
- **Versiones:** además del espejo, ver el listado de la sección 2; `pnpm contracts:check` no debe cambiar `generated/`. El espejo debe hacerse desde `git show 8c3eb0f…` con el sha del alcance; el texto leído de scratchpad es solo referencia.
- **Honestidad del mock:** el mock es de demostración; marcar el candidato con capa dentro del rótulo DEMO existente, sin presentarlo como resultado real. «Capa» no se rotula como causa de relevancia ni como probabilidad (spec: score nunca es probabilidad).
- Reasoning: `reasoningEffortMessage` queda fuera (WI aparte).

## 5. Veredicto
SUFICIENTE_CON_NOTAS. Alcance, contrato y criterios son verificables y no hay `DEC` bloqueante. Notas: (a) corregir el entendimiento de `inclusionReason` (no implementar); (b) actualizar spec 011 y las referencias INTEROP-2.21 listadas; (c) añadir el fallback en `RagSidePanel`; (d) verificar a 375/1280 px el rótulo largo de descarte.
