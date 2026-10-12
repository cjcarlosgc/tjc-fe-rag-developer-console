Modelo: implementer · configurado claude-haiku-5-5 · atendido unknown · esfuerzo low

# WI-CONSOLE-030 — implementación (mock y pruebas)

**Fecha:** 2026-10-12. **Alcance:** solo `app/src/api/mockBackend.ts` y pruebas. Sin contratos, DTO, API, adapters live, UI nueva ni copy nuevo (`UNSUPPORTED_PROJECT_MESSAGE` intacto). Sin cambios en `harness/`, `spec/`, `CHANGELOG.md` ni git (sin commit). Sin Core de Render.

## Resultado

| Corte | Estado | Resumen |
|---|---|---|
| A (C1 + C4) | Hecho | Projects PHP `shop-php-demo` y `legacy-php-admin` en `team-sandbox`; Run PHP con símbolos PHP; semilla `rcmp_demo_seed_php` movida a ese Run; 422 `UNSUPPORTED_PROJECT` en OE2 para el Project sin framework. |
| B (C3) | Hecho | 409 `FUNCTIONAL_KNOWLEDGE_CONFLICT` por scope + `targetRef` + `scenarioKey` exactos; semilla `fq_checkout_pr52_1` alineada; coexistencia persiste la regla ACTIVE. |
| C (C2) | Hecho, sin revertir | `arun_checkout_pr53` (QUEUED) y `arun_billing_pr25` (PROCESSING) salen de `traceOnlyRuns` y pasan a `analysisRuns`; mapa y ramas muertas retirados. Ningún test se debilitó. |

Verificación final: `npm run lint` OK, `tsc -b --noEmit` OK, `vitest run --maxWorkers=2` 67 ficheros / 737 pruebas OK (línea base 728; +9 nuevas), `npm run build` OK (solo la advertencia habitual de tamaño de chunk, no es error).

## Corte A (C1 + C4)

**Antes:** `team-sandbox` (2000003) no tenía Projects. La semilla `rcmp_demo_seed_php` colgaba de `arun_checkout_pr49` porque no existía Project PHP. OE2 nunca respondía 422 `UNSUPPORTED_PROJECT`.

**Después:**
- `prj_shop_php_demo` (`shop-php-demo`, ADMIN, versión `ver_shop_php_1`): `language: 'PHP'`, `detectedFramework: 'PHPUNIT'`, inventario `buildPhpInventory` (4 targets, rutas `.php`, `CouponService::apply` con prueba).
- `prj_legacy_php_demo` (`legacy-php-admin`, ADMIN, versión `ver_legacy_php_1`): `language: 'PHP'`, `detectedFramework: null`.
- Run `arun_php_pr7` (SUCCESS, creado 2026-09-08): símbolos PHP `CouponService::apply` DIRECTLY_CHANGED en `app/Services/CouponService.php` y `CheckoutController::store` POTENTIALLY_IMPACTED.
- Run `arun_legacy_php_pr3` (SUCCESS, creado 2026-09-07): símbolo PHP `CouponService::apply` DIRECTLY_CHANGED.
- `seedRetrievalComparisons`: `seed(...)` acepta `run` opcional; `rcmp_demo_seed_php` cuelga de `arun_php_pr7`. Constante `DEMO_RETRIEVAL_PHP_RUN_ID` nueva y comentario de `DEMO_RETRIEVAL_PHP_COMPARISON_ID` actualizado.
- `mockStartRetrievalComparison`: tras el chequeo de `UNSUPPORTED_SYMBOL_KIND` y antes de incrementar `sequence`, si `currentVersionId` existe, la versión existe y `detectedFramework === null`, lanza `ApiError(UNSUPPORTED_PROJECT_MESSAGE, 422, 'demo-correlation-id', 'UNSUPPORTED_PROJECT')`. Con `currentVersionId: null` no cambia nada.

**Archivos:** `app/src/api/mockBackend.ts`.

