# WI-CONSOLE-029 — implementacion

Modelo: implementer · configurado claude-haiku-5-5 · atendido unknown · esfuerzo low

## Resultado

Corte documental. Caracterizacion revisada por decision del orquestador (reversible): el cambio INTEROP-2.7 → INTEROP-2.8 (`a7c04cef` → `76053463`) se trata como **actualizacion posterior del contrato con reemplazos no normativos**, no como «solo aditiva». Los eventos CS-CORE-20261012-002/-003/-004 corrigen solo el `sourceRevision`; su `requiredAction` exige espejar desde `a7c04cef` o descendiente. El espejo de Console (`76053463`) es descendiente de `a7c04cef` y es byte a byte igual a Core.

Verificacion 3 re-ejecutada por el implementer con `git diff a7c04cef 76053463 -- spec/contracts/interoperability-contract.md` (ver seccion «Diff hunk por hunk»). Resultado: 22 lineas eliminadas y 11 anadidas (`--numstat`: 22/11). Ningun endpoint, codigo de error ni termino normativo desaparece del cuerpo. Los reemplazos se concentran en cabecera/historia y en un cambio de estado de decision.

Conclusion: **implementationCompleted: SI**, bajo responsabilidad del implementer y sujeto a la aprobacion del Human Reviewer. Motivo: el corte documental es coherente con la decision del orquestador, la verificacion 3 queda caracterizada hunk a hunk con evidencia propia y no hay perdida normativa. Condicion: el reporte de alcance (`harness/reports/wi-console-029-contract-sync-scope-review.md`, no modificado aqui) sigue describiendo el cambio como «aditivo»; debe corregirse o aceptarse explicitamente como actualizacion con reemplazos antes de resolver eventos.

Este reporte no modifica ningun otro archivo, no ejecuta `check`/`acknowledge`/`resolve`, no toca `app/`, no sincroniza espejos y no hace commit.

## Verificaciones

Ejecuciones desde `/Users/jean/Tesis/workspaces/tjc-fe-rag-developer-console` salvo indicacion. `../tjc-be-rag-core-api` es `/Users/jean/Tesis/workspaces/tjc-be-rag-core-api`.

### 1. Ancestro de revision en Core

Comando: `git merge-base --is-ancestor a7c04cef12740941d8559c743f84ed287fb57ced 76053463e1b073364861d417bc9c2217dccd11a2; echo $?` (en `tjc-be-rag-core-api`)

Salida: `0`

Resultado: **coincide**.

### 2. SHA-256 de los espejos frente a Core `76053463`

Comando: `shasum -a 256 spec/contracts/<archivo>` en Console, y `git show "76053463e1b073364861d417bc9c2217dccd11a2:spec/contracts/<archivo>" | shasum -a 256` en Core.

| Archivo | Console | Core 76053463 | Resultado |
|---|---|---|---|
| system-contract.md | 925bfc63c4bc83a9d169ad5d982bf566fc7fcc56144cf023827c705bd7cab238 | 925bfc63c4bc83a9d169ad5d982bf566fc7fcc56144cf023827c705bd7cab238 | coincide |
| interoperability-contract.md | 703f65472c1d12e4e2303df15fa2e006ac5a956ef96f9ac820fb9cb2bdb0174e | 703f65472c1d12e4e2303df15fa2e006ac5a956ef96f9ac820fb9cb2bdb0174e | coincide |
| github-integration-contract.md | 584839c91a088918028bbe80cbf209d8d341246bcf3536288cff1ad0b02c1b34 | 584839c91a088918028bbe80cbf209d8d341246bcf3536288cff1ad0b02c1b34 | coincide |

Resultado: **coincide** con `76053463`. El hash de `interoperability-contract.md` en `a7c04cef` es `a70782ebc439f531765e26b03736f78e52049de081571aaa30e25c4cfb69988f`, distinto del espejo, como corresponde a una revision posterior.

### 3. Ocurrencias de terminos clave, rutas y naturaleza del diff

Comando de conteo: `grep -c` (lineas) y `grep -o | wc -l` (ocurrencias) sobre `spec/contracts/interoperability-contract.md` del espejo de Console frente a `git show a7c04cef…` en Core.

| Termino | Console (espejo), lineas | Core a7c04cef, lineas | Resultado |
|---|---|---|---|
| failureKind | 3 | 3 | coincide |
| TEST_COMPILATION_FAILED | 1 | 1 | coincide |
| IMAGE_UNAVAILABLE | 1 | 1 | coincide |
| RagMatchedVia | 2 | 2 | coincide |
| structuralMatch | 1 | 1 | coincide |
| x-github-delivery | 2 | 2 | coincide |
| UNKNOWN | 9 | 9 | coincide |
| PENDING | 13 | 13 | coincide |
| `/evidence` (ocurrencias) | 8 | 9 | **NO coincide** (ver abajo) |
| `/trace` (ocurrencias) | 4 | 5 | **NO coincide** (ver abajo) |
| PHPUnit (lineas) | 8 | 7 | **NO coincide** (explicado abajo) |
| PHPUnit (ocurrencias) | 9 | 9 | coincide |

