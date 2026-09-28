# 013 — Plan del control plane

## Dependencias

SYSTEM-2.5/INTEROP-2.6/GH-INTEROP-1.2, identidad Supabase, diseño, routing, query cache y adapters `mock|live`. Console usa GitHub Integration directamente solo para App info, discovery, verificación GitHub y ramas; Core sigue siendo la API de dominio para Projects/workspaces, persistencia de bindings, RAG y análisis.

## Cortes

1. Alinear pantallas y adapters con las 18 HU vigentes y eliminar rutas de carga ZIP, generación manual y descarga legacy en `WI-CONSOLE-002`.
2. Mantener Projects, Runs, Action Required, Focus Mode, propuestas, trazas, publicación y experimentos ligados a AnalysisRun con estados loading/error/empty/success y permisos correctos.
3. En `WI-CONSOLE-003`, consumir las rutas autenticadas de GitHub Integration para las cuatro capacidades de interfaz; mantener autorización y persistencia de dominio en Core y las rutas equivalentes de Core durante la compatibilidad.
4. En `WI-CONSOLE-004`, especificar experiencia de OC01–OC15, happy paths primero y subcasos después.

## Verificación

Pruebas de rutas, permisos, freshness, accesibilidad, separación mock/live, sesión/token efímeros y ausencia de ZIP manual. Lint, tests, build, revisión independiente, UX cuando aplique y cuatro checkpoints Contract Sync.
