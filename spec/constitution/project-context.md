# Contexto operativo del proyecto

**Estado:** APROBADO — SDD 2.0

`tjc-fe-rag-developer-console` es el cliente web de la arquitectura. Consume exclusivamente RAG Core para dominio y usa Supabase Auth para identidad humana.

El producto objetivo es PR-driven: repositorio vinculado, PR/HEAD, `AnalysisRun`, Action Required, Check, review y companion PR. ZIP y generación manual son compatibilidad legacy. La GitHub App se instala y opera en Core; OAuth de login no concede por sí mismo acceso a repositorios.

La SPA sigue implementada en TypeScript, pero representa proyectos TypeScript/Jest/Vitest y PHP/Laravel/PHPUnit según el execution profile informado. El modo mock es desarrollo/demostración, nunca evidencia experimental o integración real.

Código, preguntas, respuestas, diffs y artefactos pueden ser confidenciales. Las trazas exponen evidencia observable, nunca chain-of-thought ni causalidad inferida.