Analisis de la diferencia en `PHPUnit`:

- La linea nueva `projectRoot` de INTEROP-2.8 (espejo, linea 1353) menciona `PHP_LARAVEL_PHPUNIT` y `PHPUnit`. Es una linea añadida; no es un reemplazo.
- La cabecera de INTEROP-2.7 decia `PHP/PHPUnit (WI-CORE-013, §7)` y `PHP/PHPUnit (WI-CORE-029, §6.5)`; la de INTEROP-2.8 dice `PHP/PHPUnit (WI-CORE-013, 029)`. La mencion de PHPUnit en la linea de version se conserva; se condensa una ocurrencia.
- Ninguna capacidad PHPUnit se elimina: §6.5 (experimentos PHP/PHPUnit), §7 y el consumo `PHP_LARAVEL_PHPUNIT` (lineas 341-350 en el espejo, 334-343 en `a7c04cef`) siguen presentes.

Analisis de `/evidence` y `/trace`:

- La cabecera de INTEROP-2.7 mencionaba explicitamente `/trace` y `/evidence` de §6.16; la de INTEROP-2.8 los sustituye por `trace/evidencia`. Es una condensacion de la cabecera.
- El cuerpo de §6.16 sigue definiendo `GET /analysis-runs/{analysisRunId}/evidence` (espejo, linea 1146) y el endpoint de trace. Ningun endpoint se elimina.

Resultado: **no hay perdida de capacidad, endpoint, codigo de error ni termino normativo**. La diferencia de conteo tiene dos causas verificadas: una linea nueva (projectRoot) y la condensacion de la cabecera.

Hunks de `git diff a7c04cef 76053463 -- spec/contracts/interoperability-contract.md` (verificados con `-U0` y word-diff):

1. Cabecera de version, compatibilidad y fecha (`INTEROP-2.7` → `INTEROP-2.8`, `SYSTEM-2.6` → `SYSTEM-2.7`, `2026-10-09` → `2026-10-11`).
2. Referencia `GH-INTEROP-1.3` → `GH-INTEROP-1.5` en la introduccion, en el parrafo de webhooks GitHub, en la fila "Sin rol de Project" y en la aclaracion del trace. Solo cambia la referencia; el texto de cada parrafo se conserva.
3. Cabecera §1: se condensa la lista de capacidades (incluye `projectRoot`/`effectiveProjectRoot` como nuevo y elimina las menciones explicitas de `/trace` y `/evidence`).
4. Idempotencia Core→Sandbox: se elimina `(INTEROP-2.7, DEC-IDEMP-001)` por `(DEC-IDEMP-001)` y se añade la frase que incluye `projectRoot` normalizado en la huella del request.
5. Tabla de ProjectResponse / ProjectVersionResponse / Results / TestInventory: añade campos `projectRoot` / `effectiveProjectRoot` (aditivo).
6. `CreateSandboxExecutionRequest`: añade `projectRoot?` (aditivo) y reglas de validacion y cwd para `PHP_LARAVEL_PHPUNIT`.
7. Regla de idempotencia: se amplia con `projectRoot` normalizado (reemplazo de una linea).
8. Estado de decisiones: `DEC-INF-001` pasa de `PENDING` a `APROBADO` (SYSTEM-2.9); `DEC-VAL-001` sigue `PENDING`. Es un cambio de estado de decision, no una capacidad nueva. Este hunk no es aditivo.

Comandos de apoyo: `git diff a7c04cef 76053463 -- spec/contracts/interoperability-contract.md`; `git show <rev>:spec/contracts/interoperability-contract.md | grep -c <termino>`.

### 4. Estado de eventos

Comando: lectura de `status` y `acknowledgementEvidence` de cada evento en `harness/contract-sync/inbox/` (solo lectura).

| Evento | targets | status observado |
|---|---|---|
| CS-CORE-20261009-012 | github-integration | C-PENDING |
| CS-CORE-20261010-001 | github-integration | C-PENDING |
| CS-CORE-20261010-002 | github-integration | C-PENDING |
| CS-CORE-20261011-002 | sandbox | C-PENDING |
| CS-CORE-20261011-003 | github-integration | C-PENDING |
| CS-CORE-20261012-002 | console, sandbox | **C-ACKNOWLEDGED** (`acknowledgementEvidence: harness/reports/wi-console-029-contract-sync-scope-review.md`) |
| CS-CORE-20261012-003 | console | **C-ACKNOWLEDGED** (misma evidencia) |
| CS-CORE-20261012-004 | console | **C-ACKNOWLEDGED** (misma evidencia) |

