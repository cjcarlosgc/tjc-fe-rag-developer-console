# Roadmap

## Sprint 1
Meta acumulada aproximada: FE 25%. HU01-HU07: shell/navegación base, crear proyecto, cargar ZIP, validaciones, polling de indexación, resumen y cobertura existente.

## Sprint 2 / PI1
Meta acumulada: FE 60%. HU08-HU19: cinco modos de generación, progreso, validación, artifacts/diff/download y pantalla funcional de comparación RAG vs agente generalista. Debe existir demo end-to-end.

## Puerta de investigación posterior al núcleo de Sprint 2

Mutation score/StrykerJS (`DEC-MET-001`) es una mejora próxima deseada, pero permanece PENDING hasta investigar su significado, costo y contrato coordinado. No bloquea el núcleo de Sprint 2; solo bloquea una futura UI o métrica de mutation testing. La posible señal test-aware (`DEC-RAG-001`) pertenece a RAG Core y tampoco se presenta como capacidad aprobada.

**Checkpoint (2026-09-06):** la investigación queda pospuesta hasta completar satisfactoriamente una prueba end-to-end en local con RAG Core, Test Execution Sandbox y Docker Desktop ejecutándose todos en local a la vez (ver checkpoint homónimo en `DEC-MET-001`, `spec/contracts/system-contract.md`).

## Sprint 3
Meta acumulada: FE 80%. HU20-HU22 y HU24: historial, WebSockets, estados más ricos y reintento manual desde cero. HU23 y la autorreparación automática están descartadas definitivamente.

## Sprint 4
Meta: FE 100%. HU25-HU26: filtros/organización, experiencia visual consolidada, responsive/accessibility/performance y visualización opcional de coverage experimental si se aprueba.

**Checkpoint (2026-09-06):** dentro de HU25/HU26 y de la transversal `accessibility`, la auditoría de accesibilidad (teclado, labels/errores de formularios, tablas/dialogs, contraste) queda deliberadamente al final del backlog: se prioriza primero navegación/filtros, consolidación visual y conexión de adapters live. No se descarta; solo se pospone su ejecución al final de todo lo demás.

La validación final en empresa utiliza el modo `live` y queda sujeta a `DEC-VAL-001`; el demo mock no aporta evidencia válida.
