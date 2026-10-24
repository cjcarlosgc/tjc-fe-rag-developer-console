# WI-CONSOLE-049 — aprobación de alcance

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Fecha:** 2026-10-21
**Autoriza:** usuario (Human Reviewer), en el chat de Console (vía la sesión coordinadora cross).

## Cita literal

> «si»

Respuesta del usuario a la propuesta literal siguiente (la decisión de glosario viene de `[TN]-Cross`, decisión del usuario, alineada con `referencias/tesis.md`, donde `target`, `changeset`, `chunk`, `Functional Knowledge` y `ranking` aparecen en inglés, y «recuperación» y «discrepancia» en español):

> «WI-CONSOLE-049 (STANDARD, UI): pasan a inglés en la UI visible `target` (hoy «objetivo»/«Buscar objetivo»), `changeset` (hoy «Conjunto de cambios», 13 usos), `chunks` (hoy prohibido por la guarda), y `Functional Knowledge` y `Ranking` (ya decididos); se mantienen sin cambio «recuperación» (no «Retrieval») y «discrepancia de comportamiento» (no «Behavioral Mismatch»); toca los textos visibles, la spec del glosario (spec/transversal/design-system/spec.md) y ui/glossary.test.ts (quitar Target/Changeset/Chunks de FORBIDDEN_VISIBLE y añadir los términos permitidos); «objetivo» en la tesis significa objetivo específico (OE), no target: no tocarlo donde se refiera a OE, revisar uso por uso; reviewer + ux-reviewer, máx. 2 ciclos; fuera de alcance: pendientes de WI-047 (objetivos táctiles <40 px, desbordes a 320 px), reasoningEffortMessage, WI-005/006.»

## Alcance aprobado (STANDARD, `uiImpact=true`, `contractImpact=false`)

1. Pasan a inglés en la UI visible: `target` (hoy «objetivo»), `changeset` (hoy «Conjunto de cambios»), `chunk(s)` (hoy «fragmento(s)») y `Functional Knowledge` / `Ranking` (donde aún aparezcan en español). Se mantienen «recuperación» y «discrepancia de comportamiento».
2. Solo textos visibles (copy, aria-labels, title, placeholders, rótulos) y los literales de test que los afirmen. Sin cambio de identificadores de código, DTOs, rutas, claves de contrato ni enums crudos; sin tocar rótulos DEMO ni la autoridad MAINTAINER/ADMIN sobre Functional Knowledge.
3. Inventario completo y tabla de decisiones por uso (conservar/cambiar/motivo, marcando los de objetivo específico, OE) antes de editar; convención de concordancia y plural documentada en el glosario y aplicada de forma consistente.
4. Spec del glosario (`spec/transversal/design-system/spec.md`) y `ui/glossary.test.ts` actualizados: los términos dejan de estar prohibidos, se verifica que los permitidos aparecen donde corresponde y se mantienen las prohibiciones restantes (Retrieval, Behavioral Mismatch, etc.).
5. `reviewer` y `ux-reviewer` independientes, máximo 2 ciclos; el ux-reviewer valida legibilidad y coherencia en las pantallas afectadas con capturas o mediciones (modo demo, 1280 y 375 px) y sin desbordes nuevos.

## Fuera de alcance

Pendientes de WI-CONSOLE-047 (objetivos táctiles < 40 px, desbordes a 320 px), `reasoningEffortMessage`, WI-CONSOLE-005 y 006 (siguen `W-PLANNED`); cambios de DTO, rutas, contratos, realtime o primitives nuevas.

## Reglas

- Una decisión no cubierta se registra como `DECISION_REQUIRED` y se aparca, sin inventar aprobación.
- Pruebas con fake timers o reloj inyectado, nunca reloj real.
- Sin push, PR ni merge; `main` no se toca.
