Modelo: sdd-analyst · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo low

# WI-CONSOLE-034 — verificación SDD

**Veredicto: SUFICIENTE** (con una acción de registro pendiente para el leader, ver H1).

## 1. Suficiencia y decisiones
- Alcance aprobado por el usuario (`wi-console-034-scope-approval.md`); WI `W-SELECTED`, `contractImpact: false`, ST-CONSOLE-038 enlazado.
- Ninguna `DEC` con `Blocks` alcanza este WI: no hay `PENDING`/`PROPOSED` aplicable a un espejo documental. DEC-VAL-002 y DEC-INF-002 ya figuran como no bloqueantes en WI-033.
- H1: WI-CONSOLE-034 no tiene `decisionGate` en `harness/work-items.json` (sí lo tienen 033 y anteriores). Registrar `checked: true`, `blockingDecisionIds: []` antes de implementar.

## 2. Eventos
Ninguno de CS-CORE-20261013-001/-002/-003 ni 20261014-001 exige comportamiento, DTO, ruta ni UI: `breaking: false`, todos `targets: [console]`, `scopePaths` solo `interoperability-contract.md`; "opcionalmente mostrar" es opcional y queda en WI-CONSOLE-038 (sin aprobar). No hay DECISION_REQUIRED. Sourcerevisions: 15f03e53, dcfee56f, 334708c2, 7f24c169 (ascendencia verificada: 864aa837 < 15f03e53 < dcfee56f < 334708c2 < 7f24c169).

## 3. Espejo (git show 7f24c16)
- SYSTEM: Core 7f24c16 = 864aa837 (sin diff) y = copia Console: SHA-256 d180d4b1…f507. Sin cambio.
- GH-INTEROP: igual, SHA-256 584839c9…1b34. Sin cambio.
- INTEROP: copia Console = 864aa837 (50f8bd53…7194, INTEROP-2.12); Core 7f24c16 = 411bd549…0db789 (INTEROP-2.16). Diff: 30 inserciones/3 borrados, solo aditivo (cabecera 2.16/fecha 2026-10-14, nota de versión, `technicallyValidRate`, `assertionFailureCount`, `RagDependency*`/`dependencyContext?`, `final?`, `StageDuration.startedAt?/completedAt?` y párrafos explicativos). Sin cambio de rutas, códigos ni campos existentes.
- Nota: la cabecera de INTEROP-2.16 sigue diciendo "Compatible con SYSTEM-2.12".

## 4. Consumidores (sin editar código)
- `StrategyMetricsResponse`: `app/src/experiments/liveMapping.ts` (interfaz local + `toStrategyMetrics`, que copia campo a campo): tolera campos extra y no los usa; `app/src/experiments/types.ts` (`StrategyMetrics`) sin los campos nuevos; tests/mocks (`liveMapping.test.ts`, `api.live.test.ts`, `ExperimentComparison*.test.tsx`, `ExperimentPage.test.tsx`, `noAutomaticVerdict.test.tsx`, `api/mockBackend.ts`) no los referencian. Tolerado.
- `RagContextTraceDetailResponse`/`dependencies`: `app/src/context-explorer/types.ts` (`RagContextTraceDetail`), `api.ts` (todas las rutas live responden `PendingContractError`), `api/mockBackend.ts`. Sin mapeo live y sin validación estricta: no hay regresión; `dependencyContext`/`final` se ignoran.
- `StageDuration`: sin ocurrencias en `app/src` (Console no consume el resultado Sandbox). Tolerado.
- `startedAt/completedAt` existentes en `retrieval-comparison/types.ts` y `analysis/` son de otros DTO, sin colisión.

## 5. Referencias de versión a pasar a INTEROP-2.16 (SYSTEM sigue 2.12)
1. `spec/README.md:10` — `INTEROP-2.12` (línea 9 SYSTEM-2.12 se mantiene).
2. `spec/constitution/architecture.md:3` — `INTEROP-2.12`.
3. `spec/features/013-pr-driven-control-plane/plan.md:5`.
4. `spec/features/013-pr-driven-control-plane/spec.md:5` y `:41` (revisar si `:41` describe lo vigente).
5. `spec/features/013-pr-driven-control-plane/tasks.md:27` (ST-CONSOLE-038, se cierra con el WI).
6. `spec/contracts/interoperability-contract.md`: se sobrescribe con el espejo.
- Intencionalmente históricas (no tocar): `INTEROP-2.7`/`2.6` en architecture.md:15, spec.md:21/29, tech-stack.md:20, roadmap.md, spec/README.md:15 (fixtures INTEROP-2.6), styles.css. Fuera de alcance: reports, CHANGELOG, state.json.
- No se encontraron referencias a 2.12 en `app/src`.

## 6. Riesgos
- Registrar los 4 eventos solo tras `git show` + SHA-256 de la copia final (esperado 411bd549…0db789) y gates (lint, `tsc -b --noEmit`, test, build, validate-harness).
- CS-CORE-20261012-012 es sandbox: no acusar; 011 ya resuelto.
