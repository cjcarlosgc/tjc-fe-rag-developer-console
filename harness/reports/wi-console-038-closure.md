# WI-CONSOLE-038 — cierre

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Estado:** W-DONE. Estabilizada `PublishSection.test.tsx` esperando las insignias `PUBLISHED` tras el refetch de propuestas; solo pruebas.

- Antes/después: `expect(screen.getAllByText('PUBLISHED')).toHaveLength(3)` (síncrona, L67) pasa a `await waitFor(() => expect(...).toHaveLength(3))`; mismo número y texto. Las filas siguen AVAILABLE hasta que llega el refetch (`useRefreshOnPublicationTerminal`) y la versión síncrona fallaba bajo carga con «Unable to find an element with the text: PUBLISHED».
- ROJO→VERDE: nueva prueba `WI-CONSOLE-038` retiene el refetch con una puerta; en la ventana afirma 0 PUBLISHED y AVAILABLE visible, y tras liberarla 3 PUBLISHED y 0 AVAILABLE. Con la aserción síncrona dentro de la ventana falla de forma determinista.
- Misma ventana en otros sitios: `AnalysisRunDetailPage.test.tsx:34` ya usaba `waitFor`; el resto de `PublishSection.test.tsx` no lee insignias de filas post-refetch. Nada más cambia.
- Evidencia del leader: lint 0, `tsc -b --noEmit` 0, vitest `--maxWorkers=2` 806/806, 5 corridas completas sin límite de workers 806/806 (0 fallos), build 0, validadores pasan.
- reviewer (awayMode) APPROVED en ciclo 1 de 2; contract-reviewer y ux-reviewer no aplican (sin producto ni UI).
- Sin producto, DTO, rutas, contrato, setup ni timeouts; sin push.
- Nota de registro: el id WI-CONSOLE-038 estaba nombrado como reservado a la UI informativa de campos nuevos; ese WI necesitará otro id.
