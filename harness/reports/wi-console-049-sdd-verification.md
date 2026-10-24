# WI-CONSOLE-049 — verificación SDD

Modelo: sdd-analyst · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo low

**Fecha:** 2026-10-21 · **Lane:** STANDARD · `uiImpact=true` · `contractImpact=false` · **Solo lectura de producto.**

## 1. Suficiencia SDD

- `storyIds` HU03, HU05, HU06, HU07, HU12, HU15, HU17 válidos (HU01–HU18); `ST-CONSOLE-051` existe en `spec/features/010-product-experience/tasks.md` (línea 6, `T-IN_PROGRESS`). `dependsOn` WI-CONSOLE-047 (cerrado, ST-CONSOLE-049 DONE).
- Alcance aprobado por el usuario (`wi-console-049-scope-approval.md`, cita «si»). Criterios de aceptación de `work-items.json` coherentes con el alcance (5 criterios).
- Decisiones: ninguna DEC con `Blocks` alcanza este WI. Las DEC de `spec/contracts/system-contract.md` tienen `Blocks: NONE` o acotan ingestión/despliegue con código empresarial (DEC-INF-001, DEC-VAL-001: PENDING, no aplican a copy de UI). No hay DEC `PENDING`/`PROPOSED` sobre glosario. `decisionGate` (`blockingDecisionIds: []`) correcto; se puede dejar `checked` con nota «sin DEC aplicable (verificado)».
- Contrato: ningún DTO, ruta, enum ni evento cambia. `contract-reviewer` no necesario. Los identificadores `changesetBaseSha`, `UNRESOLVABLE_TARGET`, `targetsTotal`, `chunkId`, `FUNCTIONAL_KNOWLEDGE_NOT_FOUND`, `CODE_FRAGMENT` no se tocan.
- Referencia tesis (`referencias/tesis.md`): «target» 57 apariciones («el target», «un target», «los targets»), «changeset» 18 («el changeset»), «chunks» 10 (siempre plural, «relatedChunks»), «Functional Knowledge» 64, «ranking/rankings» 7, «recuperación» 30, «discrepancia» 6. «Objetivo» en tesis = OE / objetivo del trabajo (26 usos), no target. Confirma la decisión.

### Specs bajo `spec/` que describen copy visible vigente

Búsqueda de «Conjunto de cambios», «Fragmentos», «Objetivo experimental», «Detalle del objetivo», «Buscar objetivo», «Sin objetivos», «por objetivo», «por ranking» y comillas «…objetivo/fragmento/chunk…»: **ninguna spec los cita** salvo la tarea ST-CONSOLE-051. A actualizar:

| Spec | Línea | Acción |
|---|---|---|
| `spec/transversal/design-system/spec.md` | 47-52 (§Idioma y glosario) | CAMBIAR: añadir `target`, `changeset`, `chunk(s)`, `Functional Knowledge`, `Ranking` a la lista de términos de dominio en inglés; documentar la convención de concordancia/plural (sección 3); declarar que se conservan «recuperación» y «discrepancia de comportamiento»; aclarar que «objetivo» sigue en español cuando no es target (p. ej. «objetivos táctiles», línea 58 `--target-min`, y OE de la tesis). La línea 6 `## Objetivo` y 43 («Implementación objetivo») son OE/otro sentido: CONSERVAR. |
| `spec/features/014-analysisrun-experiments/spec.md` | 38 | Cita el texto de `ExperimentConditionsNote` («…conocimiento funcional aplicable…»). Si se cambia la nota (ver tabla), actualizar la cita a «Functional Knowledge aplicable». |
| `spec/contracts/interoperability-contract.md` | 380 | Mismo texto de la nota; es contrato, **no tocar** (el texto visible puede diferir; `contractImpact=false`). Anotarlo como divergencia aceptada solo de copy. |
| `spec/operational-cases.md` (20), `013-pr-driven-control-plane/spec.md` (176 título OC14), `011-context-explorer/spec.md` (43), `roadmap.md` (9) | — | Prosa de especificación, no copy visible: CONSERVAR (no hay rótulo UI citado). |
| `spec/features/010-product-experience/tasks.md` | 6 | Se actualiza por el flujo del harness (estado de ST-CONSOLE-051). |
| `CHANGELOG.md` | — | Historia: no reescribir; solo nueva entrada. |

