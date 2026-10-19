# WI-CONSOLE-041 — revisión independiente

Modelo: reviewer · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Veredicto: APPROVED**

Revisión independiente del WI **retroactivo** WI-CONSOLE-041. Revisa `a464b61` y `99e1ecc`, ejecutados por la sesión cross (`implementationAgent: cross`) sin WI ni revisión en su momento. El reviewer no participó en la implementación.

## Declaración de retroactividad y no duplicación
- `wi-console-041-retroactive-verification.md` declara en su cabecera la retroactividad y `implementationAgent: cross`, y cita ambos commits y los reportes cross-fase2/3. Cumple el criterio 1.
- No duplica WI-CONSOLE-039: este WI no vuelve a espejar INTEROP-2.17, solo verifica código y entorno. Los hallazgos 1 y 2 del reporte remiten a WI-CONSOLE-039 y WI-CONSOLE-040 como ya resueltos.

## Revisión de código
- `ApiError.retryable` (client.ts): campo opcional añadido al final del constructor, así que no rompe a los llamadores. El cuerpo se lee como `Partial<ErrorEnvelope>`, que tolera campos ausentes o desconocidos. No se registra ni se propaga ningún dato nuevo salvo `retryable`.
- `generate-contract-types.mjs`: determinista (archivos ordenados, salida formateada). `--check` compara byte a byte y sale con 1 si hay deriva. Solo lee `spec/contracts/schemas` y escribe en `src/contracts/generated`. No hay red ni `eval`.
- `contract-validator.ts`: Ajv2020 con `strict: true`. Los errores solo incluyen ruta y motivo, nunca valores del payload. Lanza error ante contratos desconocidos.
- `errorEnvelope.contract.test.ts`: valida los ejemplos canónicos contra el esquema y comprueba que `ApiError` mapea `status`, `code`, `message`, `correlationId` y `retryable` (con y sin él). Prueba útil y no tautológica.
- `ci.yml`: `permissions: contents read`, acciones oficiales fijadas a v4, `pnpm install --frozen-lockfile`, y `corepack` con `packageManager: pnpm@12.14.0`. Sin secretos.
- `.env.test`: solo `http://core.test` (no se contacta, fetch está simulado). `.gitignore` excluye `.env` y `.env.*` salvo `.env.example` y `.env.test`. Sin filtrado de secretos: la búsqueda de secret/token/key/password en `.env.test`, `ci.yml` y `scripts` no devolvió coincidencias.

## Evidencia reproducida (Node v22.23.3, pnpm 12.14.0)
| Comprobación | Resultado |
|---|---|
| `pnpm contracts:check` (generados == esquemas) | rc 0, sin deriva |
| `RunsPage.test.tsx` + `errorEnvelope.contract.test.ts` con `app/.env` hostil (`VITE_DATA_SOURCE=mock`, `VITE_AUTH_MODE=mock`, `VITE_CORE_API_URL=http://localhost:9999/wrong`), borrado después (verificado) | 2 archivos, 9/9 |
| `pnpm lint` | rc 0 |
| `pnpm exec tsc -b --noEmit` | rc 0 |
| `pnpm build` | rc 0 (solo aviso de chunks >500 kB, preexistente) |
| `pnpm format:check` | rc 0 |
| `pnpm test` | 79 archivos, 840/840 (la corrida completa se hizo sin `.env`) |
| `sdd-check`, `validate-work-items` (42 WI), `validate-harness`, `validate-completions` (37 WI) | todos pasan |

## Hallazgos
1. **Info/bajo — CI sin `format:check`.** `ci.yml` ejecuta `contracts:check`, lint, build y test, pero no `pnpm format:check` (que el Harness exige localmente). El `tsc` va incluido en `build`. Recomendación opcional para un WI posterior; no bloquea.
2. **Info — CI no ejecutada en GitHub.** Solo se validó en local (lo declaran cross-fase3 y el reporte). Queda como riesgo residual aceptado.
3. **Info — alcance acotado.** Solo el error envelope se tipa desde el esquema y ~130 tipos siguen a mano; está declarado. `ApiError.retryable` es aditivo.
4. **Info — trazabilidad.** `Refs: transversal (sin HU)` en los commits se regulariza con HU01/HU12/HU14 en el WI; los commits no se reescriben.
5. **Nota de proceso.** Mi primer intento de `RunsPage.test.tsx` usó una ruta incorrecta (`src/pages/`; la correcta es `src/control-plane/`) y no ejecutó nada. Se repitió bien con el `.env` hostil (resultado en la tabla). No afecta al veredicto.

No hay hallazgos de severidad crítica, alta ni media. No hay DEC abiertas ni cambio de contrato o alcance no aprobado.
