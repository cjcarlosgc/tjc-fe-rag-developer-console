Modelo: sdd-analyst · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo low

# WI-CONSOLE-030 — verificación SDD

**Fecha:** 2026-10-12. **Estado:** APPROVED (sin blockers; una nota de decisión de diseño para el leader en C3, ver 2.5). Solo lectura: no se editó código ni specs. `node harness/validate-harness.mjs` pasa ("Harness V3 validation passed").

## 1. Suficiencia SDD y decisiones

- WI: `harness/work-items.json:2872` (W-SELECTED, `contractImpact:false`, `publishesContract:false`, storyIds HU12/HU15/HU17, taskId ST-CONSOLE-032, `approved:true`). Alcance aprobado: `harness/reports/wi-console-030-scope-approval.md` (C1-C4, solo mock y pruebas). Criterios de aceptación en `work-items.json:2898-2905`.
- `decisionGate` sigue en `checked:false` (`work-items.json:2912-2917`): el leader debe registrarlo antes de implementar.
- Decisiones con `Blocks` que alcanzan este WI:
  - `DEC-FK-001` APROBADO (2026-10-08) — `spec/contracts/system-contract.md:378-382`; `DEC-FK-004` APROBADO — `system-contract.md:398-402`. No bloquean, son la regla a implementar en C3.
  - `DEC-PHP-RET-001` no existe como `### DEC-` en `system-contract.md`; solo se cita como decisión de Core en `spec/contracts/interoperability-contract.md:1059` y `harness/contract-sync/inbox/CS-CORE-20261009-017.yaml:9`. No hay estado PENDING/PROPOSED asociado; no bloquea (el WI solo cambia datos del mock).
  - `DEC-VAL-001` es la única PENDING (`system-contract.md:274-278`); su `Blocks` es "ingestión/despliegue con código empresarial y evidencia empresarial; no bloquea trabajo con código de demostración" → no alcanza este WI. `DEC-INF-001` ya APROBADO (`system-contract.md:256-260`).
  - Ninguna PENDING/PROPOSED bloquea.
- `spec/features/014-analysisrun-experiments/plan.md:10`: los mocks "siguen rotulados `DEMO · DATOS SIMULADOS`" y los adapters live no se escriben contra campos que Core no publicó; `013-pr-driven-control-plane/spec.md:34` idem para evidencia. Suficiente.

## 2. C3 — conflicto 409 y SUPERSEDE

### 2.1 Texto vigente (INTEROP-2.8 / §6.11)
- `interoperability-contract.md:868` (HU09, implementado): Core evalúa "si ya existe una `FunctionalKnowledge` `ACTIVE` para el mismo scope+símbolo exacto+`scenarioKey` (desde INTEROP-2.7 el match incluye el `scenarioKey`, `DEC-FK-001`; otro `scenarioKey` del mismo target coexiste y no es conflicto; jerarquía PROJECT⊃MODULE⊃CLASS y contradicción semántica vía LLM quedan pendientes)". Sin `conflictResolution` → `409 FUNCTIONAL_KNOWLEDGE_CONFLICT` con `details: FunctionalKnowledgeConflictResponse`, no persiste ni avanza el Run. `SUPERSEDE` persiste la nueva `ACTIVE` y pasa la existente a `SUPERSEDED` (`supersedesId`); `KEEP_EXISTING` registra evidencia (`knowledgeId:null`) sin tocar la regla. `conflictId` reutiliza `questionId`.
- `interoperability-contract.md:870` (INTEROP-2.7, DEC-FK-001): la regla hereda `scenarioKind`/`scenarioKey` de la pregunta (las históricas, `EXPECTED_RESULT`/`LEGACY`); "el conflicto solo existe entre reglas con el mismo scope, `targetRef` y `scenarioKey`, y reglas con distinto `scenarioKey` coexisten como `ACTIVE`".
- `system-contract.md:141` y `:382` repiten la regla. Históricas: `interoperability-contract.md:774` (pregunta histórica = `EXPECTED_RESULT` + `'LEGACY'`). `scenarioKey` es `string` no nulo en el contrato (`interoperability-contract.md:811,851`; `app/src/action-required/types.ts:48,108`).

