# 011-context-explorer — Subtareas vigentes

Una subtarea técnica requiere una ST local y un WI registrado antes de comenzar. El comportamiento vigente está en `spec.md` y `plan.md`.

- [x] **ST-CONSOLE-054 · T-DONE · WI-CONSOLE-052 · HU05, HU12, HU15, HU17:** espejar en un solo paso INTEROP-2.23 desde Core `8c3eb0f` (digest `5de10cb7…`; SYSTEM-2.16, GH-INTEROP-1.9 y schemas sin cambio; cruce con INTEROP-2.22 `76f5e774…`), acusar y resolver `CS-CORE-20261025-001` y `-002` (que subsume a `-001` en INTEROP); etiquetar `BELOW_RELEVANCE_THRESHOLD` con fallback robusto en el panel RAG; tipos locales con los opcionales `layer` y `configuration.strategy`/`relevanceThreshold`/`declaringClassMaxTokens`/`targetEvidenceMaxTokens`; mostrar capa y estrategia en el panel solo cuando existan; mock con ambos casos; `inclusionReason` no existe en el contrato (no se inventa); sin rutas, DTOs de producto, realtime ni polling. Aprobación: `harness/reports/wi-console-052-scope-approval.md`.

Los checklists anteriores se conservan en Git, CHANGELOG y `harness/reports/open-task-triage-3.0.md`.
