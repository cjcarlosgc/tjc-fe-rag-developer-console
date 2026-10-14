# WI-CONSOLE-035 — alcance de Contract Sync

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

Este WI no toca DTO, rutas ni contrato: solo presenta campos que INTEROP §6.11 ya publica (`target.qualifiedName`, `target.filePath`, `target.kind`, `scenarioKind`).

| Evento | Decisión |
|---|---|
| CS-20260920-003, CS-20260921-001/-002/-003 (históricos sin scopePaths) | NOT_RELEVANT con los mismos digests y motivos que WI-CONSOLE-026..033 (binding, identidad/roles, seguridad de binding, membresía); este WI no toca bindings, autorización, login ni Projects. |
| CS-CORE-20261013-001/-002/-003 (INTEROP-2.13/2.14/2.15, Core) | NO se acusan ni se resuelven aquí. Son del WI de sincronización de contrato futuro (tentativo WI-CONSOLE-038/«Contract Sync 2.13–2.15»); si el validador los trata como pendientes para este WI, se registra el hallazgo y no se inventa su resolución. |
| Eventos dirigidos a github-integration o sandbox (-006, -008, -010, -012, etc.) | No son de Console; permanecen `C-PENDING`. |
