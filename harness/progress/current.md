# Progreso actual

Sesión de prueba manual con RAG Core y Test Execution Sandbox reales corriendo en local (Docker
Desktop) deriva en conectar el resto de adapters live que solo funcionaban en mock: listado de
proyectos (HU01), envío/progreso/resultados de generación (HU08-14) y el experimento RAG vs
agente generalista (HU19, con `BASELINE` retirado del vocabulario interno y `startExperiment`
corregido para enviar el `targetId` real en vez de una etiqueta). Verificado end-to-end contra el
backend real, incluyendo un experimento completo. `activeWorkItem` vuelve a `null`; feature 010
(product-experience) sigue con sus pendientes propios sin cambios (ver su `tasks.md`). Ver
`harness/reports/live-adapters-generation-projects-experiments.md` para hallazgos de esta prueba
(no son código de este repo, no se tocó `tjc-be-rag-core-api`).

SDD 1.14 / SYSTEM-1.4 / INTEROP-1.5 elimina el bloqueo contractual de Sprint 3: Core ya fijó e implementó historial, WebSockets y retry manual; HU23/autorreparación está descartada. El work item queda `SPEC_VERIFIED` para HU20/HU21/HU22/HU24. El código frontend aún debe implementar adapters live, lifecycle de `Idempotency-Key` y manejo de `UNSUPPORTED_PACKAGE_MANAGER`; nunca debe recibir el Bearer Core↔Sandbox. Esta actualización no tocó `app/`.

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

SDD 1.9 registra para Developer Console que `DEC-EXP-002` está APROBADO: HU19 ya no está bloqueada por decisión y el adapter live podrá implementarse contra `INTEROP-1.1` cuando RAG Core publique las rutas. Las decisiones de embeddings y chunking permanecen internas a Core y no agregan lógica ni dependencias al frontend. Docker Desktop local sigue siendo suficiente para integrar y prevalidar durante Sprint 2-4; `DEC-INF-001` conserva PENDING el proveedor remoto hasta después de Sprint 4.

HU07 (`sprint1-analysis-history-demo`) cierra `DONE`: demo completa verificada (lint, test, build, navegador sin errores), design-system migrado a tema oscuro inspirado en Superhuman sin regresión de contraste. El adapter live de listado de versiones queda fuera de esta tarea, bloqueado por backend. `activeWorkItem` vuelve a `null`.

Al intentar seleccionar el siguiente work item (Sprint 3, feature 009-history-repair-retry / HU20, HU23, HU24), la puerta de decisiones detecta un bloqueo de contrato: `spec/contracts/rag-core-api.md` marca "Historial, WebSockets, reparación y retry" como PENDING (RAG Core no fijó endpoints, eventos WebSocket ni DTOs) y prohíbe expresamente que el frontend invente nombres de evento o comandos de retry. El work item queda `BLOCKED` sin iniciar `IN_PROGRESS`.

SDD 1.14 / SYSTEM-1.4 / INTEROP-1.5 resuelve ese bloqueo (ver nota de arriba) y `sprint3-history-realtime-retry` (HU20/HU21/HU22/HU24) cierra `DONE`: historial paginado de generaciones, adapter Socket.IO reutilizable (`api/socket.ts`) cableado como complemento del polling existente en análisis (HU21) y run (HU22), y retry manual de un target `INVALID`/`FAILED` con lifecycle de `Idempotency-Key` (`api/idempotency.ts`). `spec/transversal/demo-mode/spec.md` amplía su alcance mock a HU20/HU24; HU21/HU22 quedan fuera del mock porque ese modo no abre transporte de ningún tipo. Verificación: lint/test (59 pruebas)/build en verde; el recorrido manual en navegador no pudo confirmarse en esta sesión por desconexión de la extensión Claude in Chrome. Adapters live de proyectos, generación, artifacts y experimentos siguen PENDING, fuera de este work item. `activeWorkItem` vuelve a `null`.

**Checkpoints humanos (2026-09-06):** `DEC-MET-001` queda condicionada a completar antes una prueba end-to-end satisfactoria en local con RAG Core, Test Execution Sandbox y Docker Desktop ejecutándose todos a la vez. La auditoría de accesibilidad (transversal `accessibility`, dentro de HU25/HU26) se envía deliberadamente al final del backlog, después de navegación/filtros, consolidación visual y adapters live.

Se selecciona `sprint4-product-experience-partial` (HU25/HU26, Sprint 4) por ser 100% frontend y verificable sin depender de un backend real. Entrega parcial `IN_REVIEW`: componente `Breadcrumbs` de jerarquía en las 8 páginas internas, buscador de proyectos (>4) y filtro de estado en historial de generaciones, y consolidación del patrón `.list-toolbar`/`.list-search` reutilizado por inventario e historial. Quedan explícitamente pendientes dentro de 010: revisión de patrón de tablas/diff/dialogs, la auditoría de accesibilidad (pospuesta por decisión humana) y la revisión manual en navegador (bloqueada por desconexión de la extensión Claude in Chrome). Verificación: lint/test (64 pruebas)/build en verde. Adapters live siguen fuera de alcance.
