# WI-CONSOLE-036 — cierre

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Estado:** W-DONE. `?experimentId=` en la URL, motivo visible del botón «Ejecutar comparación» y selector sin constructor preseleccionado.

- B1: `experimentId` vive en la query de la misma ruta (preserva `analysisRunId`), reabre al montar; «Ver contexto →» y el breadcrumb del explorador lo conservan.
- B3: una nota `role="status"` (`#experiment-run-note`) con el motivo concreto; error de consulta con mensaje, correlation id, «Reintentar» e «Iniciar otra comparación».
- B4: constructores (`constructor`/`__construct`) al final sin filtrarlos, nota «puede no ser ejecutable»; copy propio de `UNRESOLVABLE_TARGET`. Heurística de presentación; raíz en Core (backlog #4 / IDEA-024).
- Ciclo 3 (único, autorizado por el usuario: `wi-console-036-third-cycle-authorization.md`): la query del experimento usa `retry: false`. Causa: sin foco/visibilidad el reintento de TanStack Query se pausa y la pantalla quedaba en «Preparando experimento…». ROJO→VERDE en `ExperimentPage.retry.test.tsx` con `focusManager.setFocused(false)`; ux-reviewer confirmó en navegador (mock) el alert en ~2,8 s con el documento oculto.
- `maxReviewCycles` sigue en 2 (el validador lo exige); el ciclo extra consta en `execution.extraReviewCycleAuthorization`.
- Seguimiento no bloqueante: foco cae a BODY tras «Iniciar otra comparación»; botones del error fuera de Black Glass; `workspaceId` no se conserva en la URL al quitar `experimentId`; sondeo en segundo plano queda en WI-037 (sin aprobación).
- Sin DTO, rutas ni Core; `CS-CORE-20261013-001/-002/-003` no se acusan ni se resuelven aquí.
