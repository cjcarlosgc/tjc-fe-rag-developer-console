# WI-CONSOLE-036 — alcance de Contract Sync

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

Este WI no toca DTO, rutas de API ni contrato: solo estado de URL, mensajes y orden de presentación en la pantalla de experimentos.

| Evento | Decisión |
|---|---|
| CS-20260920-003, CS-20260921-001/-002/-003 (históricos sin scopePaths) | NOT_RELEVANT con los mismos digests y motivos que WI-CONSOLE-026..035 (binding, identidad/roles, seguridad de binding, membresía); este WI no toca bindings, autorización, login ni Projects. |
| CS-CORE-20261013-001/-002/-003 (INTEROP-2.13/2.14/2.15, Core) | NO se acusan ni se resuelven aquí; son del WI de sincronización futuro. Si el validador los trata como pendientes para este WI, se registra el hallazgo. |
| Eventos dirigidos a github-integration o sandbox | No son de Console; permanecen `C-PENDING`. |