## 2. Inventario en `app/src` (excluye `generated`, `speculative`, comentarios de código)

Alcance: texto visible (JSX, aria-label, title, placeholder, rótulos, mensajes de error mostrados, strings demo) y literales de test que lo afirman. Los identificadores (`targets`, `targetId`, `chunkId`, `changesetBaseSha`, `isLargeChangeset`, `retrievedChunks`, etc.) quedan fuera.

Convención usada en la columna «texto nuevo» (sección 3): «el target / los targets», «el changeset / los changesets», «los chunks», «Functional Knowledge» e «Ranking» sin plural.

| archivo:línea | texto actual | decisión | texto nuevo | motivo |
|---|---|---|---|---|
| `ui/routeTitles.ts:14` | `'Conocimiento funcional'` | CAMBIAR | `'Functional Knowledge'` | Título de la página FK; coherente con tab y breadcrumb. |
| `ui/routeTitles.ts:15` | `'Regla de conocimiento funcional'` | CAMBIAR | `'Regla de Functional Knowledge'` | Término de dominio en inglés. |
| `ui/ProjectTabs.tsx:23` | `'Functional Knowledge'` | CONSERVAR | — | Ya en inglés. |
| `action-required/FunctionalKnowledgePage.tsx:43,49` | `Functional Knowledge` | CONSERVAR | — | Ya en inglés. |
| `action-required/FunctionalKnowledgePage.tsx:69` | `Todavía no hay conocimiento funcional persistido para este filtro.` | CAMBIAR | `Todavía no hay Functional Knowledge persistido para este filtro.` | Término en inglés; FK sin plural, masculino. |
| `action-required/FunctionalKnowledgeDetailPage.tsx:41,58,64` | `Functional Knowledge` | CONSERVAR | — | Ya en inglés. |
| `action-required/FunctionalKnowledgeDetailPage.tsx:78` | `<dt>Objetivo</dt>` | CAMBIAR | `<dt>Target</dt>` | Objetivo de la regla = target (símbolo). Verificar visualmente el valor mostrado. |
| `action-required/FunctionalKnowledgeDetailPage.tsx:197` | `…coincide con el target de esta regla.` | CONSERVAR | — | Ya «target». |
| `action-required/FocusModePage.tsx:46` | `CODE_FRAGMENT: 'Fragmento de código'` | CONSERVAR | — | Alcance de una regla (scope enum), no chunk; fuera del glosario. |
| `action-required/FocusModePage.test.tsx:467,535` | `'Destino de la regla'` | CONSERVAR | — | «Destino» no es target; no está en el alcance. Nota: si el ux-reviewer pide coherencia, DECISION_REQUIRED aparte. |
| `control-plane/IntegrationsPage.tsx:283,298,303` + test `:61` | `…Functional Knowledge…` | CONSERVAR | — | Ya en inglés. |
| `control-plane/OperationalTraceSection.tsx:94` | `Objetivo: <code>…</code>` | CAMBIAR | `Target: <code>…</code>` | Target del Run. |
| `control-plane/OperationalTraceSection.tsx:273` | `<h3>Conjunto de cambios</h3>` | CAMBIAR | `<h3>Changeset</h3>` | Término tesis. Sustantivo único como encabezado. |
| `control-plane/OperationalTraceSection.tsx:291` | `Sin objetivos` | CAMBIAR | `Sin targets` | Plural «targets». |
| `control-plane/OperationalTraceSection.tsx:354` | `…repositorio, changeset, recuperación, contexto…` | CONSERVAR | — | Ya «changeset»; «recuperación» se mantiene. |
| `control-plane/OperationalTraceSection.test.tsx:56,61,80,89,117,184,295,303` | `'Conjunto de cambios'` (heading) | CAMBIAR | `'Changeset'` | Literales del copy. |
| `control-plane/OperationalTraceSection.test.tsx:62,67,296,297` | `'Objetivo: …'`, `startsWith('Objetivo:')` | CAMBIAR | `'Target: …'`, `startsWith('Target:')` | Idem. |
| `control-plane/OperationalTraceSection.test.tsx:98` | `'Sin objetivos'` | CAMBIAR | `'Sin targets'` | Idem. |
| `control-plane/OperationalTraceSection.test.tsx:292` | título del test «orden de targets…» | CONSERVAR | — | Ya inglés. |
| `control-plane/AnalysisRunDetailPage.tsx:366` | `Conjunto de cambios grande: {directCount} símbolo(s)…` | CAMBIAR | `Changeset grande: {directCount} símbolo(s) con cambio directo, {impactedCount} potencialmente impactado(s).` | Changeset masculino, sin plural. |
| `control-plane/AnalysisRunDetailPage.test.tsx:195,203` | `/Conjunto de cambios grande…/` | CAMBIAR | `/Changeset grande: 6 símbolo\(s\)…/`, `/Changeset grande/` | Literal del copy (`:199,191` títulos de test ya «changeset»). |
| `control-plane/errors.ts:29` | `…localizar el target elegido…` | CONSERVAR | — | Ya «target». |
| `control-plane/errors.test.ts:164` | idem | CONSERVAR | — | Ya «target». |
| `api/mockBackend.ts:2033` | `'Conjunto de cambios grande: 6 símbolos con cambio directo y 8 potencialmente impactados. 4 pruebas…'` | CAMBIAR | `'Changeset grande: 6 símbolos con cambio directo y 8 potencialmente impactados. 4 pruebas…'` | Texto demo visible (summary). Verificar que ningún test lo compare. |
| `api/mockBackend.ts:4305` | `…contradice una regla de conocimiento funcional vigente…` | CAMBIAR | `…contradice una regla de Functional Knowledge vigente…` | Mensaje visible demo. |
| `api/mockBackend.ts:3523` | `snippet: '/* target del experimento */'` | CONSERVAR | — | Ya «target»; snippet. |
| `api/mockBackend.ts:3611` | `El TestTarget no existe o no pertenece a este Project.` | CONSERVAR | — | Mensaje con identificador de dominio `TestTarget`. |
| `api/mockBackend.ts:5212` | `…regla de Functional Knowledge demo…` | CONSERVAR | — | Ya inglés. |
| `api/mockBackend.ts` (`changesetBaseSha`/`HeadSha`, `UNRESOLVABLE_TARGET`, `allTargets`) | identificadores | CONSERVAR | — | No son texto visible. |
| `inventory/InventoryPage.tsx:40` | `Objetivos detectados por RAG Core, organizados por estado de cobertura.` | CAMBIAR | `Targets detectados por RAG Core, organizados por estado de cobertura.` | Plural. |
| `inventory/InventoryPage.tsx:71` | `<dt>Objetivos</dt>` | CAMBIAR | `<dt>Targets</dt>` | Idem. |
| `inventory/InventoryView.tsx:30` | `Buscar objetivo` | CAMBIAR | `Buscar target` | Rótulo explícito del alcance. Hoy la guarda `Buscar target` lo prohíbe (quitar). |
| `inventory/InventoryView.tsx:43` | `title="Sin objetivos coincidentes"` | CAMBIAR | `Sin targets coincidentes` | Plural. |
| `inventory/InventoryView.tsx:49` | `<th scope="col">Objetivo</th>` | CAMBIAR | `<th scope="col">Target</th>` | Cabecera de tabla. |
| `inventory/InventoryView.test.tsx` (7, 27, 35) | `targets`, «filtra targets sin cobertura» | CONSERVAR | — | Ya inglés; revisar `getByLabelText`/`getByText` con «Buscar objetivo» o «objetivo»/«Objetivo» (no aparecen en grep; confirmar al editar). |
| `analysis/AnalysisHistoryPage.tsx:83` | `<dt>Fragmentos</dt>` | CAMBIAR | `<dt>Chunks</dt>` | `chunksCount`. |
| `analysis/AnalysisHistoryPage.tsx:87` | `<dt>Objetivos</dt>` | CAMBIAR | `<dt>Targets</dt>` | Es el conteo de targets de la versión. |
| `context-explorer/ContextExplorerPage.tsx:60` | `status: 'Objetivo'` | CAMBIAR | `status: 'Target'` | Fila estructurada del target RAG. |
| `context-explorer/rag/RagGraph.tsx:45` | `` `Grafo RAG del target …` `` | CONSERVAR | — | Ya «target». |
| `context-explorer/rag/RagGraph.tsx:54` | `?? 'Objetivo'` | CAMBIAR | `?? 'Target'` | Fallback de nombre. |
| `context-explorer/rag/RagGraph.tsx:56` | `<span className="node-badge">Objetivo</span>` | CAMBIAR | `Target` | Badge. |
| `context-explorer/rag/RagSidePanel.tsx:15` | `aria-label="Detalle del objetivo"` | CAMBIAR | `aria-label="Detalle del target"` | Idem. |
| `context-explorer/rag/RagSidePanel.tsx:16` | `<p className="eyebrow">Objetivo</p>` | CAMBIAR | `Target` | Idem. |
| `context-explorer/rag/RagSidePanel.tsx:34` | `<dt>Fragmentos</dt>` | CAMBIAR | `<dt>Chunks</dt>` | Idem. |
| `context-explorer/**.test.tsx` | textos «objetivo»/«Fragmentos» | REVISAR | — | El grep no halló literales que los afirmen; el implementer debe confirmar con `getByText`/`getByLabelText`. `RagGraph.test.tsx:83` título ya «target». |
| `retrieval-comparison/RetrievalComparisonPage.tsx:365` | `Candidatos por ranking del modo {mode.mode}` | CAMBIAR | `Candidatos por Ranking del modo {mode.mode}` o conservar minúscula | Decisión del usuario: «Ranking». Propuesta: usar «Ranking» capitalizado solo como rótulo de columna y `ranking` minúscula dentro de frases (término común también en la tesis). Para el aria/caption se **recomienda CONSERVAR `ranking`** (la tesis lo usa en minúscula: «calidad del ranking»); registrar como nota a confirmar. |
| `retrieval-comparison/RetrievalComparisonPage.tsx:368` | `<th scope="col">Ranking</th>` | CONSERVAR | — | Ya «Ranking». |
| `retrieval-comparison/RetrievalComparisonPage.test.tsx:127,128` | `'Candidatos por ranking del modo SEM/SE'` | CONSERVAR | — | Sigue el caption (si se cambia, cambiar aquí). |
| `experiments/ExperimentConditionsNote.tsx:2` | `…recuperación SE + ContextBuilder + conocimiento funcional aplicable…` | CAMBIAR | `…recuperación SE + ContextBuilder + Functional Knowledge aplicable…` | Texto visible. Alinear con la cita en `014 spec.md:38`. Verificar tests de nota. |
| `experiments/ExperimentPage.tsx:89` | `setSubmittedLabel(selectedTarget?.name ?? 'objetivo')` | CAMBIAR | `?? 'target'` | Etiqueta visible (fallback). |
| `experiments/ExperimentPage.tsx:128` | `Selecciona un target experimental…` | CONSERVAR | — | Ya «target». |
| `experiments/ExperimentPage.tsx:174` | `<label …>Objetivo experimental</label>` | CAMBIAR | `Target experimental` | «Target experimental» (masc. sing.). |
| `experiments/ExperimentPage.tsx:189` | `Este target parece un constructor…` | CONSERVAR | — | Ya «target». |
| `experiments/ExperimentPage.test.tsx:262,302,419,442,746` | `'Objetivo experimental'` | CAMBIAR | `'Target experimental'` | Literal del label. |
| `experiments/ExperimentPage.targets.test.tsx:58` | `findByLabelText('Objetivo experimental')` | CAMBIAR | `'Target experimental'` | Idem. |
| `experiments/ExperimentPage.test.tsx:460,478` | `'Tabla de repeticiones por objetivo'` | CAMBIAR | `'Tabla de repeticiones por target'` | Idem. |
| `experiments/ExperimentPage.test.tsx:98,655,799` | `target`, `Ver detalle por target y repetición` | CONSERVAR | — | Ya «target». |
| `experiments/ExperimentComparison.tsx:209` | `{retrievedChunks ?? '—'} fragmentos` | CAMBIAR | `… chunks` | Plural inglés + «chunks». |
| `experiments/ExperimentComparison.tsx:213` | `{selectedChunks ?? '—'} fragmentos` | CAMBIAR | `… chunks` | Idem. |
| `experiments/ExperimentComparison.tsx:240,241` | `Ver detalle por target y repetición` | CONSERVAR | — | Ya «target». |
| `experiments/ExperimentComparison.tsx:242` | `aria-label="Tabla de repeticiones por objetivo"` | CAMBIAR | `Tabla de repeticiones por target` | Idem. |
| `experiments/ExperimentComparison.tsx:245` | `<th scope="col">Objetivo</th>` | CAMBIAR | `<th scope="col">Target</th>` | Cabecera. |
| `experiments/ExperimentComparison.test.tsx:194` | `'20 fragmentos'` | CAMBIAR | `'20 chunks'` | Literal. |
| `experiments/ExperimentComparison.test.tsx:288,461` | `'Tabla de repeticiones por objetivo'` | CAMBIAR | `'Tabla de repeticiones por target'` | Idem. |
| `run-comparison/RunComparisonPage.tsx:152` | `…mismo HEAD, changeset y símbolos…` | CONSERVAR | — | Ya «changeset». |
| `styles/cssRegressionGuards.test.ts:23,63` | `objetivos táctiles`, `(objetivo con ShippingAddressValidator…)` | CONSERVAR | — | Nombres de test; táctiles = «touch targets» en sentido UX (no copy, no glosario). `:63` es descripción interna: CONSERVAR (opcional «target»). |
| `ui/glossary.test.ts:26,27,36,39,49` | reglas FORBIDDEN `Target`, `Changeset`, `Buscar target`, `Chunks`; MUST_CONTAIN `'Buscar objetivo'` | CAMBIAR | quitar las 4 reglas; `'Buscar target'` en MUST_CONTAIN | Alcance 4. |
| OE de tesis («objetivo específico») | no aparece en UI | CONSERVAR | — | Sin uso en `app/src`. |
| `spec/transversal/design-system/spec.md:58` | `tamaño mínimo de objetivos táctiles` | CONSERVAR | — | Sentido UX. |

