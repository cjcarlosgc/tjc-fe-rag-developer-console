# WI-CONSOLE-003 — Verificación SDD

**Fecha:** 2026-09-26
**Estado:** criterios/spec verificados; revisión humana independiente del WI pendiente.

- `ST-CONSOLE-003` es una subtarea de Harness y está vinculada al único WI local `WI-CONSOLE-003`; no abre HU ni épica nuevas.
- Console usa el namespace `CS-CONSOLE-*`, acepta los namespaces `CS-CORE-*`/`CS-GH-*` y conserva legibles los IDs históricos sin reescribirlos; eventos nuevos incluyen `sourceWorkItem`.
- Conforme a `GH-INTEROP-1.1`, Console llama a Integration solo para App info, discovery, verificación y ramas; mantiene Core para Projects/workspaces, reglas de dominio, persistencia del binding, RAG y análisis.
- Las decisiones pendientes del producto y la homologación Sandbox no bloquean este WI de Harness; Sandbox queda fuera del alcance.
- `SYSTEM-2.5`, `INTEROP-2.5` y `GH-INTEROP-1.1` coinciden con Core; los tres mirrors GitHub Integration también tienen mismo digest.
- `CS-GH-20260926-001` está importado como `C-PENDING`, sin ACK/RESOLVED mientras espera la revisión final del consumidor. No se aprueba el WI ni su código.

No se registra aprobación del WI ni revisión independiente concluida.
