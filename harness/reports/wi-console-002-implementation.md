# Implementación — WI-CONSOLE-002

Fecha: 2026-09-25. Estado: implementación, checks y revisiones independientes de código/UX completados; 2 ciclos de corrección usados.

## Alcance ejecutado

- Retiradas rutas, vistas, adapters, fixtures y APIs de carga manual ZIP, generación manual, runs manuales/reintentos y descarga legacy de artefactos.
- Inventario e historial de ProjectVersion quedan como consultas de solo lectura; no ofrecen carga, selección para generación ni exportación.
- Se conservan los flujos PR-driven de AnalysisRun, revisión de propuestas/diff y contexto RAG vigente.
- Se reintrodujo un tab «Historial» de solo lectura en ProjectTabs y se monta esa navegación también en AnalysisHistoryPage; el workspaceId se conserva y el test de página verifica el tab activo en la composición real.
- Se conserva el ZIP interno de snapshot en Core/Sandbox; no se alteró Sandbox ni se purgó/migró evidencia persistida.
- Retirado el uso de fflate, ya innecesario tras quitar el lector/descargador de artefactos.
- Contract Sync clasificado por WI: CS-20260920-003 y CS-20260921-001/002/003 no aplican a este retiro; permanecen abiertos para binding, autenticación, despliegue y extracción GitHub.

## Evidencia técnica

- npm run lint: pasa.
- npm test -- --reporter=dot: 421 pasan en 53 archivos; suite enfocada de navegación/historial: 14 pasan.
- npm run build: pasa; Vite advierte que un chunk supera 500 kB.
- node scripts/sdd-check.mjs, node harness/validate-harness.mjs y node harness/validate-work-items.mjs: pasan.
- Contract Sync implementation-delivery y before-review repetidos como lectura tras las correcciones: sin eventos relevantes pendientes; los no relevantes están registrados por WI.
- El build mantiene la demostración rotulada como mock; los tests de adapters/UI pasan.
- git diff --check: verificado al preparar el corte.

La primera ronda encontró el historial sin entrada visible; la segunda encontró que la navegación no se montaba en la pantalla real. Ambos hallazgos se corrigieron dentro del máximo de dos ciclos y reviewer/UX reviewer aprobaron. Ver `harness/reports/wi-console-002-code-review-final.md` y `harness/reports/wi-console-002-ux-review-final.md`. La comprobación UX fue estática porque no había navegador disponible.
