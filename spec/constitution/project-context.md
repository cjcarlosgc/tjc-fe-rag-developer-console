# Contexto operativo del proyecto

**Estado:** transición aprobada Core/Console; homologación Sandbox pendiente

`tjc-fe-rag-developer-console` es el cliente web de la arquitectura. Consume exclusivamente RAG Core para dominio y usa Supabase Auth para identidad humana.

El producto objetivo es PR-driven: repositorio vinculado, PR/HEAD, `AnalysisRun`, Action Required, Check, review y companion PR. No hay carga manual de código ZIP, generación manual ni descarga legacy de artefactos como rutas de producto. El ZIP interno del snapshot sigue disponible para Docker/Sandbox. La GitHub App y toda interacción GitHub se trasladarán a `tjc-be-github-integration-api`; OAuth de login no concede por sí mismo acceso de automatización. Durante la transición, Core todavía aloja código GitHub hasta completar los work items de extracción.

La SPA sigue implementada en TypeScript, pero representa proyectos TypeScript/Jest/Vitest y PHP/Laravel/PHPUnit según el execution profile informado. El modo mock es desarrollo/demostración, nunca evidencia experimental o integración real.

Código, preguntas, respuestas, diffs y artefactos pueden ser confidenciales. Las trazas exponen evidencia observable, nunca chain-of-thought ni causalidad inferida.
