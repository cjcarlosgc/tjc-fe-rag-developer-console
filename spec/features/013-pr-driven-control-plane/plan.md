# 013 — Plan del control plane

## Dependencias

SYSTEM-2.6/INTEROP-2.7/GH-INTEROP-1.2, identidad Supabase, diseño, routing, query cache y adapters `mock|live`. Console usa GitHub Integration directamente solo para App info, discovery, verificación GitHub y ramas; Core sigue siendo la API de dominio para Projects/workspaces, persistencia de bindings, RAG y análisis.

## Cortes

1. Alinear pantallas y adapters con las 18 HU vigentes y eliminar rutas de carga ZIP, generación manual y descarga legacy en `WI-CONSOLE-002`.
2. Mantener Projects, Runs, Action Required, Focus Mode, propuestas, trazas, publicación y experimentos ligados a AnalysisRun con estados loading/error/empty/success y permisos correctos.
3. En `WI-CONSOLE-003`, consumir las rutas autenticadas de GitHub Integration para las cuatro capacidades de interfaz; mantener autorización y persistencia de dominio en Core y las rutas equivalentes de Core durante la compatibilidad.
4. En `WI-CONSOLE-004`, especificar experiencia de OC01–OC15, happy paths primero y subcasos después.

## Verificación

Pruebas de rutas, permisos, freshness, accesibilidad, separación mock/live, sesión/token efímeros y ausencia de ZIP manual. Lint, tests, build, revisión independiente, UX cuando aplique y cuatro checkpoints Contract Sync.

## Cortes SMART V3

`WI-CONSOLE-011` sincroniza SYSTEM-2.6/INTEROP-2.7 (el contrato ya está definido y acusado) y desbloquea a `WI-CONSOLE-013` a `WI-CONSOLE-018`, que se construyen contra el contrato canónico con mocks rotulados y adapter live pendiente. `WI-CONSOLE-012` (`RunsPage`) y `WI-CONSOLE-019` (wording) no dependen de nada y pueden ejecutarse ya. La activación y verificación live contra Core se hace en `WI-CONSOLE-020`, que sí espera a los WI de Core. Cada corte UI exige `ux-reviewer`.

## Diseño técnico SMART V3

Un helper único `hasRole(role, min)` reemplaza las comprobaciones `ADMIN || MAINTAINER` dispersas (ExperimentPage, RunComparisonPage, AnalysisRunDetailPage, IntegrationsPage, ProjectDetailPage y FocusModePage) y respeta la jerarquía Admin ⊃ Maintainer ⊃ Writer ⊃ Reader. La sección «Trace operativo» vive en `AnalysisRunDetailPage` junto a `ContextSection`. El panel especulativo de procedencia se retira en `WI-CONSOLE-015`. Los tipos nuevos viven en el módulo de cada feature y, mientras Core no publique, el adapter live responde con el error de contrato pendiente ya usado por la capa de datos.
