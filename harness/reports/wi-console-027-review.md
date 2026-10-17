# WI-CONSOLE-027 — revisión técnica independiente

Modelo: reviewer · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Fecha:** 2026-10-12 · **Modo:** awayMode activo, árbol sin commit · **Veredicto:** APPROVED

No sustituye decisiones `DEC` ni aprobaciones de alcance/contrato; no autoriza push.

## Verificación por criterio

1. **B1 (FAILED visible).** `ExperimentPage.tsx` no cambió (ya cumplía desde WI-CONSOLE-026): con `status === 'FAILED'` renderiza `role="alert"` con `experimentFailureTitle()` + `experimentFailureMessage(failureCode)` + detalle + rótulo DEMO; el bloque «Preparando experimento»/`role="status"`/`.live-indicator`/barra solo se pinta si `status !== 'FAILED'`; `refetchInterval` es `false` en FAILED; no hay botón de reanudar ni resultado/ganador. La prueba «FAILED visible» afirma alerta, mensaje, detalle, DEMO, ausencia de «Preparando», `role=status`, «reanudar», «Huella de retrieval» y, añadido, `.live-indicator` y `.experiment-progress`. Dos pruebas `test.each` cubren EXPERIMENT_FAILED y código desconocido. OK.
2. **B2.** `RETRIEVAL_COMPARISON_WORKER_LOST` → «La comparación se interrumpió; vuelve a crearla.» (paralelo a «El experimento se interrumpió; vuelve a crearlo.»). `api.test.ts` conserva `/interrumpió/` y añade `/vuelve a crearla/`. Sin literal antiguo en `app`/`spec`. OK.
3. **B3.** `grep useEvidence|evidenceKeys` en `app/src`: sin resultados tras el cambio (antes solo `queries.ts` y su prueba). `queries.ts` conserva `shouldRetryEvidence`, `evidenceRetryDelayMs`, `EVIDENCE_NOT_FINISHED_MAX_RETRIES`, usados por `EvidenceDownload`. La cobertura 409 (reintento acotado, Reintentar, descarga tras 409) y 404/red sin reintento sigue en `EvidenceDownload.test.tsx` (líneas ~113-170). Se pierde únicamente la prueba `enabled=false` del hook eliminado (sin objeto). OK.
4. **D (estabilidad).** Cambios solo en configuración y pruebas: `testTimeout: 15000`, `configure({ asyncUtilTimeout: 5000 })`, timeouts explícitos 2000/3000 → 5000, `waitFor` para foco (HU56) y esperas de estado asentado en ContextExplorer. Todas las aserciones se conservan (verificado en el diff: solo se añaden esperas o se alarga el límite); no hay `skip`, `retry` ni `only`. Una condición que nunca se cumple sigue fallando (timeout acotado). Diagnóstico coherente con los logs: `before-nolimit-1..4` fallan con «Unable to find» (findBy a 1000 ms), un «Test timed out in 5000ms» (HU39/40) y toggles perdidos; `before-w2-*` 3/3 verdes (sensibilidad a carga); `after-nolimit-3/4` aún mostraron 1 fallo (ProjectsPage timing; ContextExplorer «table»), tras lo cual se endureció y `r2-nolimit-1..6` y `r2-w2-1..2` quedaron 723/723. Reejecución propia: lint exit 0, `tsc -b --noEmit` exit 0, vitest 67 archivos / 723 pruebas verdes (18 s); `node harness/validate-harness.mjs` pasa.
5. **Alcance.** Sin cambios en contratos, DTO, API, adapters ni `mockBackend`; el único cambio de producto es el texto de B2 y la retirada del hook sin uso. `ExperimentPage.tsx` y `ContextExplorerPage.tsx` no se tocaron. `tasks.md` solo añade ST-CONSOLE-029 (WI enlazado). OK.
6. **Carrera `setSearchParams`.** Queda como hallazgo aparte, correctamente no corregida.

## Findings (no bloqueantes)

- **F1 (media, seguimiento).** `ContextExplorerPage.updateParams` (setSearchParams funcional) parece perder `view=list` cuando un efecto fija `node`/`trace` en el mismo ciclo; los logs `after-nolimit-4` y la ronda 2 previa muestran ese fallo sin ser de timeout puro. Las pruebas ahora esperan `waitForDefaultSelection()` antes de clicar, lo que estabiliza la suite pero enmascara un posible defecto real de producto ante un clic rápido. Recomendado: abrir WI de producto con reproducción (prueba que haga clic sin esperar) y aprobación del usuario; no es parte de este alcance.
- **F2 (baja).** `testTimeout: 15000` y `asyncUtilTimeout: 5000` globales alargan el tiempo de fallo real de pruebas rotas; aceptable, pero conviene reducir si F1 se corrige. La muestra de estabilidad (6 + 2 corridas finales, más 1 propia) es modesta; el diagnóstico atribuye lo residual a timing/carrera, no a ocultamiento.
- **F3 (informativa).** B1 ya estaba implementado (WI-CONSOLE-026); el WI solo añadió aserciones. `harness/reports/console-deferred-corrections.md` debe registrar B1 como cerrado por verificación.
- **F4 (informativa).** B2 no es alcanzable en el mock; solo está cubierto por `api.test.ts` (ya declarado por ux-reviewer).

## Blockers
Ninguno.

## Evidence
- `git diff` completo de `app/` y `spec/` (13 archivos de `app/src` + config; 44 inserciones / 92 eliminaciones).
- Lint, `tsc -b --noEmit`, vitest completo (723/723) y validador del Harness ejecutados por el reviewer.
- Logs `before-*`, `after-*`, `r2-*` en el scratchpad de la sesión revisados.
- Reportes de alcance, SDD, implementación y UX leídos; `harness/state.json` con `activeWorkItem` WI-CONSOLE-027 en `W-IN_REVIEW`.

## recommendedNextStep
El leader puede registrar este veredicto, cerrar WI-CONSOLE-027 (marcar ST-CONSOLE-029, CHANGELOG, actualizar `console-deferred-corrections.md`) y presentar diff + evidencia al usuario; decidir aparte si se abre un WI de producto para F1. Sin push ni PR sin orden explícita.
