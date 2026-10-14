Modelo: implementer · configurado claude-haiku-5-5 · atendido unknown · esfuerzo low

# WI-CONSOLE-034 — implementación documental (espejo INTEROP-2.16)

## 1. Espejo INTEROP desde Core

- Fuente: `git -C ../tjc-be-rag-core-api show 7f24c169c7d774a2f22a5c74d1869a78d69ab53b:spec/contracts/interoperability-contract.md` (no se usó el working tree de Core).
- Destino: `spec/contracts/interoperability-contract.md` (1528 líneas).
- SHA-256 obtenido: `411bd54955ddfea2fa8e058dc59bfc81b5a2ae03e9b8ee5dd9e72f529e0db789`, igual al esperado.
- Diff contra la copia previa (INTEROP-2.12, `864aa837`): 30 inserciones, 3 borrados, solo aditivo. Cabecera: INTEROP-2.16, fecha de corte 2026-10-14, `Compatible con: SYSTEM-2.12`.

Incidente corregido durante la tarea: en el primer intento, la expansión `$R:spec/...` no se resolvió como revisión:ruta en zsh y el archivo quedó con la cabecera de un `git show` de commit (139 líneas, SHA `b19c1b33…`). Se detectó al revisar el diff (1640 líneas cambiadas) y se restauró con el hash literal del commit. El SHA final coincide con el esperado. No hubo ningún otro archivo afectado.

Verificación de los otros contratos en la misma revisión:
- `system-contract.md`: SHA-256 `d180d4b171d80ed79e3ead1ec67036d34635da9f974288d817b21a797f94f507`, igual en Core `7f24c169` y en la copia Console. Sin cambios.
- `github-integration-contract.md`: SHA-256 `584839c91a088918028bbe80cbf209d8d341246bcf3536288cff1ad0b02c1b34`, igual en Core `7f24c169` y en la copia Console. Sin cambios.

## 2. Referencias actualizadas a INTEROP-2.16

SYSTEM se mantiene en 2.12.

| Archivo | Línea | Cambio |
|---|---|---|
| `spec/README.md` | 10 | `INTEROP-2.12` → `INTEROP-2.16` (copia espejo) |
| `spec/constitution/architecture.md` | 3 | `INTEROP-2.12` → `INTEROP-2.16` |
| `spec/features/013-pr-driven-control-plane/plan.md` | 5 | `INTEROP-2.12` → `INTEROP-2.16` |
| `spec/features/013-pr-driven-control-plane/spec.md` | 5 | `INTEROP-2.12` → `INTEROP-2.16` (contrato operativo vigente) |
| `spec/features/013-pr-driven-control-plane/spec.md` | 41 | `INTEROP-2.12` → `INTEROP-2.16` (describe lo vigente) |

No se tocaron menciones históricas (2.6/2.7), reports previos, CHANGELOG, `harness/state.json`, `harness/work-items.json` ni `tasks.md` (`tasks.md` ya tenía una modificación previa que no es de este corte). Tras el cambio, no queda `INTEROP-2.12` en esos cuatro archivos.

## 3. Consumidores revisados

Sin cambios de código de producto. Los campos nuevos (`technicallyValidRate`, `assertionFailureCount`, `dependencyContext`, `final`, `startedAt`/`completedAt` de `StageDuration`) no se mapean en Console: `toStrategyMetrics` copia campo a campo y los ignora. Verificado por lectura de `app/src/experiments/liveMapping.ts`.

## 4. Test añadido

Existía cobertura para los campos INTEROP-2.7 pero ninguna para `technicallyValidRate`/`assertionFailureCount`, así que se añadió una prueba mínima al final de `app/src/experiments/liveMapping.test.ts`: tolera ambos campos presentes en la respuesta, no alteran `validRate`/`passedRate`/`evaluableRepetitions` y no aparecen en el view model. Sin cambios de tipos ni UI.

## 5. Resultados de gates (en `app/`)

- Lint (`npm run lint`): 0, sin errores.
- Typecheck (`node node_modules/typescript/bin/tsc -b --noEmit`): 0.
- Tests (`node node_modules/vitest/vitest.mjs run --maxWorkers=2`): 73 archivos, 803 tests pasados.
- Build (`npm run build`): 0. Solo aviso de tamaño de chunk, preexistente.
- `node harness/validate-harness.mjs`: falla con `ST-CONSOLE-038 is ready but WI-CONSOLE-034 is in another phase`. Es una inconsistencia de estado del harness, no de este corte. Requiere que el leader actualice la fase del WI o el estado de `ST-CONSOLE-038` en `harness/work-items.json`/`harness/state.json`; no se editaron esos archivos.

## 6. Estado del corte

Corte documental y de prueba completado, con los gates de `app/` en verde. Pendiente para el leader: registrar `decisionGate` y eventos de Contract Sync, y resolver la validación del harness. El WI no debe declararse terminado hasta que el usuario revise el diff y apruebe.