**Conteos ajustados (C1+C4, Runs +2, Projects +2):**
- `control-plane/RunsPage.test.tsx`: Success 6 → 8 (+2 SUCCESS); `.repo-chip` 17 → (ver corte C).
- `control-plane/api.test.ts`: lista global 17 → (ver corte C); SUCCESS añade `arun_legacy_php_pr3` y `arun_php_pr7`.
- `projects/workspaceOverview.test.ts`: PR activos globales y `countRunsCreatedSince` (ver corte C). Los Runs PHP son de 2026-09-07/08, así que no entran en «desde 2026-09-13».
- `retrieval-comparison/RetrievalComparisonPage.test.tsx` (lista de `arun_checkout_pr49`): previas 6 → 5, «Ver resultado» 3 → 2, tras crear una comparación 7 → 6. Motivo: la semilla PHP ya no cuelga de ese Run. El comentario de la prueba B1 («dos COMPLETED de seed») ya quedaba acorde.

**Pruebas nuevas (corte A):**
- `api/mockBackend.test.ts`:
  - `team-sandbox` lista los dos Projects PHP con rol ADMIN; `shop-php-demo` tiene versión PHP/PHPUNIT e inventario PHP.
  - `arun_php_pr7` tiene símbolos PHP y `rcmp_demo_seed_php` aparece en su listado de comparaciones y no en `arun_checkout_pr49`.
  - `legacy-php-admin` responde 422 `UNSUPPORTED_PROJECT` con el mensaje exacto, sin crear comparación; el mismo símbolo PHP en `shop-php-demo` sí se acepta (PENDING).
- `retrieval-comparison/RetrievalComparisonPage.test.tsx` (sin overrides, 422 real del mock):
  - Run `shop-php-demo` lista `rcmp_demo_seed_php` como Completada con «Ver resultado».
  - Run `legacy-php-admin` muestra `UNSUPPORTED_PROJECT_MESSAGE` al comparar y no abre resultado.

## Corte B (C3)

**Antes:** `findConflictingKnowledge(projectId, targetRef)` comparaba solo project + ACTIVE + `targetRef`, con comentario obsoleto («INTEROP-2.1 definido/no implementado»). La semilla `fq_checkout_pr52_1` tenía `EXCEPTION` / `shipping.validate.corporate-exception`, que no coincidía con `fk_shipping_zone` (`EXPECTED_RESULT` / `shipping.validate.zones`); el conflicto solo existía por la compuerta. La rama sin conflicto no persistía la regla.

**Después:**
- `findConflictingKnowledge(projectId, target, scenarioKey)` exige project + ACTIVE + `targetRef` + `scenarioKey` iguales por igualdad estricta. `null`/`undefined` nunca coinciden. `LEGACY` solo coincide con `LEGACY`.
- Scope: se compara solo si es derivable del target (`targetScopeOf`: METHOD → `METHOD`, CLASS → `CLASS`). Para otros tipos (FUNCTION, INTERFACE, …) se omite la comparación de scope, documentado en el código.
- La compuerta `conflictQuestionId` se conserva (documentada).
- Semilla: `fq_checkout_pr52_1` pasa a `EXPECTED_RESULT` / `shipping.validate.zones`. El texto de la pregunta y el rationale no cambian.
- Rama sin conflicto de esa pregunta: persiste la regla ACTIVE (kind/key heredados de la pregunta, `supersedesId: null`, scope derivado). Solo esa pregunta persiste, así que los conteos de `prj_checkout_demo` no cambian.
- SUPERSEDE, KEEP_EXISTING y la forma del 409 no cambian.

**Archivos:** `app/src/api/mockBackend.ts`, `app/src/action-required/api.test.ts`.

**Pruebas nuevas (corte B, `action-required/api.test.ts`):**
- Mismo `scenarioKey`: 409 y el conflicto apunta a `fk_shipping_zone` con `scenarioKey`, `targetRef`, `scope` exactos.
- Coexistencia: `fk_shipping_zone` con `shipping.validate.other` (helper `setMockFunctionalKnowledgeScenarioForTests`) → ANSWERED sin 409; la regla nueva queda ACTIVE con `supersedesId: null`, `scope: METHOD`, `scenarioKey: shipping.validate.zones`, y `fk_shipping_zone` sigue ACTIVE.
- `LEGACY` y `null` en la regla vigente no generan 409.

No se cambió ningún conteo de HU51 (`api.test.ts`, `FocusModePage.test.tsx`), que siguen verdes. No hay pruebas que dependan de la clave antigua `corporate-exception` (grep).

