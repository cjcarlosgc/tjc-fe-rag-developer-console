# WI-CONSOLE-033 — verificación de suficiencia SDD

Modelo: sdd-analyst · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo low

**Veredicto: SUFICIENTE** (sin DECISION_REQUIRED; con cinco puntos de atención en la sección 6). W-SPEC_VERIFIED no está impedido.

**ACTUALIZACIÓN (ampliación de alcance, CS-CORE-20261012-011):** el espejo objetivo pasa de `b07d188a` (2.11) a `864aa837b95fa379cc2c6d0a98f37521ff3eb3b6` (SYSTEM/INTEROP-2.12). Las secciones 1 a 7 describen el análisis original con 2.11; la sección 8 las corrige y prevalece: donde el texto diga `b07d188a`, `2.11` o `DEC-INF-002 PROPOSED`, léase la sección 8. El veredicto no cambia.

Fuentes: eventos `CS-CORE-20261012-007` a `-010` leídos enteros; contratos de Core solo vía `git -C ../tjc-be-rag-core-api show <rev>:<ruta>`; no se leyó el working tree de Core.

## 1. Precedencia -007 vs -009 y espejo

| Evento | WI Core | targets | Revisión | Contenido |
|---|---|---|---|---|
| -007 | WI-CORE-047 | console | `f501aef7c0bf36c702e8703abf4f522ab29a54b8` | SYSTEM-2.10 / INTEROP-2.10 |
| -008 | WI-CORE-047 | github-integration | igual que -007 | no es de Console |
| -009 | WI-CORE-049 | console | `b07d188a6ad60051e40e4d47ae44ec06aa0de50f` | SYSTEM-2.11 / INTEROP-2.11 |
| -010 | WI-CORE-049 | sandbox | igual que -009 | no es de Console |

- Ascendencia (verificada con `merge-base --is-ancestor`): `30b9acdf` -> `f501aef7` -> `b07d188a`. `b07d188a` es HEAD de la rama `feature/jean` de Core y contiene ambos eventos.
- Qué acota qué: -009 es acumulativo y posterior; su revisión contiene todo lo de -007. Es la «revisión canónica más reciente que contiene ambos». Ambos son `breaking: false` y sin cambio de rutas, campos, códigos, estados ni transporte.
- Los textos de -007 quedan parcialmente caducos por -009: -007 dice «cuando Core implemente OC08 un Run INFRASTRUCTURE_FAILURE conservará propuestas AVAILABLE», pero SYSTEM-2.11 declara DEC-VAL-002 «implementada en WI-CORE-048» y el mensaje de OC11 «implementado en WI-CORE-046». Para Console, el estado normativo vigente es el de -009; los requiredAction de ambos son compatibles (espejar, sin DTO).
- Espejar solo desde `b07d188a`; no existe un estado intermedio útil en `f501aef7`. Ambos eventos se acusan/resuelven con la misma evidencia.

SHA-256 (de `git show <rev>:spec/contracts/<f>.md`):

| Archivo | `30b9acdf` | `f501aef7` | `b07d188a` | Espejo actual de Console |
|---|---|---|---|---|
| system-contract.md | `fe48d5d3…0625a6` | `3a58e369…ead5` | `638d53cc…6277` | `fe48d5d3…0625a6` (= 30b9acdf) |
| interoperability-contract.md | `cf9c7c31…ca25` | `0f303d53…a854` | `69a7491f…0a85` | `cf9c7c31…ca25` (= 30b9acdf) |
| github-integration-contract.md | `584839c9…1b34` | `584839c9…1b34` | `584839c9…1b34` | `584839c9…1b34` (= las tres) |

Completos: SYSTEM `fe48d5d3f4980ce0e47d13b1750b3b827cf848184e9145086aeb07a81b0625a6` / `3a58e36932ad5ed2404afa45fadc10b8e0b7de51220b1212eb7d0aa6a684ead5` / `638d53cc7f4527ca11bef1b02bd873171c2cb1f36aae9117036ba15999a16277`; INTEROP `cf9c7c3167d99b67191caf9ec7c057a5ee3c7a0ccee8f303e55ba6708a08ca25` / `0f303d530edad7fa242be8e713cdcd6d5baea1b1ac9ff8cb984678a628a6a854` / `69a7491f0d7055226f4e1bb284e9b9303695f461bf57e60f1614f965556d0a85`; GH-INTEROP `584839c91a088918028bbe80cbf209d8d341246bcf3536288cff1ad0b02c1b34` (idéntico en las tres revisiones y en Console).