### 2.2 Pregunta: ¿`targetRef` + `scenarioKey`? Sí, y además scope
Igualdad exacta de scope + `targetRef` + `scenarioKey`, sobre reglas `ACTIVE` del mismo Project. Un `scenarioKey` distinto no es conflicto (coexiste).

### 2.3 null / LEGACY
- No hay regla de comodín: `LEGACY` solo coincide con `LEGACY` (igualdad de cadena); una pregunta con clave derivada nunca choca con una regla `LEGACY`. `null` no existe en el contrato (el mock lo admite solo por el helper de pruebas `setMockFunctionalKnowledgeScenarioForTests`, `mockBackend.ts:2117-2122`, y por reglas históricas "sin procedencia" de la semilla). Criterio mock: `null`/`undefined` nunca es igual a nada (ni a otro `null`) → sin conflicto.

### 2.4 Estado actual del mock
- Matcher: `mockBackend.ts:1546-1549` `findConflictingKnowledge(projectId, targetRef)` compara solo project + `ACTIVE` + `targetRef` (su comentario admite la simplificación; además dice "INTEROP-2.1 definido/no implementado", obsoleto frente a `interoperability-contract.md:868`).
- Compuerta: `mockBackend.ts:1580` solo evalúa conflicto si `questionId === state.conflictQuestionId` (campo en `:62-68`, único valor `fq_checkout_pr52_1` en `:423`). Debe conservarse: otras preguntas comparten target Y `scenarioKey` con reglas semilla (p. ej. `fq_checkout_pr42_1` `:346` tiene la misma clave `coupon.apply.expired-paid-order` que `fk_coupon_expiry` `:715-720`), y romperían sus flujos.
- 409: `:1581-1591`. SUPERSEDE: `:1604-1612` (la nueva regla ya hereda `scenarioKind/Key` de la pregunta). KEEP_EXISTING: `:1597-1599`.
- **Hallazgo clave:** `fq_checkout_pr52_1` tiene `scenarioKind:'EXCEPTION'`, `scenarioKey:'shipping.validate.corporate-exception'` (`:426`), pero `fk_shipping_zone` tiene `EXPECTED_RESULT`/`'shipping.validate.zones'` (`:724-731`). Con el criterio correcto NO habría 409 y se romperían las pruebas HU51. Hay que alinear la semilla (ver 2.5).

### 2.5 Criterio exacto propuesto y cambio de datos
1. `findConflictingKnowledge(projectId, scope, targetRef, scenarioKey)`: `item.projectId === projectId && item.status === 'ACTIVE' && item.scope === scope && item.targetRef === targetRef && scenarioKey != null && item.scenarioKey === scenarioKey`. `scope` de la pregunta: derivarlo de `question.target.kind` (METHOD/FUNCTION → `'METHOD'`, igual que las semillas con `scope:'METHOD'`); verificar el tipo `FunctionalScope` antes de mapear.
2. Mantener la compuerta `conflictQuestionId` (documentar el porqué; hoy el comentario `:62` ya lo hace).
3. Semilla pr52: para que siga habiendo conflicto, alinear la pregunta con la regla: `scenarioKind:'EXPECTED_RESULT'`, `scenarioKey:'shipping.validate.zones'` en `fq_checkout_pr52_1` (`:426`); texto y rationale (`:434-435`) ya hablan de "zonas de envío habilitadas" y no cambian. No se usó `corporate-exception` en ninguna prueba (grep: solo `mockBackend.ts`). Decisión de diseño menor (no es DEC): alternativa válida = cambiar la clave de `fk_shipping_zone`, pero rompería `listFunctionalKnowledge` agrupaciones; se recomienda la primera.
4. Sentido contrario ("coexiste"): usar el helper existente `setMockFunctionalKnowledgeScenarioForTests('fk_shipping_zone', { scenarioKind:'BOUNDARY', scenarioKey:'shipping.validate.other' })` y responder pr52_1 → sin 409, `outcome:'ANSWERED'`. OJO: hoy, en la rama sin conflicto, el mock devuelve `knowledgeId: fk_demo_N` pero NO persiste la regla (`functionalKnowledge.set` solo ocurre en el bloque SUPERSEDE, `:1602-1613`). Para que la coexistencia sea observable hay que persistir la nueva regla `ACTIVE` (heredando kind/key de la pregunta, `supersedesId:null`) cuando la pregunta es la `conflictQuestionId` y no hubo conflicto; hacerlo solo para esa pregunta evita cambiar los conteos 5 ACTIVE / 2 SUPERSEDED de `prj_checkout_demo` (`action-required/api.test.ts:154-160`, `FunctionalKnowledgePage.test.tsx:40-68`).
5. Pruebas que ejercitan hoy el conflicto (deben seguir pasando tras alinear la semilla):
   - `app/src/action-required/api.test.ts:98-146` (409 con `fk_shipping_zone`, SUPERSEDE, KEEP_EXISTING).
   - `app/src/action-required/FocusModePage.test.tsx:152-182` (UI de conflicto, "Reemplazar regla vigente", "Mantener la vigente"); `:276` (409 sintetizado).
   - `app/src/action-required/api.test.ts:245-250` (live, `ApiError.details`).
   - Pruebas nuevas: coexistencia (4) y `LEGACY`/`null` (no coincide con clave derivada; `LEGACY`=`LEGACY` sí) en `api.test.ts` sección HU51.

