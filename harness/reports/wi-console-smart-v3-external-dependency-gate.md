# SMART V3 — Puerta de dependencia externa de Console (contrato)

- **Resultado:** `G-PASSED` para los WI cuya dependencia externa es el contrato definido por `WI-CORE-017`.
- **Revisado por:** leader, verificación manual en el repositorio fuente.
- **WI fuente requerido:** `WI-CORE-017`, `W-DONE`.

## Estado y revisión fuente

| Componente | WI | Estado | Rama/revisión verificada | Cierre fuente |
| --- | --- | --- | --- | --- |
| RAG Core | `WI-CORE-017` | `W-DONE` | `feature/jean` / `ab5142b46addc0bff2c126cf3e8531f5ed111d5c` | `harness/reports/wi-core-017-closure.md` |

`WI-CORE-017.closedAt=2026-10-08T16:42:49.305Z`. Se verificaron el commit, la rama, el estado limpio y el estado registrado del WI en Core.

## Contract Sync verificado

Core-017 publicó `CS-CORE-20261008-001` (`breaking: true`, revisión fuente `0e2cd1c1a35b5b6b59f1d5c5787e424293ce278f`), importado y acusado en Console con `WI-CONSOLE-011`. El contenido de `spec/contracts/` en Core `ab5142b` es idéntico al de esa revisión.

## Contratos canónicos de Core (SHA-256)

| Contrato | SHA-256 |
| --- | --- |
| SYSTEM-2.6 | `73cb009646c3e7e1dba3f928b31c5e574458d6843628341ef83acc4a94f913d2` |
| INTEROP-2.7 | `0c7bb971b2de50a91da296e6d19233ef808f25da06410528fd3402148e736a06` |
| GH-INTEROP-1.2 | `1092ef36979f4fac7f17d6ee73c5b73723d0aaf1999b24d6098b095af5d62c45` (sin cambio; idéntico a la copia de Console) |

Los espejos SYSTEM y INTEROP de Console todavía son SYSTEM-2.5 e INTEROP-2.6; los sincroniza `WI-CONSOLE-011`.

## Alcance de esta puerta

La puerta cubre únicamente que el contrato SMART V3 está definido, cerrado y acusado. **No** afirma que Core haya implementado nada: `WI-CORE-018` a `WI-CORE-027` siguen pendientes. Por eso los WI de Console construyen tipos, adapters mock, UI y pruebas contra el contrato canónico, el adapter live responde con el error de contrato pendiente hasta que Core publique, y la activación live se verifica en `WI-CONSOLE-020`, que sí depende de los WI de Core implementados.
