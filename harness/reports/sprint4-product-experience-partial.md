# Evidencia de revisión — Product experience (parcial)

**Historias:** HU25, HU26 (parcial)
**Fecha:** 2026-09-06
**Estado:** IN_REVIEW (entrega parcial; ver pendientes)

## Alcance verificado

- **Breadcrumbs de jerarquía** (`ui/Breadcrumbs.tsx`): reemplaza el enlace único "← Volver a X" en las 8 páginas internas (`ProjectDetailPage`, `InventoryPage`, `GenerationPage`, `AnalysisHistoryPage`, `RunHistoryPage`, `RunPage`, `ArtifactsPage`, `ExperimentPage`) por una ruta completa Proyectos > Proyecto > … > página actual. El nivel actual nunca es un link (`aria-current="page"`).
- **Filtro de proyectos** (`ProjectsPage`): buscador por nombre, visible solo cuando hay más de 4 proyectos (evita ruido en el escenario demo de 2 proyectos).
- **Filtro de historial de generaciones** (`RunHistoryPage`): segmentado Todos/Completados/Parciales/Fallidos sobre los runs ya cargados.
- **Consolidación de patrón de dominio**: `.inventory-toolbar`/`.inventory-search` pasan a `.list-toolbar`/`.list-search`, reutilizado ahora por `InventoryView` y `RunHistoryPage` (antes solo existía en inventario).

## Verificación

- `npm run lint`: OK.
- `npm test`: OK, 24 archivos y 64 pruebas (5 nuevas: `Breadcrumbs`, filtro de historial, filtro/ausencia de buscador de proyectos).
- `npm run build`: OK.
- Navegador: no se pudo verificar visualmente (extensión Claude in Chrome desconectada en esta sesión, igual que en el cierre de HU20/21/22/24).

## Pendiente dentro de 010 (no completado en esta entrega)

- **design tokens/components**: tablas, diff viewer (`ArtifactWorkspace`/`DiffViewer`) y dialogs no recibieron una revisión de patrón dedicada; solo se tocó lo necesario para breadcrumbs/filtros.
- **responsive/accessibility**: pospuesto deliberadamente al final del backlog por decisión humana (checkpoint 2026-09-06). No hubo auditoría de teclado, labels/errores de formularios ni contraste dedicados a esta feature.
- **UX manual review**: bloqueada por la misma limitación de herramienta que en el cierre anterior; se recomienda repetirla con la extensión conectada antes de dar 010 por cerrada.

## Fuera de alcance (sin tocar)

- Adapters live (proyectos/generación/artifacts/experimentos): siguen PENDING, no forman parte de esta feature.
- El listado de proyectos en modo `live` sigue deshabilitado (`enabled: mock` en `useProjects`); el buscador solo opera sobre datos ya cargados en modo mock.
