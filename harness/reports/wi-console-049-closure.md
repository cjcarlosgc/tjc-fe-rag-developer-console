# WI-CONSOLE-049 — cierre

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Estado:** W-DONE. Glosario es/en de la UI (`harness/reports/wi-console-049-scope-approval.md`). `reviewer` independiente: ciclo 1 APPROVED (0 bloqueantes, 2 menores). `ux-reviewer`: ciclo 1 APPROVED (1280 y 375 px, modo demo; sin desbordes nuevos). 1 de 2 ciclos usados.

## Resultado

- `target`, `changeset`, `chunk(s)` y `Functional Knowledge` en inglés en el texto visible; «recuperación», «discrepancia de comportamiento», `ranking`, «Fragmento de código» (`CODE_FRAGMENT`) y «Destino de la regla» sin cambio; «objetivo» como OE/táctil no se tocó (no hay OE en la UI). Tabla de decisiones por uso en `wi-console-049-sdd-verification.md`.
- Spec del glosario con la convención (masculino, plural con -s, `Functional Knowledge` invariable, mayúscula solo en rótulos); guarda `ui/glossary.test.ts` actualizada y verificada por mutación.
- Sin cambio de identificadores, DTOs, rutas, enums, contratos, realtime ni primitives.

## Gates (leader y reviewer)

`pnpm lint`, `tsc -b --noEmit`, `pnpm build`, `pnpm format:check`, `pnpm contracts:check` con exit 0; `pnpm test --maxWorkers=4` 94 archivos y 959 pruebas; `sdd-check`, `validate-work-items`, `validate-harness` y `validate-completions` en verde (ver el informe final).

## Pendientes y decisiones para el usuario

- Menor (preexistente, no atribuible a este WI, ux-reviewer): la página de Experimento con resultado mide 1355 px de documento a 1280 y 375 px; causa: `<span class="visually-hidden">Contexto</span>` en el `th` de la última columna de la tabla de repeticiones (posición absoluta sin ancestro posicionado que escapa de `.table-frame`; existía en `900307a`). Candidato a WI aparte (p. ej. `position: relative` en `.table-frame`).
- `Candidatos por ranking del modo …` se conserva en minúscula (el glosario usa `Ranking` solo como rótulo de columna): confirmar si se desea capitalizar.
- «Destino de la regla» (Focus Mode) convive con «Target»: decisión de glosario aparte si se quiere unificar.
- El contrato `interoperability-contract.md:380` conserva «conocimiento funcional aplicable» (divergencia de copy aceptada, no se toca).
- No probado: 320 px, Focus Mode, Retrieval Comparison, Integraciones, mensaje demo del conflicto, lectores de pantalla reales; pendientes de WI-047 y WI-005/006 siguen fuera de alcance.
