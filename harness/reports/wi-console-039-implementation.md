# WI-CONSOLE-039 · Implementación (documental)

Modelo: implementer · configurado claude-haiku-5-5 · atendido unknown · esfuerzo low

## Espejo y digests

- `spec/contracts/interoperability-contract.md` espejado byte a byte desde Core con `git show 67519a20a5e061bd81a880fe539693c9a364bba3:spec/contracts/interoperability-contract.md` (no desde el working tree).
- SHA-256 verificado: `b9ed40dc8d15a414b7cca4ccee4f320ba9da8f7444ef426b8321d17bdc0dea05` (coincide).
- `git diff --stat` sobre `spec/contracts/`: solo ese archivo, 2 líneas cambiadas (§5 sobre `pollAfterMs` y reintentos del Sandbox; §10 sobre validación transitoria). Cabecera vigente: INTEROP-2.17, compatible con SYSTEM-2.13, corte 2026-10-18.
- `system-contract.md`: `b70f9358fabdaa6d8ac61d07e25258ec5256f9dacd31049edb4f08e6879a0444` (coincide, sin cambio). Cabecera SYSTEM-2.13.
- `github-integration-contract.md`: `6c553ee856d0c53420a75d2bde5a9eb04cce2e029ffae1bf4194dcbc7a25565a` (coincide, sin cambio). Cabecera GH-INTEROP-1.8.
- Árbol `spec/contracts/schemas`: `c45e4513f4f8b3e8f2649f5b1c8f63fc4a187ddfb5fa0fb1232f85fb29fa1b31` (coincide, sin cambio).

## Referencias actualizadas

Búsqueda de `INTEROP-2.16` / `SYSTEM-2.12` fuera de `spec/contracts/`, CHANGELOG y reports. Se cambiaron solo las referencias que describen el contrato vigente:

- `spec/features/013-pr-driven-control-plane/spec.md:5`: «Contrato operativo vigente» pasa de SYSTEM-2.12 / INTEROP-2.16 / GH-INTEROP-1.7 a SYSTEM-2.13 / INTEROP-2.17 / GH-INTEROP-1.8.
- `spec/features/013-pr-driven-control-plane/spec.md:41`: la misma terna en la frase que describe lo que establecen los contratos.
- `spec/features/013-pr-driven-control-plane/plan.md:5`: la misma terna.

Sin cambios:
- `spec/features/013-pr-driven-control-plane/tasks.md:27` (ST-CONSOLE-038, T-DONE histórico que describe WI-CONSOLE-034).
- `spec/README.md` y `spec/constitution/architecture.md` ya citaban SYSTEM-2.13 / INTEROP-2.17 / GH-INTEROP-1.8.

Nota: `GH-INTEROP-1.8` se tomó de la cabecera del espejo GitHub (y de `architecture.md`), no solo de la indicación del WI, porque la 013 citaba 1.7 y describe el contrato vigente.

Nota de estado previo: `spec/features/010-product-experience/tasks.md`, `spec/features/013-pr-driven-control-plane/tasks.md` y `spec/transversal/testing/tasks.md` ya aparecían modificados antes de empezar (estado inicial de la sesión); no los toqué en esta tarea.

## Gates (app/, Node 22, pnpm)

- `pnpm contracts:generate`: «Contratos generados en src/contracts/generated (3 esquemas).» No cambió ningún archivo (`git status` de `app/` vacío tras generar).
- `pnpm contracts:check`: sin diferencias, exit 0.
- `pnpm lint` (eslint .): exit 0, sin avisos.
- `pnpm exec tsc -b --noEmit`: exit 0.
- `pnpm test` (vitest run): 79 archivos de prueba pasados (79/79), 840 pruebas pasadas (840/840). Sin repetición: no hubo fallos. Avisos «Not implemented: HTMLCanvasElement getContext» (ruido de jsdom, no fallo).
- `pnpm build`: exit 0, «built in 792ms». Aviso de chunks > 500 kB (preexistente, no bloquea).

No se modificaron pruebas ni código de aplicación.

## Incidentes

- Ninguno bloqueante.
- Los digests coinciden con los esperados; no hubo que reespejar.
- Los archivos fuera de `spec/contracts/` y de la 013 no se tocaron. No se hizo commit, push, ni se editaron `harness/work-items.json`, `harness/state.json` ni `harness/contract-sync/inbox`.
