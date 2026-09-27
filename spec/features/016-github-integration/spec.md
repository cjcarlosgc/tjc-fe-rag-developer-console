# 016 — Frontera GitHub Integration (Console)

**Estado:** la migración de código fuente quedó cerrada localmente bajo `WI-CONSOLE-003`; no hay despliegue ni cutover. La sincronización contractual del corte temporal PR/binding se planifica por separado en `WI-CONSOLE-008` y no implica cambio funcional de UI.

## Resultado esperado

La persona autenticada conecta un repositorio sin exponer credenciales internas. Console llama a GitHub Integration directamente solo para App info, discovery, verificación GitHub y ramas, con JWT Supabase; el provider token efímero solo acompaña discovery y la verificación de un repositorio nuevo. La consulta de ramas y la verificación informativa de un binding existente no envían OAuth. Core conserva workspace/Project, autorización final, persistencia del binding, RAG y análisis.

## Alcance de esta subtarea

Adoptar Contract Sync namespaced e integrar el cliente Console con las rutas de usuario de GitHub Integration; persistir el binding únicamente en Core mediante evidencia firmada de vida corta. Se conserva el flujo de usuario existente, sin cambios en scope OAuth ni en los contratos de dominio públicos de Core.

Las seis épicas y dieciocho HU son fijas. El trabajo técnico se enlaza a HU02, HU14 y HU16 sin abrir nuevas HU. Sandbox queda intacto.
