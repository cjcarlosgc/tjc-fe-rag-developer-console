# WI-CONSOLE-033 — implementación del corte (mock y pruebas)

Modelo: implementer · configurado claude-haiku-5-5 · atendido unknown · esfuerzo low

## Alcance ejecutado

Corte aprobado en `harness/reports/wi-console-033-scope-approval.md`: solo mock y pruebas. Sin cambios de DTO, types, api, rutas, live ni de componentes de producto.

## Archivos tocados

- `app/src/api/mockBackend.ts`
  - Run existente `arun_checkout_pr48` (INFRASTRUCTURE_FAILURE) recibe `__proposals` con 2 propuestas en `AVAILABLE`, rotuladas como datos simulados. No se crearon Runs nuevos; conteos de listados y métricas no cambian.
  - `resultSummary` del Run se mantiene igual (texto existente), por lo que el assert previo no se toca.
  - `setMockAnalysisRunForTests` acepta además `resultSummary` (helper solo de pruebas).
- `app/src/control-plane/AnalysisRunDetailPage.test.tsx`
  - Nuevo: un Run INFRASTRUCTURE_FAILURE con propuestas AVAILABLE no muestra «Propuestas de prueba», no muestra botón «Publicar» ni la etiqueta AVAILABLE, y el panel de fallo (role alert) muestra el resultSummary.
  - Nuevo: el resultSummary se renderiza literal como texto libre, con «300 o más archivos» y sin «300» (texto de permiso/límite de tasa); en el caso sin «300» se verifica que el alert no contiene «300».

## Conteos antes/después

- Baseline: 70 archivos, 770 tests, todos en verde.
- Después: 70 archivos, 772 tests (+2), todos en verde.

## Gates (desde app/)

- `npm run lint` (eslint .): sin errores.
- `node node_modules/typescript/bin/tsc -b --noEmit`: sin errores.
- `node node_modules/vitest/vitest.mjs run --maxWorkers=2`: 70/70 archivos, 772/772 tests.
- `tsc -b && vite build`: build correcto; solo aviso de tamaño de chunk (> 500 kB), preexistente y no bloqueante.

## Hallazgos

- Ninguno que requiera cambio de producto. `AnalysisRunDetailPage.tsx` no se modificó. La sección de propuestas no se monta para INFRASTRUCTURE_FAILURE, así que la regresión (a) se cumple con el código actual.
- Limitación: la prueba (a) protege el comportamiento actual de la UI. No se demostró que falle ante una regresión de producto (no se inyectó un fallo a propósito, por el alcance del corte).

## Qué NO cambió

- `harness/state.json`, `harness/work-items.json`, `harness/contract-sync/**`, `spec/**`, `CHANGELOG.md`: no tocados.
- Sin commit, push, PR ni merge.
- Sin Core de Render ni servidores de desarrollo.
- `DEC-INF-002` y `DEC-VAL-002` no aparecen como regla de UI.

## Conclusión

Corte de mock y pruebas completo según el alcance aprobado. Pendiente la revisión independiente: el implementer no se autoaprueba; la revisión la hace el Human Reviewer, o el agente `reviewer` solo si el usuario lo delega o si `awayMode` está activo en `harness/state.json` (no verificado por este implementer).

## Ciclo 1 de corrección (hallazgo 1 del reviewer: prueba (a) vacua)

- Cambio: la prueba «un Run INFRASTRUCTURE_FAILURE con propuestas AVAILABLE no es publicable en Console» espera antes de afirmar ausencias: `waitFor` a que desaparezca «Cargando propuestas…» y `waitFor` a que no haya botón «Publicar». Después afirma ausencia de «Propuestas de prueba», del botón y de AVAILABLE. Sin cambios de producto.
- Mutación (copia en el scratchpad, no en el repo): en `AnalysisRunDetailPage.tsx` se montó `PublishSection` también para `INFRASTRUCTURE_FAILURE`. Resultado: la prueba FALLA («expected document not to contain element, found <button»), que es lo esperado.
- Código real (repo): `AnalysisRunDetailPage.test.tsx` 31/31 pasa; lint sin errores; `tsc -b --noEmit` sin errores; vitest 70/70 archivos, 772/772 tests.
- Conclusión: el corte queda completo. La prueba (a) ahora detecta la regresión mutada y pasa con el código real.