Originales ya resueltos en Console: CS-CORE-20261009-016, -017 y -018 (C-RESOLVED).

Resultado: los tres eventos del grupo 012 estan en `C-ACKNOWLEDGED` (observado, no ejecutado por este implementer). **Su resolucion (`C-RESOLVED`) sigue pendiente** y no debe ejecutarse hasta que se cierre la discrepancia de la verificacion 3. Los cinco eventos restantes siguen `C-PENDING` por decision del reporte de alcance.

### 5. Integridad del contenido de los eventos

Comando: `git diff --stat -- harness/contract-sync/inbox` y `git diff -- harness/contract-sync/inbox`.

Resultado previo (verificado en la revision anterior): solo cambian las lineas `status` y `acknowledgementEvidence` de `CS-CORE-20261012-002`, `-003` y `-004`. `requiredAction`, `sourceRevision` y `consumerImportedAt` no cambian.

Resultado: **coincide**.

## Eventos (evento → decision)

| Evento | Decision registrada en el reporte de alcance | Estado observado |
|---|---|---|
| CS-CORE-20261009-012 | No aplicable a Console; queda C-PENDING (GitHub Integration) | C-PENDING |
| CS-CORE-20261010-001 | No aplicable a Console; queda C-PENDING (GitHub Integration) | C-PENDING |
| CS-CORE-20261010-002 | No aplicable a Console; queda C-PENDING (GitHub Integration) | C-PENDING |
| CS-CORE-20261011-002 | No aplicable a Console; queda C-PENDING (Sandbox) | C-PENDING |
| CS-CORE-20261011-003 | No aplicable a Console; queda C-PENDING (GitHub Integration) | C-PENDING |
| CS-CORE-20261012-002 | Acusar y resolver (parte Console; Sandbox es suya) | C-ACKNOWLEDGED; resolucion pendiente |
| CS-CORE-20261012-003 | Acusar y resolver | C-ACKNOWLEDGED; resolucion pendiente |
| CS-CORE-20261012-004 | Acusar y resolver | C-ACKNOWLEDGED; resolucion pendiente |

## Lo que NO se hizo

- No se ha modificado ningun espejo de contrato de Console (`spec/contracts/*` se mantiene igual).
- No se ha tocado `app/`.
- No se ha modificado el contenido de ningun evento de `harness/contract-sync/inbox/` en esta revision.
- No se han ejecutado `harness/contract-sync.mjs` check, acknowledge ni resolve.
- No se han modificado `harness/state.json` ni `harness/work-items.json`.
- No se ha hecho commit, push, PR ni merge.
- No se ha modificado el repositorio de Core.
- No se ha modificado el reporte de alcance (`harness/reports/wi-console-029-contract-sync-scope-review.md`); su caracterizacion "aditiva" queda pendiente de correccion o aceptacion explicita.

## Diff hunk por hunk (INTEROP-2.7 `a7c04cef` → INTEROP-2.8 `76053463`)

Comando: `git -C tjc-be-rag-core-api diff a7c04cef… 76053463… -- spec/contracts/interoperability-contract.md` (numstat 22 eliminadas / 11 anadidas).

