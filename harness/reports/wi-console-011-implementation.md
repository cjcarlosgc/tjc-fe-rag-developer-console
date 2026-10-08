# WI-CONSOLE-011 — Implementación

- **WI/ST/HU:** `WI-CONSOLE-011` / `ST-CONSOLE-013` / `HU12, HU14`. Corte documental; implementer `implementer`, verificado por el leader.
- **Fuente canónica:** Core `ab5142b46addc0bff2c126cf3e8531f5ed111d5c` (`WI-CORE-017`), leída con `git show ab5142b:spec/contracts/...` porque el working tree de Core tiene archivos de harness modificados.

## Espejos byte a byte

| Archivo | Versión | SHA-256 (fuente = copia) |
|---|---|---|
| `spec/contracts/system-contract.md` | SYSTEM-2.6 | `73cb009646c3e7e1dba3f928b31c5e574458d6843628341ef83acc4a94f913d2` |
| `spec/contracts/interoperability-contract.md` | INTEROP-2.7 | `0c7bb971b2de50a91da296e6d19233ef808f25da06410528fd3402148e736a06` |
| `spec/contracts/github-integration-contract.md` | GH-INTEROP-1.2 | sin cambios (`1092ef36979f4fac7f17d6ee73c5b73723d0aaf1999b24d6098b095af5d62c45`) |

Comprobación: `git -C ../tjc-be-rag-core-api show ab5142b:spec/contracts/<f>.md | shasum -a 256` frente a `shasum -a 256 spec/contracts/<f>.md`.

## Referencias vigentes actualizadas

`spec/README.md` (espejos, líneas 9-10), `spec/constitution/architecture.md` (línea 3), `013-pr-driven-control-plane` (spec: contrato operativo, adapters y «Contrato adoptado»; plan), `014-organizations-access` (spec y plan), `014-analysisrun-experiments` (spec, plan; «Contrato adoptado»), citas normativas de §6.x en `011-context-explorer`, `012-authentication`, y `CHANGELOG.md [Unreleased]`. Las secciones citadas existen en INTEROP-2.7.

## Deliberadamente no cambiado

- Descripciones del estado actual de mocks/fixtures (`README` línea 13, `architecture` líneas 15 y 19, `demo-mode`): siguen INTEROP-2.6 hasta que `WI-CONSOLE-013` a `019` adopten el contrato; afirmar 2.7 sería falso.
- Historia: `roadmap.md`, `003-test-inventory/tasks.md` (ST-011 DONE), `016-github-integration/spec.md` y `plan.md` (cierre de WI-CONSOLE-010), entradas previas del CHANGELOG, `harness/reports/` y snapshots.
- `app/`: dos comentarios citan INTEROP-2.6 (`app/src/projects/types.ts:62`, `app/src/control-plane/types.ts:3`); fuera del alcance del WI, quedan para un corte de código.

## Verificación

`node scripts/sdd-check.mjs` y `git diff --check` pasan. No se ejecutó código de aplicación; lint/test/build no aplican a un corte sin cambios ejecutables.

## Nota sobre revisiones

El evento `CS-CORE-20261008-001` declara `sourceRevision: 0e2cd1c1a35b5b6b59f1d5c5787e424293ce278f` (emisión). Es ancestro de la revisión canónica copiada, `ab5142b46addc0bff2c126cf3e8531f5ed111d5c` (cierre de `WI-CORE-017`), confirmada por el contract-reviewer; los hashes de la tabla corresponden a `ab5142b`.
