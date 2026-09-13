# Hallazgos del recorrido guiado — 15 casos del handoff SDD 2.0

**Estado:** en curso (se va actualizando caso por caso, no es un work item de código)
**Repository:** `tjc-fe-rag-developer-console`
**Contexto:** recorrido manual en navegador (Claude in Chrome) de los 15 casos
listados en `Handoff Frontend — Pantallas objetivo SDD 2.0.md` §49, uno a la vez.
Este documento junta los hallazgos de UX/cobertura que van saliendo — no implica
que se vayan a resolver ya, solo que quedan anotados para decidir después.

## Caso 1 — Cambio sin tests (`arun_checkout_pr45`, Run Detail)

1. **Sin indicador de "cobertura previa".** El nombre del caso ("cambio sin
   tests") describe el punto de partida — el símbolo cambiado no tenía ninguna
   prueba existente antes del PR — no el resultado (que sí tiene 3 propuestas
   generadas). La pantalla `AnalysisRunDetailPage` no muestra en ningún lado ese
   "antes": no hay un dato tipo "0 tests previos" o "cobertura previa: ninguna"
   que explique *por qué* el Run generó pruebas desde cero en vez de completar
   o no hacer nada (como sí pasa en los casos 2 y 3). Sin ese dato, el nombre del
   caso es ambiguo para alguien que solo ve la pantalla.
2. **El árbol de contexto (sección "Contexto recolectado", `RagGraph`) solo
   muestra señal semántica y estructural (RAG) — no hay ningún nodo que
   represente conocimiento funcional (`FunctionalKnowledgeResponse`, lo que el
   usuario respondió en Focus Mode).** Para este caso puntual es coherente: PR#45
   nunca pasó por `ACTION_REQUIRED`, así que no hubo pregunta que responder —
   probablemente porque el código ya traía suficiente información técnica
   (símbolo, imports, excerpts) sin necesitar una regla funcional humana. Pero
   la pantalla no lo aclara: no hay ningún estado tipo "no se consultó
   conocimiento funcional porque no hizo falta" ni, para un Run que *sí* usó
   Functional Knowledge (p. ej. uno derivado de `fk_discount_engine`), un nodo
   distinto que lo muestre en el árbol. Es decir: hoy el árbol de contexto es
   puramente RAG (HU27), nunca se extendió para representar el conocimiento
   funcional persistido como parte del contexto recolectado de un Run.

## Caso 2 — Tests existentes parciales

**No es demoable hoy — no es un gap de UI, es un gap de contrato.**
`AnalysisRunDetailResponse` (INTEROP-2.0 §6.10-6.12, modelo PR-driven) no tiene
ningún campo que indique si el símbolo cambiado tenía tests previos ni cuántos.
Solo existe `generatedTestsCount` (lo que generó *este* Run) y `resultSummary`
(texto libre). El campo `hasTest: boolean` sí existe en el contrato, pero
pertenece al modelo **legacy** (`TestInventoryResponse`/ZIP, sección Inventory) —
no se volvió a llevar al diseñar el modelo PR-driven nuevo.

Consecuencia: la pantalla de Run Detail para un símbolo con 0 tests previos
(Caso 1) y uno con cobertura parcial (Caso 2) se vería **idéntica** hoy, porque
el dato "cobertura previa" ni siquiera existe en el mock ni en el contrato —
no hay nada que pintar distinto. Resolverlo requeriría primero decidir si
INTEROP-2.0 agrega ese campo al modelo PR-driven (fuera de alcance de
frontend-only: es una decisión de contrato con RAG Core).

## Verificación

No aplica (documento de hallazgos, sin cambios de código en este commit).
