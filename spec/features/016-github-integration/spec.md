# 016 — Frontera GitHub Integration (Console)

**Estado:** la migración de código fuente quedó cerrada localmente bajo `WI-CONSOLE-003`; la sincronización de contratos y la verificación de Runs por Project de `WI-CONSOLE-008` también están cerradas. `WI-CONSOLE-010` está `W-DONE`: Console importó y resolvió `CS-CORE-20260927-004/005/006`; SYSTEM-2.5, INTEROP-2.6 y GH-INTEROP-1.2 coinciden byte a byte con Core y GitHub Integration. Pasaron la puerta externa, la revisión contractual y la aprobación humana. No cambia comportamiento ni UI; no hay despliegue ni cutover.

## Resultado esperado

La persona autenticada conecta un repositorio sin exponer credenciales internas. Console llama a GitHub Integration directamente solo para App info, discovery, verificación GitHub y ramas, con JWT Supabase; el provider token efímero solo acompaña discovery y la verificación de un repositorio nuevo. La consulta de ramas y la verificación informativa de un binding existente no envían OAuth. Core conserva workspace/Project, autorización final, persistencia del binding, RAG y análisis.

## Alcance de esta subtarea

Adoptar Contract Sync namespaced e integrar el cliente Console con las rutas de usuario de GitHub Integration; persistir el binding únicamente en Core mediante evidencia firmada de vida corta. Se conserva el flujo de usuario existente, sin cambios en scope OAuth ni en los contratos de dominio públicos de Core.

Las seis épicas y dieciocho HU son fijas. El trabajo técnico se enlaza a HU02, HU14 y HU16 sin abrir nuevas HU. Sandbox queda intacto.
