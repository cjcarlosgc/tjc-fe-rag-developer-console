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

SDD 1.7 / SYSTEM-1.2 aprueba como entorno temporal de desarrollo y prevalidación la MacBook encendida con Docker Desktop y su VM Linux. El destino previsto continúa siendo una VM Linux remota, pero `DEC-INF-001` mantiene `PENDING` la selección del proveedor, priorizando opciones gratuitas sin asumir que cumplen capacidad, disponibilidad o seguridad. INTEROP-1.0 no cambia.

SDD 1.8 / SYSTEM-1.3 / INTEROP-1.1 confirma que el frontend consume exclusivamente RAG Core: envía el ZIP por `POST /projects/index` y no conoce Supabase Storage, PostgreSQL, credenciales ni signed URLs Core↔Sandbox. `@supabase/supabase-js` y `SUPABASE_PUBLISHABLE_KEY` no se incorporan sin una feature futura aprobada que los necesite.
