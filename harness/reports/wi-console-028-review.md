Modelo: reviewer · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

# WI-CONSOLE-028 — revisión independiente

Contexto: Modo fuera de casa activo (`awayMode`, activado por el usuario). Reviewer distinto del implementer. Estado: **APPROVED** (1 ciclo), sin bloqueantes.

- PULL `before-review`: `relevantPendingSyncIds=[]`; `CS-20260920-003` y `CS-20260921-001/-002/-003` NOT_RELEVANT; `CS-20260920-002` resuelto.
- Criterios: foco 2.70:1 → 10.6:1; «VS» 4.17:1 → 10.68:1; `breadcrumbs-sep` 4.17:1 (aria-hidden); `repo-sep` 9.95:1; sin desborde a 375/768/1024/1440 (incluida la cabecera, Corte B); sellos con ancho de contenido; foco restaurado en `onError`/ABSTAINED; `role="status"` fijo; H1→H2; «—» en Intento/Evaluable. Bordes de evidencia y P@10/R@10 evaluados contra WCAG 1.4.11 y documentados sin cambio.
- Pruebas no tautológicas: los dos tests de foco fallan sin el fix (mutación en worktree ANTES); los de status, H2 y «—» fallan con el código anterior.
- Sin cambios de contratos, DTO, API ni adapters; mocks no presentados como live; `spec/transversal/accessibility/tasks.md` solo añadió ST-CONSOLE-030.
- Gates reejecutados: lint, `tsc -b --noEmit`, vitest `--maxWorkers=2` 728/728, build, validate-harness.

Observaciones menores (no bloqueantes): foco tras error/ABSTAINED solo cubierto por RTL con fetch simulado; dos regiones `status` coexisten durante la carga de Functional Knowledge; orden de foco con lector de pantalla no verificado; el `h2` del resumen replica el tamaño del h3 con `font-size: 1.17em`. `ContextExplorerPage.test.tsx` «alterna entre vista de grafo y lista» es intermitente sin límite de workers (F1 de WI-027, archivo no tocado).
