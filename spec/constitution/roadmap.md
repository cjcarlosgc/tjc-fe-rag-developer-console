# Roadmap

## Sprint 1
Meta acumulada aproximada: FE 25%. HU01-HU07: shell/navegación base, crear proyecto, cargar ZIP, validaciones, polling de indexación, resumen y cobertura existente.

## Sprint 2 / PI1
Meta acumulada: FE 60%. HU08-HU19: cinco modos de generación, progreso, validación, artifacts/diff/download y pantalla funcional de comparación RAG vs agente generalista. Debe existir demo end-to-end.

## Puerta de investigación posterior al núcleo de Sprint 2

Mutation score/StrykerJS (`DEC-MET-001`) es una mejora próxima deseada, pero permanece PENDING hasta investigar su significado, costo y contrato coordinado. No bloquea el núcleo de Sprint 2; solo bloquea una futura UI o métrica de mutation testing. La posible señal test-aware (`DEC-RAG-001`) pertenece a RAG Core y tampoco se presenta como capacidad aprobada.

## Sprint 3
Meta acumulada: FE 80%. HU20-HU23: historial, WebSockets, visualización de autorreparación del modo normal y estados más ricos.

## Sprint 4
Meta: FE 100%. HU24-HU26: retry manual, filtros/organización, experiencia visual consolidada, responsive/accessibility/performance y visualización opcional de coverage experimental si se aprueba.

La validación final en empresa utiliza el modo `live` y queda sujeta a `DEC-VAL-001`; el demo mock no aporta evidencia válida.