Consecuencia: el espejo actual coincide byte a byte con `30b9acdf`; GH-INTEROP no cambia (no hay nada que copiar); SYSTEM e INTEROP deben reemplazarse enteros con los de `b07d188a`.

Diff `30b9acdf..b07d188a` (solo `spec/contracts/`: INTEROP 8 líneas, SYSTEM 50; GH-INTEROP sin cambio):
- Cabeceras: `INTEROP-2.9`->`2.11`, `Compatible con SYSTEM-2.11`; `SYSTEM-2.9`->`2.11`; Estado SYSTEM «salvo decisiones `PENDING`/`PROPOSED`»; las menciones `INTEROP-2.8 §6.13/§6.14` pasan a `INTEROP-2.11`.
- `DEC-VAL-002`: de PROPOSED a APROBADA (2026-10-12, WI-CORE-047), `Blocks: NONE`; regla de fallo de plataforma por símbolo y precedencia `BEHAVIORAL_MISMATCH > TECHNICAL_GENERATION_FAILURE > INFRASTRUCTURE_FAILURE > SUCCESS > NO_ADDITIONAL_TESTS_REQUIRED / NO_TEST_RELEVANT_CHANGES`; condición de no afectar experimentos, evidencia ni métricas; «implementada en WI-CORE-048».
- Consecuencia normativa para Console: un Run `INFRASTRUCTURE_FAILURE` con propuestas `AVAILABLE` válidas tiene Check `neutral` y no es publicable (`409 TEST_PUBLICATION_INVALID_RUN_STATUS`); los resultados por símbolo y `resultSummary` (que cuenta por separado fallos de plataforma y técnicos) siguen consultables.
- `DEC-INF-002` nueva, **PROPOSED**, sin efecto normativo; `Blocks`: el despliegue de Core en Render contra el Sandbox remoto; propone exponer el Sandbox por HTTPS desde las IP de Render con proxy TLS y bearer. No afecta contratos HTTP de Console.
- OC11 §6.10: el `resultSummary` pasa de «PR excede 300 archivos; análisis no realizado» (objetivo) a texto genérico y veraz implementado en WI-CORE-046: «No se pudo verificar el compare de GitHub (por ejemplo, un PR con 300 o más archivos); análisis no realizado»; Core no afirma que exceda 300 porque `UNVERIFIABLE` también cubre permiso, 403, 429, 5xx, red. `resultSummary` sigue siendo «texto para personas, no un enum ni un valor garantizado»; el límite 300 pertenece a GitHub Integration.
- `409 TEST_PUBLICATION_INVALID_RUN_STATUS` (Run no `SUCCESS` o no vigente) ya estaba en INTEROP-2.9 §6.12; no es código nuevo.
- Reglas de compatibilidad añaden párrafos de SYSTEM-2.10 y 2.11.

## 2. Producto en `app/` (sin cambio de DTO ni rutas)

### (a) `resultSummary` / UNVERIFIABLE / «300» — CUMPLIDO
- Console renderiza `run.resultSummary` como texto libre en `app/src/control-plane/AnalysisRunDetailPage.tsx:253` (OBSOLETE), `:258` (FAILURE_STATUSES, incluye INFRASTRUCTURE_FAILURE, `role="alert"`), `:262` (informativos), `:267` (BEHAVIORAL_MISMATCH). El tipo es `string | null` (`app/src/control-plane/types.ts:159`).
- `grep` de `\b300\b`, `UNVERIFIABLE`, `excede` en `app/src` (fuera de mocks): ninguna regla de Console depende de 300 ni de un umbral. Los `300` son `pollAfterMs` en mocks/tests (`mockBackend.ts:1679,1699,1736,2299`) y métricas de experimentos; sin relación. No hay uso de `UNVERIFIABLE` (es un estado de GitHub Integration que Console no consume; compare lo traduce Core a `INFRASTRUCTURE_FAILURE`).
- Falta prueba específica: el único test del caso es `AnalysisRunDetailPage.test.tsx:135-139` (`arun_checkout_pr48`, texto «La GitHub Compare API no respondió…»), que no cubre el texto del compare no verificable ni demuestra independencia de «300». Mock `mockBackend.ts:617` no usa el texto de OC11.