Notas del inventario:
- El grep amplio (569 coincidencias) incluyó muchísimos identificadores (`targets`, `changesetHeadSha`, `chunkId`, `targetId`); solo los literales de la tabla son visibles. «Rótulos DEMO» (`DEMO TIMELINE`, etc.) no se tocan.
- No hay usos visibles de «chunk(s)»/«Chunks» hoy (la guarda `<dt>Chunks<|\} chunks<` evitaba que aparecieran): todos son «Fragmentos»/«fragmentos».
- No hay «changeset»/«Target» visibles a corregir en sentido inverso (ya en inglés en `RunComparisonPage`, `errors.ts`, etc.).
- Posibles residuos no capturados por el grep (cadenas partidas en varias líneas): el implementer debe repetir un grep de control tras editar (`objetivo|Objetivo|[Ff]ragmento|[Cc]onjunto de cambios|[Cc]onocimiento funcional` en `src` fuera de comentarios, test e identificadores) y verificar visualmente en demo.

## 3. Convención de concordancia y plural (a documentar en el glosario)

1. Los términos ingleses se escriben tal cual, sin cursiva ni comillas, con el género gramatical del equivalente español: **el target / los targets** (masc.), **el changeset / los changesets** (masc.), **el chunk / los chunks** (masc.), **Functional Knowledge** (masc., invariable, sin plural; «el Functional Knowledge persistido»), **Ranking** (masc.; plural «rankings»).
2. Plural con «-s» (targets, chunks, changesets), sin apóstrofo. «Functional Knowledge» no se pluraliza: «reglas de Functional Knowledge».
3. Mayúscula inicial solo en posición de rótulo (encabezado, columna, `dt`, badge, label). Dentro de frase: minúscula (`target`, `changeset`, `chunks`, `ranking`), salvo `Functional Knowledge` (nombre de entidad, siempre capitalizado) y `Ranking` como rótulo de columna.
4. Adjetivos/participios concuerdan en masculino: «Changeset grande», «Targets detectados», «Target experimental», «Sin targets coincidentes».
5. Contadores: «N chunks» (nunca «N fragmentos»); «N símbolo(s)» no cambia (símbolo no está en el glosario).
6. Se conservan en español «recuperación» y «discrepancia de comportamiento» (y «Discrepancia de comportamiento» como rótulo de estado). Se conserva «objetivo» cuando no es target (objetivos táctiles, OE, «Implementación objetivo», `## Objetivo` de specs).
7. No cambia `Fragmento de código` (scope `CODE_FRAGMENT`) ni «Destino de la regla».