## 3. C1 — Project demo PHP

### 3.1 Dónde modelar (`app/src/api/mockBackend.ts`)
- Workspaces: `DEMO_WORKSPACES` `:72-77`; Projects `seed()` `:307-318`; versiones `:319-331`; inventario `buildInventory` `:209-220` (hard-codea `language:'TYPESCRIPT'`, `detectedFramework:'VITEST'` y rutas `.ts` → crear `buildPhpInventory` o parametrizar). Semilla `rcmp_demo_seed_php`: constante `:133-134` (comentario "vive en `arun_checkout_pr49` porque el mock no tiene proyecto PHP" a actualizar), siembra `:1346-1397` (usa `analysisRuns.get('arun_checkout_pr49')` y su `run`/`projectId`; el helper `seed(...)` cierra sobre `run` → parametrizar `run` para la semilla PHP, `:1392-1394`). Candidatos PHP `:125-131`.
- Run PHP: nuevo item en `seedControlPlane` (`seeds` `:482-694`), p. ej. `arun_php_pr7`, `status:'SUCCESS'`, símbolo `{language:'PHP', kind:'METHOD', qualifiedName:'CouponService::apply', filePath:'app/Services/CouponService.php', changeKind:'DIRECTLY_CHANGED'}` (+ uno `POTENTIALLY_IMPACTED` opcional, p. ej. `CheckoutController::store`). El trace usa `notApplicableTarget` genérico (`:1918-1922`), sin cambio.
- Binding opcional: `repo_team_sandbox`/`team-sandbox/demo-api` ya existe en `control-plane/demoRepositories.ts:55-59` y ramas en `mockBackend.ts:1657`; la visibilidad no lo exige (`canSeeProject` `:849-853`: rol ADMIN siempre visible).

### 3.2 Workspace/rol que minimiza cambios
- `team-sandbox` (id `2000003`, rol ADMIN, `DEMO_WORKSPACES[3]`) no tiene Projects hoy y no aparece en ninguna prueba (grep `2000003|team-sandbox` solo en `mockBackend.ts:76` y `demoRepositories.ts`). Poner ahí el Project con rol `ADMIN` (así Writer+ para OE2, `requireProjectRole(...,'WRITER')`, y `mockCreateProject` ya admite org con rol ADMIN `:895-898`).
- No usar `1000001` (cambiaría "2 proyectos", PR activos 13, Action Required 4 en `ProjectsPage.test.tsx:248-266`, `:294` "7", `workspaceOverview`).
- `DEMO · DATOS SIMULADOS`: el rótulo es un chip global (`ui/AppShell.tsx:36`) y sellos por página (`AnalysisRunDetailPage.tsx:145`, `RetrievalComparisonPage.tsx:159`); no se rotula por nombre de Project. Nombre neutro y claro, p. ej. `shop-php-demo`; no hay regla de la spec que exija prefijo en el nombre.

