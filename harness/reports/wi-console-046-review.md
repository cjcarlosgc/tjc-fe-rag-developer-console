# WI-CONSOLE-046 — revisión independiente

Modelo: reviewer · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Veredicto: APPROVED** (con un hallazgo menor de redacción a corregir por el leader antes del cierre y dos observaciones no bloqueantes de pruebas). Ciclo de revisión 1 de 2.

## Alcance revisado
Diff de `app/` (hook nuevo `useAnalysisRunRealtime.ts`, una importación y una llamada en `AnalysisRunDetailPage.tsx`, solo el comentario de `api/socket.ts`, 3 archivos de prueba nuevos), `work-items.json`, `state.json`, `tasks.md` y los reportes de WI-046. No se tocó DTO, rutas, JSX, estilos, copy ni polling.

## (a) Criterios de aceptación y alcance
- Criterio 1: cumple. El hook solo llama `invalidateQueries({ queryKey: controlPlaneKeys.run(id) })` como `onUpdate` y `onReconcile`; no escribe el DTO del aviso en la caché; no invalida proposals ni trace. Sin cambio de DTO ni de rutas (`router.tsx` intacto).
- Criterio 2: cumple (ver b, c, d).
- Criterio 3: gates y validadores reproducidos (abajo); la aprobación del reviewer es este informe. Sin reinterpretación de la autoridad MAINTAINER/ADMIN.
- Sin salida de alcance: el comentario de `socket.ts` es el único cambio ajeno al hook y estaba previsto en el SDD.

## (b) Corrección del hook
- Sin sesión (`userId` nulo), sin id o con `isMockDataSource()` retorna sin abrir el socket. Deps `[analysisRunId, userId, queryClient]`: cambio de id y logout limpian y re-evalúan. Devuelve el unsubscribe de `subscribeAnalysisRunUpdates` (idempotente por `active`), por lo que StrictMode (monta/desmonta/monta) deja una sola suscripción viva. En logout, `AuthProvider` ya llama `resetSocket()`; el cleanup posterior es no-op. Llamada antes de los returns tempranos de la página. Sin defectos.

## (c) Calidad de las pruebas (mutación real, restaurada)
Mutaciones aplicadas temporalmente y revertidas (hook y página verificados idénticos al original, prettier ok):
- Quitar el `return` de cleanup: 6 pruebas fallan (hook, socket real y página). Detectado.
- Quitar `onReconcile`: 3 fallan. Detectado.
- Quitar guardas `userId`/mock: 3 fallan. Detectado.
- Quitar la llamada en la página: 1 falla. Detectado.
- Cambiar la clave invalidada `controlPlaneKeys.run(id)` por la genérica `['control-plane']`: **0 fallan (mutante superviviente)**. Ninguna prueba afirma que solo se invalida el Run del id (p. ej. que otra consulta como `proposals`/trace no se refetchea). Menor, no bloqueante: el criterio «solo invalida controlPlaneKeys.run» queda sin cobertura negativa. Recomendado como mejora (consulta hermana con otra clave que no debe refetchearse), no condiciona la aprobación.
- Reloj falso: solo la última prueba del hook usa `vi.useFakeTimers({ shouldAdvanceTime: true })`; ese modo deja avanzar el reloj real y la prueba verifica el `refetchInterval` de React Query, no el hook (pasaría igual con el hook roto). Observación no bloqueante: el criterio «fake timers» se cumple de forma nominal; no hay aserción de timers pendientes (`vi.getTimerCount()`) tras desmontar. La ausencia de fugas de listeners sí está probada con el socket real simulado (`.socket.test.tsx`: tras desmontar, `analysis-run:update` = 0 y `connect` vuelve al conteo previo; fallaría sin cleanup, comprobado). Las demás pruebas no dependen del reloj (sin sleeps reales); `afterEach` restaura timers y data source. Sin fugas entre pruebas observadas; 887/887 estable.

## (d) «Sin segundo consumidor / sin conteo de referencias»
Confirmado contra el código. `useAnalysisRun` lo usan `AnalysisRunDetailPage`, `RunComparisonPage`, `RetrievalComparisonPage` y `ExperimentPage`; en `router.tsx` son todas rutas hermanas bajo `AppShell` (`projects/:projectId/runs/:analysisRunId`, `/comparison`, `/retrieval-comparison`, `projects/:projectId/experimental`), un solo `element` montado a la vez, sin anidamiento ni portales. `subscribeAnalysisRunUpdates` solo lo llama el hook nuevo y solo el detalle lo usa. Conclusión correcta; el comentario de `socket.ts` la documenta y deja el riesgo latente (otra pantalla coexistente exigiría conteo de referencias).

