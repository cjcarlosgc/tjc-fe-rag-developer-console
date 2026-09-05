# CHANGELOG

Todos los cambios notables de la línea base SDD se registran aquí. El contenido vigente vive en `spec/`; este archivo no reemplaza la especificación.

## [Unreleased]

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
  generalista que explora el código y obtiene sus propias referencias; `BASELINE`
  se conserva sólo como identificador técnico mientras el contrato siga `PENDING`.
- El proyecto semilla incorpora un historial demostrativo de ProjectVersions
  indexadas y permite consultar el inventario histórico de cada versión sin
  asumir un endpoint live todavía no publicado por RAG Core.

## [1.0.0] - 2026-08-30

- Se crea la línea base SDD del proyecto.
- Se adopta `spec.md + plan.md + tasks.md` por feature.
- Se adopta `CHANGELOG.md` en lugar de enmiendas acumulativas dentro de las specs.
- Se conserva trazabilidad mediante `storyIds` y `sprint`.
- El código fuente se reserva para `app/`.
