# WI-CONSOLE-015 — Verificación SDD

Modelo: sdd-analyst · configurado claude-sonnet-5-5 · atendido claude-sonnet-5-5 · esfuerzo low

Work item: WI-CONSOLE-015 «Procedencia de Functional Knowledge y varias reglas ACTIVE» (ST-CONSOLE-017 T-READY, HU07/HU09, sprint SMART V3, dependsOn WI-CONSOLE-011, externalDependencyGate G-PASSED, W-SELECTED). Solo verificación; no se editó código, state.json ni work-items.json.

## Veredicto: SUFFICIENT

Alcance, criterios (5 AC) y contrato INTEROP-2.7 §6.11 son suficientes. Sin decisiones bloqueantes. Hay una contradicción spec/código sobre el adapter live (ver Contradicciones), que el WI ya resuelve en AC4/AC5.

## Decision gate
- Fuente: `spec/contracts/system-contract.md`.
- blockingDecisionIds: [].
- Aplicables, todas APROBADO (2026-10-08, usuario), sin `Blocks` que bloquee: `DEC-FK-001` (varias ACTIVE por target; conflicto solo con mismo scope+targetRef+scenarioKey; nadie escribe scenarioKey), `DEC-FK-004` (scenarioKey derivado por Core; scenarioKind mapeado), `DEC-FK-003` (contexto: aplicabilidad por target y scenarioKey; solo Core).
- Contexto no bloqueante: `DEC-FK-002` (UNKNOWN, ya hecho en WI-013), `DEC-ORG-003` (Writer, ya hecho).
- Resto (`DEC-INF-001`, `DEC-VAL-001`, `DEC-EXP-*`): no alcanzan este WI.
- decisionGate sugerido: blockingDecisionIds [], nonBlocking [], approvedApplicable [DEC-FK-001, DEC-FK-003, DEC-FK-004].
- Contract Sync: los 4 eventos (CS-20260920-003, CS-20260921-001/002/003) ya tienen disposición NOT_RELEVANT con reporte. No se requiere contract-reviewer; no hay impacto contractual nuevo (`contractImpact:false`).

## Spec aplicable (citas)
- `system-contract.md:137`: una regla ACTIVE por escenario; mismo target puede tener varias ACTIVE; Core deriva `scenarioKey`; conflicto solo con mismo scope, `targetRef` y `scenarioKey`.
- `system-contract.md:139`: categorías de pregunta; V1 genera solo resultado esperado, borde, excepción y transición de estado (`OBSERVABLE_SIDE_EFFECT` y `FUNCTIONAL_PRECONDITION` reservadas), pero la UI debe etiquetar los seis.
- INTEROP-2.7 §6.11 (`interoperability-contract.md` 754, 821-838): `FunctionalKnowledgeResponse` con `supersedesId: Id|null`, `scenarioKind` y `scenarioKey` (pendiente WI-CORE-020), `confirmedByUserId: Id|null` y `confirmedRole: ConfirmingRole|null` (pendiente WI-CORE-019; null solo en reglas históricas), `originHeadSha: string|null` («procedencia, no vencimiento»), `sourceRef: string|null` (solo si source=APPROVED_IMPORT), `source: HUMAN_ANSWER|APPROVED_IMPORT`, `status: ACTIVE|SUPERSEDED`. `ScenarioKind` (línea 763) y `ConfirmingRole = ADMIN|MAINTAINER` (764).
- 409 `FUNCTIONAL_KNOWLEDGE_CONFLICT` (línea 850): `details: FunctionalKnowledgeConflictResponse {conflictId, analysisRunId, questionId, conflictingKnowledge, proposedNormalizedRule}`; reenvío con `conflictResolution.action` SUPERSEDE/KEEP_EXISTING. `conflictId` de un solo uso.
- `tasks.md` 013 línea 6: ST-CONSOLE-017 «mostrar varias reglas ACTIVE por target agrupadas por escenario y su procedencia, y retirar el panel especulativo».
- WI-CONSOLE-016 (aparte) aporta la procedencia por Run con `functionalRuleIds` del trace.

