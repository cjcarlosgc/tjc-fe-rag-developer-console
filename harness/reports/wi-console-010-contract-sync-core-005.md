# WI-CONSOLE-010 — Contract Sync Core 005

- **Evento:** `CS-CORE-20260927-005` (`sourceWorkItem: WI-CORE-015`).
- **Revisión fuente:** Core `383e23c3260d585510a3060b32c38534ef8f7d44` (sourceRevision publicado: `383e23c`).
- **Targets / scope:** `console`, `github-integration`; `spec/contracts/system-contract.md` y `spec/contracts/github-integration-contract.md`.
- **Tipo:** no breaking; elimina referencias transitorias al envío de `CS-CORE-20260927-004`, sin cambio de comportamiento ni versiones.

## Revisión del evento

Se verificó que el evento está publicado por Core como `C-PENDING`, identifica el WI propietario y dirige a Console. La comparación de los dos blobs fuente contra los espejos locales confirmó únicamente la eliminación de la frase temporal sobre el envío de 004. Se acepta el alcance y se importa el evento en el inbox de Console.

## Sincronización byte a byte

| Contrato | SHA-256 del blob Core `383e23c` | SHA-256 en Console | `cmp` |
| --- | --- | --- | --- |
| SYSTEM-2.5 | `97069ee6022bd3477d4091389e5805fc6a15e78679eb7de986ca006dc5ec0736` | `97069ee6022bd3477d4091389e5805fc6a15e78679eb7de986ca006dc5ec0736` | idéntico (`cmp`) |
| GH-INTEROP-1.2 | `1092ef36979f4fac7f17d6ee73c5b73723d0aaf1999b24d6098b095af5d62c45` | `1092ef36979f4fac7f17d6ee73c5b73723d0aaf1999b24d6098b095af5d62c45` | idéntico (`cmp`) |
| INTEROP-2.6 | `1f5cc04a7fc73388a49d1c1de4f79f873d0e95edec7db6e102b5f828f6a2f852` | sin cambio por este evento | igual al corte anterior |

Los dos blobs de Core se copiaron sin edición local y se compararon byte a byte (`cmp`). El evento pasó por `C-PENDING` → `C-ACKNOWLEDGED` → `C-RESOLVED`; la resolución usa `harness/reports/wi-console-010-implementation.md` como evidencia. `INTEROP-2.6` se mantuvo sin cambios por estar fuera del scope del evento. En el momento de esta resolución, quedaba por retirar otra frase temporal de SYSTEM. Core publicó luego `CS-CORE-20260927-006`; Console lo aplicó y el checkpoint `before-review` se registró con cero eventos relevantes pendientes.
