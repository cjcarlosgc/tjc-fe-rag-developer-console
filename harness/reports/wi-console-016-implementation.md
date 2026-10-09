# WI-CONSOLE-016 — Implementación

## Corte A — datos y adapter (sin UI)

Estado: completado, sin commit ni push. Pendiente de revisión humana (Human Reviewer).

### Archivos
- `app/src/control-plane/operationalTraceTypes.ts` (nuevo): `TraceLinkStatus`, `TraceExecutionResponse`, `TraceTargetResponse`, `TracePublicationResponse`, `AnalysisRunTraceResponse`. Marcados `// INTEROP-2.7 §6.16`; reutiliza `AnalysisSymbolResponse`.
- `app/src/control-plane/operationalTraceErrors.ts` (nuevo): `isTraceNotFinished` (409 + `EVIDENCE_NOT_FINISHED`) y `shouldRetryOperationalTrace` (no reintenta 404/409/contrato pendiente).
- `app/src/control-plane/api.ts`: `getAnalysisRunTrace(id)`. Mock -> `mockGetAnalysisRunTrace`; live -> `PendingContractError`.
- `app/src/control-plane/queries.ts`: `controlPlaneKeys.trace(id)` y `useAnalysisRunTrace(id)` (polling 900 ms, 10 ms en test, solo mientras el error sea `EVIDENCE_NOT_FINISHED`).
- `app/src/api/mockBackend.ts`: `mockGetAnalysisRunTrace`, trazas por Run (SUCCESS, BEHAVIORAL_MISMATCH, NO_ADDITIONAL, ACTION_REQUIRED, NO_TEST_RELEVANT_CHANGES, resto con enlaces NOT_APPLICABLE), publicación PRESENT/NOT_APPLICABLE con freshness, `setMockAnalysisRunForTests` (solo pruebas), runs QUEUED/PROCESSING sembrados.
- `app/src/control-plane/operationalTrace.test.ts` (nuevo): 16 pruebas.

### Decisiones
1. Los runs QUEUED (`arun_checkout_pr53`) y PROCESSING (`arun_billing_pr25`) viven en un mapa `traceOnlyRuns`, fuera de `analysisRuns`. Al sembrarlos en el listado global rompieron 10 pruebas existentes (conteo de 17 runs, PRs activos, último run por proyecto, ProjectsPage). No se modificaron esas expectativas.
2. `checkId` siempre `null` en la publicación mock: el mock no modela un check de GitHub y no se inventa el id.
3. Targets de pr45 incluyen `formatCurrency` (POTENTIALLY_IMPACTED), que no está en `run.symbols`. Así `changeset.targetCount` = 2 con la traza completa.
4. Runs sin fixture explícita: targets derivados de `symbols` con los enlaces en NOT_APPLICABLE (no se afirma retrieval/context sin dato).
5. Regla FK ausente de prueba: `fk_demo_regla_inexistente` en `arun_checkout_pr45` / `formatCurrency`, para la degradación de Corte B.
6. `outcome` = `VALIDATED` o `BEHAVIORAL_MISMATCH`, cadenas tal cual sin mapear a veredicto.

### Duda abierta
- Un run QUEUED/PROCESSING responde la traza pero `GET /analysis-runs/{id}` responde 404 (por la decisión 1). Es un desfase del mock. Afecta a Corte B si la UI necesita ambos. Alternativa: aceptarlo como fixture de trace-only o ampliar los demás tests.
- Código del 404 del trace: se usa `ANALYSIS_RUN_NOT_FOUND`, como el detalle; confirmar en WI-CONSOLE-020.

### Checks
- `npx eslint .`: 0 errores.
- `npx tsc -b --noEmit`: 0 errores.
- `node node_modules/vitest/vitest.mjs run --maxWorkers=2`: 60 archivos, 563 pruebas en verde (línea base 547 más 16 nuevas).

## Corte B — UI del trace operativo

Estado: completado, sin commit ni push. Pendiente de revisión humana (Human Reviewer) y de `ux-reviewer` (cambio visible).

