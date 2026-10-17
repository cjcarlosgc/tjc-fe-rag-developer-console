# WI-CONSOLE-020 — Puerta de dependencia externa

- **Resultado:** `G-PASSED`.
- **Revisado por:** leader, verificación manual en el repositorio fuente.
- **WI fuente requeridos:** `WI-CORE-018`, `WI-CORE-019`, `WI-CORE-020`, `WI-CORE-022`, `WI-CORE-025`, `WI-CORE-026`, `WI-CORE-027`, todos `W-DONE`.

## Estado y revisión fuente

| Componente | WI | Estado | closedAt | Cierre fuente |
| --- | --- | --- | --- | --- |
| RAG Core | `WI-CORE-018` | `W-DONE` | `2026-10-08T18:51:26.000Z` | `harness/reports/wi-core-018-closure.md` |
| RAG Core | `WI-CORE-019` | `W-DONE` | `2026-10-08T21:50:00.000Z` | `harness/reports/wi-core-019-closure.md` |
| RAG Core | `WI-CORE-020` | `W-DONE` | `2026-10-09T00:45:00.000Z` | `harness/reports/wi-core-020-closure.md` |
| RAG Core | `WI-CORE-022` | `W-DONE` | `2026-10-09T20:30:46.000Z` | `harness/reports/wi-core-022-closure.md` |
| RAG Core | `WI-CORE-025` | `W-DONE` | `2026-10-09T15:40:00.000Z` | `harness/reports/wi-core-025-closure.md` |
| RAG Core | `WI-CORE-026` | `W-DONE` | `2026-10-10T01:12:03.000Z` | `harness/reports/wi-core-026-closure.md` |
| RAG Core | `WI-CORE-027` | `W-DONE` | `2026-10-10T14:20:18.000Z` | `harness/reports/wi-core-027-closure.md` |

Rama `feature/jean`, revisión verificada `129a9ab23886ade532071de389e5129a1e64f61f`, árbol limpio y sin WI activo en Core.

## Contract Sync verificado

`CS-CORE-20261009-014` y `-015` (fuente `WI-CORE-027`, `breaking: true`) y los 11 eventos de `WI-CORE-018`, `019`, `020`, `022`, `025` y `026` están importados y acusados en Console (`WI-CONSOLE-020` y `WI-CONSOLE-021`). Se comparó, evento por evento, el contenido que posee el productor (id, fuente, WI, destinatarios, alcance, `breaking`, `changed`, `requiredAction` y `sourceRevision`) entre el inbox de Console y el outbox de Core: ninguno difiere. Core no emitió eventos nuevos al cerrar `WI-CORE-027`.

## Contratos canónicos de Core en esa revisión (SHA-256)

| Contrato | SHA-256 |
| --- | --- |
| SYSTEM-2.6 | `670a1ef035d7c60be0a3385ca5f88e2a458b91f8ded2317e9dbbb97c58b07dc2` |
| INTEROP-2.7 | `fcfbd6d6301e7d15ad508b7745bd73c54a3ca06cba03f9372bd3fe9801ec109a` |
| GH-INTEROP-1.3 | `d1779bbdc2445be8760c6b3eea3b73da4663618bab8d471f4d6e932fd7d0b964` |

Los espejos locales de Console siguen en SYSTEM-2.6 e INTEROP-2.7 de la revisión `0e2cd1c` y en GH-INTEROP-1.2; los refresca `WI-CONSOLE-021`, que precede a este WI. La puerta no implica despliegue ni cutover.
