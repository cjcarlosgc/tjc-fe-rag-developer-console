# 011-context-explorer — Plan

## Dependencias

- `INTEROP-2.1`, artifacts, resultados de run y modo experimental.
- Transversales `api-client`, `async-state`, `design-system`, `accessibility` y `testing`.

## Diseño técnico

- Crear un `ContextExplorerPage` con selector de modo y una capa de layout de grafo desacoplada de los DTOs.
- Adapters live consultan listados/detalle/paginación; adapters mock generan el mismo contrato sin llamar al backend.
- Mantener estado de canvas, filtros y selección local; las trazas y excerpts permanecen server state de TanStack Query.
- Virtualizar nodos/listas cuando el run sea masivo y colapsar grupos sin perder acceso por teclado.
- El panel lateral usa un patrón común para metadata/excerpt; los bloques específicos RAG/AGENT se modelan como variantes discriminadas.
- Deep link conserva run/experiment, trace y node seleccionados en query params estables de UI.

## Validación

- Tests de mapeo de ambos DTOs, filtros y último intento por defecto.
- Tests de accesibilidad para canvas alternativo, teclado, tooltip y drawer.
- Revisión visual desktop y responsive, incluido reduced motion.
- `lint`, `test`, `build` y SDD check.