## (e) Omisión de ux-reviewer
De acuerdo, con una precisión: no cambia markup, estilos ni copy (diff de la página = 1 import + 1 llamada); el refresco usa `invalidateQueries`, que no pasa por `isPending`, así que no hay parpadeo del estado de carga. Sí cambia el comportamiento visible (el estado del Run se actualiza sin recargar), lo que es el objetivo aprobado, no un cambio de superficie UI. Omisión justificada; `uxReviewed: G-NOT_APPLICABLE` es coherente. Recomendación: que el informe de cierre deje esta justificación por escrito.

## (f) Afirmación de «polling base»
`useAnalysisRun` no tiene `refetchInterval`: el detalle no sondea el Run. Los informes de implementación y SDD lo dicen bien. **Hallazgo H1 (menor, redacción):** siguen afirmando lo contrario, sin matiz, el `title` del WI en `work-items.json` y de `activeWorkItem` en `state.json` («…el polling sigue como base»), y `tasks.md` ST-CONSOLE-048 («el polling HTTP no se elimina ni se relaja», que sugiere que existe polling del Run). El sdd-analyst ya lo recomendó. El criterio de aceptación 1 (copia literal de la aprobación) puede quedar. Corrección sugerida al leader: cambiar el título a «…invalidando el GET; sin polling del Run que preservar ni añadir» (en ambos JSON) y la frase de tasks.md; el CHANGELOG (listado en specPaths pero sin modificar aún) debe redactarse sin «polling base» para el Run. No cambia el código.

## (g) Registro
- Rutas de `specPaths`, `scopeApprovalReport`, `contractSyncReview.report` y `gateEvidence` apuntan a `wi-console-046-*` (no copiadas de otro WI). `dependsOn: WI-CONSOLE-044` correcto. ST-CONSOLE-048 sigue `[ ] … T-IN_PROGRESS` (se marca T-DONE al cierre, correcto). `activeWorkItem` = WI-CONSOLE-046 en `W-IN_REVIEW`; `reviewCycles: 0` (pasará a 1 al registrar esta revisión).
- Para registrar la revisión el leader debe: poner `technicalChecksPassed` e `interopSyncChecked` en `G-PASSED` con evidencia (hoy `G-NOT_RUN` y `validate-harness` lo exige antes de revisión), añadir este informe como evidencia de `independentReviewPassed`, y `retryLimitRespected`. Hoy `evidence`/`gateEvidence` no referencian `wi-console-046-contract-sync-review.md` ni la revisión.

## Gates reproducidos (Node 22, `app/` y raíz)
- `pnpm lint`: exit 0.
- `pnpm exec tsc -b --noEmit`: exit 0.
- `pnpm test --maxWorkers=4`: 83 archivos, 887 pruebas pasan.
- `pnpm build`: exit 0 (solo aviso previo de tamaño de chunk).
- `pnpm format:check`: exit 0.
- `pnpm contracts:check`: exit 0.
- `node scripts/sdd-check.mjs`: exit 1, solo «Referencia inexistente» de `wi-console-046-review.md` y `-closure.md` (esperado).
- `node harness/validate-work-items.mjs`: exit 1, solo `missing spec path` de esos dos archivos (esperado).
- `node harness/validate-harness.mjs`: exit 1; además de esos dos specPaths reporta `technicalChecksPassed must pass before review` e `interopSyncChecked must pass before review` (no son defecto del código: gates aún `G-NOT_RUN` en el registro, ver g).

## Hallazgos
1. H1 (menor): título/tasks.md afirman «polling base» para el Run (ver f). Corregir antes del cierre.
2. Observación: mutante superviviente por clave de invalidación genérica; sin prueba negativa (ver c).
3. Observación: la única prueba con reloj falso usa `shouldAdvanceTime: true` y no ejerce el hook; sin aserción de timers pendientes (ver c).
4. Registro: gates `technicalChecksPassed` e `interopSyncChecked` pendientes de pasar a `G-PASSED` (ver g).

Sin DECISION_REQUIRED: ampliar la invalidación a proposals/trace sigue siendo no recomendado en este WI (el SDD lo evaluó; trace ya sondea y proposals se refresca por su propio flujo).
