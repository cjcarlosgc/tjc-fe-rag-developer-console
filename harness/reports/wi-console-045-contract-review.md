Modelo: contract-reviewer · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo low

# WI-CONSOLE-045 — revisión contractual

Veredicto: APPROVED (con una observación no bloqueante).

## Verificación propia contra Core 3d2383e4b6efc20162b77945261fe08d384094a8

Todo se comprobó con `git show`/`git archive` de la revisión, no con el working tree de Core.

- `system-contract.md`: sha256 `f60d6c4b…6ce3` en Core y en Console. Coincide. Cabecera SYSTEM-2.14.
- `interoperability-contract.md`: sha256 `f9866d16…c6f9` en Core y en Console. Coincide. Cabecera INTEROP-2.19, compatible con SYSTEM-2.14.
- `github-integration-contract.md`: `6c553ee8…565a` en Core y en Console. Sin cambio; no aparece en `git status`.
- Árbol `spec/contracts/schemas` (receta indicada): `a1ba9a19…9091` en Console y en `git archive`. `diff -r` sin diferencias. `git status` no lo marca.
- `pnpm contracts:check` en `app/`: exit 0.
- `app/` sin cambios: `git status` y `git diff HEAD -- app` vacíos.
- El diff de `spec/contracts` solo toca los dos espejos esperados.

## Contract Sync CS-CORE-20261021-004

- Evento en `harness/contract-sync/inbox/`, `status: C-RESOLVED`. Es el único entrada nueva en esa carpeta; los demás eventos (-001, -002, -003 y anteriores) no figuran como modificados.
- `sourceRevision` correcto. `breaking: false`.
- `acknowledgementEvidence` (`wi-console-045-contract-sync-review.md`) y `resolutionEvidence` (`wi-console-045-implementation.md`) existen.
- Resolución honesta. La requiredAction de Console es solo re-espejar, sin código. Coincide con lo hecho. Los targets `github-integration` y `sandbox` se declaran ajenos.

## Referencias de versión vigentes

- `spec/README.md`, `constitution/architecture.md`, `013/plan.md` y `013/spec.md` están en 2.14/2.19.
- No quedan menciones vigentes a SYSTEM-2.13 ni a INTEROP-2.18 fuera de los espejos y de la historia (tasks ST-CONSOLE-041/045 y CHANGELOG).
- Se añadió ST-CONSOLE-047 en `tasks.md`, coherente con el formato previo.

## Lectura del cambio de Core frente a Console

La lectura es correcta: no hay cambio de rutas, DTO, enums, `ErrorCode` ni esquemas, y el cambio no exige código en Console.

- `app/src/control-plane/errors.ts` (`reasoningEffortMessage`) lee `details.supportedEfforts` como lista abierta de cadenas, sin enumerar combinaciones. Con `['none']` produce un mensaje válido.
- No se encontró en `app/src` ningún texto ni lógica que asuma una lista fija de combinaciones modelo/esfuerzo.
- `reasoningEffort` es `string | null`, así que el tipo es abierto.
- `ExperimentPage.test.tsx` usa `['low','medium']`, un mock sin impacto.
- No hay referencias a `LLM_SUPPORTED_COMBINATIONS`, `EXPERIMENT_LLM_*` ni `gpt-4o`.

## Observación no bloqueante (opcional, fuera de este WI)

El texto de `errors.ts` dice «El modelo no admite el esfuerzo de razonamiento configurado… Esfuerzos admitidos: none.». Desde INTEROP-2.19 el 422 solo sale por temperatura incompatible con razonamiento activo. El mensaje sigue siendo cierto en lo esencial, pero la causa ya no es el modelo. Conviene considerar un ajuste de redacción (y del comentario «INTEROP-2.7») en un WI posterior, sin cambio de contrato. Requiere aprobación de alcance aparte y no afecta esta resolución.

## Hallazgos bloqueantes

Ninguno.
