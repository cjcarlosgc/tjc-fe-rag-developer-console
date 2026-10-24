# WI-CONSOLE-039 — aprobación de alcance

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Fecha:** 2026-10-18
**Autoriza:** usuario (Human Reviewer), en el chat de Console (vía la sesión coordinadora cross).

## Cita literal

> «Aprobar los 4 WIs (Recomendado)»

Los cuatro WIs propuestos son WI-CONSOLE-039 (espejo INTEROP-2.17 y Contract Sync), WI-CONSOLE-040 (pnpm como gestor único, vía rápida), WI-CONSOLE-041 (regularización retroactiva de contratos y estabilización) y WI-CONSOLE-042 (regularización retroactiva de UI).

## Alcance aprobado para WI-CONSOLE-039: espejar INTEROP-2.17 y procesar Contract Sync

1. Espejar byte a byte `spec/contracts/interoperability-contract.md` desde Core (revisión `67519a20a5e061bd81a880fe539693c9a364bba3`, `git show`); digest esperado `b9ed40dc8d15a414b7cca4ccee4f320ba9da8f7444ef426b8321d17bdc0dea05` (la copia local daba `4bab54e8…`).
2. Verificar los cuatro digests: INTEROP, SYSTEM `b70f9358…`, GH-INTEROP `6c553ee8…` y árbol `spec/contracts/schemas` `c45e4513…`.
3. Regenerar tipos y ejecutar `contracts:check`, lint, tipos, pruebas y build.
4. Importar los eventos Contract Sync al inbox; acusar y resolver `CS-CORE-20261018-002` (target console) solo con evidencia real; `CS-CORE-20261012-008/-010/-012` y `CS-CORE-20261018-001/-003` no apuntan a Console: se clasifican NOT_RELEVANT sin acusarlos.

## Fuera de alcance

Cambios de DTO, rutas o UI; cualquier cambio en otros repositorios; la restricción CORS de Core (`CONSOLE_CORS_ORIGINS`) es del usuario/Core.

## Notas de registro

- Revisión independiente por el agente `reviewer` (el implementer nunca se revisa a sí mismo); no sustituye decisiones `DEC` ni aprobaciones de alcance o contrato.
- No hay push, PR ni merge; `main` no se toca.