### (b) PublishSection / INFRASTRUCTURE_FAILURE con AVAILABLE — gating CUMPLIDO, prueba NO CUMPLIDA
- Gating: `PublishSection` solo se monta para `run.status === 'BEHAVIORAL_MISMATCH'` (`AnalysisRunDetailPage.tsx:270`) y `'SUCCESS'` (`:272`). Para `INFRASTRUCTURE_FAILURE` no se monta: ni lista de propuestas ni botón; solo el panel de fallo (`:257-259`). Por tanto no se ofrece publicar. Dentro de `PublishSection` el botón depende de `canPublish` (Writer), `available.length > 0` y `!endedWithoutPublish` (`:40-…`); en BEHAVIORAL_MISMATCH las propuestas son `HELD` y no se ofrece (test `AnalysisRunDetailPage.test.tsx:94-99`).
- Defensa en profundidad: `useAnalysisRun`/`usePublishTests` ya trata `409 TEST_PUBLICATION_INVALID_RUN_STATUS` releyendo propuestas y Run (`queries.ts:244-252`); prueba existente en `publicationPolling.test.tsx:129` y mock `mockBackend.ts:2275` (409 si `status !== 'SUCCESS'`).
- Mock: `arun_checkout_pr48` (`mockBackend.ts:611-618`) es INFRASTRUCTURE_FAILURE con `generatedTestsCount: 0` y sin propuestas (`__proposals` ausente). **No existe ningún caso mock ni prueba de INFRASTRUCTURE_FAILURE con propuestas `AVAILABLE`.** Hay que añadirlos para que el criterio «con prueba» sea verificable.
- Hecho a documentar: como la sección no se monta, las propuestas `AVAILABLE` conservadas en Core no se muestran en un Run INFRASTRUCTURE_FAILURE. El contrato dice que «siguen consultables», no que Console deba mostrarlas; mostrarlas sería comportamiento nuevo (ver 6.2).

### (c) DEC-INF-002 / DEC-VAL-002 en UI, mock, README — CUMPLIDO
- `grep -rnE "DEC-VAL|DEC-INF|UNVERIFIABLE|300 archivos"` en `app/`, `README.md`, `spec/features`: 0 coincidencias de producto, mock o README. Ninguna pantalla cita las decisiones.
- Mock: `mockBackend.ts:1727` redacta un `resultSummary` de mismatch por respuesta funcional, no cita DEC. Nada que corregir.

### Corte mínimo de implementación (sin DTO/ruta)
Ningún cambio de comportamiento de producto es necesario. Solo pruebas y mock:
1. `app/src/api/mockBackend.ts`: sembrar un Run (o ampliar `arun_checkout_pr48`) `INFRASTRUCTURE_FAILURE` con `resultSummary` genérico de OC11 y propuestas `AVAILABLE` (incluye `generatedTestsCount`/`symbols` coherentes). Texto del mock sin «300 archivos» como afirmación (copiar el texto genérico veraz).
2. `app/src/control-plane/AnalysisRunDetailPage.test.tsx`: (i) INFRASTRUCTURE_FAILURE con propuestas `AVAILABLE` -> no hay «Propuestas de prueba» ni botón `Publicar`, y el panel de fallo muestra el `resultSummary`; (ii) un `resultSummary` sin «300» (p. ej. «No se pudo verificar el compare… permiso») y otro con «300 o más archivos» se renderizan literalmente como texto libre; Writer/Admin y Reader.
3. Opcional: test de `usePublishTests` con 409 `TEST_PUBLICATION_INVALID_RUN_STATUS` ya cubierto (`publicationPolling.test.tsx:129`); no duplicar.
4. Espejos y referencias (sección 3), `CHANGELOG.md`, `tasks.md` ST-CONSOLE-035, harness. Sin cambios en `types.ts`, `api.ts`, rutas ni live.

## 3. Referencias vigentes de versión a actualizar

