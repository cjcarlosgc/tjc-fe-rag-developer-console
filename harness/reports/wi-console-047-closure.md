# WI-CONSOLE-047 — cierre

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Estado:** W-DONE. Mejoras de UX acotadas (punto 3 de la orden del usuario, `harness/reports/wi-console-047-scope-approval.md`). `reviewer` APPROVED y `ux-reviewer` APPROVED, ambos tras 2 ciclos de 2 (ciclo 1: reviewer APPROVED con menores, ux-reviewer CHANGES_REQUESTED; ciclo 2: ambos APPROVED), independientes del implementer. WI-CONSOLE-005 y WI-CONSOLE-006 **siguen W-PLANNED**. Sin push, PR ni merge.

## Mediciones antes → después (navegador real, demo mock)

| Obs. | Medida | Antes | Después |
|---|---|---|---|
| 1 | Enlace de marca `a.brand` | 161×32 | 161×40 |
| 1 | «Saltar al contenido» enfocado | 184×37 | 184×40 |
| 1 | Pestañas de proyecto (alto) | 39 | 40 (5 pestañas) |
| 2 | Focus Mode `scrollWidth` a 375 px | 413 | 375 (causa real: `h2` con token largo sin `overflow-wrap`, no `.pr-ref`) |
| 2 | Barrido a 320/375 px, 22 detalles de Run + Action Required + Focus Mode | 6 desbordes | 50/50 sin desborde |
| 3 | Rótulos en inglés fuera del glosario | CONNECTED, ACTIVE PRS, Integration branch, Latest:, Overview, Integrations, etc. | español; guarda `ui/glossary.test.ts` |
| 4 | Badge nav / KPI del workspace / tarjetas / Runs ACTION_REQUIRED | 6 / 4 / 4 / 4 | 5 (global, rotulado) / 3 (workspace, rotulado) / 3 / 5 |
| 5 | `VITE_CORE_API_URL=ftp://x` en live | página en blanco | pantalla «Configuración no válida», role alert, sin valor crudo; en mock el demo arranca |
| 6 | Zoom 200 % (640 CSS px) y 375 px, 8 páginas | no medido | 8/8 sin scroll horizontal; 320 px 8/8 tras corregir `.pr-ref` y la vista previa de Projects |
| 6 | Reduced motion en ejecución (CDP) | no medido | transición máxima 0.01 ms con reduce (150 ms sin reduce); estático ≤ 120 ms en 3 CSS |

El «3» del handoff era el límite de la vista previa (`ACTION_REQUIRED_PREVIEW_LIMIT`), no un conteo de Runs. Decisión de demo (para el usuario): el PR #17 (OBSOLETE) sale de la bandeja y se añade el Run `arun_checkout_pr52`, para que un Run sea ACTION_REQUIRED sii aparece en la bandeja.

## Gates (leader, tras el último cambio)

Reproducidos por el leader y por el reviewer en el ciclo 2: `pnpm lint`, `pnpm exec tsc -b --noEmit`, `pnpm build`, `pnpm format:check` y `pnpm contracts:check` con exit 0; `pnpm test --maxWorkers=4` 93 archivos y 943 pruebas; `sdd-check`, `validate-work-items`, `validate-harness` y `validate-completions` en verde al cierre.

## Pendientes y decisiones para el usuario (no implementados, fuera del alcance aprobado)

- DR-1 a DR-4: migas de pan (17 px), «Ver todos →» (18 px), «Ver inventario →» del Historial (34 px, ×3) y la fila «Historial de transiciones» (18 px) están por debajo de 40 px; subirlos cambia el layout global.
- D-b (mayúsculas por CSS dentro del nombre accesible) y D-c (`user-email` truncado a ≤ 375 px).
- H5/H6 del ux-reviewer, solo a 320 px (el criterio aprobado era 375 px): `functional-knowledge` (filtro «Estado», 328) y `…/comparison` (rejilla HEAD/Símbolo, 354); no medidos en ciclo 1, pueden ser preexistentes. Los ciclos de revisión se agotaron: quedan para un WI futuro o para tu decisión.
- «Functional Knowledge» sigue en inglés (entidad de Core fuera del glosario): ampliar el glosario o aceptarlo. «Ranking» también.
- Residuos menores en inglés dentro de texto en español: «trial», «Replay», enums crudos como valores.
- No probado: lector de pantalla real (VoiceOver/NVDA), zoom real del navegador (se usó 640 CSS px), contraste, modo `live` con Core real, restauración de foco del aviso de identidad en navegador (cubierta en jsdom), fallo de carga diferida en navegador (cubierto por prueba), 320 px en rutas no barridas. No hay diálogos modales: el foco atrapado no aplica.
- WI-CONSOLE-005 y 006 siguen W-PLANNED: la evidencia de este WI no cierra su cobertura.