## Inventario del código actual (`app/src`)

### Rutas (`router.tsx:36-37`)
- `projects/:projectId/functional-knowledge` -> `FunctionalKnowledgePage`
- `projects/:projectId/functional-knowledge/:knowledgeId` -> `FunctionalKnowledgeDetailPage`
(ambas con `?workspaceId=` en enlaces de breadcrumbs; no cambiar rutas.)

### action-required/types.ts
- YA existen `ScenarioKind` (l.13) y `ConfirmingRole` (l.15) (aportados por WI-013).
- `FunctionalKnowledgeResponse` (l.92-104) tiene solo: id, projectId, scope, targetRef, originalQuestion, originalAnswer, normalizedRule, source, status, supersedesId, createdAt. FALTAN: `scenarioKind`, `scenarioKey`, `confirmedByUserId`, `confirmedRole`, `originHeadSha`, `sourceRef`.
- `FunctionalKnowledgeConflictResponse` (l.118-123) ya referencia `FunctionalKnowledgeResponse` (cambiará de forma automáticamente).
- Cabecera dice INTEROP-2.7 §6.11; comentarios del 409 aún citan INTEROP-2.1.

### action-required/api.ts (l.59-66)
- `listFunctionalKnowledge`: mock -> `mockListFunctionalKnowledge`; live -> `apiRequest` real a `/projects/{id}/functional-knowledge?status`. NO usa `PendingContractError` (el comentario dice «implementado y desplegado en Core»).
- `queries.ts`: `useFunctionalKnowledge(projectId, status?)`, key `['action-required','functional-knowledge',projectId,status??null]`. Sin cursor (un solo `nextCursor` ignorado).

### FunctionalKnowledgePage.tsx
- Filtro de estado Todas/Active/Superseded (`aria-pressed`), lista plana `ul.action-required-list` de tarjetas (Link -> detalle) con `targetRef ?? scope`, badge `status` (texto, `status-success`/`status-muted`), `normalizedRule`. Estado vacío, `LoadingState`, `ErrorState`. Sello `DEMO · DATOS SIMULADOS` si mock. Sin agrupación, sin scenarioKind ni procedencia.

### FunctionalKnowledgeDetailPage.tsx
- Usa `useFunctionalKnowledge(projectId)` (toda la lista, sin filtro) y busca por id; `supersedes` y `supersededBy` solo un nivel (enlaces «Ver regla reemplazada →» / «Ver regla vigente →»), no cadena completa. Metadata: Scope, Target, Fuente («Respuesta humana»/«Importación aprobada»), Creado. Panel pregunta/respuesta originales.
- Consume `getRuleUsage` (HU52 especulativo, panel «Runs que usaron esta regla» con sello PROPUESTA). No pedido retirar por este WI explícitamente, pero ver Riesgos.

### Especulativo de procedencia a retirar
- `context-explorer/speculative/contextProvenance.ts` (31 líneas): tipos `ContextProvenance*`, `getContextProvenance` (mock -> `mockGetContextProvenance`; live -> `ProposedCapabilityError`).
- `context-explorer/speculative/contextProvenance.test.ts` (28 líneas, 3 pruebas: mock, run inexistente, live).
- `api/mockBackend.ts`: import de tipo `ContextProvenance` (l.6) y `mockGetContextProvenance` (l.~976-992).
- Único consumidor: `control-plane/AnalysisRunDetailPage.tsx`: import l.9, `useQuery` provenance en `ContextSection` (l.~96-100, `enabled` depende de traceQuery), `const provenance` y bloque JSX `div.context-provenance` con h3 «Qué más alimentó este contexto» + sello PROPUESTA (l.~114-130, listas FK y «Test existente»). Con el bloque se pierde también «Test existente»: es parte del retiro pedido.
- Pruebas que mencionan el bloque: buscar «Qué más alimentó» en `control-plane/AnalysisRunDetailPage*.test.tsx` y `control-plane/api.test.ts` (grep arrojó solo los listados; confirmar por `rg` que queda 0 al terminar). `useQuery` puede quedar sin uso en AnalysisRunDetailPage tras el retiro (verificar imports).
- CSS `.context-provenance`, `.context-provenance-list`: `context-provenance-list` también la usa el panel de ruleUsage; no borrar la clase mientras ruleUsage siga.

