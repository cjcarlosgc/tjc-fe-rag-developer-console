# WI-CONSOLE-050 — aprobación de alcance

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Fecha:** 2026-10-22
**Autoriza:** usuario (Human Reviewer), en el chat, vía la sesión coordinadora cross.

## Cita literal

> «Aprueba un WI chico para el desborde de la página de Experimento (position: relative en .table-frame o equivalente), con reviewer y ux-reviewer. Contúnalo.»

## Alcance aprobado (STANDARD, `uiImpact=true`, `contractImpact=false`)

1. Corregir la causa raíz del desborde horizontal del documento en la página de Experimento con resultado: `<span class="visually-hidden">Contexto</span>` en el `th` de la última columna de la tabla de repeticiones es `position:absolute` sin ancestro posicionado y escapa de `.table-frame`. Cambio mínimo (p. ej. `position: relative` en `.table-frame` o equivalente) que no altere el diseño.
2. Auditar si el mismo patrón (`visually-hidden` dentro de `th`/`td` dentro de un contenedor con overflow) afecta a otras tablas y páginas; corregir solo las que se midan con desborde real, con antes/después en el reporte.
3. Medir `scrollWidth` frente a `clientWidth` del documento y de `.table-frame` en navegador real (modo demo mock; 1280, 375 y, si es viable, 320 px) en Experimento con resultado y en las demás páginas con tablas (Historial, Inventario, Runs, comparaciones, Functional Knowledge).
4. Guarda de prueba (vitest) estática del CSS, que falle (ROJA) al revertir el arreglo, más la evidencia de navegador en el reporte.
5. `reviewer` y `ux-reviewer` independientes, máximo 2 ciclos; el ux-reviewer mide por su cuenta.

## Fuera de alcance

Cambios de copy, DTO, rutas, contratos, realtime o primitives nuevas; pendientes de WI-CONSOLE-047 (DR-1..4, H5/H6 a 320 px salvo que coincidan exactamente con este desborde); `reasoningEffortMessage`; WI-CONSOLE-005 y 006; autoridad MAINTAINER/ADMIN sobre Functional Knowledge; rótulos DEMO.

## Reglas

- Una decisión no cubierta se registra como `DECISION_REQUIRED` y se aparca, sin inventar aprobación.
- Pruebas sin reloj real.
- Sin push, PR ni merge; `main` no se toca.
