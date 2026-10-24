# WI-CONSOLE-042 — aprobación de alcance

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Fecha:** 2026-10-18
**Autoriza:** usuario (Human Reviewer), en el chat de Console (vía la sesión coordinadora cross).

## Cita literal

> «Aprobar los 4 WIs (Recomendado)»

Los cuatro WIs propuestos son WI-CONSOLE-039 (espejo INTEROP-2.17 y Contract Sync), WI-CONSOLE-040 (pnpm como gestor único, vía rápida), WI-CONSOLE-041 (regularización retroactiva de contratos y estabilización) y WI-CONSOLE-042 (regularización retroactiva de UI).

## Alcance aprobado para WI-CONSOLE-042: regularización retroactiva de UI

Regularizar a posteriori `3f6341c` (tokens, accesibilidad AA/40 px, skip link, 404, títulos, StatusBadge/EmptyState/PageHeader, mock diferido, sondeo central, Prettier/jsx-a11y; reporte `cross-fase4`). Revisión independiente por `reviewer` y `ux-reviewer` (obligatorio, toca UI), máximo 2 ciclos; si se agotan queda pendiente para el usuario. No cierra WI-CONSOLE-005 ni WI-CONSOLE-006 (cobertura parcial). Idioma de UI en español con términos de dominio en inglés. La Console sigue siendo el control plane de revisión/publicación; no se reinterpreta la autoridad MAINTAINER/ADMIN sobre Functional Knowledge.

## Fuera de alcance

Primitives adicionales, tiempo real/WebSocket, tag arch-v1.0 (en espera).

## Notas de registro

- Revisión independiente por el agente `reviewer` (el implementer nunca se revisa a sí mismo); no sustituye decisiones `DEC` ni aprobaciones de alcance o contrato.
- No hay push, PR ni merge; `main` no se toca.
