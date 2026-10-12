# WI-CONSOLE-031 — revisión de Contract Sync (acuse)

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

Evento: `CS-CORE-20261012-005` (core, WI-CORE-045, `targets: [console]`, `breaking: false`, `sourceRevision: 30b9acdfbc063b027ad891799574b4553574559e`, commit «docs(spec): INTEROP-2.9 aclara 404 FUNCTIONAL_QUESTION_NOT_FOUND, continuationAttemptId y functionalBehaviorValidated; registra DEC-VAL-002 PROPOSED (WI-CORE-045)»).

## Verificación (repositorio `../tjc-be-rag-core-api`, solo `git show` de la revisión; no el working tree)

- `30b9acdf` es descendiente de `76053463e1b073364861d417bc9c2217dccd11a2` (espejo actual): `git merge-base --is-ancestor` verdadero.
- SHA-256 en `76053463` == espejo actual: INTEROP `703f6547…174e` (INTEROP-2.8), SYSTEM `925bfc63…c238`.
- SHA-256 en `30b9acdf` (objetivo del espejo): INTEROP-2.9 `cf9c7c3167d99b67191caf9ec7c057a5ee3c7a0ccee8f303e55ba6708a08ca25`, SYSTEM `fe48d5d3f4980ce0e47d13b1750b3b827cf848184e9145086aeb07a81b0625a6`.
- GH-INTEROP: `584839c91a088918028bbe80cbf209d8d341246bcf3536288cff1ad0b02c1b34` en `30b9acdf` y en Console; sin diff entre `76053463` y `30b9acdf`. No cambia.
- Diff `76053463..30b9acdf` de INTEROP: 14 inserciones, 6 eliminaciones (aclaraciones §6.11 y OC11); de SYSTEM: 15 inserciones (línea de remisión y `DEC-VAL-002` PROPOSED «sin efecto normativo hasta su aprobación»).
- `CS-CORE-20261012-006` apunta solo a `github-integration`: no es de Console; permanece `C-PENDING` en el buzón (el harness no admite acuse ni `NOT_RELEVANT` para eventos sin `console` en `targets`; ver `wi-console-029-contract-sync-scope-review.md`).

## Acción requerida por el evento y plan

1. Espejar INTEROP-2.9 y SYSTEM byte a byte (sin DTO).
2. Tratar `404 FUNCTIONAL_QUESTION_NOT_FOUND` al responder como pregunta obsoleta y refrescar el inbox.
3. No asumir consultable un `continuationAttemptId` no nulo.
4. No mostrar `DEC-VAL-002` como regla vigente.

Los puntos 2 a 4 se verifican en `harness/reports/wi-console-031-sdd-verification.md` §3: el 404 no está tratado hoy (corte de UI pequeño), `continuationAttemptId` no lo lee ningún componente y `DEC-VAL-002` no se cita en `app/`. Sin cambio de DTO ni rutas.
