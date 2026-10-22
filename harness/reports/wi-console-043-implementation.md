Modelo: implementer · configurado claude-haiku-5-5 · atendido unknown · esfuerzo low

# WI-CONSOLE-043 · Implementación (documental)

Estado: implementado, pendiente de revisión independiente (reviewer y contract-reviewer). El Contract Sync `CS-CORE-20261021-001` NO se declara resuelto en este informe; no se acusa ni se cierra. Ni el WI ni el Contract Sync se cierran aquí.

## Espejo y digests

Origen: Core `/Users/cjcarlosgc/Development/Tesis/tjc-be-rag-core-api`, revisión `5c82853c36a419e9839d5474ad9657f714aba4cb`, mediante `git show 5c82853c:<ruta> > <destino>` (no el working tree de Core). Script de copia en el scratchpad de la sesión (`mirror.sh`).

Digests verificados (todos coinciden con los esperados):

- `spec/contracts/interoperability-contract.md`: `22b880d1d677d7a54fb0f909f05d505e1557b6bbcdcfbb35347e9e3b5947e311` (cabecera: INTEROP-2.18, compatible con SYSTEM-2.13).
- `spec/contracts/github-integration-contract.md`: `6c553ee856d0c53420a75d2bde5a9eb04cce2e029ffae1bf4194dcbc7a25565a` (sin cambio; cabecera GH-INTEROP-1.8).
- `spec/contracts/system-contract.md`: `b70f9358fabdaa6d8ac61d07e25258ec5256f9dacd31049edb4f08e6879a0444` (sin cambio; cabecera SYSTEM-2.13).
- Árbol `spec/contracts/schemas` (incluye `examples/`, 19 archivos): `a1ba9a199d0035de85b807fa9ae26b9afb09f8af340a22f1cb34096547dc9091`.

No se eliminó ningún archivo local: todos los archivos locales del árbol existen en la revisión de Core.

## Diff de spec/contracts

`git diff --stat -- spec/contracts`: 3 archivos cambiados, 112 inserciones, 26 eliminaciones.

- `spec/contracts/interoperability-contract.md` (modificado; INTEROP-2.17 → INTEROP-2.18).
- `spec/contracts/schemas/error-envelope.schema.json` (modificado: 6 líneas; descripciones de `code`, `message` y `retryable` con los códigos genéricos de INTEROP-2.18 §4).
- `spec/contracts/schemas/examples/manifest.json` (modificado: +30 líneas, entradas nuevas).

Archivos nuevos del árbol (7, sin tracking previo):

- `spec/contracts/schemas/realtime-events.schema.json` (esquema nuevo, INTEROP §6.6).
- `spec/contracts/schemas/examples/error-envelope.generic.json`.
- `spec/contracts/schemas/examples/realtime-analysis-run-update.event.json`.
- `spec/contracts/schemas/examples/realtime-experiment-update.event.json`.
- `spec/contracts/schemas/examples/realtime-subscribe-ack.subscribed.json`.
- `spec/contracts/schemas/examples/realtime-subscribe-analysis-run.payload.json`.
- `spec/contracts/schemas/examples/realtime-subscribe-experiment.payload.json`.

Sin cambio: `common.schema.json`, `error-envelope.upstream.json`, `error-envelope.validation.json`, `sandbox-*`, `github-integration-contract.md`, `system-contract.md`.

## Archivos generados cambiados

`pnpm contracts:generate` (4 esquemas ahora; antes 3) cambió dos archivos bajo `app/src/contracts/generated/`:

- `contract-schemas.ts` (+518 / −6): descripciones actualizadas y esquema `realtime-events.schema.json` incorporado.
- `contract-types.ts` (+177 / −6): tipos nuevos de tiempo real (SubscribeAck, payloads de suscripción, avisos) y descripciones actualizadas.

`pnpm contracts:check` (exit 0) tras la regeneración.

## Referencias actualizadas (vigentes)

- `spec/README.md:10`: INTEROP-2.17 → INTEROP-2.18.
- `spec/features/013-pr-driven-control-plane/plan.md:5`: INTEROP-2.17 → INTEROP-2.18 (SYSTEM-2.13 / GH-INTEROP-1.8 sin cambio, verificadas en cabeceras).
- `spec/features/013-pr-driven-control-plane/spec.md:5` y `:41`: INTEROP-2.17 → INTEROP-2.18.
- `spec/constitution/architecture.md:3`: INTEROP-2.17 → INTEROP-2.18.

Versiones confirmadas en las cabeceras de los espejos: SYSTEM-2.13, INTEROP-2.18, GH-INTEROP-1.8. No hubo cambio de SYSTEM ni de GH-INTEROP.

