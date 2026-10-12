# WI-CONSOLE-031 — aprobación de alcance

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Fecha:** 2026-10-12
**Autoriza:** usuario (Human Reviewer), en el chat.

## Contexto y cita

El usuario pidió esperar el Contract Sync de Core para reanudar `WI-CONSOLE-004`: «reanuda WI 004 cuando core publique contract sync». Core publicó `CS-CORE-20261012-005` (WI-CORE-045, INTEROP-2.9, `targets: [console]`, `breaking: false`, revisión `30b9acdfbc063b027ad891799574b4553574559e`). Este WI es la sincronización rutinaria que exige el protocolo Contract Sync (`harness/contract-sync/README.md`): el consumidor importa y acusa. El usuario pidió seguir en cadena con este corte.

**Esto NO es la re-aprobación de `WI-CONSOLE-004`.** Ese WI permanece `W-READY` y pausado; su re-selección, su aprobación y sus decisiones (OC02, OC10, OC11, OC14) las confirma el usuario en un lanzamiento posterior.

## Alcance aprobado

1. Importar los eventos del outbox de Core y clasificar con evidencia los que apuntan a Console (`CS-CORE-20261012-005`); `CS-CORE-20261012-006` apunta a `github-integration` y queda `C-PENDING` documentado.
2. Espejar byte a byte INTEROP-2.9 y SYSTEM desde `30b9acdf` (`git show`, nunca el working tree de Core), verificando SHA-256 y ascendencia; actualizar las referencias vigentes de versión.
3. Lo que el evento pide en producto y aún no existe: `404 FUNCTIONAL_QUESTION_NOT_FOUND` al responder = pregunta obsoleta (copy «Esta pregunta ya no aplica») y refresco del inbox; no tratar `continuationAttemptId` no nulo como consultable; no mostrar `DEC-VAL-002` como regla vigente. Cambio de DTO/ruta o algo mayor: `DECISION_REQUIRED`.

## Fuera de alcance

Reanudar `WI-CONSOLE-004`, OC02/OC08/OC10/OC11/OC14/OC15 como casos, el WI de publicación, live, Core de Render, cambios de contrato, push, PR o merge.

Revisión independiente: mientras `awayMode.enabled` sea `true`, la hace el agente `reviewer`; no sustituye decisiones `DEC` ni aprobaciones de alcance o contrato.
