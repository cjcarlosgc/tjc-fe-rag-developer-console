# Console — correcciones diferidas (consolidado)

Fecha: 2026-10-12. Recoge las observaciones no bloqueantes y pendientes que los cierres de WI dejaron para después. No es un WI ni autoriza implementación: cada grupo necesita su WI y su aprobación de alcance. Fuente de cada punto: reporte de cierre del WI indicado.

## A. Interfaz y accesibilidad (candidatos a WI-CONSOLE-005 / WI-CONSOLE-006)

> Actualización 2026-10-12 (WI-CONSOLE-028): CORREGIDO — anillo de foco (10.6:1), «VS», `breadcrumbs-sep`, `repo-sep`, desbordes de `.analysis-run-summary`/`symbol-list`/`test-proposal-item`/`status-badge`/tabla de experimentos/cabecera a 768-1024 px, sellos DEMO/PROPUESTA, foco en `onError`/ABSTAINED, `role="status"`, jerarquía H3→H2 y «—» en Intento/Evaluable. PENDIENTE — borde del botón de evidencia (1.15:1) y P@10/R@10 (`#5b4d86`, ≈2.7:1) por decisión WCAG 1.4.11, hex fuera de tokens para WI-CONSOLE-005; `summary` con outline UA 1px (3.29:1); dos regiones `status` durante la carga de Functional Knowledge; lector de pantalla real sin verificar.

- Anillo de foco global ≈2.7:1 (<3:1). Transversal, previo a SMART V3. (013, 014, 017)
- Separadores de bajo contraste: breadcrumbs 1.45:1, `repo-sep` 3.89:1. (014)
- Desbordes horizontales: `.analysis-run-summary` a 375 px y 13 px a 1024 px por un botón de cabecera; `symbol-list`, `test-proposal-item`, `status-badge` a 375 px; la tabla de experimentos desborda con datos. (014, 016, 026)
- El sello DEMO y el sello PROPUESTA de `ruleUsage` se estiran a 375 px. (014, 015)
- Bordes con contraste bajo: botón de evidencia 1.15:1; P@10/R@10 ≈2.7:1 (redundante con negrita); «VS» de la cabecera de estrategias 4.02:1. (017, 018, 014)
- El foco no se restaura en `onError` ni cuando `ABSTAINED` llega por `resolveConflict`. (013)
- El wrapper `role="status"` del estado vacío pierde el rol mientras carga. (015)
- Jerarquía H3 antes de H2 en el detalle del Run (previo). (015)
- Celdas Intento/Evaluable sin dato quedan vacías en corrida mixta; podrían llevar «—». (026)
- Sin verificación con lector de pantalla real. (014, 016, 017)

## B. Comportamiento de la UI

> Actualización 2026-10-12: B (FAILED de experimentos, texto OE2 worker lost, `useEvidence`) y D (suite intermitente) cerrados por WI-CONSOLE-027; queda un seguimiento de producto sobre `setSearchParams` en ContextExplorer.

- Un experimento `FAILED` sigue mostrando «Preparando experimento» sin mensaje de fallo (previo a SMART V3). (017)
- `RETRIEVAL_COMPARISON_WORKER_LOST` no dice «vuelve a crearlo» (fuera del alcance de WI-026). (026)
- «sin procedencia registrada» se repite tres veces en reglas históricas. (015)
- El hook `useEvidence` quedó sin uso en la UI (la evidencia no usa caché). (017)

## C. Mock y datos de demostración

> Actualización 2026-10-12 (WI-CONSOLE-030): CORREGIDO — proyecto demo PHP propio (`shop-php-demo`; semilla `rcmp_demo_seed_php` en `arun_php_pr7`), Runs QUEUED/PROCESSING en listados/contadores/métricas, conflicto 409 por `targetRef` + `scenarioKey` y caso demo `UNSUPPORTED_PROJECT` en OE2 (`legacy-php-admin`). PENDIENTE — `checkId` null y `reasoningEffort` ilustrativo (fuera de alcance); `attempt`/`technicallyEvaluable` omitidos en corridas antiguas (decisión del usuario); `legacy-php-admin` sin repositorio vinculado; UX F2 y F5-F7 de `wi-console-030-ux-review.md`.

