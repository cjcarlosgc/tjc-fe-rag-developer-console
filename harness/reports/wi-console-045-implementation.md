Modelo: implementer · configurado claude-haiku-5-5 · atendido unknown · esfuerzo low

# WI-CONSOLE-045 · Implementación (documental)

Estado: implementado, pendiente de revisión independiente (reviewer y contract-reviewer; revisión por defecto del Human Reviewer). El Contract Sync `CS-CORE-20261021-004` NO lo resuelve el implementer: la resolución la realiza el leader. No se toca `harness/work-items.json`, `harness/state.json` ni `harness/contract-sync/`. Ni el WI ni el Contract Sync se cierran en este informe.

## Espejo y digests

Origen: Core `/Users/cjcarlosgc/Development/Tesis/tjc-be-rag-core-api`, revisión `3d2383e4b6efc20162b77945261fe08d384094a8`. La copia mecánica la realizó el leader con `git show`; el implementer la verificó de forma independiente, comparando contra `git -C <core> show ${REV}:<ruta>` (no el working tree de Core).

Verificación independiente (todos los digests coinciden con los esperados):

- `spec/contracts/system-contract.md`: `f60d6c4b19e2bfbce232894614667e5898197a8677eb80db284d96b9f2b96ce3`. `cmp` contra Core: idéntico. Cabecera: `SYSTEM-2.14`, fecha de corte 2026-10-21.
- `spec/contracts/interoperability-contract.md`: `f9866d16e8c738001d7a9dd664599cd542d857b676d17723fa9c3a25bd2cc6f9`. `cmp` contra Core: idéntico. Cabecera: `INTEROP-2.19`, compatible con SYSTEM-2.14.
- `spec/contracts/github-integration-contract.md`: `6c553ee856d0c53420a75d2bde5a9eb04cce2e029ffae1bf4194dcbc7a25565a`, sin cambio. `cmp` contra Core: idéntico. Cabecera: `GH-INTEROP-1.8`.
- Árbol `spec/contracts/schemas`: `a1ba9a199d0035de85b807fa9ae26b9afb09f8af340a22f1cb34096547dc9091`, sin cambio. Calculado con la receta `find . -type f | LC_ALL=C sort | xargs shasum -a 256 | shasum -a 256` y también con `git archive 3d2383e4 spec/contracts/schemas` extraído en el scratchpad: `diff -r` sin diferencias.

## Diff de spec/contracts

`git diff --stat -- spec/contracts`: 2 archivos cambiados, 29 inserciones, 9 eliminaciones.

- `spec/contracts/system-contract.md`: 24 líneas (SYSTEM-2.13 → SYSTEM-2.14).
- `spec/contracts/interoperability-contract.md`: 14 líneas (INTEROP-2.18 → INTEROP-2.19).
- `spec/contracts/github-integration-contract.md` y `spec/contracts/schemas/`: sin cambios.

## Referencias actualizadas (revisadas en `git diff -- spec/`)

- `spec/README.md`: descripción de los dos espejos y línea «Contratos compartidos» → SYSTEM-2.14 / INTEROP-2.19 / GH-INTEROP-1.8. Correcto.
- `spec/constitution/architecture.md`: «Contrato operativo vigente» → SYSTEM-2.14 / INTEROP-2.19 / GH-INTEROP-1.8. Correcto.
- `spec/features/013-pr-driven-control-plane/plan.md`: «Contratos compartidos» y «Contrato operativo» actualizados. Correcto.
- `spec/features/013-pr-driven-control-plane/spec.md`: texto de contrato base de los happy paths actualizado a SYSTEM-2.14 / INTEROP-2.19. Correcto.
- `spec/features/013-pr-driven-control-plane/tasks.md`: nueva línea `ST-CONSOLE-047 · T-DONE · WI-CONSOLE-045` (añadida por el leader, coherente con el formato de ST-CONSOLE-045/046).

## Menciones no tocadas (con motivo)

