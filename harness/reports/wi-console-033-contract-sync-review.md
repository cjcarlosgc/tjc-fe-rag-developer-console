# WI-CONSOLE-033 — revisión de Contract Sync (acuse)

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

Eventos: `CS-CORE-20261012-007` (WI-CORE-047, SYSTEM/INTEROP-2.10, `f501aef7c0bf36c702e8703abf4f522ab29a54b8`), `-009` (WI-CORE-049, 2.11, `b07d188a6ad60051e40e4d47ae44ec06aa0de50f`) y `-011` (WI-CORE-049, 2.12, `864aa837b95fa379cc2c6d0a98f37521ff3eb3b6`); los tres `targets: [console]`, `breaking: false`.

## Precedencia

Cadena lineal verificada con `git merge-base --is-ancestor` en `../tjc-be-rag-core-api`: `30b9acdf` (espejo previo) < `f501aef7` (-007) < `b07d188a` (-009) < `864aa837` (-011). Cada revisión contiene a la anterior; -011 reemplaza a -009 (y -012 a -010) y es la revisión objetivo. El texto de -007 («cuando Core implemente OC08») está caduco por -009 (DEC-VAL-002 implementada en WI-CORE-048; mensaje de OC11 en WI-CORE-046). Las `requiredAction` son compatibles: espejar byte a byte sin cambio de DTO.

## Verificación (solo `git show` de la revisión; no el working tree de Core)

- SYSTEM en `864aa837`: `d180d4b171d80ed79e3ead1ec67036d34635da9f974288d817b21a797f94f507` (espejo anterior `fe48d5d3…25a6`).
- INTEROP en `864aa837`: `50f8bd53697c573c48fed596e408ec7514c95cb8dea79d0fc00f547a457c7194` (espejo anterior `cf9c7c31…ca25`).
- GH-INTEROP en `864aa837`: `584839c91a088918028bbe80cbf209d8d341246bcf3536288cff1ad0b02c1b34`, idéntico al de Console; no cambia.
- El espejo anterior de Console equivalía a `30b9acdf`; `cmp` de los tres archivos de Console contra `git show 864aa837` sin diferencias tras copiar.
- `-008` (github-integration), `-010` y `-012` (sandbox) no apuntan a Console: no se importan.

## Acción requerida y plan

1. Espejar SYSTEM-2.12/INTEROP-2.12 byte a byte (hecho) y actualizar las referencias vigentes de versión.
2. `resultSummary` de OC11 como texto libre sin «300» y Run `INFRASTRUCTURE_FAILURE` con propuestas `AVAILABLE` no publicable: según `wi-console-033-sdd-verification.md` §2 el comportamiento ya se cumple; falta mock y pruebas de regresión (corte delegado al implementer, sin cambios de producto, DTO ni rutas).
3. `DEC-INF-002` y `DEC-VAL-002` no se muestran como regla de UI (grep 0 en `app/`).
