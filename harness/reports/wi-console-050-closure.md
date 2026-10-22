# WI-CONSOLE-050 — cierre

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Estado:** W-DONE. Desborde horizontal del documento en Experimento con resultado (`harness/reports/wi-console-050-scope-approval.md`). `reviewer` independiente: ciclo 1 APPROVED. `ux-reviewer`: ciclo 1 APPROVED (mediciones propias). 1 de 2 ciclos usados.

## Resultado

- Causa raíz corregida con una declaración: `position: relative` en `.table-frame` (`app/src/styles/components.css`). El `.visually-hidden` («Contexto») de la última columna queda contenido en el frame.
- Guarda estática en `app/src/styles/cssRegressionGuards.test.ts` (4 pruebas); ROJA al revertir (1 failed | 12 passed; verificada por implementer, leader y reviewer) y VERDE restaurada (13/13).
- Mediciones del leader (iframes en navegador integrado, modo demo): Experimento con resultado, documento 1342/1280, 1342/375 y 1342/320 antes; 1280/1280, 375/375 y 320/320 después. El `.table-frame` conserva su scroll interno (1461/1238, 1461/333, 1461/278). Detalle en `wi-console-050-implementation.md`.
- Auditoría del patrón: `visually-hidden` dentro de `th`/`td` con overflow solo existe en `ExperimentComparison.tsx`; las demás tablas (Inventario, comparación de recuperación) y páginas medidas no desbordan.
- Sin cambios de copy, DTO, rutas, contratos, realtime ni primitives.

## Pendientes (fuera de alcance, todos a 320 px y no por este patrón)

- FK lista: 328/320 (ya conocido, WI-CONSOLE-047).
- Comparación de recuperación pr52 con resultado 363/320 (`h2.retrieval-result-heading`) y comparación de estrategias pr52 354/320 (`dl`/`dt`/`dd`), hallados por el ux-reviewer: candidatos a WI-CONSOLE-047 o WI aparte; no se corrigieron.
- Observaciones menores del reviewer sobre la guarda (regex lazy puede cruzar celdas; chequeo `table-frame` a nivel de archivo): no bloqueantes.
- `.retrieval-table-wrap` no es posicionado: riesgo latente si se añade un `visually-hidden` dentro de su tabla.
- No probado: StructuredAlternativeView, lectores de pantalla reales, tema claro; el ux-reviewer midió con viewport limitado a 1024 px (no 1280 exacto).