### 3.3 Conteos y pruebas que cambian (con 1 Project PHP + 1 Run SUCCESS en team-sandbox; ver C4 para el segundo)
Sin cambio: workspaces `1000001`/`2000001`/`2000002`, selector de workspace (siguen 4 workspaces), `ProjectsPage.test.tsx:248-266` (KPIs de `1000001`), `:280-296`, `HU25 buscador` (`:203-228`), `control-plane/api.test.ts:39,236,263-265`, `mockBackend.test.ts:15,36`, `ProjectDetailPage.test.tsx`, `FunctionalKnowledge*`, `ActionRequiredPage.test.tsx` (Run PHP sin preguntas).
Cambian (listado global sin `workspaceId`, `mockListAnalysisRuns` `:1806-1816` no filtra por workspace):
- `control-plane/api.test.ts:313-315` "lista los 17" → 18 (19 con C4); `:323-324` lista SUCCESS: añadir el id nuevo.
- `control-plane/RunsPage.test.tsx:22` `.repo-chip` 17 → 18; `:19` `getAllByText('Success')` 6 → 7.
- `projects/workspaceOverview.test.ts:12,15-16` (16 PR activos globales → 17), `:24-28` (17 → 18; `createdAt` ≥ 2026-09-13 queda 7 si el Run PHP se fecha antes del 2026-09-13, recomendable).
- `retrieval-comparison/RetrievalComparisonPage.test.tsx` (seed PHP sale de `arun_checkout_pr49`): `:173` 6 → 5 ítems, `:174` 3 → 2 "Ver resultado", `:180` 7 → 6 y `:110` conteo "Completada" (recalcular), comentario `:179`.
- `retrieval-comparison/api.test.ts:73-79` y `evidence/api.test.ts:99-104,115-116` buscan `rcmp_demo_seed_php` por id: siguen válidas; añadir assert de `results.symbol.filePath` PHP y de `projectId` del Run PHP. `retrieval-comparison/queries.ts`/`api.ts` no cambian.
- Pruebas nuevas: Project en `listProjects('2000003')`; versión actual con `language:'PHP'`/`detectedFramework:'PHPUNIT'`; inventario PHP; `getAnalysisRun(runPhp)` con símbolos PHP; `listRetrievalComparisons(runPhp)` contiene `rcmp_demo_seed_php`.

## 4. C2 — Runs QUEUED/PROCESSING en listados/contadores/métricas

- Hoy: `traceOnlyRunSeeds` `:151-172` → `traceOnlyRuns` `:150,695`; se resuelven en `mockGetAnalysisRun` (`:1844`), trace (`:1964`), evidence (`:2062`), helper de pruebas (`:2126`), `resetMockBackend` (`:830`). Los listados/contadores/métricas leen `analysisRuns` (`:1809`, `:2227`).
- Viabilidad: viable técnicamente (mover los dos Runs a `seeds` de `seedControlPlane`; `setMockAnalysisRunForTests` y trace/evidence ya funcionan con `analysisRuns`; `findVisibleTraceOnlyRun` y las 4 ramas `?? findVisibleTraceOnlyRun` quedan muertas). Notas: `prj_billing_demo` tiene `currentVersionId:null` (`:310`) → `evidenceAnalysisRun` `projectVersionId:null`, sin impacto mientras el Run no sea terminal (409 `EVIDENCE_NOT_FINISHED`); `symbols:[]` → `canCompareRetrieval` falso (no hay símbolo elegible, `AnalysisRunDetailPage.tsx:132`).
- Pruebas que dependen de los conteos actuales (cambian al pasar de 17 a 19 Runs, o a 20 con C1+C4+C2):
  - `control-plane/api.test.ts:315` (17), `:319-321` checkout 7 → 8.
  - `control-plane/RunsPage.test.tsx:22` (chips).
  - `projects/workspaceOverview.test.ts:16` (16 → +2), `:20-21` (checkout 7 → 8), `:26` (17), `:28` (7 → 9 por createdAt 2026-10-07/10-07), `:34-35` (último Run checkout `pr50` → `pr53`; billing `pr24` → `pr25`: cambia el sentido "último Run").
  - `projects/ProjectsPage.test.tsx:257-258` (PR activos 13 → 15), `:294` (Active PRs 7 → 8), `:296` (`/PR #50/` último run → `PR #53`; la tarjeta mostrará badge "En cola").
  - Trace/evidencia (`control-plane/operationalTrace.test.ts:145-157,201-209`, `OperationalTraceSection.test.tsx:167-190,260-268`, `AnalysisRunDetailPage.test.tsx:217`, `evidence/api.test.ts:27-28`) usan ids/estados y no dependen de la lista; deberían seguir verdes, pero hay que revisar comentarios "solo-trace/no aparece en listados" en `mockBackend.ts:154,695,1843` y en las pruebas.
  - ActionRequired y FunctionalKnowledge no cambian (0 preguntas, sin símbolos).