### api/mockBackend.ts (Functional Knowledge)
- `functionalKnowledge` Map (l.89); `seedFunctionalKnowledge()` (l.~607-645): 5 reglas: `fk_coupon_expiry`, `fk_shipping_zone`, `fk_discount_engine`, `fk_rounding_v1` (SUPERSEDED, supersedesId null), `fk_rounding_v2` (ACTIVE, supersedesId fk_rounding_v1); todas HUMAN_ANSWER y sin campos nuevos. En `prj_checkout_demo`: 3 ACTIVE + 1 SUPERSEDED (las pruebas actuales cuentan 3 ACTIVE).
- `mockListFunctionalKnowledge(projectId,status)` (l.~1406): filtra por proyecto y estado, ordena por `createdAt` desc.
- `findConflictingKnowledge` (l.1035): compara solo targetRef (no scenarioKey); el conflicto está limitado a `state.conflictQuestionId` (pregunta `fq_checkout_pr52_1` vs `fk_shipping_zone`); `mockSubmitFunctionalAnswer` emite el 409 con `details`. No toca scenarioKey: se puede mejorar a comparar por scenarioKey sin romper pruebas (revisar).
- `mockGetRuleUsage` (l.~1421): usado por `ruleUsage.ts` y `control-plane/api.test.ts:283-294`.
- Respuestas nuevas del mock (`fk_demo_${sequence}`, l.~1088) crean FK: deben incluir los campos nuevos (rol, userId, headSha del Run, scenarioKind/Key de la pregunta).

### Pruebas actuales a actualizar
- `FunctionalKnowledgePage.test.tsx`: cuenta `getAllByText('ACTIVE')` = 3 y `SUPERSEDED` único; el filtro Active espera 3. Cambiarán con la nueva semilla y con etiquetas por grupo.
- `FunctionalKnowledgeDetailPage.test.tsx`: 5 pruebas (detalle simple, cadena v1<->v2, ruleUsage x2).
- `action-required/api.test.ts` (shape de listFunctionalKnowledge), `FocusModePage.test.tsx` (409 SUPERSEDE/KEEP_EXISTING con `conflictingKnowledge`), `control-plane/api.test.ts` (ruleUsage).

## Contradicciones spec/código
1. AC4 y AC5 exigen que en modo live el adapter solo use campos publicados en INTEROP-2.7 y que hasta entonces responda `PendingContractError`. `listFunctionalKnowledge` live hoy hace `apiRequest` real y su comentario dice «implementado y desplegado». Los campos de procedencia/escenario están «pendiente» en INTEROP-2.7 (WI-CORE-019/020); decisión recomendada: el adapter live lanza `PendingContractError('las reglas de Functional Knowledge con procedencia y escenarios')` (como `context-explorer/api.ts`), o bien lo mantiene si Leader/Humano lo prefieren, pero entonces el tipo no puede exigir campos que Core aún no envía. Conviene confirmar con el Leader; WI-CONSOLE-020 activa live. No es blocker (se resuelve en la propia redacción de AC4).
2. `FunctionalKnowledgeResponse` TS no refleja INTEROP-2.7 (faltan 6 campos); es el trabajo del WI, no un conflicto de spec.
3. Detalle muestra «Fuente» e importa `sourceRef` solo si APPROVED_IMPORT: hoy no se muestra nada de `sourceRef`.
4. Comentarios `INTEROP-2.1` en types/api/mock desfasados respecto de INTEROP-2.7 (menor).
5. `Panel» PROPUESTA` de ruleUsage (HU52) sigue activo aunque ST-CONSOLE-017 solo pide retirar el de procedencia; no contradice, pero queda como deuda especulativa (ver Riesgos).