## Corte C (C2)

**Antes:** `arun_checkout_pr53` (QUEUED) y `arun_billing_pr25` (PROCESSING) vivían en `traceOnlyRuns` (fuera de `analysisRuns`), así que no aparecían en listados, contadores ni «último Run». Había un mapa aparte, `traceOnlyRunSeeds`, `findVisibleTraceOnlyRun` y cuatro ramas `?? findVisibleTraceOnlyRun`.

**Después:** ambos Runs están en el array `seeds` de `seedControlPlane` (mismos datos, `createdAt` 2026-10-07). Se retiraron el mapa, `traceOnlyRunSeeds`, `findVisibleTraceOnlyRun`, las ramas y la limpieza en `resetMockBackend`. Los comentarios que decían «solo-trace» se actualizaron. Trace, evidence y `setMockAnalysisRunForTests` siguen funcionando sobre `analysisRuns`.

**Archivos:** `app/src/api/mockBackend.ts`, `app/src/control-plane/api.test.ts`, `app/src/control-plane/RunsPage.test.tsx`, `app/src/projects/workspaceOverview.test.ts`, `app/src/projects/ProjectsPage.test.tsx`.

**Conteos ajustados (corte C, totales acumulados A+C):**

| Dónde | Antes | Después | Motivo |
|---|---|---|---|
| Runs globales (`listAnalysisRuns`) | 17 | 21 | +2 PHP (A) +2 en curso (C) |
| Runs filtrados por `prj_checkout_demo` | 7 | 8 | `arun_checkout_pr53` (QUEUED) |
| SUCCESS globales | 6 | 8 | +2 PHP (A); los en curso no son SUCCESS |
| `.repo-chip` en RunsPage | 17 | 21 | = Runs globales |
| PR activos globales (`countActivePullRequests`) | 16 | 20 | +PR#7 y PR#3 (team-sandbox), +PR#53 y PR#25 |
| PR activos de checkout | 7 | 8 | PR#53 |
| Runs creados desde 2026-01-01 | 17 | 21 | = Runs globales |
| Runs creados desde 2026-09-13 | 7 | 9 | PR#53 y PR#25 (2026-10-07); los PHP son de septiembre antes del 13 |
| Último Run de checkout | pr50 | pr53 | fecha 2026-10-07 |
| Último Run de billing | pr24 | pr25 | fecha 2026-10-07 |
| KPI «PR activos» del workspace 1000001 (ProjectsPage) | 13 | 15 | PR#53 y PR#25 son de acme |
| Card de checkout: Active PRs | 7 | 8 | PR#53 |
| Card de checkout: última corrida | PR #50 | PR #53 | último Run |
| «Actividad reciente» (límite 6, ordenada por fecha) | incluye PR #42 | incluye PR #25 | los dos nuevos desplazan a PR#42 |

Ninguna aserción se eliminó ni se marcó como skip. Cada cambio de número lleva comentario con el motivo.

**Pruebas nuevas (corte C):**
- `control-plane/api.test.ts`: los dos Runs en curso figuran en su listado de proyecto con `QUEUED` (`arun_checkout_pr53`) y `PROCESSING` (`arun_billing_pr25`).
- `control-plane/RunsPage.test.tsx`: en el listado del workspace 1000001 aparecen «PR #53» con «En cola» y «PR #25» con «Procesando».

**Nota de copy:** la etiqueta existente de PROCESSING en `control-plane/status.ts` es «Procesando», no «En proceso». No se cambió el copy; la prueba usa la etiqueta real.

## Pruebas y comandos

Comandos ejecutados desde `app/`:

| Comando | Resultado |
|---|---|
| Línea base antes de editar: `node node_modules/vitest/vitest.mjs run --maxWorkers=2` | 67 ficheros, 728 pruebas, OK |
| `node_modules/.bin/eslint .` (`npm run lint`) | OK, sin errores (se corrigió un `let` → `const` en `knowledgeId`) |
| `node_modules/.bin/tsc -b --noEmit` | OK |
| `node node_modules/vitest/vitest.mjs run --maxWorkers=2` | 67 ficheros, 737 pruebas, OK |
| `npm run build` | OK (advertencia de tamaño de chunk, preexistente en el build de Vite) |

