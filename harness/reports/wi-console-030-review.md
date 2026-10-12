Modelo: reviewer · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

# WI-CONSOLE-030 — revisión independiente (ciclo 1 de 2)

**Fecha:** 2026-10-12. **Veredicto: APPROVED** (sin blockers; 4 observaciones no bloqueantes). Revisor independiente del implementer (haiku) y del leader; Modo fuera de casa activo; no sustituye decisiones DEC ni aprobación humana de alcance/contrato. Sin commit, sin cambios en el árbol (las mutaciones se restauraron; md5 de `mockBackend.ts` idéntico antes/después).

## Alcance y límites

- Solo `app/src/api/mockBackend.ts` y 7 archivos de prueba (`git status`): ningún adapter live, DTO, tipo, contrato, `spec/` de contrato ni UI de producto. `UNSUPPORTED_PROJECT_MESSAGE` intacto (se importa, no se redefine).
- `harness/`: solo registro de WI-CONSOLE-030 en `state.json`/`work-items.json`, reportes propios y `spec/.../014-.../tasks.md` (ST-CONSOLE-032). WI-CONSOLE-004 no aparece tocado (única mención: texto del criterio «permanece W-READY»).
- `node harness/validate-harness.mjs` OK. `decisionGate` registrado y coherente (DEC-FK-001/004 aprobadas, DEC-VAL-001 no alcanza).

## Regla C3 frente al contrato

`findConflictingKnowledge(projectId, target, scenarioKey)` exige proyecto + `ACTIVE` + `targetRef` + `scenarioKey` iguales (+ scope cuando es derivable), con `null/undefined` sin coincidencia; coincide con `interoperability-contract.md` §6.11 / DEC-FK-001 (distinto `scenarioKey` coexiste; `LEGACY` solo con `LEGACY`). La compuerta `conflictQuestionId` se conserva con motivo documentado. La rama de coexistencia persiste la regla ACTIVE solo para esa pregunta, sin alterar los conteos 5 ACTIVE / 2 SUPERSEDED de checkout (suite verde). `scope` fallback `'SYMBOL'` es un valor válido de `FunctionalScope`.

## Mutación real (restaurada)

| Mutación | Resultado |
|---|---|
| Quitar la igualdad de `scenarioKey` del matcher | Fallan 2 pruebas nuevas (coexistencia; LEGACY/null). El 409 de la misma clave y HU51 existentes siguen verdes, como debe ser |
| Quitar el chequeo `detectedFramework === null` en OE2 | Fallan la prueba de API y la de página C4 (422 real del mock, sin overrides) |
| Quitar el `return` de historial para QUEUED (F1) | Falla la prueba F1 |

Las pruebas no son tautológicas ni están debilitadas: ninguna aserción se eliminó ni se relajó; los conteos ajustados llevan comentario con la razón y los números coinciden con la aritmética (17 + 2 PHP + 2 en curso = 21; PR activos 16 → 20; checkout 7 → 8; «desde 2026-09-13» 7 → 9 porque los PHP son de septiembre antes del 13; acme 13 → 15; semilla PHP fuera de `arun_checkout_pr49`: 6 → 5 / 3 → 2 / 7 → 6). Se añadieron aserciones positivas de visibilidad en listado (QUEUED/PROCESSING).

## C2: movimiento de pr53/pr25

`traceOnlyRuns`, `traceOnlyRunSeeds`, `findVisibleTraceOnlyRun`, las 4 ramas `??` y la limpieza en `resetMockBackend` se retiraron; `grep traceOnly` en `app/src` solo deja los dos comentarios históricos y el título de una prueba existente. Trace/evidence/`setMockAnalysisRunForTests` operan sobre `analysisRuns`; sus pruebas (`operationalTrace`, `OperationalTraceSection`, `evidence/api`) pasan. Sin código muerto.

## Honestidad del mock

Projects/Runs nuevos quedan bajo el rótulo global DEMO · DATOS SIMULADOS (el rótulo es por página/shell, no por nombre; coherente con plan.md 014). Run PHP en `functionalBehaviorValidated:true` con resumen explicativo; métricas «no disponible», sin números inventados (UX review). F1 (transiciones QUEUED/PROCESSING) y F4 (legacy sin «Con test») corregidos con prueba.

## Observaciones no bloqueantes

1. **F3 (legacy-php-admin sin binding): aceptable como deuda de mock, no bloqueante.** Es solo dato demo; la causa es real (no hay repo demo libre en `demoRepositories.ts` sin colisionar con pruebas de `IntegrationsPage`/`api`, y `REPOSITORY_ALREADY_BOUND` impide compartir). Queda una incoherencia visible (Run con PR de `team-sandbox/demo-api` y «Sin repositorio vinculado»). Recomendación: registrarla como deuda explícita o abrir un WI chico para añadir `team-sandbox/legacy-admin` a `DEMO_GITHUB_REPOSITORIES` (fuera del alcance aprobado de este WI) y vincularlo; el usuario decide.
2. **Datos pr52:** clave `shipping.validate.zones` + `EXPECTED_RESULT` es la opción correcta para que el conflicto exista bajo la regla exacta; la pregunta sigue hablando de clientes corporativos (el rationale puede sugerir una excepción que, bajo DEC-FK-001, coexistiría). Es decisión de datos de demo, no DEC; aceptable. Cambiar la clave de `fk_shipping_zone` sería peor (afecta `listFunctionalKnowledge`). El UX review verificó coherencia visual del 409.
3. **Cobertura de borde:** no hay prueba para `LEGACY` ↔ `LEGACY` (admitido en el informe) ni para pregunta con `scenarioKey` null (la guarda inicial de `findConflictingKnowledge` no tiene mutación que la detecte). Bajo riesgo; añadir cuando exista un helper de preguntas.
4. **Cosmético de demo (UX F2, F5–F7)** fuera de alcance y ya registrados por ux-reviewer; F2 afecta `RetrievalComparisonPage.tsx` de producto, no tocado.

## Evidencia ejecutada

- `node node_modules/vitest/vitest.mjs run --maxWorkers=2`: 67 archivos, 740 pruebas OK.
- `eslint .` sin salida (OK); `tsc -b --noEmit` OK; `node harness/validate-harness.mjs` OK. Build no re-ejecutado (lo reportó el implementer; sin cambios de config).

## Resultado

- **status:** APPROVED
- **findings:** ver observaciones 1–4 (todas no bloqueantes).
- **blockers:** ninguno.
- **filesAffected:** `app/src/api/mockBackend.ts`, `app/src/api/mockBackend.test.ts`, `app/src/action-required/api.test.ts`, `app/src/control-plane/api.test.ts`, `app/src/control-plane/RunsPage.test.tsx`, `app/src/projects/ProjectsPage.test.tsx`, `app/src/projects/workspaceOverview.test.ts`, `app/src/retrieval-comparison/RetrievalComparisonPage.test.tsx`.
- **recommendedNextStep:** el leader registra este veredicto en `state.json` y presenta diff + evidencia al usuario (Human Reviewer) para el cierre (W-DONE bajo su aprobación de alcance); decidir con el usuario si F3 se acepta como deuda o se abre un WI de seguimiento; commit/push solo por solicitud explícita.
