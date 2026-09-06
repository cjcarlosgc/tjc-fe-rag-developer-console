# CHANGELOG

Todos los cambios notables de la línea base SDD se registran aquí. El contenido vigente vive en `spec/`; este archivo no reemplaza la especificación.

## [Unreleased]

- **SDD 1.8 / SYSTEM-1.3 / INTEROP-1.1:** se fija que Developer Console consume solo RAG Core. El ZIP sigue viajando por `POST /projects/index`; el frontend no accede a Supabase, no recibe credenciales/keys/URLs firmadas del Sandbox y no incorpora `@supabase/supabase-js` por la infraestructura backend. No se modifican rutas implementadas ni decisiones PENDING.
- **SDD 1.7 / SYSTEM-1.2:** se registra la MacBook encendida con Docker Desktop y su VM Linux como entorno temporal aprobado para desarrollo/prevalidación del Sandbox. El destino previsto es una VM Linux remota; `DEC-INF-001` mantiene PENDING la selección de un proveedor preferentemente gratuito y bloquea solo su aprovisionamiento remoto. No se decide exposición temporal, imagen Node, package managers ni condiciones de validación empresarial. INTEROP-1.0 no cambia.
- **SDD 1.6:** se consolida una línea base SDD homologada para los tres repositorios y se formaliza la política Git común: commits por cambio coherente con trazabilidad obligatoria `Refs: HU...`, revisión por work item y revisión consolidada documentada del sprint antes del push. `sddVersion` deja de tratarse como versión local independiente; `SYSTEM-*` e `INTEROP-*` conservan versionado propio. Un push anticipado exige la misma puerta y commit/push siguen requiriendo solicitud humana explícita.
- **Ajuste de revisión SDD 1.6:** se permite que un commit exclusivo `docs(review)` incorpore la evidencia después del veredicto, sujeto a una comprobación final de que no contiene otros cambios. Se corrige además el diagnóstico de `decisionGate` malformado y la validación de espacios finales.
- **SDD 1.5 / SYSTEM-1.1 / INTEROP-1.0:** se incorpora el contrato universal de rutas, DTOs, errores y asincronía. Se fijan listado de proyectos/versiones, `POST /test-runs`, status/resultados, artefactos y transporte experimental. Los adapters y mocks todavía deben migrarse en work items de código; `DEC-EXP-002` permanece PENDING.
- **SDD 1.4 / SYSTEM-1.0:** se incorpora la copia espejo del contrato de los tres componentes, el contexto TypeScript-only y de validación empresarial, y la puerta `decisionGate` acotada por `Blocks`. La comparación usa `GENERALIST_AGENT`; `BASELINE` deja de ser identificador técnico para contratos nuevos. Mutation score/StrykerJS permanece PENDING y el mock queda excluido de toda evidencia real.
- Se aprueba el stack frontend: React, Vite, TypeScript, React Router,
  TanStack Query, Vitest, Testing Library y npm.
- Se incorpora la copia canónica del contrato de RAG Core, distinguiendo operaciones
  implementadas, aprobadas y `PENDING`.
- Se corrigen en SDD los contratos Sprint 1: `currentVersionId`,
  `POST /projects/index`, polling/resultados por `projectVersionId` y
  `x-correlation-id`/`correlationId`.
- Se sincronizan los DTO ya implementados de ProjectVersion, resultados e inventario
  desde RAG Core SDD 1.2, incluido `targetType=CLASS|METHOD|FUNCTION`.
- El modo puntual de generación se alinea con RAG Core: `METHOD` pasa a `TARGET`
  para aceptar métodos y funciones top-level.
- Se aprueba un modo demo stateful seleccionado con `VITE_DATA_SOURCE=mock`,
  visible en la interfaz y desacoplado de los adapters HTTP `live`.
- El modo demo cubre proyectos, indexación, inventario, generación, validación,
  artifacts y comparación RAG vs agente generalista sin presentar sus datos como reales.
- La descarga conjunta del demo produce un ZIP real y la comparación experimental
  explicita deltas absolutos/relativos para tiempo, tokens y costo.
- La comparación experimental sustituye la variante aislada sin contexto por un agente
  generalista que explora el código y obtiene sus propias referencias.
- El proyecto semilla incorpora un historial demostrativo de ProjectVersions
  indexadas y permite consultar el inventario histórico de cada versión sin
  asumir un endpoint live todavía no publicado por RAG Core.

## [1.0.0] - 2026-08-30

- Se crea la línea base SDD del proyecto.
- Se adopta `spec.md + plan.md + tasks.md` por feature.
- Se adopta `CHANGELOG.md` en lugar de enmiendas acumulativas dentro de las specs.
- Se conserva trazabilidad mediante `storyIds` y `sprint`.
- El código fuente se reserva para `app/`.