Las pruebas corrieron en jsdom (Vitest). No se abrió el Browser pane; los escenarios de UI se verifican con las pruebas de página citadas abajo.

## Cómo ver cada escenario (rutas en la Console con datos mock)

- Projects PHP: selector de workspace `team-sandbox` (2000003). Aparecen `shop-php-demo` y `legacy-php-admin`, ambos con rotulado DEMO · DATOS SIMULADOS global.
- `shop-php-demo`, Run PHP: `/projects/prj_shop_php_demo/runs/arun_php_pr7`. Comparación OE2: `/projects/prj_shop_php_demo/runs/arun_php_pr7/retrieval-comparison` (la semilla `rcmp_demo_seed_php` aparece en «Comparaciones previas», con «Ver resultado»).
- `legacy-php-admin`, error 422: `/projects/prj_legacy_php_demo/runs/arun_legacy_php_pr3/retrieval-comparison`. Elegir `CouponService::apply` y pulsar «Comparar retrieval SE vs SEM»; aparece el mensaje `UNSUPPORTED_PROJECT_MESSAGE`.
- Conflicto de Functional Knowledge: Focus Mode `/action-required/arun_checkout_pr52`. Responder la pregunta fq_checkout_pr52_1 da 409 contra `fk_shipping_zone` (mismo scope, `targetRef` y `shipping.validate.zones`) y muestra las opciones «Reemplazar regla vigente» / «Mantener la vigente».
- Runs en curso: listado personal `/analysis-runs?workspaceId=1000001` (PR #53 «En cola», PR #25 «Procesando»); detalles `/projects/prj_checkout_demo/runs/arun_checkout_pr53` y `/projects/prj_billing_demo/runs/arun_billing_pr25`.

## Findings y decisiones para la revisión

1. **Texto de la pregunta pr52 frente a la clave.** La pregunta sigue hablando de «clientes corporativos», pero su clave pasa a `shipping.validate.zones` (EXPECTED_RESULT), como recomendó la verificación. Sigue siendo una decisión de datos de demo: si el revisor prefiere mantener la excepción corporativa, habría que cambiar la clave de `fk_shipping_zone`, lo que afectaría a `listFunctionalKnowledge` y a sus pruebas.
2. **Scope no derivable.** Para targets FUNCTION, INTERFACE, etc., el matcher omite el scope (documentado). Ningún caso demo lo necesita hoy.
3. **Par LEGACY ↔ LEGACY sin prueba directa.** El helper de pruebas no permite cambiar la clave de una pregunta. Se prueban LEGACY frente a clave derivada y `null` frente a clave derivada; el caso LEGACY ↔ LEGACY queda por cubrir si se añade un helper para preguntas.
4. **No se hizo commit ni push.** Los cambios de `harness/` y `spec/` que aparecen en `git status` ya estaban antes de empezar.
5. **Sin reversión de corte.** C2 fue viable y no obligó a debilitar pruebas, así que no se revirtió.

## Blockers

Ninguno.

## Archivos afectados

- `app/src/api/mockBackend.ts`
- `app/src/api/mockBackend.test.ts`
- `app/src/action-required/api.test.ts`
- `app/src/control-plane/api.test.ts`
- `app/src/control-plane/RunsPage.test.tsx`
- `app/src/projects/ProjectsPage.test.tsx`
- `app/src/projects/workspaceOverview.test.ts`
- `app/src/retrieval-comparison/RetrievalComparisonPage.test.tsx`
- `harness/reports/wi-console-030-implementation.md` (este reporte)

## Recomendación

Enviar el diff de `app/` y este reporte al Human Reviewer (o al `reviewer` si el Modo fuera de casa está activo, según el scope-approval) para validar: (a) la clave `shipping.validate.zones` de pr52 frente al texto de la pregunta; (b) el cambio de conteos de Runs y PR activos; (c) la revisión visual de los dos Projects PHP y los Runs en curso con `ux-reviewer`, por ser cambios visibles de Console. Después, el WI puede cerrarse con el veredicto humano; el implementer no se autoaprueba.

## Corte D (hallazgos UX F1, F3, F4)

Alcance: solo `app/src/api/mockBackend.ts` y `app/src/api/mockBackend.test.ts`. Sin git, sin commit, sin cambios en `harness/` ni `spec/` (esta sección es el único añadido al informe). F2, F5, F6 y F7 quedan fuera de alcance.

**F1 — transiciones coherentes (`deriveRunHistory`).**
- QUEUED: el historial es solo `null → QUEUED (RUN_CREATED)`. Sin `SNAPSHOT_PROCESSING_STARTED` ni `GENERATION_COMPLETED`.
- PROCESSING: termina en PROCESSING (con `FUNCTIONAL_ANSWER_CONTINUATION` si hubo varios intentos), sin el paso final `PROCESSING → PROCESSING · GENERATION_COMPLETED`.
- Resto de estados (SUCCESS, ACTION_REQUIRED, OBSOLETE, …) sin cambios.

**F3 — binding de repositorio (parcial).**
- `prj_shop_php_demo` queda vinculado a `repo_team_sandbox` (`team-sandbox/demo-api`, integrationBranch `develop`, ENABLED). Sus PRs (#7) están en ese repo.
- `prj_legacy_php_demo` NO se vincula. Motivo: en `control-plane/demoRepositories.ts` solo `repo_team_sandbox` es de team-sandbox, y el resto de repos demo libres (`repo_notifications`, `repo_playground`) colisiona con pruebas existentes (`api.test.ts`, `IntegrationsPage.test.tsx`) que los vinculan a proyectos nuevos y esperan éxito. Además, `repo_team_sandbox` no puede compartirse con `legacy-php-admin` porque el mock aplica `REPOSITORY_ALREADY_BOUND`. Para completarlo hace falta añadir un repo demo propio (p. ej. `team-sandbox/legacy-admin`) a `DEMO_GITHUB_REPOSITORIES`, que está fuera del alcance indicado. Pendiente, ver recommendedNextStep.

**F4 — legacy sin «Con test».**
- `buildPhpInventory(…, null)` deja `hasTest: false` y `testFilePaths: []` en los 4 targets.
- `ver_legacy_php_1`: `targetsWithTest 0`, `targetsMissingTest 4` (antes 1/3). Inventario y Historial coinciden.

**Pruebas nuevas (`mockBackend.test.ts`, 3 casos):**
- F4: inventario legacy sin ningún target con test; contadores coherentes en inventario e historial.
- F3: `mockGetRepositoryBinding('prj_shop_php_demo')` apunta a `team-sandbox/demo-api` ENABLED, igual que el repo del Run `arun_php_pr7`.
- F1: `arun_checkout_pr53` (QUEUED) tiene historial solo `QUEUED`; `arun_billing_pr25` (PROCESSING) termina en PROCESSING, sin `GENERATION_COMPLETED` ni `PROCESSING → PROCESSING`.

**Conteos existentes.** No hubo que cambiar ninguna aserción existente: los cambios de F1/F3/F4 no alteraron los conteos de Runs, PR activos ni de inventario ya probados. No se debilitó ninguna prueba.

**Comandos (desde `app/`):**

| Comando | Resultado |
|---|---|
| `node node_modules/vitest/vitest.mjs run --maxWorkers=2` | 67 ficheros, 740 pruebas, OK (antes 737; +3) |
| `node_modules/.bin/eslint .` | OK, sin errores |
| `node_modules/.bin/tsc -b --noEmit` | OK |
| `npm run build` | Build correcto; solo la advertencia habitual de tamaño de chunk |

**Blockers.** F3 parcial: `legacy-php-admin` sigue «Sin repositorio vinculado» aunque tenga el Run `arun_legacy_php_pr3` con PR #3 en `team-sandbox/demo-api`. Requiere decisión: añadir repo demo propio a `control-plane/demoRepositories.ts` (fuera de alcance de este WI) o aceptar la incoherencia como deuda.

**recommendedNextStep.** Revisar el diff de `app/`. Decidir si se amplía el alcance para añadir un repo demo propio a `legacy-php-admin` (cambio en `control-plane/demoRepositories.ts` y una prueba de binding) y, con ese cambio, cerrar F3 por completo. Después, pedir a `ux-reviewer` una verificación visual de Historial de Runs QUEUED/PROCESSING y de Projects PHP. El veredicto de cierre lo da el Human Reviewer.