Sin tocar (historia o fuera de alcance de este WI):

- `spec/features/013-pr-driven-control-plane/tasks.md` (T-DONE históricos; no lo edité en esta tarea: ya aparecía modificado en el git status inicial).
- `spec/features/013-pr-driven-control-plane/spec.md:29` y `:21` (INTEROP-2.7 / SYSTEM-2.6 históricos y de mock).
- `CHANGELOG.md` y `harness/reports/` (historia).
- Comentarios de código en `app/src/` que citan INTEROP-2.17 (no se modifican: son código de producto y su ajuste corresponde a WI-CONSOLE-044):
  - `app/src/contracts/contract-validator.ts:5`.
  - `app/src/api/client.ts:11`.
  - `app/src/api/errorEnvelope.contract.test.ts:7`.
  - `app/src/contracts/generated/contract-types.ts:317` y `contract-schemas.ts:798`: texto generado que cita INTEROP-2.17 §7.2. Se conserva tal cual porque sale de los esquemas del espejo (no lo he rastreado hasta el esquema de origen; queda para la revisión).

## CHANGELOG

Añadida una entrada bajo `[Unreleased]` (`WI-CONSOLE-043 (2026-10-21)`): re-espejo INTEROP-2.18 desde Core `5c82853c`, digests, esquema `realtime-events` nuevo, cambio incompatible del lado Core (handshake WebSocket sin sesión rechazado; token en `auth.token` / `Authorization: Bearer`) con adopción de código en WI-CONSOLE-044, y sin cambio de código, DTO ni UI.

## Gates (app/, Node 22, pnpm 12.14.0)

- `pnpm install --frozen-lockfile`: exit 0 («Lockfile is up to date», sin cambios de lockfile).
- `pnpm contracts:generate`: exit 0, «Contratos generados en src/contracts/generated (4 esquemas).»
- `pnpm contracts:check`: exit 0 (antes y después de las ediciones de docs).
- `pnpm lint` (eslint .): exit 0, sin avisos.
- `pnpm exec tsc -b --noEmit`: exit 0, sin errores (los tipos nuevos no rompen compilación).
- `pnpm test --maxWorkers=4`: exit 0. Test Files 79 passed (79); Tests 840 passed (840).
- `pnpm build`: exit 0. Aviso de chunks mayores de 500 kB y sugerencia de code-splitting (preexistente; no bloquea).
- `pnpm format:check` (prettier sobre `src/**/*.{ts,tsx,css}`): exit 0, «All matched files use Prettier code style!».

Los gates se ejecutaron tras la regeneración y antes de las ediciones documentales (`spec/`, `CHANGELOG.md`). Esas ediciones no tocan `app/` ni los archivos que los gates leen.

## Incidentes

- Primer intento del script de espejo con zsh: `$REV:spec` se interpretó como modificador de sustitución («bad substitution»). Sin efecto en el repo; se reintentó con bash y `${}` explícito, sin cambios residuales.
- El esquema `realtime-events.schema.json` y los ejemplos `realtime-*` generan tipos nuevos en `app/src/contracts/generated/`; no rompen compilación ni pruebas. El uso de esos tipos en código (WebSocket, handshake y su adopción) es de WI-CONSOLE-044.
- El Contract Sync `CS-CORE-20261021-001` (breaking del lado Core) queda pendiente: no se acusa ni se resuelve en este WI, y el inbox no se modificó.

## Fuera de este WI (no tocado)

- Cambios de código de producto, DTO, rutas o UI (WI-CONSOLE-044).
- `harness/work-items.json`, `harness/state.json`, `harness/contract-sync/inbox/`, commits, push y PR.
- Ajuste de los comentarios de `app/src/` que citan INTEROP-2.17 (ver arriba).

## Resolución del Contract Sync (leader)

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

`CS-CORE-20261021-001` se resuelve con esta evidencia para la parte contractual de la acción requerida: re-espejo byte a byte de `interoperability-contract.md` (INTEROP-2.18), `github-integration-contract.md` y del árbol `spec/contracts/schemas/` cruzando los digests (verificados también por el leader), tipos regenerados (`contracts:check` sin diferencias) y referencias vigentes de versión actualizadas. La adopción de código (handshake con token, no abrir el socket sin sesión, manejo de `connect_error`, subscribe/ack, `ExperimentStatusResponse` live, comentario de `socket.ts`) NO está hecha aquí: la ejecuta WI-CONSOLE-044 (ST-CONSOLE-046, aprobado, depende de este WI) y se verifica con su propia revisión. Hasta entonces Console sigue enviando `{}` en el handshake, incompatible con Core 5c82853c.