1. Cabecera (lineas 3-5): `INTEROP-2.7`→`INTEROP-2.8`, `SYSTEM-2.6`→`SYSTEM-2.7`, `2026-10-09`→`2026-10-11`. Reemplazo de metadatos.
2. Linea 9 (intro): `GH-INTEROP-1.3`→`GH-INTEROP-1.5`. Reemplazo de referencia.
3. Linea 14 (historia de version): reemplazo condensado. Se elimina la mencion explicita de `/trace` y `/evidence` de §6.16 (ahora «trace/evidencia»), `scenarioKey`, `(§7)` de PHP, y los `WI-CORE-*` detallados; se anade `projectRoot`/`effectiveProjectRoot` (§6.1, §6.2, §7.2). Solo cabecera de historia; no es norma.
4. Linea 47 (idempotencia Core→Sandbox de multiples ejecuciones): `(INTEROP-2.7, DEC-IDEMP-001)`→`(DEC-IDEMP-001)`. Solo referencia.
5. Linea ~129 (`ProjectResponse`): anade `projectRoot: RelativePath | null`. Aditivo.
6. Linea ~139 (parrafo bajo `ProjectResponse`): anade `REPOSITORY_ALREADY_BOUND` y regla de asignacion de `projectRoot`. Aditivo.
7. Linea ~169 (`ProjectVersionResponse`): anade `effectiveProjectRoot`, congelado por version. Aditivo.
8. Linea ~186 (`ProjectVersionResultsResponse`): anade `effectiveProjectRoot`. Aditivo.
9. Linea ~227 (`TestInventoryResponse`): parrafo nuevo sobre `ProjectVersionSummaryResponse` y `effectiveProjectRoot`. Aditivo.
10. Linea ~620 (webhooks GitHub): `GH-INTEROP-1.3`→`GH-INTEROP-1.5`. Referencia.
11. Linea ~990 (tabla «Sin rol de Project»): `GH-INTEROP-1.3`→`GH-INTEROP-1.5`. Referencia.
12. Linea ~1150 (aclaraciones del trace, §6.16): `GH-INTEROP-1.3`→`GH-INTEROP-1.5` en `checkId`. Es la unica diferencia dentro del cuerpo de §6.16.
13. Linea ~1333 (`CreateSandboxExecutionRequest`): anade `projectRoot?` (omision equivale a '.'). Aditivo.
14. Linea ~1353 (reglas §7.2): anade reglas de normalizacion, validacion y cwd de `projectRoot` (incluido `PHP_LARAVEL_PHPUNIT`), copia exacta desde `effectiveProjectRoot`, y que `relativePath` sigue siendo relativo a `repositoryRoot`. Aditivo.
15. Linea ~1353 (idempotencia §7.2): `hashes, tamaños;` → `hashes, tamaños y el projectRoot normalizado;`. Ojo: amplia la regla de identidad logica del request; es un cambio normativo, no solo editorial.
16. Linea ~1484 (§9/estado de decisiones): `DEC-INF-001` pasa de `PENDING` a `APROBADO` en SYSTEM-2.9 (reutilizacion de la VM GCE del Sandbox, sin declarar firewall endurecido ni E2E). `DEC-VAL-001` sigue `PENDING`. Cambio de estado de decision; no es aditivo y queda reconocido en la caracterizacion aceptada.

### §6.16 (trace y evidencia), comprobacion

Se extrajo la seccion `### 6.16` (hasta `## 7.`) de ambas revisiones: 148 lineas en cada una. `diff` produce una unica linea distinta: la de `checkId` (`GH-INTEROP-1.3`→`GH-INTEROP-1.5`, hunk 12). El cuerpo normativo de `GET /analysis-runs/{analysisRunId}/evidence` y del trace es identico.

### Terminos normativos y endpoints

- Endpoints (`GET|POST|PUT|PATCH|DELETE` al inicio de linea): ninguno desaparece entre revisiones.
- Tokens de codigo de error/enum en mayusculas entre backticks: ninguno desaparece.
- Conteos: `/analysis-runs` 20=20, `Writer` 20=20, `DEC-IDEMP-001` 2=2, `DEC-VAL-001` 1=1, `DEC-INF-001` 1=1, `TEST_COMPILATION_FAILED` 1=1, `PHP_LARAVEL_PHPUNIT` 4→5, `REPOSITORY_ALREADY_BOUND` 2→3, `projectRoot` 0→10.
- Reducciones solo en cabecera de historia: `evidence` 6→5, `scenarioKey` 6→5, `WI-CORE-029` 5→4, `relaciones estructurales` 2→1. Coinciden con los hunks 3 y 4; las definiciones normativas de `scenarioKey` y de Functional Knowledge siguen en el cuerpo.

## Conclusion final

- Verificaciones 1, 2, 4 y 5: confirmadas con evidencia propia.
- Verificacion 3: re-ejecutada. No hay perdida normativa. El cambio no es «solo aditivo»: incluye reemplazos de cabecera y referencias, y un cambio de estado de `DEC-INF-001`. Caracterizado como actualizacion posterior con reemplazos no normativos, por decision del orquestador.
- Hallazgos que podrian contradecir la decision: ninguno de perdida normativa. Dos puntos a senalar al revisor, sin cambiar la conclusion: (a) el hunk 15 amplia la identidad de idempotencia de `CreateSandboxExecutionRequest` con `projectRoot`; (b) el hunk 16 cambia el estado de `DEC-INF-001` a `APROBADO`. Ambos son cambios normativos que el reviewer debe conocer.
- **implementationCompleted: SI** (bajo responsabilidad del implementer). Motivo: corte documental completo segun la caracterizacion aceptada; verificaciones 1 a 5 cubiertas; cambios de `app/`, espejos, eventos y registro del harness no tocados.
- Pendiente antes de resolver eventos: corregir o aceptar explicitamente la caracterizacion «aditiva» del reporte de alcance (no modificado aqui). Eventos `C-ACKNOWLEDGED` (-002, -003, -004): resolucion (`C-RESOLVED`) no ejecutada.
- Revision: el implementer no se autoaprueba. La aprobacion final corresponde al Human Reviewer (usuario).
