# WI-CONSOLE-020 — Resolución del criterio Contract Sync

Modelo: leader · configurado gpt-6-luna · atendido unknown · esfuerzo xhigh

El `contract-reviewer` identificó una contradicción: el registry marca `publishesContract: false`, pero un criterio de aceptación exigía emitir un `CS-CONSOLE` al completar incluso sin diferencia contractual.

La aprobación de alcance de WI-CONSOLE-020 limita el corte a activar y verificar adapters ya publicados por Core. La revisión contractual no encontró una necesidad nueva para Core. Por ello no se publica un evento vacío ni se habilita publicación del WI; se corrige el criterio para exigir `CS-CONSOLE` solo ante una diferencia confirmada. Esto conserva la regla de no modificar Core ni inventar una necesidad contractual.

La verificación live posterior sigue pudiendo detectar una diferencia real. En ese caso el corte registra el Contract Sync correspondiente y no cierra mientras quede pendiente.

## Aplicación posterior

La verificación contra Core local confirmó el 2026-10-10 una diferencia real en el request de OE5: Core aún exige `projectId`/`targetId`, aunque §6.5 publica `analysisRunId`/`symbolFilePath`/`symbolQualifiedName`. El registro habilita `publishesContract` para este único evento y la evidencia está en `harness/reports/wi-console-020-core-contract-verification.md`.