Actualizar a `SYSTEM-2.11 / INTEROP-2.11` (GH-INTEROP-1.7 se mantiene):
- `spec/README.md:9` — «`SYSTEM-2.9`»; `spec/README.md:10` — «`INTEROP-2.9`».
- `spec/constitution/architecture.md:3` — `SYSTEM-2.9 / INTEROP-2.9 / GH-INTEROP-1.7`.
- `spec/features/013-pr-driven-control-plane/plan.md:5` — `SYSTEM-2.9/INTEROP-2.9/GH-INTEROP-1.7`.
- `spec/features/013-pr-driven-control-plane/spec.md:5` y `:41` — `SYSTEM-2.9 / INTEROP-2.9 / GH-INTEROP-1.7` y «SYSTEM-2.9, INTEROP-2.9 y GH-INTEROP-1.7».
- `spec/contracts/system-contract.md:3` e `interoperability-contract.md:3-4` (y cuerpo): se reemplazan enteros por el espejo (sin edición manual).

Históricas, no tocar: `CHANGELOG.md`, `harness/reports/**`, `harness/contract-sync/**`, `spec/features/013…/tasks.md:18,22` (ST-CONSOLE-027/033 cerradas), comentarios `INTEROP-2.9 §6.11` en `app/src` (`mockBackend.ts:1660`, `action-required/types.ts:79`, `queries.ts:63`, `FocusModePage.tsx:48`, `errors.ts:99,104`, tests `INTEROP-2.9`): citan la versión que fijó cada regla; correctos tras el espejo.
Ninguna referencia a `30b9acdf` en `spec/` ni en `app/` (grep: 0); `app/src` no referencia `SYSTEM-2.x` como versión vigente. `spec/backlog.md` sin referencias.

## 4. Decisiones con `Blocks` que alcanzan este WI

Fuente: `spec/contracts/system-contract.md` (espejo actual) y SYSTEM-2.11 de `b07d188a`.
- `DEC-VAL-002`: en el espejo actual PROPOSED (`system-contract.md:287`, Blocks solo el WI de código de Core OC08). En SYSTEM-2.11 pasa a APROBADA, `Blocks: NONE`, implementada en WI-CORE-048. No alcanza a Console en ningún caso; no bloquea.
- `DEC-INF-002` (PROPOSED en SYSTEM-2.11): `Blocks` = despliegue de Core en Render contra el Sandbox remoto; no bloquea trabajo local ni el WI. No es una decisión de Console y no se muestra como regla de UI.
- `DEC-INF-001`: aprobada, `Blocks: NONE` para seleccionar destino; operativa de GCE fuera de alcance. `DEC-VAL-001` (ingestión/despliegue empresarial): no alcanza una sincronización documental ni pruebas de UI. `DEC-ORG-*`, `DEC-FK-*`, `DEC-EXP-*`: `Blocks: NONE` o implementadas.
- Resultado: `decisionGate.blockingDecisionIds: []` es correcto; `nonBlockingDecisionIds: [DEC-VAL-002, DEC-INF-002]` es correcto. Ninguna decisión impide W-SPEC_VERIFIED.

## 5. Eventos (clasificación)

- `-007` y `-009`: relevantes (targets console, scopePaths `spec/contracts/system-contract.md` e `interoperability-contract.md`, dentro de `syncScopePaths` del WI). Acusar ambos con evidencia de revisión; resolver con evidencia de implementación (espejo, pruebas, gates, revisión).
- `-008` (github-integration) y `-010` (sandbox): no dirigidos a Console; quedan `C-PENDING` documentados y no se tocan. `-010` aclara que Sandbox conserva SYSTEM-2.2.
- El check `contractSyncReview` ya presente en el WI (eventos antiguos NOT_RELEVANT) no cubre -007/-009, correcto.

## 6. Riesgos y puntos de atención

