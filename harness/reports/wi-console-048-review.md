# WI-CONSOLE-048 — revisión independiente (ciclo 1 de 2)

Modelo: reviewer · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Veredicto: CHANGES_REQUESTED** (solo por bookkeeping del Harness, no por código; el código y las pruebas son aprobables).

## Hallazgos

### H1 (bloqueante de proceso, no de código) — `validate-harness.mjs` falla
`node harness/validate-harness.mjs` sale con error:
- `technicalChecksPassed must pass before review`
- `interopSyncChecked must pass before review`

Origen: `harness/validate-harness.mjs:105` exige `G-PASSED` en `implementationCompleted`, `technicalChecksPassed` e `interopSyncChecked` cuando un WI está en `W-IN_REVIEW`, y el estado de WI-CONSOLE-048 en `harness/state.json` no los tiene. Los checks técnicos sí pasan (ver tabla) y el Contract Sync está dispuesto como NOT_RELEVANT en `work-items.json`. Acción del leader: marcar esos gates con evidencia y volver a ejecutar el validador. La revisión no puede darse por cerrada con un validador en rojo (criterio de aceptación 5).

### H2 (menor, documental) — comentario inexacto sobre deduplicación
`app/src/control-plane/useAnalysisRunRealtime.ts:~11-13` dice que "TanStack Query deduplica las peticiones en vuelo". `invalidateQueries` usa `cancelRefetch: true` por defecto: cancela la lectura en vuelo y lanza otra, no deduplica. El propio `wi-console-048-implementation.md` lo describe correctamente; el comentario del código contradice al informe. Sugerencia: reformular el comentario (p. ej. "un aviso durante un sondeo puede cancelar y relanzar la lectura; no hay lecturas concurrentes").

### H3 (menor, cobertura) — edge case de invalidación en vuelo no probado
La prueba de convivencia (`analysisRunPolling.test.tsx`, "convive con el tiempo real") dispara el aviso con el GET ya resuelto, por lo que no ejercita el caso invalidar-con-lectura-en-vuelo. Tampoco comprueba que no queden timers (`vi.getTimerCount()`), solo conteo de llamadas tras desmontar; aun así es suficiente para detectar fugas de polling (la mutación lo confirmaría). No bloquea.

## Verificación por punto

1. **Estados, parada y error — OK.** `queries.ts` `isInProgressAnalysisRunStatus` solo `QUEUED`/`PROCESSING`; `analysisRunPollIntervalMs` devuelve `false` con error, sin datos o estado fuera de curso; `refetchInterval` es función de `query.state`, así que `ACTION_REQUIRED` -> `PROCESSING` reanuda solo. No se inventan estados.
2. **pollAfterMs — OK.** `clampPollMs` (250 ms–30 s, default 900 ms = `DEFAULT_POLL_MS`, el de la traza). Correcto que el GET del Run no lo trae (`AnalysisRunDetailResponse` no lo declara; solo el 202, §5); es parámetro opcional documentado en el JSDoc y en el informe. En `MODE==='test'` se usa `TEST_POLL_MS` (10 ms), el modo acelerado centralizado.
3. **Convivencia con realtime — OK con matiz.** El realtime sigue solo invalidando; no se tocó su lógica (solo comentario). Al desmontar o cambiar el Run, react-query destruye el observer (key con `analysisRunId`); las pruebas lo cubren con conteos y fake timers y no son vacuas (ver mutaciones). El edge case señalado por el implementer (aviso durante sondeo = cancelar y relanzar, una petición extra no concurrente, comportamiento preexistente del realtime) es aceptable: sin corrupción de estado, sin ráfagas, sin cambio de contrato. No exige `DECISION_REQUIRED`. Ver H2/H3.
4. **Opt-in — OK.** Default `pollWhileInProgress=false` -> `refetchInterval: false`. Solo `AnalysisRunDetailPage.tsx:268` lo activa; ExperimentPage, RunComparisonPage y RetrievalComparisonPage no cambian de comportamiento (Experiment solo sustituye el chequeo literal por `isInProgressAnalysisRunStatus`, equivalente; en `AnalysisRunDetailPage` `!isInProgress(...)` equivale a `!== 'QUEUED' && !== 'PROCESSING'`). Sin cambio de markup ni copy, DTO, rutas ni socket (diff de 5 archivos de producto/prueba confirmado).
5. **Pruebas y mutación — OK.** 15 pruebas, `vi.useFakeTimers` (sin reloj real), `MODE` estubbeado a `development` para probar el intervalo real. Mutaciones propias (queries.ts, restaurado con `git checkout`; `git status` limpio tras cada una):
   - quitar chequeo de estado en curso: 3 fallos
   - quitar `clampPollMs`: 2 fallos
   - quitar `hasError`: 2 fallos
   - `refetchInterval` siempre activo (ignora opt-in): 2 fallos
   - redefinir "en curso" como `!== 'SUCCESS'`: 2 fallos
