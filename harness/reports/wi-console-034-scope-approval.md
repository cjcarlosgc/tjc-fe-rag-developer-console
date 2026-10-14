# WI-CONSOLE-034 — aprobación de alcance

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Fecha:** 2026-10-14
**Autoriza:** usuario (Human Reviewer), literalmente en el chat de Console.

## Cita

> «Apruebo espejar en Console byte a byte SYSTEM-2.12 e INTEROP-2.16 desde Core y acusar CS-CORE-20261012-011/012, CS-CORE-20261013-001/002/003 y CS-CORE-20261014-001, sin cambio funcional; sin push ni despliegue sin mi orden.»

## Alcance aprobado

1. Importar los eventos del outbox de Core y conservar solo los dirigidos a Console; acusar (`acknowledge`) y resolver con evidencia real los que lo estén.
2. Espejar byte a byte SYSTEM-2.12 e INTEROP-2.16 (y verificar GH-INTEROP) desde la revisión canónica más reciente que cita `CS-CORE-20261014-001` (`git show`, nunca el working tree de Core), con SHA-256 y ascendencia verificados; actualizar referencias vigentes de versión.
3. Sin cambio funcional, de DTO, rutas ni UI. Verificar que los campos nuevos (`technicallyValidRate`, `assertionFailureCount`, `dependencyContext`, `final`, `startedAt`/`completedAt`) no producen regresión de tipos ni mapeos.

## Nota de verificación

`CS-CORE-20261012-012` tiene `targets: [sandbox]` en el outbox de Core: no es un evento de Console y el Harness no admite acusarlo (`acknowledge` exige `targets` con `console`). Se reporta y no se fuerza su estado. `CS-CORE-20261012-011` ya está `C-RESOLVED` desde WI-CONSOLE-033.

## Fuera de alcance

Sondeo en segundo plano (WI-CONSOLE-037), UI informativa de campos nuevos (WI-CONSOLE-038, sin aprobación), trazas live, Core de Render, push, PR, despliegue.

Revisión independiente: mientras `awayMode.enabled` sea `true`, la hace el agente `reviewer`; no sustituye decisiones `DEC` ni aprobaciones de alcance o contrato.
