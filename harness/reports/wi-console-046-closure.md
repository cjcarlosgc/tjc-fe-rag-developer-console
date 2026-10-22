# WI-CONSOLE-046 — cierre

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Estado:** W-DONE. `AnalysisRunDetailPage` consume el tiempo real (`analysis-run:update`, INTEROP-2.19 §6.6) mediante `useAnalysisRunRealtime`: cada aviso y cada reconexión invalidan solo `controlPlaneKeys.run(id)` (el GET es la fuente de verdad). Resuelve la decisión D2 de WI-CONSOLE-044 con la cita literal del usuario (`harness/reports/wi-console-046-scope-approval.md`).

- Sin sesión, sin id o en mock no se abre el socket; al desmontar, cambiar de Run o cerrar sesión se libera la suscripción (probado con StrictMode, con el socket real simulado y sin listeners de `analysis-run:update` tras desmontar).
- **Polling:** el detalle no tiene polling HTTP del Run (`useAnalysisRun` sin `refetchInterval`; solo sondean traza y publicación). No había polling que preservar y no se añade: el tiempo real es best effort y sin replay.
- **Segundo consumidor:** evaluado, no existe. `ExperimentPage`, `RunComparisonPage`, `RetrievalComparisonPage` y el detalle usan el mismo Run pero son rutas hermanas bajo un solo `Outlet`; el único llamador de `subscribeAnalysisRunUpdates` es el hook nuevo. No se implementa conteo de referencias en `unsubscribe` (riesgo latente solo si una pantalla futura conviviera con el detalle).
- **uiImpact = false, `ux-reviewer` omitido:** el diff de la página es un import y una llamada; sin cambio de markup, estilos ni copy, y la invalidación no pasa por `isPending` (sin parpadeo de carga). El reviewer independiente confirmó la justificación.
- Sin cambio de DTO, rutas ni contrato; `contractImpact=false`, sin `contract-reviewer`. Sin reinterpretar la autoridad MAINTAINER/ADMIN sobre Functional Knowledge.
- Revisión: `reviewer` APPROVED en el ciclo 1 de 2 (`harness/reports/wi-console-046-review.md`). Atendí sus hallazgos: H1 (títulos y ST que decían que el polling era la base del Run) corregidos, y la observación del mutante superviviente (clave genérica) cubierta con una prueba nueva que exige `invalidateQueries` exactamente con `controlPlaneKeys.run(id)`, verificada ROJA al mutar la clave. Esa prueba es posterior a la aprobación y solo de pruebas (cambio mínimo del leader, un archivo de prueba, +12 líneas).
- Gates finales (leader): lint, `tsc -b --noEmit`, build, format:check y contracts:check con exit 0; `pnpm test --maxWorkers=4` 83 archivos y 888 pruebas.

Pendientes para el usuario: ampliar la invalidación a propuestas/traza ante `analysis-run:update` (el reviewer y el analista no lo recomiendan aquí); añadir polling HTTP del Run al detalle (decisión de alcance, no aprobada); el WI de mejoras de UX (punto 3 de la orden) sigue sin abrirse.
