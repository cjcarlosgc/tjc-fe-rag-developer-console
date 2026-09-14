# Arquitectura

**Contratos compartidos:** SYSTEM-2.1 / INTEROP-2.1

`Browser -> RAG Core -> Test Execution Sandbox`. El navegador consume Core para todo el dominio. Supabase Auth se usa solo para la sesión humana; GitHub OAuth de identidad y GitHub App de repositorios son integraciones separadas.

El estado remoto usa adapters tipados `mock|live`; el mock implementa las mismas formas INTEROP-2.1 y se rotula como demo. La UI no calcula clasificación, impacto, suficiencia, freshness ni autorización: presenta decisiones de Core.

La jerarquía objetivo es Project/RepositoryBinding -> PR/HEAD -> AnalysisRun -> Check/Action Required/Proposal. Focus Mode es una ruta dedicada con retorno seguro. WebSockets pueden complementar HTTP, pero las operaciones idempotentes conservan `Idempotency-Key`.

Los flujos ZIP y los cinco modos manuales quedan **retirados** en `INTEROP-2.1` (§6.2-6.4, §6.6): no existe ruta de backend real detrás de ellos, ni siquiera como compatibilidad legacy — solo pueden seguir existiendo como mock interno para desarrollo/experimentos. La demo GitHub previa (login/import) sigue superseded como antes (HU26). Ninguno orienta nuevas pantallas ni adapters.
