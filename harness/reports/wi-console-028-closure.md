# WI-CONSOLE-028 — cierre

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Estado:** `W-DONE` · **Revisión independiente:** `reviewer` (awayMode activo), APPROVED, 1 ciclo; UX aprobado tras 1 ciclo de corrección (Corte B).

## Resultado (contraste computado ANTES → DESPUÉS)
- Anillo de foco global: 2.70:1 → 10.6:1 (`var(--accent)`; el textarea ahora tiene anillo).
- `.versus` 4.17:1 → 10.68:1; `.breadcrumbs-sep` 1.45:1 → 4.17:1 (decorativo); `.repo-sep` 3.89:1 → 9.95:1.
- Desbordes: detalle de Run a 375 px (526 → 375); cabecera global a 768 px (900 → 768) y 1024 px (1037 → 1024) con `flex-wrap` en `.topbar-inner`/`.topbar-badges` (Corte B); sellos DEMO/PROPUESTA con ancho de contenido; tabla de experimentos con scroll interno operable por teclado.
- Comportamiento: foco a la tarjeta en `onError` y en ABSTAINED por `resolveConflict`; `role="status"` fijo en Functional Knowledge; H3 → H2 en «Símbolos cambiados»; «—» en Intento/Evaluable sin dato.
- Decisiones documentadas: bordes de `.button.secondary` (1.15:1) y P@10/R@10 (`#5b4d86`, ≈2.7:1) sin cambio por WCAG 1.4.11 (etiqueta de texto visible; no son controles); el hex fuera de tokens queda para WI-CONSOLE-005.

## Gates
lint, `tsc -b --noEmit`, vitest 728/728 (`--maxWorkers=2`, y sin límite 4 de 6 corridas verdes; la falla restante es F1 de WI-027), build y validadores pasan.

## Pendiente / seguimiento
- F1 de WI-027: `ContextExplorerPage.updateParams` puede perder `view=list` bajo carga; pendiente de decisión del usuario (WI de producto aparte).
- `summary` conserva el outline UA 1px (3.29:1); bordes P@10/R@10 y `.button.secondary` para WI-005/006; verificación con lector de pantalla real.

Evidencia: `wi-console-028-{scope-approval,sdd-verification,contract-sync-scope-review,implementation,ux-review,review}.md`. Sin push ni PR.
