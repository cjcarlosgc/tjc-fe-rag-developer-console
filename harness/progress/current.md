# Progreso actual

Modo demo end-to-end en revisión. `VITE_DATA_SOURCE=mock` sirve un escenario
stateful y visible que enlaza proyectos, historial multiversión, indexación,
inventario por ProjectVersion, generación, progreso, validación, artifacts y
comparación RAG vs Agente generalista. Los componentes consumen los mismos servicios que
el modo live; el mock no realiza requests HTTP.

Los adapters live de ProjectVersion, resultados e inventario conservan los DTO
confirmados de RAG Core. SDD 1.5 / SYSTEM-1.1 / INTEROP-1.0 aprueba además contratos para listado,
generación, run, artifacts y experimentos; sus adapters live continúan sin implementar. La
verificación final incluye 38 pruebas y recorrido manual en navegador sin errores
ni warnings de consola.

El SDD local sube a 1.4: incorpora el contrato común de los tres componentes, alcance de proyectos TypeScript-only, validación empresarial exclusivamente live, `GENERALIST_AGENT` sin identificador heredado `BASELINE` y puerta `decisionGate`. El work item actual no queda bloqueado porque es demo y no implementa contratos live pendientes.

El SDD local sube a 1.5 con la copia universal `INTEROP-1.0`. El mock deja de ser fuente provisional de DTOs; deberá adaptarse junto con el código live en work items posteriores. `DEC-EXP-002` sigue bloqueando exclusivamente la ejecución real de HU19.

SDD 1.6 queda homologada como línea base conjunta de los tres repositorios y formaliza la entrega Git común: cada commit es un cambio coherente con `Refs: HU...`; cada work item conserva su revisión y, antes del push de cierre de sprint, el reviewer debe aprobar y documentar el rango acumulado exacto que se publicará. `SYSTEM-*` e `INTEROP-*` conservan versionado propio. Commit y push continúan requiriendo solicitud humana explícita.
