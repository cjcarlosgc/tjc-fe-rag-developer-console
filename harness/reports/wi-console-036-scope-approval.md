# WI-CONSOLE-036 — aprobación de alcance

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Fecha:** 2026-10-13
**Autoriza:** usuario (Human Reviewer), en el chat de Console.

## Cita literal

> «Apruebo el alcance de WI-CONSOLE-036: experimentId en la URL, motivo visible cuando no se puede lanzar y no preseleccionar el constructor en el selector (sin filtrarlo). Sin push ni despliegue sin mi orden.»

## Alcance aprobado

1. B1: `?experimentId=` en la misma ruta del experimento; al lanzar con éxito se escribe preservando `analysisRunId`; al montar se reabre ese experimento (GET /experiments/{id} y resultados); recargar o compartir conserva el estado; un id inexistente o fallido muestra error claro.
2. B3: nota `role="status"` bajo «Ejecutar comparación» con el motivo concreto cuando no lanza o está deshabilitado; manejo de `experimentQuery.isError` con mensaje, correlation id y «Reintentar».
3. B4: no preseleccionar un constructor (`constructor`/`__construct`) en el selector: se ordenan al final sin filtrarlos; nota breve si el seleccionado es constructor; mensaje claro para `UNRESOLVABLE_TARGET`. Es heurística de presentación por nombre; la raíz es de Core (backlog #4 / IDEA-024).

## Fuera de alcance

Sondeo en segundo plano (WI-037, sin aprobación), Contract Sync 2.13–2.15, listado GET /analysis-runs/{id}/experiments, UI informativa, trazas de contexto live, cambios de contrato/Core, rutas nuevas, accesibilidad global, push, PR o despliegue.

## Notas de registro

- Origen: `harness/reports/fase2-diagnostico-console.md`, ítems B1, B3, B4.
- Revisión independiente: mientras `awayMode.enabled` sea `true`, la hace el agente `reviewer`; no sustituye decisiones `DEC` ni aprobaciones de alcance o contrato.