1. **Criterio de aceptación desfasado.** La aprobación de alcance y el `decisionGate.note` dicen «DEC-VAL-002 sigue PROPOSED» y «DEC-INF-002 as-built». Tras el espejo, DEC-VAL-002 es APROBADA/implementada y DEC-INF-002 es **PROPOSED**. Conviene que la nota del gate (y el reporte de cierre) lo diga bien; el criterio «DEC-VAL-002 no se muestra como vigente» debe leerse «no se muestra como regla de UI», no «es una regla no aprobada». Es corrección de texto, no decisión.
2. **Propuestas AVAILABLE no visibles en INFRASTRUCTURE_FAILURE.** Si el usuario quiere verlas (consultables según el contrato) sin botón de publicar, es comportamiento de UI nuevo: `DECISION_REQUIRED` fuera de este WI. El corte mínimo no lo hace; basta no ofrecer publicar.
3. **Check `neutral` / precedencia.** Console no calcula estados ni Checks; solo muestra `run.status`. La nueva precedencia de Core (`INFRASTRUCTURE_FAILURE` sobre `SUCCESS`) hace que Runs que antes salían `SUCCESS` con símbolos en fallo de plataforma ahora salgan `INFRASTRUCTURE_FAILURE`; ese cambio es de Core y el panel de fallo ya lo cubre.
4. **Mock desalineado.** El `409 TEST_PUBLICATION_INVALID_RUN_STATUS` del mock (`mockBackend.ts:2275`) exige `SUCCESS`, correcto; un Run BEHAVIORAL_MISMATCH con propuestas `AVAILABLE` no existe en el mock y no es necesario.
5. **Espejo.** No usar el working tree de Core (puede estar adelantado); `git show b07d188a…` y verificar SHA-256 de la sección 1. Tras copiar, GH-INTEROP no debe cambiar (SHA `584839c9…1b34`). `-007` y `-009` deben referenciar la misma evidencia; no cerrar `-008`/`-010`.
6. **Pruebas faltantes.** El criterio de aceptación exige prueba de ambos comportamientos (resultSummary libre y no publicar INFRA con AVAILABLE); hoy no existe ninguna específica (sección 2); es el único trabajo de `app/`.
7. WI-CONSOLE-004 permanece `W-READY`; no reanudarlo.

## 7. Archivos esperados

- Contratos y SDD: `spec/contracts/system-contract.md`, `spec/contracts/interoperability-contract.md` (espejo `b07d188a`), `spec/contracts/github-integration-contract.md` (sin cambios; solo verificar), `spec/README.md`, `spec/constitution/architecture.md`, `spec/features/013-pr-driven-control-plane/{plan,spec,tasks}.md`, `CHANGELOG.md`.
- Producto/pruebas: `app/src/api/mockBackend.ts` (semilla INFRASTRUCTURE_FAILURE con AVAILABLE y texto OC11), `app/src/control-plane/AnalysisRunDetailPage.test.tsx`.
- Harness: `harness/work-items.json`, `harness/state.json`, `harness/contract-sync/inbox/CS-CORE-20261012-007.yaml` y `-009.yaml`, reportes del WI.
- Gates: lint, `tsc -b --noEmit`, vitest, build, `node harness/validate-harness.mjs`, validador SDD.

## 8. Ampliación: CS-CORE-20261012-011 (SYSTEM/INTEROP-2.12) — prevalece sobre 1 a 7

Evento: `CS-CORE-20261012-011`, WI-CORE-049, `targets: [console]`, `breaking: false`, `sourceRevision 864aa837b95fa379cc2c6d0a98f37521ff3eb3b6`, ya en `harness/contract-sync/inbox/` (importado 2026-10-12T22:58:51Z, `C-PENDING`). Sucesor de -009/-010; `requiredAction`: espejar INTEROP-2.12 (y SYSTEM-2.12) byte a byte, sin cambio de comportamiento, «reemplaza CS-CORE-20261012-009». -009 NO se oculta: sigue `C-PENDING` en inbox y debe acusarse/resolverse igualmente (queda subsumido por -011, misma evidencia).

**Precedencia real:** -007 (f501aef7, 2.10) < -009 (b07d188a, 2.11) < -011 (864aa837, 2.12), todos en una cadena lineal. Verificado: `b07d188a` y `30b9acdf` son ancestros de `864aa837`. La revisión objetivo del espejo es `864aa837`; -011 es acumulativo y contiene todo lo de -007 y -009. Espejar solo desde `864aa837`.

**SHA-256 en `864aa837`** (`git show`, no working tree): SYSTEM `d180d4b171d80ed79e3ead1ec67036d34635da9f974288d817b21a797f94f507`; INTEROP `50f8bd53697c573c48fed596e408ec7514c95cb8dea79d0fc00f547a457c7194`; GH-INTEROP `584839c91a088918028bbe80cbf209d8d341246bcf3536288cff1ad0b02c1b34` (idéntico a `30b9acdf`, `f501aef7`, `b07d188a` y al espejo actual: no cambia). El espejo actual de Console sigue siendo `30b9acdf` (SYSTEM `fe48d5d3…0625a6`, INTEROP `cf9c7c31…ca25`).

