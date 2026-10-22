# WI-CONSOLE-048 — cierre

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Estado:** W-DONE. Polling de respaldo del detalle de `AnalysisRun` (`harness/reports/wi-console-048-scope-approval.md`). `reviewer` independiente: ciclo 1 CHANGES_REQUESTED (H1 bloqueante de registro del Harness: gates técnicos sin marcar al entrar en revisión; H2 comentario inexacto; H3 cobertura menor), ciclo 2 APPROVED (2 de 2 ciclos). `ux-reviewer` omitido: `uiImpact=false`, sin cambio de markup, copy ni estilos; el estado ya visible se actualiza solo.

## Resultado

- `useAnalysisRun(id, { pollWhileInProgress?, pollAfterMs? })` es opt-in; solo `AnalysisRunDetailPage` lo activa. Sondea mientras el Run está en `QUEUED`/`PROCESSING`, se detiene en terminal y ante error, y se reanuda solo si vuelve a `PROCESSING`.
- Intervalo: `pollAfterMs` si se informa (acotado a 250 ms–30 s, INTEROP-2.19 §5); sin él, 900 ms (`DEFAULT_POLL_MS`, el de la traza). El GET del Run no trae `pollAfterMs` (solo el `202` de creación), por eso es un parámetro opcional. `MODE test`: 10 ms.
- Con la pestaña oculta TanStack pausa el intervalo (valor por defecto, igual que el resto del polling).
- Convivencia con `useAnalysisRunRealtime`: sin cambios de lógica; solo invalida el GET.
- Sin cambio de DTO, rutas, markup, copy ni socket.

## Gates (leader, tras el último cambio)

`pnpm lint`, `pnpm exec tsc -b --noEmit`, `pnpm build`, `pnpm format:check` y `pnpm contracts:check` con exit 0; `pnpm test --maxWorkers=4` 94 archivos y 958 pruebas; reproducidos por el reviewer. `sdd-check`, `validate-work-items`, `validate-harness` y `validate-completions` en verde (ver el informe final). Mutaciones (reviewer): quitar el chequeo de estado, el clamp, `hasError`, el opt-in o redefinir «en curso» hacen fallar de 2 a 3 pruebas.

## Pendientes y decisiones para el usuario

- H3 (menor, aceptado): la prueba de convivencia no cubre un aviso del socket durante una lectura en vuelo. `invalidateQueries` la cancela y relanza: a lo sumo una petición extra no concurrente (comportamiento previo del realtime). Deduplicar más allá de TanStack sería una decisión aparte.
- El intervalo por defecto (900 ms) es el de la traza; si se prefiere uno más holgado (p. ej. 2 s como la publicación) dado que el tiempo real ya empuja avisos, es un ajuste de una constante.
- Si Core llegara a exponer `pollAfterMs` en el GET del Run, bastaría pasarlo al hook (ya soportado); requeriría cambio contractual.
- WI-CONSOLE-005 y 006 siguen W-PLANNED; DR-1..4, H5/H6 de WI-047 y menores de WI-044 siguen fuera de alcance.
