# WI-CONSOLE-038 — verificación SDD

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

WI de solo pruebas; análisis breve del leader (sin sdd-analyst, como WI-CONSOLE-029).

## Veredicto: SUFICIENTE

- Alcance aprobado por el usuario (`wi-console-038-scope-approval.md`); criterios verificables; sin contrato, DTO, rutas ni pantallas.
- `decisionGate`: ninguna DEC `PENDING`/`PROPOSED` con `Blocks` alcanza `PublishSection.test.tsx`; blockingDecisionIds vacío.
- Contract Sync: `start` registrado sin pendientes relevantes; los cuatro históricos sin `scopePaths` se clasifican NOT_RELEVANT con los mismos digests (`wi-console-038-contract-sync-scope-review.md`).

## Hallazgo

`PublishSection.test.tsx`, prueba «PENDING → PUBLISHING → PUBLISHED…»: tras `findByText('Companion PR publicado')` (estado de la publicación en memoria) afirma de forma síncrona `getAllByText('PUBLISHED')).toHaveLength(3)`. Las insignias de las filas dependen del refetch de propuestas (`useRefreshOnPublicationTerminal`), que llega después; bajo carga las filas siguen en AVAILABLE y la aserción falla.

Misma ventana en otros archivos: `AnalysisRunDetailPage.test.tsx` L34 ya usa `waitFor`; la prueba de recarga («propuestas ya PUBLISHED sin publicationId») no afirma insignias; las pruebas FAILED/STALE no leen el estado de las filas. No hay otras aserciones síncronas de esta ventana (se confirma al implementar).

## Corte

Solo `app/src/control-plane/PublishSection.test.tsx`: esperar las insignias con `waitFor` conservando 3 y `PUBLISHED`; prueba ROJO que retiene el refetch con una puerta (espía `listTestProposals` como en WI-CONSOLE-037) y afirma, antes de liberarla, que las filas aún no son PUBLISHED y que tras liberarla llegan 3.