**Diff `30b9acdf..864aa837`** (solo `spec/contracts/`: INTEROP 8 líneas, SYSTEM 54; GH-INTEROP sin diff). Sobre lo de la sección 1, `b07d188a..864aa837` agrega:
- Cabeceras `INTEROP-2.12` / `SYSTEM-2.12`; Estado SYSTEM «APROBADO salvo decisiones `PENDING` explícitas» (ya no `PROPOSED`); referencia `INTEROP-2.12 §6.13/§6.14`; INTEROP-2.12 «solo alinea la cabecera; no toca ninguna sección §6.x ni el transporte».
- `DEC-INF-002`: **APROBADA AS-BUILT** (usuario, 2026-10-12), `Blocks: NONE`. Sustituye solo dos puntos del párrafo «Red» de DEC-INF-001: (i) ingreso al servicio del Sandbox por HTTPS con TLS y bearer detrás de un proxy Caddy en la VM (IAP queda como respaldo/reversión; puerto efectivo 3001); (ii) la limitación de HTTP/HTTPS `0.0.0.0/0` solo para TCP 80/443 hacia el proxy. SSH sigue IAP-only. Rate limit aprobado como control con valores iniciales a ratificar por Sandbox/Cross (no aprobados); rotación de 90 días; seguimiento aparte `isAllowedSandboxUrl` en Core. Es infraestructura Core/Sandbox/Cross; no cambia rutas, campos, códigos, estados ni transporte HTTP del navegador.
- `DEC-VAL-002` y OC11: sin cambios respecto de 2.11 (APROBADA/implementada; resultSummary genérico veraz).
- Regla de compatibilidad: SYSTEM-2.12 reemplaza el estado PROPOSED de 2.11; Sandbox conserva SYSTEM-2.2.

**Correcciones a las secciones previas:**
- Sección 4: `DEC-INF-002` ya no es PROPOSED; es APROBADA as-built con `Blocks: NONE`; no alcanza a Console y no bloquea. `decisionGate.nonBlockingDecisionIds: [DEC-VAL-002, DEC-INF-002]` y `blockingDecisionIds: []` siguen correctos. La nota del gate/aprobación de alcance que dice «DEC-INF-002 as-built» queda correcta con 2.12 (era imprecisa con 2.11); la frase «DEC-VAL-002 sigue PROPOSED» sigue desfasada: es APROBADA/implementada (punto 6.1).
- Sección 5: -011 es relevante (targets console, scopePaths dentro de `syncScopePaths`); acusar/resolver -007, -009 y -011 con la misma evidencia; -008 y -010 siguen fuera de Console y `C-PENDING`.
- Sección 3 (referencias de versión) → **SYSTEM-2.12 / INTEROP-2.12**, mismos archivo:línea: `spec/README.md:9` (SYSTEM) y `:10` (INTEROP); `spec/constitution/architecture.md:3`; `spec/features/013-pr-driven-control-plane/plan.md:5`; `spec.md:5` y `:41`; contratos reemplazados enteros. Históricas sin tocar (incluido `tasks.md:18,22`). Re-grep: sin referencias a `2.10`/`2.11`/`f501aef7`/`b07d188a` en `spec/` ni `app/` (0); `INTEROP-2.9` solo en comentarios de `app/src` (correctos).
- Sección 2 y producto: sin cambios. El mock y el corte mínimo (semilla INFRASTRUCTURE_FAILURE con AVAILABLE y pruebas) no dependen de 2.11 vs 2.12.

**DEC-INF-002 no se muestra como regla de UI — CUMPLIDO:** `grep -rnE "DEC-INF|DEC-VAL|sslip|Caddy|isAllowedSandboxUrl|SANDBOX_URL|rate limit"` sobre `app/`, `README.md`, `spec/features`: 0 coincidencias de producto/mock/README. Console no consume el Sandbox (Core→Sandbox), por lo que ni la URL, el TLS ni el rate limit aparecen. Un 429 del proxy es problema de Core; Console solo vería un Run `INFRASTRUCTURE_FAILURE` ya cubierto por el panel de fallo.

**Riesgo adicional:** el texto de 2.12 incluye datos operativos as-built (hostname, IP, nombre de reglas de firewall, versión de Caddy; sin el valor del token). Es contenido canónico de Core; Console lo espeja byte a byte sin editar. No copiarlo a ningún README, mock ni copy de UI.

**Veredicto de la ampliación: SUFICIENTE.** Sin DECISION_REQUIRED; ninguna decisión `Blocks` alcanza el WI; W-SPEC_VERIFIED no está impedido.
