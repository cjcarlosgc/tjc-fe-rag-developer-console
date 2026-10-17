# WI-CONSOLE-027 — cierre

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Fecha:** 2026-10-12 · **Estado:** `W-DONE` · **Revisión independiente:** `reviewer` (awayMode activo), APPROVED, 1 ciclo.

## Resultado
- B1: el estado `FAILED` de un experimento ya mostraba la alerta con el mensaje por `failureCode` desde WI-CONSOLE-026; el WI lo verificó en navegador (3 escenarios mock, contraste ≥ 9.5:1, sin «Preparando», spinner, reanudar ni ganador) y añadió aserciones de ausencia de `.live-indicator`/`.experiment-progress`. El ítem B de las correcciones diferidas queda cerrado por verificación.
- B2: `RETRIEVAL_COMPARISON_WORKER_LOST` → «La comparación se interrumpió; vuelve a crearla.» (no alcanzable en el mock; cubierto por prueba).
- B3: `useEvidence` y `evidenceKeys` retirados (sin consumidores); la cobertura 409/404 sigue en `EvidenceDownload.test.tsx`.
- D: causa medida: `findBy/waitFor` con 1000 ms por defecto y con timeouts explícitos de 2000/3000 ms, `testTimeout` de 5000 ms frente a 16 workers y una carrera de prueba en el foco de HU56 y en el toggle de ContextExplorer. Corrección: `asyncUtilTimeout: 5000`, `testTimeout: 15000`, timeouts explícitos subidos a 5000 y esperas de estado asentado, sin tocar aserciones.

## Antes / después (suite completa, 723 pruebas, sin límite de workers)
- Antes: 4 de 4 corridas con 2 a 6 fallos (721, 720, 717, 720 de 723); con `--maxWorkers=2`, 3 de 3 verdes.
- Después: implementer 6 corridas sin límite y 2 con `--maxWorkers=2`; leader 3 sin límite y 1 con `--maxWorkers=2`; reviewer 1; todas 723/723 (muestra modesta, ver F2 del reviewer).

## Seguimiento (fuera de alcance)
`ContextExplorerPage.updateParams` (setSearchParams funcional de react-router) puede perder `view=list` bajo carga si un efecto fija `node`/`trace` en el mismo ciclo. Posible defecto de producto; requiere un WI aparte con aprobación. Los timeouts globales deberían reducirse si se corrige.

Evidencia: `wi-console-027-{scope-approval,sdd-verification,contract-sync-scope-review,implementation,ux-review,review}.md`. Sin push ni PR.
