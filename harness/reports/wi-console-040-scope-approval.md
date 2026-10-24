# WI-CONSOLE-040 — aprobación de alcance

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Fecha:** 2026-10-18
**Autoriza:** usuario (Human Reviewer), en el chat de Console (vía la sesión coordinadora cross).

## Cita literal

> «Aprobar los 4 WIs (Recomendado)»

Los cuatro WIs propuestos son WI-CONSOLE-039 (espejo INTEROP-2.17 y Contract Sync), WI-CONSOLE-040 (pnpm como gestor único, vía rápida), WI-CONSOLE-041 (regularización retroactiva de contratos y estabilización) y WI-CONSOLE-042 (regularización retroactiva de UI).

## Alcance aprobado para WI-CONSOLE-040: pnpm como gestor único (lane FAST)

Eliminar `app/package-lock.json` y toda referencia vigente a npm en scripts, CI, README, `spec/constitution/tech-stack.md` y docs de proceso; un solo lockfile pnpm; `packageManager` en `app/package.json` si procede. Sin cambio de comportamiento ni de contrato. No se reescriben reportes históricos ni CHANGELOG pasado, ni los contratos espejados.

## Fuera de alcance

Contratos espejados, reportes históricos, CHANGELOG pasado, cambios de comportamiento.

## Notas de registro

- Revisión independiente por el agente `reviewer` (el implementer nunca se revisa a sí mismo); no sustituye decisiones `DEC` ni aprobaciones de alcance o contrato.
- No hay push, PR ni merge; `main` no se toca.