- Espejos y esquemas (`spec/contracts/schemas/*`, `spec/contracts/*.md`): contenido espejado byte a byte; no se edita. Ejemplos: `realtime-events.schema.json` cita INTEROP-2.18 §6.6; `error-envelope.schema.json` cita INTEROP-2.18 §4. Los esquemas no cambian en 2.19.
- `app/src/**` (no editado): comentarios y tipos generados que citan INTEROP-2.18 §4, §6.5, §6.6 y §10 (`experiments/ExperimentPage.tsx`, `experiments/useExperimentRealtime.ts`, `experiments/liveMapping.ts`, `api/socket.ts`, `api/client.ts`, `api/errorEnvelope.contract.test.ts`, `contracts/contract-validator.ts`, `contracts/generated/contract-types.ts`, `contracts/generated/contract-schemas.ts`). Motivo: son referencias de sección a la versión que introdujo la regla; no cambian en 2.19. `contract-types.ts` y `contract-schemas.ts` se mantienen porque `contracts:check` confirma que siguen en sincronía con los esquemas.
- `app/src/experiments/liveMapping.test.ts:388` cita INTEROP-2.13 en un nombre de prueba: referencia histórica, no se toca.
- `spec/features/013-pr-driven-control-plane/tasks.md` (ST-CONSOLE-041, 045, 046) y `CHANGELOG.md` (entradas anteriores): historia; se conserva.
- `harness/reports/*`: históricos, no se tocan.

## CHANGELOG

Entrada `WI-CONSOLE-045 (2026-10-21, pendiente de revisión independiente y del usuario)` insertada al inicio de `[Unreleased]`, antes de la entrada de WI-CONSOLE-044. Recoge: re-espejo de SYSTEM-2.14 e INTEROP-2.19 desde Core `3d2383e4` con digests; enmienda DEC-EXP-005 (configuración única del LLM, `LLM_REASONING_EFFORT` obligatorio, flujo normal a `gpt-6-luna`, 422 `REASONING_EFFORT_UNSUPPORTED` solo por temperatura con razonamiento activo y `details.supportedEfforts=['none']`); GH-INTEROP-1.8 y schemas sin cambio; acuse y resolución de `CS-CORE-20261021-004` (informativo, `breaking=false`); sin cambio de código, DTO, rutas ni UI.

## Gates

Ejecutados en `app/` con `export PATH=$HOME/.local/node22/bin:$PATH`. Logs en el scratchpad (`gate-*.log`).

| Gate | Comando | Exit |
|---|---|---|
| install | `pnpm install --frozen-lockfile` | 0 (lockfile up to date, pnpm 12.14.0) |
| contratos | `pnpm contracts:check` | 0 |
| lint | `pnpm lint` | 0 |
| tipos | `pnpm exec tsc -b --noEmit` | 0 |
| tests | `pnpm test --maxWorkers=4` | 0 (80 archivos, 874 pruebas pasadas, 0 fallidas) |
| build | `pnpm build` | 0 (aviso informativo de chunks >500 kB, preexistente) |
| formato | `pnpm format:check` | 0 |

Cambios en `app/`: `git status --short app` vacío tras los gates.

## Incidentes

Ninguno que afecte al resultado. El build emite el aviso de tamaño de chunk, preexistente y no relacionado con este WI.

## Nota de verificación

El leader realizó la copia mecánica con `git show`; el implementer la verificó de forma independiente. Esta verificación es independiente de la del leader, pero no sustituye la revisión independiente (reviewer, contract-reviewer) ni la del Human Reviewer.

## Resolución del Contract Sync (leader)

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

`CS-CORE-20261021-004` (informativo, `breaking: false`) se resuelve con esta evidencia: SYSTEM-2.14 e INTEROP-2.19 re-espejados byte a byte desde Core `3d2383e4` y cruzados los digests (`f60d6c4b…`, `f9866d16…`; verificados por el leader y de forma independiente por el implementer), `github-integration-contract.md` y `spec/contracts/schemas` sin cambio (`6c553ee8…`, `a1ba9a19…`), validadores y gates en verde. La `requiredAction` para Console es documental y no exige cambio de código: el manejo de errores ya tolera `code` abierto. Los destinos `github-integration` y `sandbox` del evento no son de este repositorio.
