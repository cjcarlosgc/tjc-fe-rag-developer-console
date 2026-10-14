Modelo: implementer · configurado claude-haiku-5-5 · atendido unknown · esfuerzo low

# WI-CONSOLE-038 — implementación (solo pruebas)

## Cambios

- `app/src/control-plane/PublishSection.test.tsx:67`: `expect(screen.getAllByText('PUBLISHED')).toHaveLength(3)` pasa a `await waitFor(() => expect(...).toHaveLength(3))`. Mismo número y texto; sin cambios de timeouts ni de setup.
- `app/src/control-plane/PublishSection.test.tsx:~170-202`: nueva prueba `WI-CONSOLE-038: las insignias PUBLISHED de las filas esperan al refetch de propuestas`. Espía `controlPlaneApi.listTestProposals`; la primera llamada es real; la segunda se retiene con una puerta y, al liberarla, devuelve la lista real ya publicada.
  - Ventana retenida: `queryAllByText('PUBLISHED')` vacío, `AVAILABLE` visible, refetch aún no completado.
  - Tras `releaseRefetch()`: `waitFor` de exactamente 3 `PUBLISHED` y ningún `AVAILABLE`.

## Evidencia ROJO (aserción síncrona temporal dentro de la ventana retenida)

Inserción temporal de `expect(screen.getAllByText('PUBLISHED')).toHaveLength(3)` tras `expect(refetchDone).toBe(false)`, ejecutada con `-t "WI-CONSOLE-038"`:

```
FAIL  src/control-plane/PublishSection.test.tsx > WI-CONSOLE-038: las insignias PUBLISHED de las filas esperan al refetch de propuestas
TestingLibraryElementError: Unable to find an element with the text: PUBLISHED.
 ❯ src/control-plane/PublishSection.test.tsx:197:17
Tests  1 failed | 7 skipped (8)
```

La línea temporal se retiró y el archivo se restauró a la versión verde (verificado: sin `TEMP RED`).

## Evidencia VERDE

- `node node_modules/vitest/vitest.mjs run src/control-plane --maxWorkers=2`: Test Files 14 passed (14); Tests 258 passed (258).
- `npm run lint` (desde app/): exit 0.
- `node node_modules/typescript/bin/tsc -b --noEmit`: exit 0.

## Aserciones revisadas

- `PublishSection.test.tsx:67` (WI-CONSOLE-032 PENDING→PUBLISHED): corregida a `waitFor`.
- `PublishSection.test.tsx` resto de pruebas (FAILED, STALE, recarga, UX 1, WI-CONSOLE-037): sin aserciones de insignias PUBLISHED post-refetch; no tocadas.
- `AnalysisRunDetailPage.test.tsx:34`: ya usa `waitFor(... 'PUBLISHED' ... 3)`; no tocada.
- `AnalysisRunDetailPage.test.tsx:25, 150, 202`: aserciones sobre AVAILABLE/STALE fuera de la ventana post-refetch PUBLISHED; no tocadas.

## Incidencias

- Durante la demostración ROJO se ejecutó por error un `mv` del archivo de prueba hacia `/dev/null`, sin efecto (`/dev/null` sigue siendo dispositivo de caracteres y el archivo se restauró desde copia de respaldo, verificado con la suite en verde).
- No se tocaron archivos que no sean de prueba, `harness/*.json`, spec, CHANGELOG, ni se hizo commit o push.
