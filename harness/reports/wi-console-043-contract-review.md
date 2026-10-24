# WI-CONSOLE-043 · Revisión contractual (INTEROP-2.18)

Modelo: contract-reviewer · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo low

Veredicto: APPROVED

## Verificación independiente

- SHA-256 de los 3 contratos locales coinciden con Core @5c82853c (`git show` en Core vs archivo local): interoperability 22b880d1…e311, github-integration 6c553ee8…5565a, system b70f9358…0444.
- Árbol `spec/contracts/schemas`: hash a1ba9a19…9091 (igual al esperado, receta indicada) y `diff -r` contra `git archive` de Core sin diferencias.
- `pnpm contracts:check` (Node 22, app/): exit 0; tipos y esquemas generados coherentes con el espejo.
- CS-CORE-20261021-001 (target console): `C-RESOLVED`, con `consumerImportedAt`, `acknowledgementEvidence` (contract-sync-review) y `resolutionEvidence` (implementation); los dos archivos existen; sourceRevision correcto. -002 (github-integration) y -003 (sandbox) siguen `C-PENDING`, sin evidencia añadida.
- Diff en producto: en `app/` solo `contract-schemas.ts` y `contract-types.ts` (generados). Sin cambios en DTO manuales, rutas, UI, `socket.ts` ni `client.ts`. En `spec/` solo espejo + referencias de versión; el resto son informes/harness.
- Referencias de versión: README, architecture.md y plan/spec de la feature 013 pasan a INTEROP-2.18; tasks.md añade ST-CONSOLE-045/046; CHANGELOG con entrada WI-CONSOLE-043. Quedan menciones a 2.17 solo en texto espejado de Core (historial/notas de versión, esquema sandbox, GH contract) y en entradas históricas del CHANGELOG: correctas. Los comentarios de `app/src` que citan 2.17 se difieren a WI-044 y están listados.

## Sobre la resolución de -001 (punto 4)

Es honesta: la sección «Resolución» declara explícitamente que handshake con token, no abrir socket sin sesión, `connect_error`, subscribe/ack, `ExperimentStatusResponse` y comentario de `socket.ts` NO están hechos, y que Console sigue enviando `{}` (incompatible con Core 5c82853c) hasta WI-CONSOLE-044 (ST-CONSOLE-046, aprobado, con ese alcance literal en su scope-approval). El workflow solo tiene `C-PENDING`/`C-RESOLVED` (no existe estado intermedio) y además la «incompatibilidad conocida» bloquea `interopSyncChecked` independientemente del estado del evento, así que resolver no oculta el riesgo. Aceptable, con condiciones (observaciones, no bloqueantes):
1. La evidencia de resolución cubre solo la parte contractual del espejo; no debe leerse como Console compatible en runtime. Recomiendo que WI-CONSOLE-044 cite -001 en su `contractSyncReview` y que su cierre verifique cada ítem de `requiredAction` de -001.
2. No hacer merge/release de feature/jean contra un Core 5c82853c desplegado antes de cerrar WI-044 (el realtime fallaría con AUTH_REQUIRED; el polling HTTP sigue siendo la base).
Si se prefiere máxima conservadurismo, dejar -001 `C-PENDING` hasta WI-044 también es válido, pero bloquearía el gate de WI-044 sobre su propio evento sin aportar información adicional; no lo exijo.

## Hallazgos

- Ninguno bloqueante.
- Observación menor: `contract-types.ts:317` y `contract-schemas.ts:798` citan INTEROP-2.17 §7.2; es texto generado desde un esquema espejado de Core (no editable aquí).
