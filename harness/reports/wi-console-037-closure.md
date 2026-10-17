# WI-CONSOLE-037 — cierre

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Estado:** W-DONE. F1 de ContextExplorer y «Publicar» oculto con la publicación PUBLISHED.

- Antes/después F1: `updateParams` usaba `setSearchParams(fn)` cuyo `previous` es el `searchParams` del render, de modo que dos escrituras antes del siguiente render se pisaban. Ahora compone desde `latestSearchRef` (última query escrita, reconciliada con `location.search`). Causa en `ContextExplorerPage.tsx:96-103` (HEAD); corrección en L96-108.
- Antes/después Publicar: con `publication.status === 'PUBLISHED'` y propuestas aún AVAILABLE reaparecía «Publicar N propuesta(s)»; ahora `publishedNow` lo oculta, junto con su párrafo de oferta y la nota de solo lectura (`AnalysisRunDetailPage.tsx:71-73,80,134`).
- Pruebas ROJO→VERDE por punto verificadas contra el código sin corregir. Se retiró `waitForDefaultSelection`; las aserciones no cambian y los timeouts globales no se tocaron.
- Evidencia del leader: lint 0, `tsc -b --noEmit` 0, vitest `--maxWorkers=2` 805/805, 3 corridas completas sin límite de workers 805/805, 5 corridas de `src/context-explorer` 48/48, build 0.
- ux-reviewer APPROVED (contraste ≥9.5:1, foco a `.publication-result`, sin desborde 375/768/1024); reviewer APPROVED en ciclo 1 de 2.
- Seguimientos no bloqueantes: cabecera «Sin propuestas disponibles» mientras las filas aún muestran AVAILABLE hasta el refetch (~0,2-0,5 s); semántica con AVAILABLE nuevas tras recargar sin publicación en memoria (se sigue ofreciendo).
- Nota de registro: el id WI-CONSOLE-037 estaba nombrado en reportes como reservado al sondeo en segundo plano; ese WI necesitará otro id.
- Sin DTO, rutas, contrato ni Core; sin push.
