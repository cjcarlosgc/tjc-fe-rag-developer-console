# WI-CONSOLE-012 — Reproducción de la prueba de RunsPage

Modelo: leader · configurado claude-sonnet-5-5 · atendido claude-sonnet-5-5 · esfuerzo medium

- **WI/ST/HU:** `WI-CONSOLE-012` / `ST-CONSOLE-014` / `HU12, HU14`. Línea base: `6037b50` (rama `feature/jean`); `app/` sin cambios respecto de `51b11e7` para esta prueba.
- **Resultado:** el fallo **no se reproduce**. Cierre con evidencia y sin cambios de código.

## Intentos (todos desde `app/`)

| Modo | Comando | Zonas | Repeticiones | Resultado |
| --- | --- | --- | --- | --- |
| Aislada, fecha real | `TZ=<tz> npx vitest run src/control-plane/RunsPage.test.tsx` | UTC, America/Lima, Pacific/Auckland | 20 por zona (60) | 60/60 pasan (6/6 pruebas cada vez) |
| Aislada, fecha fija | igual, con config temporal que añade un setup `vi.useFakeTimers({toFake:['Date']}); vi.setSystemTime('2026-01-15T12:00:00Z')` en `beforeEach` | las tres | 20 por zona (60) | 60/60 pasan |
| Suite completa | `TZ=<tz> npx vitest run` | las tres | 1 por zona + 1 corrida sin TZ forzada (`npm test`) | 4/4: 53 archivos, 428 pruebas |

Mensaje de fallo exacto: ninguno; no hubo ninguna corrida fallida (no se generó ningún archivo de fallo). El config y setup temporales vivían fuera del repo (scratchpad) y no se commitearon.

## Análisis de causas posibles

- Fecha/zona: ni `RunsPage.tsx` ni su prueba usan `Date`, `toLocale*` ni `Intl`; confirmado empíricamente por las corridas con fecha fija y tres zonas.
- Orden/aislamiento: `src/test/setup.ts` hace `cleanup`, `setDataSourceForTests(null)`, `resetMockBackend()` y `vi.restoreAllMocks()` tras cada prueba, de modo que el `fetch` espiado de la prueba live no se filtra. Sin `.only`/`.skip`, sin timers ni aleatoriedad.
- Dependencia de fixture: la prueba afirma conteos del mock (6 `Success`, 16 `.repo-chip`); es sensible a cambios futuros del mock, pero hoy están alineados. No hay evidencia de expectativa obsoleta ni de bug real.
- Historia: el único cambio relacionado fue la prueba live añadida en `WI-CONSOLE-008`, que pasa.

## Gates (re-ejecutados por el Leader)

`npm run lint` OK · `npm test` 53/428 OK · `npm run build` OK (solo la advertencia habitual de tamaño de chunk) · `git status` de `app/` limpio.

## Decisión

No se inventa un arreglo. Si el usuario conoce un entorno/comando concreto donde falle, debe aportarlo para reabrir el WI con ese mensaje exacto.
