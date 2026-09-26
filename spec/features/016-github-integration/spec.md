# 016 — Frontera GitHub Integration (Console)

**Estado:** implementación fuente y checks locales disponibles bajo `WI-CONSOLE-003`; revisión UX estática aprobada por agente, revisión independiente integral y visto bueno personal pendientes. El WI no está cerrado; no hay despliegue ni cutover.

## Resultado esperado

La persona autenticada conecta un repositorio sin exponer credenciales internas. Console llama a GitHub Integration directamente solo para App info, discovery, verificación GitHub y ramas, con JWT Supabase y provider token efímero cuando corresponde. Core conserva workspace/Project, autorización final, persistencia del binding, RAG y análisis.

## Alcance de esta subtarea

Adoptar Contract Sync namespaced e integrar el cliente Console con las rutas de usuario de GitHub Integration; persistir el binding únicamente en Core mediante evidencia firmada de vida corta. Se conserva el flujo de usuario existente, sin cambios en scope OAuth ni en los contratos de dominio públicos de Core.

Las seis épicas y dieciocho HU son fijas. El trabajo técnico se enlaza a HU02, HU14 y HU16 sin abrir nuevas HU. Sandbox queda intacto.