- Recomendación: SÍ hacerlo, en un corte propio y al final (corte C), con valores exactos actualizados y comentario del porqué (no es debilitar: se afirma el nuevo número exacto y se añaden aserciones de que ambos Runs aparecen con estado En cola/En proceso). Cuidado explícito con `latestRunByProject` y `Runs esta semana` (cambia la semántica de "último Run"); si el usuario/reviewer lo ve riesgoso, fallback aprobado: dejarlo y documentar el motivo (criterio de aceptación 2).

## 5. C4 — UNSUPPORTED_PROJECT en OE2

- Spec: `interoperability-contract.md:350` (§6.5.1): `422 UNSUPPORTED_PROJECT` cuando la versión no tiene framework `JEST`/`VITEST`/`PHPUNIT` ("un proyecto PHP sin PHPUnit incluido"); precedencia: después de Writer, indexación, versión completada y target. §6.15 `:1057`: un proyecto PHP ya no devuelve 422 por lenguaje; `UNSUPPORTED_PROJECT` en OE2 vale por falta de framework (`control-plane/errors.ts:33-34`, mensaje `:3-4`; no se cambia).
- Hoy: `mockStartRetrievalComparison` `:1267-1304` no lo emite; el mock de experimentos solo lo dispara con el id mágico `demo-error-unsupported-project` (`:970`, `:1131`; prueba `api/mockBackend.test.ts:86`); OE2 solo lo cubre `RetrievalComparisonPage.test.tsx:183-190` con `overrides.start`.
- Caso demo concreto (recomendado, fiel a la spec): un segundo Project demo en `team-sandbox` (p. ej. `legacy-php-admin`, `role:'ADMIN'`), con versión actual `language:'PHP'`, `detectedFramework:null` (los tipos lo admiten, `projects/types.ts:28,36,96`; `inventory/types.ts:18`) y un Run SUCCESS con un símbolo `METHOD` `DIRECTLY_CHANGED` PHP. En `mockStartRetrievalComparison`, tras el chequeo de `UNSUPPORTED_SYMBOL_KIND` (`:1288-1290`) y antes de `sequence += 1` (`:1291`): si `project.currentVersionId` existe, la versión está en `versions` y `detectedFramework === null` → `throw new ApiError(UNSUPPORTED_PROJECT_MESSAGE, 422, 'demo-correlation-id', 'UNSUPPORTED_PROJECT')`. Con `currentVersionId:null` (billing, org) el comportamiento no cambia (la prueba `retrieval-comparison/api.test.ts:137-141` de `arun_billing_pr17` exige PENDING).
- Cómo verlo: Runs → Run de `legacy-php-admin` → "Comparar retrieval SE vs SEM" → ruta `/projects/<id>/runs/<runId>/retrieval-comparison` → elegir el símbolo → botón; la página muestra `UNSUPPORTED_PROJECT_MESSAGE` en el alert (la UI ya lo soporta, prueba `RetrievalComparisonPage.test.tsx:183-190`).
- Alternativa más barata (si se quiere un solo Project nuevo): marcar un Run del Project PHP por id mágico (como `DEMO_RETRIEVAL_NOT_FINISHED_RUN_ID` `:1322`), pero es menos fiel porque el framework es propiedad de la versión. Opcional y coherente: aplicar el mismo chequeo en `mockStartExperiment` (`:1126-1138`) usando `versions.get(project.currentVersionId)`.
- Con 2 Projects nuevos, ambos en `team-sandbox`, los totales de la sección 3.3 pasan a 19 Runs / 18 PR activos (+2 respecto a hoy; sin tocar workspaces existentes).

