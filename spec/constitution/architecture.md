# Arquitectura

**Contratos compartidos:** SYSTEM-2.5 / INTEROP-2.5 / GH-INTEROP-1.1

```text
Browser ──Projects/workspaces, bindings, RAG──> RAG Core ──> Test Execution Sandbox
   │                                           ▲
   └──App info, discovery, verify, branches──> GitHub Integration ──> GitHub
GitHub ──webhook firmado──> GitHub Integration ──evento normalizado──> RAG Core
GitHub Integration ──sesión + hechos verificados──> autorización síncrona Core
```

Supabase Auth gestiona la sesión humana. GitHub Integration es dueño de toda interacción GitHub. Console la llama directamente solo para las cuatro capacidades de interfaz indicadas; Core sigue siendo la API de dominio y conserva Projects/workspaces, binding persistido, autorización, RAG y análisis. Core también invoca Integration para el pipeline y recibe webhooks normalizados.

El estado remoto usa adapters tipados `mock|live`; el mock implementa las mismas formas INTEROP-2.5 y se rotula como demo. La UI no calcula clasificación, impacto, suficiencia, freshness ni autorización: presenta decisiones de Core.

La jerarquía objetivo es Project/RepositoryBinding -> PR/HEAD -> AnalysisRun -> Check/Action Required/Proposal. Focus Mode es una ruta dedicada con retorno seguro. WebSockets pueden complementar HTTP, pero las operaciones idempotentes conservan `Idempotency-Key`.

Los componentes visuales y de estado reutilizables se conservan para AnalysisRuns. No existe flujo, mock o adapter de producto para carga manual ZIP, modos de generación manual o descarga legacy de artefactos. El snapshot ZIP interno para Sandbox no es una capacidad de UI. La demo GitHub previa (login/import) está retirada; la UX mock vigente implementa INTEROP-2.5 y no prueba integración live por sí sola.
