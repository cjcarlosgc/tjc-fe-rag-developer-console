# Casos operativos OC01–OC15

**Prioridad:** P2 para formalización de subcasos y criterios verificables. Este catálogo identifica escenarios; no convierte el informe conceptual de referencia en contrato ejecutable. La especificación de cada happy path y subcaso debe aprobarse en la feature dueña antes de marcar `O-READY`.

| Caso | Happy path a especificar | HU principales | Estado | Formalización (Feature 013) |
| --- | --- | --- | --- | --- |
| OC01 | Cambio sin tests y con contexto suficiente | HU05, HU10, HU11, HU14 | O-CATALOGUED | §OC01 de `spec/features/013-pr-driven-control-plane/spec.md` |
| OC02 | Cambio con tests ya aportados por developer o agente | HU04, HU10, HU14 | O-CATALOGUED | §OC02 — decisión confirmada (2026-10-12); cita contractual pendiente |
| OC03 | Tests existentes suficientes; no duplicar | HU04, HU10, HU14 | O-CATALOGUED | §OC03 |
| OC04 | Falta contexto funcional; pedir intervención | HU07, HU08, HU14 | O-CATALOGUED | §OC04 |
| OC05 | Respuesta humana revela inconsistencia | HU08, HU13, HU14 | O-CATALOGUED | §OC05 |
| OC06 | Push posterior a corrección de implementación | HU07, HU14 | O-CATALOGUED | §OC06 |
| OC07 | Defecto detectable sin intervención humana | HU07, HU13, HU14 | O-CATALOGUED | §OC07 |
| OC08 | Test generado falla técnicamente | HU11, HU13, HU14 | O-CATALOGUED | §OC08 (precedencia según DEC-VAL-002) |
| OC09 | Suite existente ya fallaba | HU04, HU11, HU14 | O-CATALOGUED | §OC09 |
| OC10 | Primer análisis de repositorio grande | HU03, HU14 | O-CATALOGUED | §OC10 — decisión confirmada (V1 mínimo); deuda de umbral y progreso |
| OC11 | PR o commit grande | HU06, HU14 | O-CATALOGUED | §OC11 — decisión confirmada (compare no verificable) |
| OC12 | Cambios sin relevancia para pruebas unitarias | HU06, HU14 | O-CATALOGUED | §OC12 |
| OC13 | Impacto indirecto por símbolos relacionados | HU03, HU06, HU14 | O-CATALOGUED | §OC13 |
| OC14 | Conocimiento funcional desactualizado o contradicho | HU07, HU09, HU14 | O-CATALOGUED | §OC14 — decisión confirmada (opción A: `BEHAVIORAL_MISMATCH`) |
| OC15 | Nuevo commit mientras se espera respuesta humana | HU08, HU14 | O-CATALOGUED | §OC15 |

Las referencias de la última columna indican dónde está descrito el happy path. No implican implementación, cobertura ni estado `O-READY`. Ningún caso está marcado `DECISION_REQUIRED` en esta versión: OC02, OC10, OC11 y OC14 se formalizaron con las decisiones confirmadas por el usuario el 2026-10-12 (reaprobación de `WI-CONSOLE-004`). Esas decisiones no se citan todas en el espejo; donde no lo están, la afirmación queda marcada «pendiente de cita contractual». Todos los casos siguen en `O-CATALOGUED`.

`O-CATALOGUED` solo confirma nombre y ubicación en el backlog. `O-READY` requiere entrada, salida, invariantes, subcasos elegidos y pruebas propuestas. `O-COVERED` requiere evidencia de los subcasos comprometidos. Inicialmente se preparan los happy paths; los edge cases se añaden como subcasos `OCxx.a` cuando se aprueben, no se asumen por el título.

## Orden de formalización y prioridad

Cita literal del usuario, en el chat de Console, para la reaprobación de `WI-CONSOLE-004` (2026-10-12; registro en `harness/reports/wi-console-004-scope-reapproval.md`):

> «Confirmo las decisiones OC02, OC10, OC11, OC14, OC15 y OC08 y apruebo el alcance de WI-CONSOLE-004, con el orden de prioridad OC01, OC03, OC04, OC05, OC06, OC07, OC08, OC09, OC12, OC13 y luego OC02, OC10, OC11, OC14, OC15.»

Este orden ordena la formalización y la priorización de la documentación. No implica implementación, cobertura ni estado `O-READY` u `O-COVERED`; cada caso sigue en `O-CATALOGUED`.

| Orden | Caso | Estado de formalización tras este corte |
| --- | --- | --- |
| 1 | OC01 | Happy path formalizado; citas revisadas |
| 2 | OC03 | Corregido: `functionalBehaviorValidated` no equivale a validación por ejecución; `SKIPPED_HAS_TEST` pendiente de cita |
| 3 | OC04 | Corregido: `continuationAttemptId` nulo mientras queden preguntas `PENDING` |
| 4 | OC05 | Revisado; sin cambios sustantivos |
| 5 | OC06 | Corregido: `history` y `GITHUB_HEAD_SUPERSEDED` no observables (pendientes de implementación) |
| 6 | OC07 | Corregido: sin exigencia de regla `ACTIVE` en la entrada |
| 7 | OC08 | Formalizado con la precedencia de `DEC-VAL-002` (calculada por Core) |
| 8 | OC09 | Revisado con citas |
| 9 | OC12 | Revisado con citas |
| 10 | OC13 | Revisado; una invariante marcada pendiente de cita |
| 11 | OC02 | Decisión confirmada; cita contractual pendiente para la clasificación de tests aportados |
| 12 | OC10 | Decisión confirmada (V1 mínimo); deuda «umbral de repo grande + progreso» |
| 13 | OC11 | Decisión confirmada; texto literal de `resultSummary` sin depender de «300» |
| 14 | OC14 | Decisión confirmada (opción A); selección de regla pendiente de cita |
| 15 | OC15 | Formalizado con `404 FUNCTIONAL_QUESTION_NOT_FOUND` |