## 6. Contract Sync
Sin impacto contractual: solo datos y reglas internas del mock; ningún DTO, endpoint, enum, código de error, header ni adapter live cambia. `UNSUPPORTED_PROJECT_MESSAGE`, `FunctionalKnowledgeConflictResponse` y `ProjectLanguage`/`TestFramework` ya existen. `work-items.json:2918-2947` clasifica 4 eventos como NOT_RELEVANT; los eventos de PHP/OE2 (`CS-CORE-20261009-017/-018`) los consumieron WI-CONSOLE-021/026. El validador del Harness pasa.

## 7. Riesgos, límites y plan de pruebas por corte
Riesgos: (a) la semilla pr52 es la única que dispara conflicto; sin alinearla HU51 se rompe (2.4); (b) la rama sin conflicto no persiste la regla (2.5.4); (c) mover la semilla PHP cambia 3-4 aserciones literales de `RetrievalComparisonPage.test.tsx`; (d) C2 altera "último Run"/PR activos; (e) `projectVersionId: ver_<projectId>` de las comparaciones (`:1286`) no coincide con el id real de versión; mantener para no tocar `api.test.ts:98` ("ver_prj_checkout_demo"); (f) no implementar nada fuera de mock y pruebas (sin UI nueva, sin tocar `reasoningEffort`/`checkId`, F1, OC*).
Límites: sin contratos/DTO/API/adapters live; copy `UNSUPPORTED_PROJECT_MESSAGE` intacto; WI-CONSOLE-004 queda W-READY; reviewer independiente (Modo fuera de casa activo según scope-approval) y `ux-reviewer` por el cambio visible (Project/Runs nuevos).

Plan de pruebas:
- Corte A (C1+C4): pruebas nuevas del Project PHP y del 422 OE2 (mock + UI de página con el Run `legacy-php-admin`); actualizar conteos de 3.3; verificar que `rcmp_demo_seed_php` resuelve contra el Run PHP; lint, `tsc -b --noEmit`, vitest, build.
- Corte B (C3): `findConflictingKnowledge` con scope+targetRef+scenarioKey; alinear pr52; pruebas de ambos sentidos (409 con clave igual; coexistencia con clave distinta y regla nueva `ACTIVE` persistida; `LEGACY`/`null`); HU51 existentes siguen verdes.
- Corte C (C2, si el usuario lo mantiene): mover Runs, actualizar los conteos de la sección 4, eliminar `traceOnlyRuns` muerto o dejarlo vacío, aserciones de visibilidad en listado/contadores.

## Estado final
**APPROVED**
- findings: DEC-FK-001/DEC-FK-004 aprobadas, solo DEC-VAL-001 PENDING sin alcance; regla C3 = scope + targetRef + scenarioKey exacto; semilla pr52 incompatible con la regla y debe alinearse; rama sin conflicto no persiste la regla; `team-sandbox` está libre; C2 viable con ~10 aserciones; C4 viable con Project de versión sin framework.
- blockers: ninguno.
- filesAffected (previstos, solo mock y pruebas): `app/src/api/mockBackend.ts`; pruebas `app/src/action-required/api.test.ts`, `app/src/action-required/FocusModePage.test.tsx` (si cambia texto), `app/src/control-plane/api.test.ts`, `app/src/control-plane/RunsPage.test.tsx`, `app/src/projects/workspaceOverview.test.ts`, `app/src/projects/ProjectsPage.test.tsx` (solo C2), `app/src/retrieval-comparison/RetrievalComparisonPage.test.tsx`, `app/src/retrieval-comparison/api.test.ts`, `app/src/evidence/api.test.ts`, `app/src/api/mockBackend.test.ts`.
- evidence: citas archivo:línea de las secciones 1-5; `node harness/validate-harness.mjs` OK.
- recommendedNextStep: el leader registra `decisionGate` (sin bloqueantes) y delega A (C1+C4), luego B (C3) y C (C2) al implementer; decisión de diseño para el usuario/leader solo si se quiere evitar el 2.º Project (usar alternativa de id mágico).
