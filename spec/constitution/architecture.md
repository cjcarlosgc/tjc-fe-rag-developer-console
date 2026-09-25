# Arquitectura

**Contratos compartidos:** SYSTEM-2.4 / INTEROP-2.4; frontera de GitHub Integration en transición

`Browser -> RAG Core -> Test Execution Sandbox`, con `GitHub <-> GitHub Integration API <-> RAG Core` como topología objetivo. El navegador consume Core para el dominio; Supabase Auth gestiona la sesión humana. La GitHub App, SDK y toda operación GitHub se trasladan desde Core al cuarto componente por WIs aprobados. Console no llama directamente a GitHub para automatización.

El estado remoto usa adapters tipados `mock|live`; el mock implementa las mismas formas INTEROP-2.4 y se rotula como demo. La UI no calcula clasificación, impacto, suficiencia, freshness ni autorización: presenta decisiones de Core.

La jerarquía objetivo es Project/RepositoryBinding -> PR/HEAD -> AnalysisRun -> Check/Action Required/Proposal. Focus Mode es una ruta dedicada con retorno seguro. WebSockets pueden complementar HTTP, pero las operaciones idempotentes conservan `Idempotency-Key`.

Los componentes visuales y de estado reutilizables se conservan para AnalysisRuns. No existe flujo, mock o adapter de producto para carga manual ZIP, modos de generación manual o descarga legacy de artefactos. El snapshot ZIP interno para Sandbox no es una capacidad de UI. La demo GitHub previa (login/import) está retirada; la UX mock vigente implementa INTEROP-2.4 y no prueba integración live por sí sola.
