# 013 — Plan del control plane

## Dependencias

SYSTEM-2.4/INTEROP-2.4, identidad Supabase, diseño, routing, query cache y adapters `mock|live`. La futura frontera GitHub Integration se define antes de adaptar consumidores; la Console mantiene Core como API de dominio.

## Cortes

1. Alinear pantallas y adapters con las 18 HU vigentes y eliminar rutas de carga ZIP, generación manual y descarga legacy en `WI-CONSOLE-002`.
2. Mantener Projects, Runs, Action Required, Focus Mode, propuestas, trazas, publicación y experimentos ligados a AnalysisRun con estados loading/error/empty/success y permisos correctos.
3. En `WI-CONSOLE-003`, adaptar consumidores al contrato aprobado del cuarto componente sin llamadas directas de automatización desde el navegador.
4. En `WI-CONSOLE-004`, especificar experiencia de OC01–OC15, happy paths primero y subcasos después.

## Verificación

Pruebas de rutas, permisos, freshness, accesibilidad, separación mock/live y ausencia de ZIP manual. Lint, tests, build, revisión independiente, UX cuando aplique y cuatro checkpoints Contract Sync.
