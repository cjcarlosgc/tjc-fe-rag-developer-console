# WI-CONSOLE-010 — Puerta de dependencia externa

- **Resultado:** `G-PASSED`.
- **Revisado por:** leader, verificación manual en los dos repositorios fuente.
- **WI fuente requerido:** `WI-CORE-015` y `WI-GH-008`, ambos `W-DONE`.

## Estado y revisión fuente

| Componente | WI | Estado | Rama/revisión verificada | Cierre fuente |
| --- | --- | --- | --- | --- |
| RAG Core | `WI-CORE-015` | `W-DONE` | `feature/jean` / `22614d0c4b68058b9eb91d4c1c832e4c87375ac7` | `harness/reports/wi-core-015-closure.md` |
| GitHub Integration | `WI-GH-008` | `W-DONE` | `feature/jean` / `8e5782a8030037771ca2274dd6bb108c49b3a8d8` | `harness/reports/wi-gh-008-closure.md` |

Los snapshots fuente indican `WI-CORE-015.closedAt=2026-09-28T04:55:38.108Z` y `WI-GH-008.closedAt=2026-09-28T04:55:07Z`. Se verificaron commits, ramas, estado limpio y estado registrado de cada WI en los repositorios fuente.

## Contract Sync verificado

- Core-015 publicó `CS-CORE-20260927-004`, `005` y `006`. Los tres eventos están `C-RESOLVED` en Console y GitHub Integration, con evidencia de acuse y resolución en cada consumidor.
- GitHub Integration-008 tiene `publishesContract=false`, `publishedSyncIds=[]` y `contractSyncPublished=G-NOT_APPLICABLE` en su snapshot `W-DONE`; no publicó un evento propio. Su cierre confirma que no cambió la fuente canónica ni la semántica del contrato. El evento saliente GH aplicable que ya consume Console (`CS-GH-20260927-001`, fuente `WI-GH-007`) está `C-RESOLVED`.
- El checkpoint final de Contract Sync de cada fuente quedó sin eventos entrantes relevantes pendientes.

## Contratos comparados

En Console, Core `22614d0c4b68058b9eb91d4c1c832e4c87375ac7` y GitHub Integration `8e5782a8030037771ca2274dd6bb108c49b3a8d8`, los tres archivos comparan byte a byte. SHA-256:

| Contrato | SHA-256 |
| --- | --- |
| SYSTEM-2.5 | `879bce741d4cf5246dd30db62759cd3100804019e608e62a9028bc2e33fa487c` |
| INTEROP-2.6 | `1f5cc04a7fc73388a49d1c1de4f79f873d0e95edec7db6e102b5f828f6a2f852` |
| GH-INTEROP-1.2 | `1092ef36979f4fac7f17d6ee73c5b73723d0aaf1999b24d6098b095af5d62c45` |

La puerta externa pasa: ambos WIs fuente están `W-DONE`, sus cierres y sincronizaciones aplicables tienen evidencia, y las fuentes contractuales son idénticas a los espejos de Console. Este resultado no implica despliegue ni cutover.