- Proyecto DEMO PHP propio para `rcmp_demo_seed_php` (hoy cuelga de un Run TypeScript). Aprobado como backlog. (021, 026)
- Runs QUEUED/PROCESSING del mock viven en un mapa solo-trace, fuera de listados, contadores y métricas. (016)
- `checkId` siempre `null` y `reasoningEffort` «high» ilustrativo en el mock. (016, 018)
- El conflicto 409 del mock compara solo `targetRef`; `DEC-FK-001` pide `targetRef` + `scenarioKey`. (015)
- El mock no dispara `UNSUPPORTED_PROJECT` en OE2; solo lo cubre `RetrievalComparisonPage.test.tsx`. (026)
- Mock omite `attempt`/`technicallyEvaluable` en corridas antiguas aunque INTEROP §6.16 los declara no nulos (1/true): lectura confirmada por el usuario; alternativa disponible. (026)

## D. Pruebas e infraestructura

- La suite completa de vitest es intermitente bajo carga de la máquina (3 a 7 fallos variables que pasan aislados): limitar concurrencia o subir timeouts. Mientras tanto, `--maxWorkers=2`. (019, 013)
- En algunos shells `npx vitest` da exit 127: usar `node node_modules/vitest/vitest.mjs`. (017)
- Los Leaders dejan bucles `until grep …` en segundo plano que persisten horas: usar la notificación de término. (sesión)

## E. Solicitudes y preguntas hacia Core

- Exponer `correlationId` en el DTO de estado de la comparación de retrieval (INTEROP-2.7 §6.15); redactada en `wi-console-014-core-request-correlationid.md`, aún no enviada. (014)
- Código de error de `/results` para una comparación `FAILED` (el mock usa 409 `RETRIEVAL_COMPARISON_NOT_FINISHED`). (014)
- Código del 404 del trace (§6.16 no lo nombra; el mock usa `ANALYSIS_RUN_NOT_FOUND`). (016)
- Evidencia: `projectVersionId` no expuesto en el detalle del Run; `analysisRun` null en evidencia de EXPERIMENT y RETRIEVAL_COMPARISON; semilla del mock fija; orden y espacios de bytes del JSON de Core. (017)
- El texto de INTEROP §6.5.1 aún dice «puede reanudarse» sin ruta de reanudación. (026)
- Alinear `sourceRevision` de CS-CORE-20261009-016/-017/-018 (Cross ya lo pidió; los eventos -002 a -004 de 2026-10-12 lo corrigen).

## F. Harness y procesos

- F1 de WI-CONSOLE-027: `ContextExplorerPage.updateParams` puede perder `view=list` bajo carga; hace intermitente `ContextExplorerPage.test.tsx` («alterna entre vista de grafo y lista») sin límite de workers. Pendiente de decisión del usuario (WI de producto aparte); los timeouts globales deberían reducirse si se corrige.

- RESUELTO (WI-CONSOLE-029, 2026-10-12): CS-CORE-20261012-002/-003/-004 acusados y resueltos en Console. PENDIENTE de sus receptores (no de Console): CS-CORE-20261009-012, 20261010-001/-002, 20261011-003 (github-integration) y 20261011-002 (sandbox); la parte Sandbox de -002 es de Sandbox.
- RESUELTO (WI-CONSOLE-031, 2026-10-12): CS-CORE-20261012-005 (INTEROP-2.9/SYSTEM, 404 obsoleto) acusado y resuelto en Console; CS-CORE-20261012-006 es de github-integration y sigue C-PENDING. Pendiente menor de UX: `focus-mode-obsolete` sin CSS ni `:focus-visible` propios.
- RESUELTO (WI-CONSOLE-004, 2026-10-12): OC01–OC15 formalizados (ninguno DECISION_REQUIRED; todos siguen O-CATALOGUED). Deuda nombrada: citas contractuales pendientes (SKIPPED_HAS_TEST, test aportado como existente, snapshot suficiente del bootstrap, batches/SUCCESS por batches, selección de regla en OC14, símbolo relacionado que no pasa a DIRECTLY_CHANGED); umbral y progreso real de bootstrap (Core + Integration); `AnalysisRunDetailPage.tsx` dice «se indexó el repositorio completo» para BOOTSTRAP (requiere WI de código).
- `awayMode` sigue `enabled: true` en `state.json` aunque el usuario revisa en el chat; lo desactiva el usuario.
- En WI-CONSOLE-018 el `before-done` de Contract Sync se copió a mano con un `checkedAt` no real; el contenido coincidía con lo que daría una ejecución real. Desde WI-017 se corre de verdad.
- El handoff a Cross sobre el formato de títulos de subagentes (hook `check-subagent-title.mjs`, commit 86fb4f7) sigue sin enviarse.
- Quedan sin publicar los commits locales de `feature/jean`: el push exige la aprobación del reviewer sobre el rango completo.
