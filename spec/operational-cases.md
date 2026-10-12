# Casos operativos OC01–OC15

**Prioridad:** P2 para formalización de subcasos y criterios verificables. Este catálogo identifica escenarios; no convierte el informe conceptual de referencia en contrato ejecutable. La especificación de cada happy path y subcaso debe aprobarse en la feature dueña antes de marcar `O-READY`.

| Caso | Happy path a especificar | HU principales | Estado | Formalización (Feature 013) |
| --- | --- | --- | --- | --- |
| OC01 | Cambio sin tests y con contexto suficiente | HU05, HU10, HU11, HU14 | O-CATALOGUED | §OC01 de `spec/features/013-pr-driven-control-plane/spec.md` |
| OC02 | Cambio con tests ya aportados por developer o agente | HU04, HU10, HU14 | O-CATALOGUED | §OC02 — DECISION_REQUIRED |
| OC03 | Tests existentes suficientes; no duplicar | HU04, HU10, HU14 | O-CATALOGUED | §OC03 |
| OC04 | Falta contexto funcional; pedir intervención | HU07, HU08, HU14 | O-CATALOGUED | §OC04 |
| OC05 | Respuesta humana revela inconsistencia | HU08, HU13, HU14 | O-CATALOGUED | §OC05 |
| OC06 | Push posterior a corrección de implementación | HU07, HU14 | O-CATALOGUED | §OC06 |
| OC07 | Defecto detectable sin intervención humana | HU07, HU13, HU14 | O-CATALOGUED | §OC07 |
| OC08 | Test generado falla técnicamente | HU11, HU13, HU14 | O-CATALOGUED | §OC08 |
| OC09 | Suite existente ya fallaba | HU04, HU11, HU14 | O-CATALOGUED | §OC09 |
| OC10 | Primer análisis de repositorio grande | HU03, HU14 | O-CATALOGUED | §OC10 — DECISION_REQUIRED |
| OC11 | PR o commit grande | HU06, HU14 | O-CATALOGUED | §OC11 — DECISION_REQUIRED |
| OC12 | Cambios sin relevancia para pruebas unitarias | HU06, HU14 | O-CATALOGUED | §OC12 |
| OC13 | Impacto indirecto por símbolos relacionados | HU03, HU06, HU14 | O-CATALOGUED | §OC13 |
| OC14 | Conocimiento funcional desactualizado o contradicho | HU07, HU09, HU14 | O-CATALOGUED | §OC14 — DECISION_REQUIRED |
| OC15 | Nuevo commit mientras se espera respuesta humana | HU08, HU14 | O-CATALOGUED | §OC15 |

Las referencias de la última columna indican dónde está descrito el happy path. No implican implementación, cobertura ni estado `O-READY`; los casos `DECISION_REQUIRED` no están formalizados.

`O-CATALOGUED` solo confirma nombre y ubicación en el backlog. `O-READY` requiere entrada, salida, invariantes, subcasos elegidos y pruebas propuestas. `O-COVERED` requiere evidencia de los subcasos comprometidos. Inicialmente se preparan los happy paths; los edge cases se añaden como subcasos `OCxx.a` cuando se aprueben, no se asumen por el título.
