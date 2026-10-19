# WI-CONSOLE-042 — cierre

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Estado:** W-DONE. **Retroactivo**: regulariza `3f6341c` (`implementationAgent: cross`, excepción puntual del usuario). `reviewer` APPROVED y `ux-reviewer` APPROVED, ambos en el ciclo 1 de 2, independientes de cross. WI-CONSOLE-005 y WI-CONSOLE-006 **siguen W-PLANNED** (cobertura parcial).

Evidencia reproducida: lint (jsx-a11y), `tsc -b --noEmit`, `format:check` y build en 0; 79 archivos y 840/840 pruebas; contraste calculado AA (`--text-dim` 4.83–5.83); mock diferido verificado (chunk aparte de 107.95 kB, índice 986.89 kB); rótulos DEMO presentes; sin cambio de autoridad MAINTAINER/ADMIN/WRITER/UNKNOWN en Functional Knowledge.

## Observaciones no bloqueantes (pendientes, sin corregir aquí; candidatas a WI-CONSOLE-005/006)

1. Objetivos < 40 px: enlace de marca 32 px, «Saltar al contenido» 37 px, pestañas de proyecto 39 px, fila «Historial de transiciones» 18 px.
2. Focus Mode desborda horizontalmente a 375 px (scrollWidth 413).
3. Mezcla es/en fuera del glosario en Projects/Trace («CONNECTED», «ACTIVE PRS», «Integration branch», «Latest:»; «Projects conectados»).
4. Conteos demo de Action Required inconsistentes en Projects (badge 6, KPI 4, 3 Runs): rotular el ámbito o ajustar el dato demo.
5. Una `VITE_CORE_API_URL` inválida deja la app en blanco (falla al importar `client.ts`); mostrarlo en `RouteError`.
6. `pollAfterMs` de Core solo se respeta en el sondeo de experimentos; los demás usan valor fijo.

No verificados por ningún revisor: zoom 200 %, reduced motion en ejecución, restauración de foco en diálogos, lector de pantalla, Context Explorer, Experimental y comparaciones.
