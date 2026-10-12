# WI-CONSOLE-030 — cierre

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Estado:** `W-DONE` · **Revisión independiente:** `reviewer` (awayMode activo), APPROVED, 1 ciclo; UX aprobado (F1/F3/F4 corregidos en el Corte D).

## Resultado (solo mock y pruebas; live sin cambios)
- C1: Projects demo PHP en `team-sandbox` (2000003, ADMIN): `shop-php-demo` (PHP/PHPUNIT, Run `arun_php_pr7` con símbolos PHP, binding a `team-sandbox/demo-api`) y `legacy-php-admin` (PHP sin framework detectado, Run `arun_legacy_php_pr3`). `rcmp_demo_seed_php` cuelga ahora de `arun_php_pr7`.
- C4: la comparación OE2 devuelve 422 `UNSUPPORTED_PROJECT` (copy unificado intacto) para la versión sin framework; ruta `/projects/prj_legacy_php_demo/runs/arun_legacy_php_pr3/retrieval-comparison`.
- C3: el 409 `FUNCTIONAL_KNOWLEDGE_CONFLICT` exige `targetRef` + `scenarioKey` exactos (INTEROP §6.11, DEC-FK-001); distinto `scenarioKey` coexiste y persiste la regla `ACTIVE`; semilla `fq_checkout_pr52_1` alineada a `shipping.validate.zones`.
- C2: `arun_checkout_pr53` (En cola) y `arun_billing_pr25` (Procesando) pasan a listados, contadores y métricas (Runs 17 → 21; PR activos 16 → 20); historial de transiciones coherente.

## Gates
lint, `tsc -b --noEmit`, vitest 740/740 (con `--maxWorkers=2` y sin límite), build y validadores pasan. Mutaciones del reviewer detectadas por las pruebas.

## Pendiente / deuda
- `legacy-php-admin` queda «Sin repositorio vinculado» (no hay repo demo libre; requeriría añadir uno a `DEMO_GITHUB_REPOSITORIES`).
- UX F2 (foco tras 422 en `RetrievalComparisonPage`), F5-F7 (lenguaje PHP no visible, regla propuesta del 409 repite la pregunta, «se actualizará automáticamente» en Run en cola) quedan como deuda baja.
- Sin prueba LEGACY↔LEGACY directa; `reasoningEffort` y `checkId` siguen ilustrativos (fuera de alcance).

Evidencia: `wi-console-030-{scope-approval,sdd-verification,contract-sync-scope-review,implementation,ux-review,review}.md`. Sin push ni PR.
