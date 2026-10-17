# WI-CONSOLE-033 — aprobación de alcance

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Fecha:** 2026-10-12
**Autoriza:** usuario (Human Reviewer), en el chat (de Console y de la sesión Cross).

## Contexto y cita

Core publicó `CS-CORE-20261012-007` (WI-CORE-047, SYSTEM/INTEROP-2.10, `targets: [console]`, revisión `f501aef7c0bf36c702e8703abf4f522ab29a54b8`) y `CS-CORE-20261012-009` (WI-CORE-049, SYSTEM/INTEROP-2.11, `targets: [console]`, revisión `b07d188a6ad60051e40e4d47ae44ec06aa0de50f`), ambos `breaking: false`. Mientras corría el WI, Core publicó `CS-CORE-20261012-011` (WI-CORE-049, SYSTEM/INTEROP-2.12, `targets: [console]`, revisión `864aa837b95fa379cc2c6d0a98f37521ff3eb3b6`, sucesor de -009/-010); el orquestador (Cross) pidió incorporarlo a este mismo WI sin abrir otro. Este WI es la sincronización rutinaria que exige el protocolo Contract Sync (`harness/contract-sync/README.md`): el consumidor importa, espeja y acusa. El usuario pidió por Cross «importa, exporta, lo necesario para destrabar los otros» y, en el chat de Console, seguir la cola (publicación → reanudar `WI-CONSOLE-004`).

**Esto NO es la re-aprobación de `WI-CONSOLE-004`.** Ese WI permanece `W-READY` y pausado; su re-selección, su aprobación y sus decisiones (OC02, OC10, OC11, OC14) las confirma el usuario en un lanzamiento posterior.

## Alcance aprobado

1. Clasificar con evidencia los eventos del outbox de Core que apuntan a Console (`-007`, `-009`, `-011`) y fijar su precedencia; `-008` (github-integration) y `-010`/`-012` (sandbox) no son de Console.
2. Espejar byte a byte SYSTEM, INTEROP y GH-INTEROP desde la revisión canónica más reciente que contenga los tres eventos (`864aa837`) (`git show`, nunca el working tree de Core), verificando SHA-256 y ascendencia; actualizar referencias vigentes de versión.
3. Producto solo si el evento lo pide y hoy no se cumple: `resultSummary` de OC11 como texto libre sin depender de «300»; un Run `INFRASTRUCTURE_FAILURE` con propuestas `AVAILABLE` no es publicable. `DEC-INF-002` (aprobada as-built) y `DEC-VAL-002` (aprobada, implementada en Core) no se muestran como regla de UI. Nota: el texto inicial de la solicitud decía que `DEC-VAL-002` seguía `PROPOSED`; tras el espejo 2.12 ya está aprobada. DTO, ruta, comportamiento nuevo o decisión: `DECISION_REQUIRED`.

## Fuera de alcance

Reanudar `WI-CONSOLE-004`, OC02/OC08/OC10/OC11/OC14/OC15 como casos de la Feature 013, live, Core de Render, cambios de contrato, push, PR o merge.

Revisión independiente: mientras `awayMode.enabled` sea `true`, la hace el agente `reviewer`; no sustituye decisiones `DEC` ni aprobaciones de alcance o contrato.