## Corte propuesto (un solo corte, implementer)
Pasos secuenciales:
1. `action-required/types.ts`: extender `FunctionalKnowledgeResponse` con `scenarioKind: ScenarioKind`, `scenarioKey: string`, `confirmedByUserId: string|null`, `confirmedRole: ConfirmingRole|null`, `originHeadSha: string|null`, `sourceRef: string|null`. Actualizar comentarios a INTEROP-2.7. Tipos viven en el módulo de la feature.
2. Nuevo helper en el módulo de la feature (p. ej. `action-required/knowledgeScenario.ts` con prueba): `SCENARIO_KIND_ORDER = [EXPECTED_RESULT, BOUNDARY, EXCEPTION, STATE_TRANSITION, OBSERVABLE_SIDE_EFFECT, FUNCTIONAL_PRECONDITION]` y `SCENARIO_KIND_LABELS` en español (propuesta: Resultado esperado, Borde, Excepción, Transición de estado, Efecto observable, Precondición funcional; el copy exacto no está fijado en spec, validarlo con ux-reviewer). Función `groupByScenarioKind(items)` que devuelve solo grupos no vacíos en ese orden; dentro del grupo ordenar por `targetRef` y luego `createdAt` desc; valor desconocido de scenarioKind cae a un grupo final «Otros escenarios» (defensivo, sin inventar).  Helper `shortSha(sha)` = primeros 7 caracteres. No calcular ni editar `scenarioKey`; mostrarlo como texto/código solo lectura.
3. `FunctionalKnowledgePage.tsx`: renderizar un `<section aria-labelledby>` por grupo (`h2` con la etiqueta), conservar el filtro de estado y `aria-pressed`, no asumir una sola regla por target (varias tarjetas con el mismo `targetRef`; distinguir cada una con `scenarioKey`, `key={item.id}`). Mantener badges ACTIVE/SUPERSEDED con texto. Mostrar un resumen de procedencia breve por tarjeta (rol, sha corto) o dejarlo al detalle; el AC exige el detalle completo en alguna de las dos pantallas, preferible en el detalle.
4. `FunctionalKnowledgeDetailPage.tsx`: bloque «Procedencia» con `dl`: Confirmada por (`confirmedByUserId` solo el id, sin nombre), Rol (`confirmedRole`), Commit de origen (`originHeadSha.slice(0,7)` en `<code title={sha completo}>`), Fuente (`source`), Referencia de importación (`sourceRef`, SOLO si `source === 'APPROVED_IMPORT'`; ignorar `sourceRef` si es HUMAN_ANSWER aunque venga), Escenario (etiqueta + `scenarioKey` solo lectura). Cualquier campo null en reglas históricas -> texto «sin procedencia registrada» (si confirmedByUserId, confirmedRole y originHeadSha son todos null, un único aviso; si solo uno es null, «sin procedencia registrada» en ese campo). Reemplazar el enlace de un nivel por la cadena completa: caminar `supersedesId` hacia atrás (antecesoras) y `supersedes` hacia delante (sucesoras) con protección contra ciclos y ids no presentes en la lista; renderizar como `ol` ordenada con la regla actual marcada (`aria-current="step"`), estados con texto además de color. Detalle debe pedir la lista sin filtro (ya lo hace) para ver SUPERSEDED.
5. `api/mockBackend.ts`: ampliar `seedFunctionalKnowledge`: en `prj_checkout_demo` al menos 2-3 ACTIVE sobre el MISMO target `OrderService.calculateTotal` o `CouponPolicy.apply` con distinto `scenarioKind`/`scenarioKey` (p. ej. EXPECTED_RESULT, BOUNDARY, EXCEPTION); conservar la cadena `fk_rounding_v1 -> v2` y alargarla a 3 eslabones si es útil para probar la cadena; incluir (a) reglas históricas con `confirmedByUserId/confirmedRole/originHeadSha = null` (los campos de escenario siempre presentes porque el contrato los exige no-null), (b) una `APPROVED_IMPORT` con `sourceRef` (p. ej. `docs/reglas-negocio.md#L12`), (c) HUMAN_ANSWER con `sourceRef: null`, (d) roles ADMIN y MAINTAINER, sha completo de 40 hex. Mantener ids existentes que usan FocusModePage/pruebas (`fk_shipping_zone` para el 409). Actualizar `mockSubmitFunctionalAnswer` (rama que crea `fk_demo_*`) con los campos nuevos tomados de la pregunta (`scenarioKind`, `scenarioKey`), del rol del Project, del userId mock y del `headSha` del Run. Opcional/segun spec: el conflicto del mock debería ser por `targetRef + scenarioKey` (coherente con DEC-FK-001); no es requerido por el AC, evaluarlo para no romper el flujo HU51.
6. `action-required/api.ts`: AC4/AC5 -> live lanza `PendingContractError` hasta WI-CONSOLE-020 (ver Contradicción 1; confirmar con Leader antes). Prueba en `api.test.ts`.
7. Retiro de lo especulativo de procedencia: borrar `context-explorer/speculative/contextProvenance.ts` y `.test.ts`; quitar `mockGetContextProvenance` y el import de tipo de `mockBackend.ts`; quitar import, `useQuery`/`provenance` y el bloque «Qué más alimentó este contexto» de `AnalysisRunDetailPage.tsx` (y imports sin uso); eliminar CSS `.context-provenance` si queda huérfano (conservar `.context-provenance-list` mientras `ruleUsage` la use). Si `context-explorer/speculative/` queda vacío, borrar la carpeta. Verificar con `rg 'contextProvenance|Qué más alimentó|getContextProvenance' app/src` = 0.
8. No tocar `ruleUsage`/HU52 salvo decisión del Leader (ver riesgos).
9. Actualizar `tasks.md` (ST-CONSOLE-017) solo con evidencia; ver reglas del repositorio.

