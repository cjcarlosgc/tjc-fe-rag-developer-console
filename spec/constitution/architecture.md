# Arquitectura

**Contratos compartidos:** SYSTEM-2.2 / INTEROP-2.2

`Browser -> RAG Core -> Test Execution Sandbox`. El navegador consume Core para todo el dominio. Supabase Auth se usa solo para la sesión humana; GitHub OAuth de identidad y GitHub App de repositorios son integraciones separadas.

El estado remoto usa adapters tipados `mock|live`; el mock implementa las mismas formas INTEROP-2.2 y se rotula como demo. La UI no calcula clasificación, impacto, suficiencia, freshness ni autorización: presenta decisiones de Core.

La jerarquía objetivo es Project/RepositoryBinding -> PR/HEAD -> AnalysisRun -> Check/Action Required/Proposal. Focus Mode es una ruta dedicada con retorno seguro. WebSockets pueden complementar HTTP, pero las operaciones idempotentes conservan `Idempotency-Key`.

Los componentes visuales y de estado reutilizables se conservan para Runs y AnalysisRuns. No existe flujo, mock o adapter de producto separado para ZIP o modos manuales. La demo GitHub previa (login/import) está retirada; la UX mock vigente implementa INTEROP-2.2 y no orienta integración live sin aprobación humana.
