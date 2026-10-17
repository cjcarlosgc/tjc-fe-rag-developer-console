# Revisión independiente de código — WI-CONSOLE-002 (ciclo 1)

Fecha: 2026-09-25. Reviewer independiente: agente `console_code_review`. Veredicto: `CHANGES_REQUESTED`.

## Hallazgo bloqueante

- **P2 — enlace visible a ProjectVersion perdido.** El único enlace entrante a `/projects/:projectId/analyses` estaba en `LegacyToolsPage`, retirada por este WI. La ruta y `AnalysisHistoryPage` siguen implementadas, pero el detalle del proyecto y `ProjectTabs` no ofrecen otro punto de entrada. El historial queda accesible solo con URL directa, lo que deja la consulta de ProjectVersion no descubrible.
- **Corrección mínima:** reponer desde el Overview o la navegación del proyecto un acceso a «Historial de análisis»/«Snapshots», solo lectura, sin restaurar carga ni generación manual.

## Verificaciones

- No se encontraron regresiones en las rutas/adapters de AnalysisRun PR-driven ni en las consultas mock/live de historial e inventario de ProjectVersion.
- La paginación limitada a 100 versiones es una limitación previa a este WI; tratar aparte si se requiere historial completo.
- Se revisaron `AGENTS.md`, SDD, contratos, rutas, adapters, mocks y pruebas afectadas. No se ejecutaron pruebas en esta revisión; la implementación previa registra 420 pruebas, lint y build satisfactorios.

## Cierre

Blocker: acceso visible al historial. Corregir y solicitar revisión independiente de nuevo.