6. **Checks (resultado real):**

| Comando | Resultado |
|---|---|
| `pnpm lint` | OK |
| `pnpm exec tsc -b --noEmit` | OK |
| `pnpm test --maxWorkers=4` | OK: 94 archivos, 958 pruebas |
| `pnpm build` | OK |
| `pnpm format:check` | OK |
| `pnpm contracts:check` | OK |
| `node scripts/sdd-check.mjs` | OK |
| `node harness/validate-work-items.mjs` | OK (CONSOLE, 48 WI) |
| `node harness/validate-harness.mjs` | **FALLA** (H1) |

7. **Omisión de ux-reviewer — razonable.** Sin cambio de markup ni copy; el estado visible existente se refresca solo. El gate `uxReviewed` puede quedar `G-NOT_APPLICABLE` con esta justificación.
8. **Alcance — OK.** No se tocó autoridad MAINTAINER/ADMIN, DTOs, rutas, socket, `reasoningEffortMessage` ni pendientes de 044/047. Sin push/PR/merge.

## Para cerrar
Corregir H1 (gates en `harness/state.json`; leader) y, opcionalmente, H2 (comentario) y H3. Con H1 resuelto y `validate-harness.mjs` en verde, el ciclo 2 es solo verificación y se espera APPROVED. El árbol de trabajo queda limpio salvo este informe.

# Ciclo 2 (final)

Modelo: reviewer · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Veredicto final: APPROVED**

Diff revisado: `git diff 93e91aa HEAD` (commit f4bf898). Solo cambia `app/src/control-plane/useAnalysisRunRealtime.ts` (comentario), `harness/state.json` (gates) y este informe.

- **H1 resuelto:** `technicalChecksPassed` e `interopSyncChecked` pasan a `G-PASSED` con evidencia (`wi-console-048-implementation.md` y `wi-console-048-contract-sync-review.md`); `independentReviewPassed` sigue `G-NOT_RUN` hasta cerrar esta revisión. `node harness/validate-harness.mjs`: passed.
- **H2 resuelto:** el comentario ahora dice que una invalidación en vuelo cancela y relanza (a lo sumo una petición extra, nunca concurrente). Exacto. Cambio solo de comentario; sin efecto en ejecución.
- **H3 no es bloqueante:** el caso invalidar-con-lectura-en-vuelo es comportamiento preexistente del realtime, no introducido por este WI, sin corrupción de estado ni ráfagas; el riesgo de fuga queda cubierto por las pruebas de desmontaje y cambio de Run (que mutan en rojo). Queda como limitación menor documentada.

Re-ejecución: `node scripts/sdd-check.mjs` OK; `node harness/validate-work-items.mjs` OK (48 WI); `node harness/validate-harness.mjs` OK; eslint y prettier del archivo tocado OK. Los checks de app/ del ciclo 1 (lint, tsc, 958 pruebas, build, format, contracts) no se ven afectados por un cambio solo de comentario.

**Resumen:** ciclo 1 aprobó código y pruebas (5 mutaciones en rojo, opt-in correcto, alcance respetado) y pidió corregir gates (H1) y un comentario inexacto (H2); ciclo 2 verifica ambas correcciones y acepta H3. Sin hallazgos abiertos.