### Archivos
- `app/src/api/mockBackend.ts`: `mockGetAnalysisRun` resuelve también los runs solo-trace (QUEUED/PROCESSING). No entran en listados ni contadores.
- `app/src/control-plane/OperationalTraceSection.tsx` (nuevo): sección «Trace operativo». Estados: cargando (`role="status"`), 409 `EVIDENCE_NOT_FINISHED` (informativo, `role="status"`, polling vía `useAnalysisRunTrace`), `PendingContractError` («Contrato pendiente» con el mensaje del adapter), otros errores (`ErrorState` con reintento y correlationId), éxito.
- `app/src/ui/CopyButton.tsx` y `app/src/ui/clipboard.ts` (nuevos): botón «Copiar» reutilizable. Nombre accesible `Copiar <dato> <valor>` (incluye el valor para ser único entre targets). Confirmación en `role="status"` (`Copiado` / `No se pudo copiar`). Sin `navigator.clipboard` o si se rechaza, no lanza.
- `app/src/control-plane/AnalysisRunDetailPage.tsx`: monta `OperationalTraceSection` justo antes de `ContextSection`. Visible para todos los roles.
- `app/src/styles.css`: bloque «WI-CONSOLE-016» con tokens existentes. Texto secundario con `--muted`, no `--text-dim` (contraste insuficiente para texto pequeño). Foco de copia con contorno blanco de 3 px. Botón de copia de 40x40 mínimo. Reflow en móvil (<=640 px). `prefers-reduced-motion` ya cubierto por la regla global.
- `app/src/control-plane/OperationalTraceSection.test.tsx` (nuevo): 22 pruebas RTL.

### Decisiones
1. Enlaces 1-2 (repositorio/PR/HEAD y Run) sin badge propio: siempre existen cuando hay trace. Lo fija la prueba de orden de encabezados.
2. Enlace 7 = estado de ejecuciones del target; enlace 8 = cada ejecución (`execution_id`, intento, perfil, outcome tal cual, propuesta).
3. Enlace 9 (publicación) es de nivel Run y se muestra después de los targets.
4. `functionalRuleIds`: se enlaza a `projects/:projectId/functional-knowledge/:id` solo si la regla aparece en `useFunctionalKnowledge(projectId)`. Mientras carga o si falla la lista, se muestra texto plano (sin romper ni afirmar que no existe).
5. `companionPullRequestUrl`: solo `http:`/`https:`; se enlaza con `target="_blank" rel="noopener noreferrer"`. Otro esquema se muestra como texto con la nota «URL no válida, no se enlaza».
6. `freshness` null se muestra como «sin dato», nunca como fallo.
7. Sección con rótulo visible «Datos simulados…» en mock.
8. Reintentos: el hook no reintenta 404/409/contrato pendiente. Un 500 se reintenta dos veces antes de mostrar `ErrorState`.

### Mock por rol y estado (rutas reales del router: `/projects/:projectId/runs/:analysisRunId`)
- SUCCESS con dos targets, publicación no realizada (`NOT_APPLICABLE`): `/projects/prj_checkout_demo/runs/arun_checkout_pr45`. Reglas `fk_rounding_v2` (enlace) y `fk_demo_regla_inexistente` (texto).
- SUCCESS con publicación: mismo Run, tras «Publicar» en la página. Freshness `CURRENT`, o `STALE` si cambia el HEAD.
- BEHAVIORAL_MISMATCH (outcome `BEHAVIORAL_MISMATCH` sin veredicto): `/projects/prj_checkout_demo/runs/arun_checkout_pr46`.
- ACTION_REQUIRED (`NOT_APPLICABLE` en retrieval, contexto, generación y ejecuciones): `/projects/prj_checkout_demo/runs/arun_checkout_pr42`.
- NO_ADDITIONAL_TESTS_REQUIRED (retrieval y contexto, sin generación): `/projects/prj_checkout_demo/runs/arun_checkout_pr47`.
- Sin targets (`targetCount` 0): `/projects/prj_billing_demo/runs/arun_billing_pr22`.
- QUEUED (409, polling): `/projects/prj_checkout_demo/runs/arun_checkout_pr53`. Pasa a terminal con `setMockAnalysisRunForTests` en pruebas.
- PROCESSING (409, polling): `/projects/prj_billing_demo/runs/arun_billing_pr25`.
- 404 y contrato pendiente: no hay ruta mock; se cubren en pruebas con `vi.mock` sobre `getAnalysisRunTrace`.

