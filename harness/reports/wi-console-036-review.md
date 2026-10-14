# WI-CONSOLE-036 — revisión independiente (reviewer)

Modelo: reviewer · claude-sonnet-5-5 · awayMode activo

**Veredicto: APPROVED** (hallazgos bajos no bloqueantes). No sustituye la aprobación humana de alcance ni autoriza push/PR.

## Evidencia ejecutada (desde `app/`)
- `npx vitest run src/experiments`: 8 ficheros, 87 pruebas verdes.
- `node node_modules/typescript/bin/tsc -b --noEmit`: sin errores.
- `npm run lint`: sin errores.
- `node harness/validate-harness.mjs`: «Harness V3 validation passed».
- Búsqueda de secretos en el diff: sin coincidencias reales.

## Criterios
- B1: `experimentId` se lee de `?experimentId=`; al crear se escribe preservando `analysisRunId` (`replace`); reabre al montar; «Ver contexto →» propaga `analysisRunId` y el breadcrumb del explorador vuelve con `experimentId`+`analysisRunId`. OK.
- B3: una sola región `role="status"` (`#experiment-run-note`) con motivo concreto; con `isError` bloque `alert` con correlation id, «Reintentar» e «Iniciar otra comparación»; se oculta «Preparando…» y se corta el sondeo en error. OK.
- B4: `targetOrdering.ts` reordena sin filtrar, preselecciona el primer no-constructor, respeta `targetId` explícito, nota con `aria-describedby`; `UNRESOLVABLE_TARGET` con mensaje que no promete reintento; opción DEMO rotulada «DATOS SIMULADOS» y no preseleccionada. Heurística declarada, raíz en Core. OK.
- `retry: false` solo en la query `['experiments', id]` de `ExperimentPage.tsx`; `main.tsx` sin diff; sin `refetchIntervalInBackground` en `app/src`; otros sondeos intactos. OK.
- Prueba ROJO→VERDE: `ExperimentPage.retry.test.tsx` usa el cliente de `main.tsx` (retry:1, refetchOnWindowFocus:false), `focusManager.setFocused(false)`, MODE=development, restaura en `finally`; el reporte documenta ROJO (sin alert tras 5 s) y VERDE. La causa queda demostrada en jsdom y confirmada por ux-reviewer en navegador (alert a ~2,8 s con documento oculto). OK.
- Contrato/Core/rutas: sin cambios de DTO, rutas, endpoints ni contratos; solo copy en `errors.ts`; `contractImpact:false`; Contract Sync clasificado NOT_RELEVANT con reporte. OK.
- Autorización del ciclo 3: cita literal del usuario en `third-cycle-authorization.md`; ciclo único, acotado, `maxReviewCycles` sigue en 2, `extraReviewCycleAuthorization` registrado. OK.
- Marcas de tiempo/checkpoints: en `state.json`/`work-items.json` solo constan campos de gate/ciclos y `decisionGate.checkedAt` con formato ISO consistente; no se observa edición manual evidente. `independentReviewPassed` sigue `G-NOT_RUN` (lo fija el leader tras este veredicto).

## Hallazgos (bajos, no bloqueantes)
1. Tras «Iniciar otra comparación» el foco cae en `BODY` (ya anotado por ux-reviewer); mejora sugerida, no requerida por el alcance.
2. Los botones del bloque de error usan `.button` con aspecto claro fuera de Black Glass (legible 18,26:1); preexistente.
3. En el ux-review se observó que al quitar `experimentId` la URL quedó sin `workspaceId`; no se verificó si es preexistente (el breadcrumb del explorador tampoco lo conserva). Revisar si importa.
4. Sangrado inconsistente en el ternario anidado de `runNote` (cosmético).
5. Pendiente de cierre (no de este veredicto): CHANGELOG/consolidación en spec canónica y `build`, a cargo del leader antes de `W-DONE`.