Frases pedidas, texto exacto propuesto:
- «Objetivo experimental» → **Target experimental**
- «Sin objetivos coincidentes» → **Sin targets coincidentes**
- «Tabla de repeticiones por objetivo» → **Tabla de repeticiones por target**
- «Conjunto de cambios grande: …» → **Changeset grande: …**
- «N fragmentos» → **N chunks**
- «Buscar objetivo» → **Buscar target**
- «Detalle del objetivo» → **Detalle del target**

## 4. Veredicto

**SUFFICIENT_WITH_NOTES**

Sin blockers. No hay DEC con `Blocks` que alcance este WI; el alcance está aprobado por el usuario; sin impacto contractual.

Notas y riesgos para leader/implementer:
1. **Guarda `glossary.test.ts`**: escanea solo fuentes no-test. Quitar las reglas `Target (visible)`, `Changeset (visible)`, `Buscar target`, `Chunks (visible)`; cambiar `MUST_CONTAIN` `'Buscar objetivo'` por `'Buscar target'` y añadir como mínimo `'Changeset'`, `'Chunks'`, `'Functional Knowledge'`. Se recomienda **añadir nuevas prohibiciones** para los residuos españoles en fuentes no-test: `/Buscar objetivo/`, `/Conjunto de cambios/`, `/>Fragmentos</`, `/\d+ fragmentos|\} fragmentos/`, `/Objetivo experimental/`, `/[Cc]onocimiento funcional/`. Mantener Retrieval, Behavioral Mismatch, etc. Cuidado de no prohibir «objetivo» genérico (objetivos táctiles).
2. **Tests que afirman copy** (cambiar en el mismo corte): `OperationalTraceSection.test.tsx`, `AnalysisRunDetailPage.test.tsx`, `ExperimentPage.test.tsx`, `ExperimentPage.targets.test.tsx`, `ExperimentComparison.test.tsx`, y los de `inventory/`, `context-explorer/`, `experiments/` que busquen «Objetivo»/«Fragmentos» por rol/label. Confirmar con `tsc`/vitest completo; comprobar que ningún test use el summary demo de `mockBackend.ts:2033`.
3. **`ranking` en caption** (`RetrievalComparisonPage.tsx:365`): ya está en inglés (anglicismo común); «Ranking» de la columna también. Sin cambio funcional; solo confirmar con el usuario si espera capitalizar en frase (propuesta: no).
4. **Desbordes a 375 px**: «Chunks» y «Target» son más cortos o iguales que «Fragmentos»/«Objetivo»; «Changeset grande» más corto que «Conjunto de cambios grande». «Functional Knowledge» (título de ruta y breadcrumb) es ligeramente más largo que «Conocimiento funcional» solo en el `document.title` (sin efecto visual); breadcrumb ya lo usa. Riesgo bajo; el ux-reviewer valida a 375 px las pantallas: Inventario, Experimento (tabla de repeticiones), Detalle de Run (changeset), Trace operativo, Context Explorer, Historial, Functional Knowledge.
5. **Divergencia con contrato**: `interoperability-contract.md:380` y `014 spec.md:38` citan «conocimiento funcional aplicable»; actualizar solo la spec 014 (copy visible) y dejar el contrato intacto.
6. **Detalle por verificar**: `FunctionalKnowledgeDetailPage.tsx:78` «Objetivo» → asumido target de la regla; confirmar el dato mostrado antes de cambiar. Si fuera otra semántica, registrar `DECISION_REQUIRED`.
7. **Pendiente de glosario fuera de alcance** (registrar, no inventar): «Destino de la regla».

## Salida estructurada

- **status:** SUFFICIENT_WITH_NOTES
- **blockers:** ninguno
- **filesAffected (estimado):** `ui/routeTitles.ts`, `ui/glossary.test.ts`, `action-required/{FunctionalKnowledgePage,FunctionalKnowledgeDetailPage}.tsx`, `control-plane/{OperationalTraceSection,AnalysisRunDetailPage}.tsx` y sus tests, `api/mockBackend.ts`, `inventory/{InventoryPage,InventoryView}.tsx`, `analysis/AnalysisHistoryPage.tsx`, `context-explorer/{ContextExplorerPage,rag/RagGraph,rag/RagSidePanel}.tsx`, `experiments/{ExperimentPage,ExperimentComparison,ExperimentConditionsNote}.tsx` y sus tests, `spec/transversal/design-system/spec.md`, `spec/features/014-analysisrun-experiments/spec.md`, `CHANGELOG.md`.
- **recommendedNextStep:** el leader registra el `decisionGate` verificado y pasa a implementer (corte único); luego `reviewer` y `ux-reviewer` (demo, 1280 y 375 px).
