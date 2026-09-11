# Contexto operativo del proyecto

**Estado:** APROBADO
**Alcance:** contexto mínimo para especificación, implementación y revisión; no agrega contratos funcionales.

`tjc-fe-rag-developer-console` es el frontend/cliente web de referencia de una solución de tesis compuesta por dos backends y un frontend. Su usuario principal es el desarrollador del área de desarrollo de la empresa participante. Este repositorio implementa solo la consola y consume exclusivamente RAG Core.

La implementación de la consola usa TypeScript. Distintamente, el lenguaje de los proyectos que el producto analiza y valida también queda restringido en V1 a TypeScript (`.ts`/`.tsx`) con Jest o Vitest; describir académicamente el ecosistema como JavaScript/TypeScript no habilita JavaScript puro.

La validación final ocurre contra servicios `live` en una empresa real. El modo mock es únicamente una ayuda de desarrollo y demostración, no evidencia experimental. Código, rutas, logs, diffs y artefactos pueden ser confidenciales y deben representarse sin exposición innecesaria.

El producto conserva el flujo ZIP independiente de GitHub. La identidad aprobada para ese flujo es correo/contraseña mediante Supabase Auth con autorización por propietario. El flujo GitHub real continúa pendiente, pero una maqueta interactiva claramente simulada forma parte de la demo de experiencia y no bloquea la versión funcional basada en ZIP.

Las trazas visualizan evidencia observable: candidatos y decisiones RAG o contenido efectivamente entregado al agente. Nunca se presentan como razonamiento interno ni como prueba de qué información influyó causalmente en el modelo.

No incorporar aquí papers, marco teórico, nombres académicos, estructura de capítulos ni roles organizativos que no cambien un contrato implementable.

Las condiciones todavía pendientes para la validación empresarial se rigen por `DEC-VAL-001` en `spec/contracts/system-contract.md`.
