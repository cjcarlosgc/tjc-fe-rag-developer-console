# Arquitectura

**Contratos compartidos:** SYSTEM-2.0 / INTEROP-2.0

`Browser -> RAG Core -> Test Execution Sandbox`. El navegador consume Core para todo el dominio. Supabase Auth se usa solo para la sesión humana; GitHub OAuth de identidad y GitHub App de repositorios son integraciones separadas.

El estado remoto usa adapters tipados `mock|live`; el mock implementa las mismas formas INTEROP-2.0 y se rotula como demo. La UI no calcula clasificación, impacto, suficiencia, freshness ni autorización: presenta decisiones de Core.

La jerarquía objetivo es Project/RepositoryBinding -> PR/HEAD -> AnalysisRun -> Check/Action Required/Proposal. Focus Mode es una ruta dedicada con retorno seguro. WebSockets pueden complementar HTTP, pero las operaciones idempotentes conservan `Idempotency-Key`.

Los flujos ZIP, cinco modos manuales y demo GitHub previa quedan como compatibilidad superseded. No orientan nuevas pantallas ni adapters.
