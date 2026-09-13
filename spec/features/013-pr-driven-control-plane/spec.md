# 013 — Control plane PR-driven

**Estado:** APROBADO
**Story IDs:** HU30, HU32, HU35-HU40, HU44-HU45
**Contrato:** SYSTEM-2.0 / INTEROP-2.0

## Objetivo

Representar el ciclo de un repositorio vinculado y sus `AnalysisRun` por PR/HEAD, haciendo accionables el contexto faltante, los resultados y la publicación revisada sin duplicar reglas de Core.

## Navegación y estados

- Navegación principal: Projects, Runs, Action Required, Experiments e Integrations/GitHub.
- Un proyecto muestra repository binding, `integrationBranch`, PR/HEAD vigente, checks y runs; el upload ZIP no es el camino principal.
- Focus Mode es una página dedicada, no un modal. Presenta una sola pregunta adaptativa, evidencia visual acotada, opción `No lo sé` y retorno seguro mediante `returnTo`.
- `No lo sé` equivale a `UNKNOWN` y nunca se presenta como conocimiento funcional persistido.
- Las propuestas se revisan antes de publicar. La UI muestra freshness y nunca promete escritura directa, auto-merge o autorepair.
- El login permite correo/contraseña y GitHub OAuth mediante Supabase Auth. La conexión de una GitHub App es un flujo separado.

## Mock-first

La primera entrega usa adapters `mock` con fixtures que respetan INTEROP-2.0 y una etiqueta visible de demo. `mock` y `live` permanecen separados y la UI no simula efectos externos como reales.

Debe cubrir nueve escenarios navegables: success, action required, behavioral mismatch, correction/new HEAD, existing tests sufficient, baseline failed, technical generation failure, no relevant changes y publication/freshness.

## Seguridad

El navegador solo consume Core para dominio. Nunca recibe secretos de GitHub App, `SANDBOX_SERVICE_TOKEN`, URLs firmadas internas ni reglas para verificar webhooks. Ownership y roles se reflejan desde el servidor.

## Fuera de alcance de T-001

- adapters live o integración GitHub real;
- colaboración Owner/Maintainer/Reviewer antes de HU45;
- iniciar automáticamente otra HU después de aprobar esta baseline.
