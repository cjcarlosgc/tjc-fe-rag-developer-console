# WI-CONSOLE-004 — revisión de alcance de Contract Sync

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

WI documental: `contractImpact=false`, `publishesContract=false`, `specPaths` solo en `spec/operational-cases.md`, Feature 013 y el reporte de análisis, sin `syncScopePaths`. El validador de Contract Sync (`harness/contract-sync.mjs`) considera relevante un evento solo si su `scopePaths` toca las rutas del WI o es `*`, o si el WI tiene `contractImpact` y el evento apunta a `spec/contracts/`. Aquí ninguna de las dos condiciones se cumple.

| Evento | Origen | Efecto | Clasificación para WI-CONSOLE-004 | Estado en inbox |
| --- | --- | --- | --- | --- |
| CS-CORE-20261012-002 | WI-CORE-013 | corrige solo `sourceRevision` de `-016` (INTEROP-2.7 §7) | Fuera de alcance: no toca rutas del WI; sin cambio funcional ni de contrato | C-PENDING |
| CS-CORE-20261012-003 | WI-CORE-028 | corrige solo `sourceRevision` de `-017` (relaciones PHP, §6.15) | Fuera de alcance, ídem | C-PENDING |
| CS-CORE-20261012-004 | WI-CORE-029 | corrige solo `sourceRevision` de `-018` (§6.5 PHP/PHPUnit) | Fuera de alcance, ídem | C-PENDING |

Evidencia: `node harness/contract-sync.mjs check --checkpoint start --work-item WI-CONSOLE-004` devuelve `relevantPendingSyncIds: []`; `acknowledge` sobre estos IDs falla con `outside the scope of WI-CONSOLE-004`.

Su `requiredAction` indica tomar los espejos desde `a7c04cef` (feature/jean de Core) y no desde la revisión original. Los espejos actuales de Console provienen de Core `76053463` (WI-CONSOLE-025), posterior; no hay acción de código ni de spec para este WI.

No se crea entrada `contractSyncReview`: ese mecanismo solo aplica a eventos relevantes anteriores a la línea base; estos son nuevos y no relevantes por alcance. No se acusan ni resuelven aquí: quedan C-PENDING para un WI documental/de sincronización aparte que verifique que los espejos coinciden con `a7c04cef` o posterior y los acuse y resuelva. El mismo criterio aplica a los demás eventos C-PENDING de Core no relevantes para este WI.
