# WI-CONSOLE-021 — Acuse de Contract Sync (soporte PHP)

Eventos `CS-CORE-20261009-016`, `-017` y `-018` (fuentes `WI-CORE-013`, `WI-CORE-028` y `WI-CORE-029`), importados en `b6e0c3e`, con `scopePaths: [spec/contracts/interoperability-contract.md]` dentro de `syncScopePaths` de WI-CONSOLE-021.

Observacion de revision canonica: los `sourceRevision` de los eventos (`123f8ed`, `8f4ddd1`, `c1343cf`) estan en la rama PHP de Core, cuya base es anterior a `3f06f44` (WI-CORE-027) y por eso su INTEROP no contiene el cierre de `/evidence` ni las tasas `number | null`. La revision canonica fusionada es `a7c04cef12740941d8559c743f84ed287fb57ced` (`825e417` de Core `feature/jean`, publicada en `origin/feature/jean`), que contiene `3f06f44` mas las tres adiciones PHP. El espejo INTEROP-2.7 de Console se copio de ese commit con `git show` (no del working tree).

SHA-256 de los espejos (igualdad `cmp` con `git show 825e417:spec/contracts/...`):
- system-contract.md `670a1ef035d7c60be0a3385ca5f88e2a458b91f8ded2317e9dbbb97c58b07dc2`
- interoperability-contract.md `a70782ebc439f531765e26b03736f78e52049de081571aaa30e25c4cfb69988f`
- github-integration-contract.md `d1779bbdc2445be8760c6b3eea3b73da4663618bab8d471f4d6e932fd7d0b964`

Acuse: Console se hace cargo; la adopcion queda en el Corte C de `harness/reports/wi-console-021-implementation.md`.
