# Contexto operativo del proyecto

**Estado:** APROBADO
**Alcance:** contexto mínimo para especificación, implementación y revisión; no agrega contratos funcionales.

`tjc-fe-rag-developer-console` es el frontend/cliente web de referencia de una solución de tesis compuesta por dos backends y un frontend. Su usuario principal es el desarrollador del área de desarrollo de la empresa participante. Este repositorio implementa solo la consola y consume exclusivamente RAG Core.

La implementación de la consola usa TypeScript. Distintamente, el lenguaje de los proyectos que el producto analiza y valida también queda restringido en V1 a TypeScript (`.ts`/`.tsx`) con Jest o Vitest; describir académicamente el ecosistema como JavaScript/TypeScript no habilita JavaScript puro.

La validación final ocurre contra servicios `live` en una empresa real. El modo mock es únicamente una ayuda de desarrollo y demostración, no evidencia experimental. Código, rutas, logs, diffs y artefactos pueden ser confidenciales y deben representarse sin exposición innecesaria.

No incorporar aquí papers, marco teórico, nombres académicos, estructura de capítulos ni roles organizativos que no cambien un contrato implementable.

Las condiciones todavía pendientes para la validación empresarial se rigen por `DEC-VAL-001` en `spec/contracts/system-contract.md`.
