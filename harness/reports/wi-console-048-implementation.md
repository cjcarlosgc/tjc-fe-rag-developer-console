# WI-CONSOLE-048 — implementación

Modelo: implementer · configurado claude-haiku-5-5 · atendido unknown · esfuerzo low

## Cambios (app/)

- `control-plane/queries.ts`: `isInProgressAnalysisRunStatus` (solo `QUEUED`/`PROCESSING`, la definición ya usada por la traza §6.16, `ExperimentPage` y el detalle), `analysisRunPollIntervalMs` (función pura con `testMode` inyectable, como `publicationPollIntervalMs`) y `useAnalysisRun(id, { pollWhileInProgress?, pollAfterMs? })`.
- `control-plane/AnalysisRunDetailPage.tsx`: activa `pollWhileInProgress: true` y sustituye el chequeo literal por `isInProgressAnalysisRunStatus` (equivalente, sin cambio de markup ni copy).
- `experiments/ExperimentPage.tsx`: mismo reemplazo equivalente del chequeo literal (línea 80).
- `control-plane/useAnalysisRunRealtime.ts`: solo comentario de cabecera actualizado.
- `control-plane/analysisRunPolling.test.tsx` (nuevo, 15 pruebas).

## Decisiones de diseño documentadas

- **Opt-in:** `useAnalysisRun` lo usan cuatro páginas; por defecto no sondea, solo el detalle del Run lo activa.
- **Estados:** en curso = `QUEUED`/`PROCESSING`; `ACTION_REQUIRED` y `OBSOLETE` no sondean. Al volver a `PROCESSING` (tras responder una pregunta) el intervalo se reanuda solo porque `refetchInterval` es una función del estado.
- **`pollAfterMs`:** el GET del Run no lo incluye (solo el `202` de creación, INTEROP-2.19 §5), por eso es un parámetro opcional; acotado con `clampPollMs` (250 ms–30 s). Sin él, `DEFAULT_POLL_MS` (900 ms), el mismo de la traza. En `MODE === 'test'`, `TEST_POLL_MS` (10 ms), el modo acelerado centralizado de `api/polling.ts`.
- **Error:** `refetchInterval` devuelve `false` si la consulta está en error; no hay bucle de reintentos.
- **Pestaña oculta:** `refetchIntervalInBackground` queda en su valor por defecto (`false`): TanStack pausa el intervalo con la pestaña oculta, igual que el resto del polling del repo.
- **Convivencia con el realtime:** el aviso solo invalida el GET; el intervalo sigue. Nota técnica: `invalidateQueries` cancela una lectura en vuelo y relanza una, por lo que un aviso del socket durante un sondeo puede generar una petición extra no concurrente en la caché (comportamiento previo del realtime; no se añade deduplicación propia).
- Sin cambio de DTO, rutas, markup, copy ni socket.

## Pruebas (fake timers, sin reloj real)

Función pura con `testMode` falso (5000→5000, 100→250, 999999→30000, ausente/0/NaN→900; error→false; estados terminales y sin datos→false) y verdadero; hook: sondea en `PROCESSING`, se detiene en `SUCCESS` y en error, sin opción no sondea, respeta `pollAfterMs` y su mínimo, desmontar no vuelve a pedir, cambiar de Run no sondea el anterior, y convivencia con `useAnalysisRunRealtime` (un aviso = una lectura extra, el intervalo continúa). Con fake timers el render de react-query no refleja el refetch de fondo, por lo que algunas pruebas verifican la caché y el conteo de llamadas.

**Mutación (ROJA):** ignorar `hasError`, no parar en `SUCCESS` y no acotar `pollAfterMs` hacen fallar el archivo (2, 3 y 2 fallos). Restaurado.

## Checks (implementer; reproducidos por el leader)

`pnpm lint`, `pnpm exec tsc -b --noEmit`, `pnpm test --maxWorkers=4` (94 archivos, 958 pruebas), `pnpm build`, `pnpm format:check` y `pnpm contracts:check`: en verde.
