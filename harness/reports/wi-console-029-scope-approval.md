# WI-CONSOLE-029 — aprobación de alcance

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Fecha:** 2026-10-12
**Autoriza:** usuario (Human Reviewer), en el chat.

Sobre la lista de correcciones diferidas (`harness/reports/console-deferred-corrections.md`, grupo F) el usuario respondió literalmente: «hazlo todo de una», y confirmó «1» = un WI por grupo en el orden recomendado (A, F, C). Este WI toma la parte documental del grupo F: acusar y clasificar los eventos de Contract Sync de Core pendientes (`C-PENDING`).

## Alcance aprobado

1. Revisar con evidencia real cada evento `C-PENDING` del buzón (`CS-CORE-20261009-012`, `CS-CORE-20261010-001`, `-002`, `CS-CORE-20261011-002`, `-003`, `CS-CORE-20261012-002`, `-003`, `-004`) y decidir qué corresponde a Console.
2. Usar solo los comandos `acknowledge`/`resolve` del harness con reportes de evidencia reales; no modificar el contenido de ningún evento ni forzar estados a mano.
3. Un evento que exija trabajo de producto, una decisión o sincronizar espejos queda abierto con motivo y se documenta como dependencia de un WI futuro; no se implementa aquí.

## Fuera de alcance

- Código de `app/`, UI, API, contratos, sincronización de espejos, Core de Render, infraestructura, push, PR o merge.
- Los restantes puntos del grupo F (F1 de WI-CONSOLE-027, reanudar WI-CONSOLE-004, `awayMode`, handoff a Cross).

Revisión independiente: mientras `awayMode.enabled` sea `true` y por el «hazlo todo de una» del usuario, la hace el agente `reviewer`; no sustituye decisiones `DEC` ni aprobaciones de alcance o contrato.