## Pruebas requeridas (roles/estados desde el inicio)
- `knowledgeScenario.test.ts`: orden fijo de grupos, etiquetas en español, grupos vacíos omitidos, `shortSha` (7 caracteres, null-safe), valor desconocido a «Otros».
- `FunctionalKnowledgePage.test.tsx` (reescribir): agrupa por escenario en el orden del AC con `role=heading` por grupo; varias ACTIVE del mismo target visibles; filtro Active/Superseded/Todas sigue funcionando y los grupos se recalculan; estado vacío; estado de error con `role="alert"` y reintento; carga con `role="status"`; sello DEMO; regla histórica con campos null no rompe la lista; badge con texto.
- `FunctionalKnowledgeDetailPage.test.tsx`: procedencia completa (id, rol, sha 7 chars + `title` con 40), `sourceRef` visible solo con APPROVED_IMPORT y oculto para HUMAN_ANSWER, «sin procedencia registrada» para regla histórica (todos null y parcial), cadena SUPERSEDED de 3 eslabones en ambas direcciones sin ciclo infinito (caso de ciclo/ID ausente), regla no encontrada, error; sin texto «PROPUESTA» de procedencia.
- Roles: la página de lectura no depende del rol; prueba con proyecto READER (`prj_org_metrics_demo`) y WRITER (`prj_org_writer_demo`) y ADMIN/MAINTAINER que la lista y el detalle se ven igual y sin acciones de edición (Console no edita scenarioKey ni reglas). Estados: `useProject` en carga/error, 404 `PROJECT_NOT_FOUND` del mock para un proyecto inexistente.
- `AnalysisRunDetailPage` test: ya no aparece «Qué más alimentó este contexto» ni «Test existente»; el contexto RAG sigue renderizando.
- `api.test.ts`: live -> `PendingContractError` en `listFunctionalKnowledge`; mock devuelve los campos nuevos (shape de INTEROP-2.7).
- FocusMode (regresión): 409 con `conflictingKnowledge` ya con la forma nueva sigue mostrándose tal cual llega; SUPERSEDE y KEEP_EXISTING siguen funcionando.
- Accesibilidad (spec/transversal/accessibility): navegación por teclado a enlaces y filtros, foco visible, estados con texto además del color, regiones `role="status"/"alert"`.
- Gate final: lint, test, build, `node harness/validate-harness.mjs`, validadores SDD, revisión `ux-reviewer` (UI) y luego revisión humana. Commit con `Refs: HU07, HU09`.