### Pruebas
- Orden de encabezados y de los nueve enlaces para pr45 (dos targets).
- PRESENT y NOT_APPLICABLE sin `alert`; `outcome` tal cual, sin CUMPLE/NO CUMPLE.
- Sin targets con `targetCount`.
- FK existente (enlace) y ausente (texto).
- Copiar: nombres accesibles, éxito con anuncio, fallo, sin clipboard, Enter y Espacio.
- QUEUED y PROCESSING: 409 como `role="status"` sin `alert` ni reintentar; QUEUED sondea hasta terminar.
- 404 con reintento y correlationId; error 500 con correlationId; contrato pendiente sin crash.
- Publicación CURRENT y STALE; `sourceHeadSha` y `checkId` null como «sin dato».
- URL https enlazada con `rel` seguro; `javascript:` no enlazada.
- Detalle QUEUED/PROCESSING resuelve el Run («En cola» / «Procesando») con el 409 visible.
- Rótulo demo en la sección y stamp en cabecera.

### Limitaciones
- No hay prueba automatizada de «misma vista para Reader, Writer y Admin». El componente no recibe rol ni ramifica por él; no se pudo cambiar el rol del mock dentro de la prueba. Revisión manual pendiente.
- Contraste y foco se verificaron por tokens y no con medición en navegador. Pendiente de `ux-reviewer`.
- La URL insegura y las respuestas 404/500/contrato se prueban con `vi.mock` del adapter, no con datos del mock.

### Checks
- `cd app && npx eslint .`: 0 errores, 0 warnings.
- `node node_modules/vitest/vitest.mjs run --maxWorkers=2`: 61 archivos, 585 pruebas en verde (563 de Corte A más 22 nuevas).
- `npx tsc -b --noEmit`: 0 errores.
- `npm run build`: correcto (aviso de tamaño de chunk ya existente).

## Correcciones UX ciclo 1

Aplicadas las no bloqueantes N1, N2 y N3 de `harness/reports/wi-console-016-ux-review.md`. N4 queda fuera del WI.

- N1: `app/src/styles.css` añade el selector `.operational-trace .trace-demo-note` (especificidad 0,2,0) para que el ámbar `#e5b968` gane a `.panel p`. Contraste medido sobre `#0b0b0d` (superficie del panel): 10,7:1, cumple AA. No se tocaron `.trace-na-note` ni `.trace-no-data`.
- N2: `app/src/ui/CopyButton.tsx` vuelve a `idle` tras 2500 ms (`COPY_STATUS_RESET_MS`). El temporizador se limpia al desmontar y al recopiar. El mensaje se renderiza con `key` por intento para que cada copia se reanuncie aunque el texto sea igual.
- N3: se quita `aria-describedby` del botón y el `id` de la región. La región `role="status"` se mantiene siempre en el DOM: si se montara solo al anunciar, el lector de pantalla no garantiza el anuncio. Las regiones vacías siguen existiendo por ese motivo.
- Pruebas: nuevo `app/src/ui/CopyButton.test.tsx` (sin `aria-describedby`, reset a idle y reanuncio, reinicio del temporizador en recopia, sin temporizadores pendientes tras desmontar). En `OperationalTraceSection.test.tsx` se ajustan dos aserciones de `role="status"` a `closest('[role="status"]')` porque el mensaje ahora va en un hijo.
- Checks: `npx eslint .` sin errores; `vitest run` con todas las pruebas en verde; `npx tsc -b --noEmit` sin errores; `npm run build` correcto.