## Riesgos
1. Live `listFunctionalKnowledge` hoy llama a Core real: si Core ya devuelve la lista sin campos nuevos, hacer el tipo no-null rompería render; por eso el cambio a `PendingContractError` (AC4) o al menos un parser tolerante. Decidir con el Leader antes de implementar.
2. Pruebas existentes cuentan literales (`ACTIVE` x3): cualquier semilla nueva en `prj_checkout_demo` las rompe; actualizarlas a propósito, no relajarlas.
3. `FocusModePage.test.tsx` y `control-plane/api.test.ts` dependen de ids/semillas FK (`fk_shipping_zone`, `fk_coupon_expiry`, `fk_rounding_*`); mantener ids y targets.
4. `ruleUsage` (HU52) depende de `mockGetRuleUsage` y comparte CSS con el panel retirado; su permanencia es especulativa (PROPOSED) y no hay contrato; no retirarla sin instrucción, pero señalarla al Leader.
5. `originHeadSha` es procedencia, no vencimiento: no mostrar «vigente/caducada» ni compararla con el HEAD actual.
6. `confirmedByUserId`: solo el id, sin resolver a nombre ni correo (privacidad y AC2).
7. Cadena SUPERSEDED: las sucesoras se infieren con `supersedesId` de otra regla; ids ausentes en la página paginada (`nextCursor`) podrían truncar la cadena; el mock no pagina, pero la UI debe tolerar eslabones faltantes.
8. Etiquetas en español de `scenarioKind` no están fijadas por spec; dejar centralizadas para ajuste por ux-reviewer.
9. Quitar `useQuery` de `AnalysisRunDetailPage` puede dejar imports sin usar (lint) o cambiar el `enabled` del trace.

## Entregable para el Leader (status, findings, blockers, filesAffected, evidence, recommendedNextStep)
- status: SUFFICIENT
- blockers: ninguno
- filesAffected: `app/src/action-required/{types.ts, api.ts, api.test.ts, FunctionalKnowledgePage.tsx, FunctionalKnowledgeDetailPage.tsx, *.test.tsx}`, nuevo helper de escenarios (+ prueba), `app/src/api/mockBackend.ts`, `app/src/control-plane/AnalysisRunDetailPage.tsx` (+ prueba), eliminar `app/src/context-explorer/speculative/contextProvenance{,.test}.ts`, CSS huérfano; `spec/features/013-pr-driven-control-plane/tasks.md` (ST-CONSOLE-017 solo con evidencia).
- evidence: citas de spec arriba; inventario con rutas y líneas.
- recommendedNextStep: Leader registra decisionGate (blocking [], approved [DEC-FK-001, DEC-FK-003, DEC-FK-004]), confirma la decisión del adapter live (PendingContractError) y delega a `implementer` (un corte, ver pasos); luego ux-reviewer, validadores y revisión humana.
