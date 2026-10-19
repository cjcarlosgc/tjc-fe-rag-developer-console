# 013 — Control plane PR-driven

**Estado:** aprobado como comportamiento objetivo; aceptación de cada HU requiere evidencia propia.
**Historias:** HU01, HU02, HU07–HU09, HU12–HU16
**Contrato operativo vigente:** SYSTEM-2.13 / INTEROP-2.17 / GH-INTEROP-1.8.

## Objetivo

Permitir al usuario autorizado seguir un repositorio vinculado y cada `AnalysisRun` por PR/HEAD, responder contexto faltante, revisar evidencia y publicar propuestas mediante companion PR sin duplicar reglas de Core.

## Navegación y estados

- Navegación: Projects, Runs, Action Required, Experiments e Integrations/GitHub. Un Project muestra binding, `integrationBranch`, PR/HEAD, Runs y Checks; no presenta carga manual de código.
- Focus Mode es una ruta dedicada que muestra una pregunta adaptativa, evidencia acotada, `No lo sé` y retorno interno seguro. `UNKNOWN` no crea conocimiento autoritativo.
- El detalle del Run muestra estado, historial disponible, cambios, contexto y propuestas. Distingue datos reales de simulación, resultados `ACTION_REQUIRED`, `BEHAVIORAL_MISMATCH`, fallo técnico, baseline roto, cambio irrelevante y Run obsoleto.
- La revisión de pruebas presenta contenido y diff de propuestas vigentes. Publicar exige solicitud humana, freshness y autorización; nunca promete escritura directa a la feature branch, auto-merge ni autorepair.
- GitHub OAuth mediante Supabase Auth autentica a la persona. Para App info, discovery, verificación GitHub y ramas, Console llama a las rutas de usuario de GitHub Integration con la sesión Supabase; el provider token OAuth solo se transmite a Integration cuando hace falta y no se persiste ni reenvía a Core. Core conserva Projects/workspaces, autorización de dominio, persistencia de bindings, RAG y análisis; Integration conserva la automatización GitHub App.

## Mock y live

Los adapters `mock|live` respetan el mismo contrato INTEROP-2.7. La demo se rotula y jamás se presenta como evidencia de integración o del experimento. Fixtures pueden ilustrar success, action required, mismatch, HEAD nuevo, tests suficientes, baseline fallido, fallo técnico, cambios no relevantes y publicación stale; una pantalla mock no prueba que el backend cubra el caso. Cualquier campo o capacidad especulativa sin contrato aprobado se marca pendiente o se elimina, no se infiere desde fixtures.

## Seguridad

No exponer secretos de GitHub App, token del Sandbox, keys de Storage ni URLs firmadas internas. En el flujo directo de GitHub Integration, el provider token OAuth se usa en memoria para discovery o verificación de un repositorio nuevo, nunca se persiste ni se registra y no se reenvía a Core. La compatibilidad temporal de las rutas Core antiguas puede recibirlo y reenviarlo a Integration. Core determina autorización, clasificación, suficiencia, impacto y freshness; la UI presenta esos resultados. Un recurso no visible no revela existencia por mensaje o estado.

## Alineación SMART V3 (SDD 2026-10-08; implementación pendiente)

Contrato adoptado: SYSTEM-2.6 / INTEROP-2.7 (canónico en Core, `WI-CORE-017`). Console adoptó esa copia en `WI-CONSOLE-011`; el comportamiento descrito sigue pendiente de sus WI y no se presenta como live.

- **`UNKNOWN` (`WI-CONSOLE-013`).** «No lo sé» es una abstención auditada (`DEC-FK-002`): la pregunta sigue pendiente y el Run sigue en `ACTION_REQUIRED`. Console muestra la abstención registrada (quién, rol y cuándo, según `abstention`) y nunca presenta «resuelto», «continuando» ni «todas las preguntas respondidas» como consecuencia. Solo Maintainer o Admin pueden registrarla; Console oculta o deshabilita la acción para Writer y Reader pero deja que `403 PROJECT_ROLE_INSUFFICIENT` de Core sea la autoridad. La acción nunca se decide en el navegador.
- **Functional Knowledge (`WI-CONSOLE-015`).** Puede haber varias reglas `ACTIVE` por target, una por escenario; Console las agrupa por `scenarioKind` y no asume una regla por target. Muestra procedencia (`confirmedByUserId`, `confirmedRole`, `originHeadSha`, `source`, `sourceRef`) cuando existe y «sin procedencia registrada» para reglas históricas. Console no calcula ni edita `scenarioKey`. El panel especulativo `context-explorer/speculative/contextProvenance.ts` se reemplaza por datos live o se retira.
- **Trace operativo (`WI-CONSOLE-016`).** El detalle del Run muestra los nueve enlaces con su estado `PRESENT`/`NOT_APPLICABLE` y los identificadores `retrieval_id`, `context_id` y `execution_id` que entrega Core; no inventa identificadores ni veredictos «CUMPLE/NO CUMPLE». Es distinto del Context Explorer experimental.
- **Evidencia (`WI-CONSOLE-017`).** Console descarga los paquetes de evidencia JSON versionados que expone Core; no es el registro académico de evidencia. Un mock se rotula `DEMO · DATOS SIMULADOS` y nunca se ofrece como evidencia científica ni empresarial.
- **Prueba rota de `RunsPage` (`WI-CONSOLE-012`).** El reporte previo «arreglar la prueba rota de `RunsPage`» no se reproduce hoy: en `51b11e7`, `app/src/control-plane/RunsPage.test.tsx` pasa (6/6) y la suite completa también (53 archivos, 428 pruebas). El WI primero busca una reproducción (reintentos, zona horaria y fecha) y registra comando y mensaje exactos; si no reproduce, se cierra con esa evidencia y sin cambios de código.

## Casos operativos

Ver `spec/operational-cases.md`: OC01–OC15 están catalogados y formalizados como happy paths (P2), con el orden de prioridad y formalización descrito allí. Subcasos, aceptación y evidencia se enlazan por subtarea/WI; el catálogo no significa cobertura completa.

Esta sección formaliza los happy paths (`WI-CONSOLE-004`, corte 4). Describe lo que establecen SYSTEM-2.13, INTEROP-2.17 y GH-INTEROP-1.8 y esta feature. Cuando una regla fue confirmada por el usuario en la reaprobación de `WI-CONSOLE-004` (2026-10-12) y el espejo no la cita, se marca «pendiente de cita contractual» e indica su origen. Ningún caso se declara implementado ni cubierto: la columna de estado sigue en `O-CATALOGUED` (no `O-READY` ni `O-COVERED`). Las «pruebas propuestas» son descripciones; los mocks rotulados `DEMO · DATOS SIMULADOS` solo verifican presentación y no prueban cobertura del backend. Ningún caso queda `DECISION_REQUIRED` en esta versión. Los subcasos `OCxx.a` no se añaden aquí.

Abreviaturas de fuente: **SYS** = `spec/contracts/system-contract.md`; **INT** = `spec/contracts/interoperability-contract.md`; **GH** = `spec/contracts/github-integration-contract.md`.

### OC01 — Cambio sin tests y con contexto suficiente

- **Entrada/precondiciones:** PR ready con `baseRef` igual a `integrationBranch` (INT §6.9, línea 640); Run creado para el HEAD vigente (SYS «AnalysisRun, Job y Check», línea 101); baseline de tests existentes en verde (SYS «Baseline, generación y clasificación», línea 147); no hay conocimiento funcional faltante, por lo que no se activa `ACTION_REQUIRED` (SYS «Contexto RAG y Functional Knowledge», línea 143); no hay tests existentes suficientes para el cambio (SYS línea 151, no aplica).
- **Salida/resultado observable:** Run `SUCCESS` (SYS línea 156, «validación correcta»); propuestas `AVAILABLE` con `relativePath`, `target` y `contentSha256` (INT §6.12, `GeneratedTestProposalResponse`, línea 889); Check del SHA del Run (SYS «AnalysisRun, Job y Check», línea 107). Console muestra estado, diff y propuestas; la validez la determina Core.
- **Invariantes:** un Run por PR/HEAD (SYS línea 101); `SUCCESS` solo tras validación en Sandbox, que permanece «ciego a GitHub» (SYS «Arquitectura operativa», línea 35); sin duplicados ni autorreparación semántica (SYS línea 158); Console no clasifica.
- **Prueba propuesta:** integración Core↔Sandbox con fixture de cambio sin tests (estado, propuestas y conclusión del Check); UI con mock rotulado solo para presentación.
- **Fuente:** SYS «Trigger PR-driven y lifecycle», «AnalysisRun, Job y Check», «Baseline, generación y clasificación», «Publicación human-in-the-loop»; INT §6.10, §6.12.

### OC02 — Cambio con tests ya aportados por developer o agente

- **Entrada/precondiciones:** PR ready cuyo cambio incluye tests aportados por developer o agente en el mismo PR; baseline en verde.
- **Decisión confirmada:** un test aportado en el mismo PR cuenta como **existente** y **no se ejecuta** para esta clasificación. El resultado no se rotula «validado por ejecución».
- **Salida/resultado observable:** si Core considera suficientes los tests existentes, Run `NO_ADDITIONAL_TESTS_REQUIRED` (SYS línea 151; INT §6.10, línea 689). Console muestra ese estado sin afirmar que el test aportado se ejecutó.
- **Invariantes:**
  - `functionalBehaviorValidated` significa «el pipeline terminó sin hallar discrepancia», no «se ejecutó una validación»; con `NO_ADDITIONAL_TESTS_REQUIRED` es `true` y «los tests existentes suficientes no se ejecutan» (INT §6.11, línea 874).
  - No se generan duplicados (SYS línea 158).
  - Pendiente de cita contractual: que un test nuevo aportado en el PR se trate como «existente». Ni SYS (líneas 147 y 151) ni INT §6.10 lo fijan; es decisión confirmada por el usuario el 2026-10-12.
  - Pendiente de cita contractual: el tratamiento si Core considera insuficientes esos tests (se supone el flujo de generación de OC01).
- **Prueba propuesta:** integración Core con fixture de test aportado en el PR (estado final, sin afirmación de validación por ejecución); UI con mock rotulado para presentación.
- **Fuente:** decisión del usuario (reaprobación de `WI-CONSOLE-004`, 2026-10-12); SYS «Baseline, generación y clasificación», líneas 151 y 158; INT §6.11, línea 874.

### OC03 — Tests existentes suficientes; no duplicar

- **Entrada/precondiciones:** baseline en verde; tests existentes que Core considera suficientes para el cambio (SYS línea 151).
- **Salida/resultado observable:** Run `NO_ADDITIONAL_TESTS_REQUIRED`; sin propuestas nuevas (SYS línea 158; HU10). `functionalBehaviorValidated` es `true` con la semántica de INT §6.11 (línea 874): no equivale a validación por ejecución.
- **Símbolo con `hasTest`:** con `hasTest: true` en el inventario (`TestTargetResponse`, INT línea 212) el símbolo no se ejecuta y su estado es `SKIPPED_HAS_TEST`. Pendiente de cita contractual: declarado por Core; el nombre `SKIPPED_HAS_TEST` no aparece en SYS, INT ni GH. No implementar sobre ese nombre hasta citarlo.
- **Invariantes:** no se generan duplicados (SYS línea 158); la suficiencia la decide Core (SYS línea 151); Console no infiere suficiencia desde la lista de tests (`hasTest` es inventario, INT línea 212).
- **Prueba propuesta:** integración Core con fixture de tests existentes suficientes (estado final y ausencia de propuestas nuevas); UI con mock rotulado para la presentación del estado.
- **Fuente:** SYS «Baseline, generación y clasificación», líneas 151 y 158; INT §6.10 (`AnalysisRunStatus`, línea 680), §6.11 (línea 874), `TestTargetResponse` (línea 212); HU10.

### OC04 — Falta contexto funcional; pedir intervención

- **Entrada/precondiciones:** target `DIRECTLY_CHANGED` que necesita un resultado esperado, borde, excepción o transición de estado no establecido por una regla `ACTIVE` aplicable (SYS «Contexto RAG y Functional Knowledge», línea 143).
- **Salida/resultado observable:** Run `ACTION_REQUIRED` (INT §6.10, línea 680); pregunta `PENDING` visible en `GET /action-required` (INT línea 769) y en Focus Mode; el Check del HEAD enlaza al Run mediante `details_url` (INT línea 926). Una respuesta válida devuelve `202` con `FunctionalAnswerAcceptedResponse` (INT líneas 771 y 835). `continuationAttemptId` es no nulo solo cuando Core encola la continuación del Run; mientras queden preguntas `PENDING` (o surja una pregunta adaptativa) el Run sigue en `ACTION_REQUIRED` y `continuationAttemptId` es `null` (INT línea 872). Console presenta la pregunta; no decide cuándo se activa.
- **Invariantes:**
  - La elegibilidad es determinista y estructural (SYS línea 143, `DEC-FK-003`); la pregunta es atómica y `scenarioKind`/`scenarioKey` los deriva Core (INT línea 815).
  - Una continuación por respuesta humana actúa sobre el mismo Run mientras el SHA no cambie (INT línea 763; SYS línea 103).
  - El job termina y no deja runners esperando (SYS línea 135; SYS línea 103 solo fija que `ACTION_REQUIRED` termina el job actual).
  - Solo Maintainer o Admin responden; el autor del PR no gana autoridad por serlo; Writer y Reader reciben `403 PROJECT_ROLE_INSUFFICIENT` (SYS línea 139; INT línea 774).
- **Prueba propuesta:** integración Core: fixture sin regla → `ACTION_REQUIRED` → respuesta → continuación del mismo Run (con `continuationAttemptId` nulo mientras queden preguntas); E2E live con cuenta Maintainer tras `WI-CONSOLE-020`; UI con mock rotulado para Focus Mode.
- **Fuente:** SYS «Contexto RAG y Functional Knowledge», líneas 139 y 143; INT §6.10 (líneas 680, 763), §6.11 (líneas 769, 771, 774, 815, 835, 872); `DEC-FK-003`; HU07, HU08.

### OC05 — Respuesta humana revela inconsistencia

- **Entrada/precondiciones:** Run `ACTION_REQUIRED` con pregunta `PENDING`; existe una regla `ACTIVE` con mismo scope, `targetRef` y `scenarioKey`.
- **Salida/resultado observable:** la respuesta sin `conflictResolution` responde `409 FUNCTIONAL_KNOWLEDGE_CONFLICT` con `details: FunctionalKnowledgeConflictResponse`, sin persistir ni avanzar el Run. Focus Mode muestra la regla existente junto a la propuesta. Reenvío con `SUPERSEDE` persiste la nueva regla `ACTIVE` y pasa la anterior a `SUPERSEDED` (`supersedesId`); con `KEEP_EXISTING` registra la respuesta sin `knowledgeId` y no toca la regla vigente.
- **Invariantes:** el conflicto no se resuelve automáticamente; solo existe entre reglas con mismo scope, `targetRef` y `scenarioKey`; reglas con otro `scenarioKey` coexisten; la detección de contradicción semántica vía LLM sigue pendiente y este caso no la cubre; `conflictId` expira si el HEAD cambia.
- **Prueba propuesta:** integración Core: segunda respuesta sobre el mismo escenario → `409`; reenvíos `SUPERSEDE` y `KEEP_EXISTING`; UI con mock rotulado para la comparación de reglas en Focus Mode.
- **Fuente:** SYS «Contexto RAG y Functional Knowledge», líneas 133 y 140 (HU09); INT §6.11 (línea 876; HU09, `DEC-FK-001`).

### OC06 — Push posterior a corrección de implementación

- **Entrada/precondiciones:** Run previo en `PROCESSING` o `ACTION_REQUIRED` para el HEAD A; nuevo commit (incluido force-push) que produce el HEAD B (SYS «Trigger PR-driven y lifecycle», líneas 90; INT §6.9, línea 640).
- **Salida/resultado observable:** Run A pasa a `OBSOLETE` (SYS línea 91; INT línea 763, aunque estuviera `PROCESSING` o `ACTION_REQUIRED`); se crea Run B para el HEAD B. Console muestra A como obsoleto y el Check vigente es el de B (SYS «AnalysisRun, Job y Check», línea 107).
- **Historial (no observable todavía):** `history` y la transición `GITHUB_HEAD_SUPERSEDED` (INT línea 736) están definidos, pendientes de implementación en Core (INT línea 765). No se afirman como observables en Console ni en la respuesta de Core.
- **Invariantes:** un Run por PR/HEAD (SYS línea 101); el Run A no se reanuda (INT línea 763); un resultado tardío de A no publica Check actual (SYS línea 107); todo Check pertenece al SHA de su Run (SYS línea 107).
- **Prueba propuesta:** integración Core con eventos normalizados `synchronize` (lifecycle y ausencia de Check actual para A); E2E live con push real en repositorio de prueba tras `WI-CONSOLE-020`.
- **Fuente:** SYS «Trigger PR-driven y lifecycle», líneas 90–91; «AnalysisRun, Job y Check», líneas 101 y 107; INT §6.9 (línea 640), §6.10 (líneas 736, 763, 765).

### OC07 — Defecto detectable sin intervención humana

- **Entrada/precondiciones:** test generado técnicamente válido (SYS línea 152) cuya ejecución evidencia discrepancia con el comportamiento esperado. La entrada no exige regla `ACTIVE`. Pendiente de cita contractual: de dónde procede el comportamiento esperado contra el que se contrasta la aserción; el espejo no lo fija.
- **Salida/resultado observable:** Run `BEHAVIORAL_MISMATCH` (SYS línea 152; INT §6.10, línea 680); propuestas `HELD` (INT línea 926); no se acepta `POST /analysis-runs/{id}/test-publications` (SYS línea 164; INT línea 926). Console distingue la discrepancia de un fallo técnico (`status.ts`, etiqueta «Behavioral mismatch» en `status.ts` y panel en `AnalysisRunDetailPage.tsx:267`) y no presenta veredicto propio.
- **Invariantes:** sin autorreparación de la aserción ni modificación de código productivo (SYS línea 158); la clasificación la decide Core (SYS línea 152); mientras exista `BEHAVIORAL_MISMATCH` no se crea publicación (SYS línea 164).
- **Prueba propuesta:** integración Core con fixture de test contradictorio (estado, `HELD`, rechazo de publicación); UI con mock rotulado para la distinción visual.
- **Fuente:** SYS «Baseline, generación y clasificación», líneas 152 y 158; «Publicación human-in-the-loop», línea 164; INT §6.10 (línea 680), §6.12 (línea 926); HU13.

### OC08 — Test generado falla técnicamente

- **Entrada/precondiciones:** test generado con namespace, import, API, mock, setup o sintaxis inválidos (SYS línea 153).
- **Salida/resultado observable:** si ese es el resultado agregado del Run, `TECHNICAL_GENERATION_FAILURE` (SYS línea 153). Console lo distingue de `BEHAVIORAL_MISMATCH` (`AnalysisRunDetailPage.tsx:267`) e `INFRASTRUCTURE_FAILURE` (etiquetas distintas en `status.ts:8–10`). Propuestas `HELD`: INT §6.12 (línea 928) cita que `HELD` cubre tanto `BEHAVIORAL_MISMATCH` como `TECHNICAL_GENERATION_FAILURE` sin distinguirlos en el campo `status` (línea 926 lo fija para `BEHAVIORAL_MISMATCH`).
- **Precedencia (Core):** `DEC-VAL-002`, aprobada y implementada en Core (`WI-CORE-048`; SYS líneas 155 y 309–321). Con resultados mezclados por símbolo, el estado del Run es, de mayor a menor: `BEHAVIORAL_MISMATCH` > `TECHNICAL_GENERATION_FAILURE` > `INFRASTRUCTURE_FAILURE` > `SUCCESS` > `NO_ADDITIONAL_TESTS_REQUIRED` / `NO_TEST_RELEVANT_CHANGES` (estos dos últimos excluyentes entre sí) (SYS línea 315). `BASELINE_FAILED` y los `INFRASTRUCTURE_FAILURE` de nivel job terminan el Run antes de esta precedencia (SYS línea 315).
- **Fallo de plataforma por símbolo (`DEC-VAL-002`):** Sandbox no disponible, ejecución rechazada, tiempo límite agotado o falla de categoría `INFRASTRUCTURE` (Docker, red, almacenamiento, worker o runtime). No lo son compilación, aserción, error de ejecución, dependencia ni configuración del framework (siguen siendo fallo técnico). Un fallo `UNKNOWN` no se atribuye a la plataforma sin evidencia (SYS línea 315).
- **Consecuencias:** un Run con fallo de plataforma y propuestas `AVAILABLE` tiene Check `neutral` y no es publicable (`409 TEST_PUBLICATION_INVALID_RUN_STATUS`, SYS línea 321). La publicación exige Run `SUCCESS` (INT línea 926).
- **Invariantes:**
  - Un fallo técnico no se presenta como discrepancia de comportamiento (SYS líneas 152–153).
  - Sin autorreparación semántica ni publicación (SYS línea 158; INT línea 926).
  - La precedencia la calcula Core; Console no la calcula y consume `run.status` (`AnalysisRunDetailPage.tsx:23`, `257–258`).
  - Un fallo técnico atribuible no se degrada a `neutral` (SYS línea 319, «Razón»).
- **Prueba propuesta:** integración Core con fixture de import inválido (estado y ausencia de clasificación como mismatch); fixture mezclado (mismatch + técnico → `BEHAVIORAL_MISMATCH`; técnico + infraestructura → `TECHNICAL_GENERATION_FAILURE`); UI con mock rotulado para la distinción.
- **Fuente:** SYS «Baseline, generación y clasificación», líneas 152–158 y 155; DEC-VAL-002 (líneas 309–321); INT §6.10 (línea 680), §6.12 (línea 926); HU11, HU13.

### OC09 — Suite existente ya fallaba

- **Entrada/precondiciones:** baseline relevante de tests existentes en rojo (SYS línea 149).
- **Salida/resultado observable:** Run `BASELINE_FAILED` (SYS línea 149; INT §6.10, línea 680). Termina antes de la clasificación por símbolo (SYS línea 315). Console muestra el baseline roto y no atribuye la falla a pruebas generadas (expectativa de presentación; el panel de fallo usa `resultSummary`, `AnalysisRunDetailPage.tsx:257–258`).
- **Invariantes:** el baseline se ejecuta antes de atribuir una falla a pruebas generadas (SYS línea 147); el estado lo determina Core (INT §7.2, línea 1369); `functionalBehaviorValidated` es `false` (INT línea 874).
- **Prueba propuesta:** integración Core con fixture de suite roja (estado `BASELINE_FAILED` y ausencia de clasificación de generación); UI con mock rotulado.
- **Fuente:** SYS «Baseline, generación y clasificación», líneas 147 y 149; SYS línea 315; INT §6.10 (línea 680), §6.11 (línea 874), §7.2 (línea 1369); HU04, HU11.

### OC10 — Primer análisis de repositorio grande

- **Entrada/precondiciones:** primer Run de un Project sin `ProjectVersion` previo, que realiza bootstrap del snapshot (SYS «CHANGESET, INDEX DELTA y símbolos», línea 114).
- **Salida/resultado observable:** Run con `indexMode: 'BOOTSTRAP'` (INT §6.10, línea 749). Console muestra únicamente un texto de estado del bootstrap, sin porcentajes ni progreso (decisión confirmada por el usuario el 2026-10-12). El texto está en `AnalysisRunDetailPage.tsx:194–199`.
- **Invariantes:**
  - V1 mínimo: Console no inventa progreso ni porcentajes.
  - Umbral de «repo grande» y progreso real: deuda «umbral de repo grande + progreso» (INT §6.10, línea 761), con responsables Core + Integration (decisión del usuario). No se fija aquí.
  - Criterio de «snapshot suficiente» para completar el Run: pendiente de cita contractual. SYS línea 114 lo nombra sin definirlo.
  - Discrepancia a corregir en un WI de código aparte: el texto actual (`AnalysisRunDetailPage.tsx:197–198`) dice «se indexó el repositorio completo», afirmación que el espejo no respalda («snapshot suficiente», SYS línea 114). Este documento no cambia código.
- **Prueba propuesta:** UI con mock: `indexMode: 'BOOTSTRAP'` muestra el texto de estado y ningún porcentaje (`AnalysisRunDetailPage.test.tsx:171–176` cubre la presentación actual); integración Core con fixture de primer análisis (`indexMode: BOOTSTRAP`).
- **Fuente:** decisión del usuario (2026-10-12); SYS línea 114; INT §6.10 (líneas 749, 761); HU03.

### OC11 — PR o commit grande

- **Entrada/precondiciones:** compare del PR que GitHub Integration no puede verificar (`UNVERIFIABLE`, operación «Compare», GH línea 49), por ejemplo un PR con 300 o más archivos, o por otras causas (permiso, 403, 429, 5xx, red) (INT línea 761).
- **Salida/resultado observable:** Run `INFRASTRUCTURE_FAILURE` con Check `neutral` y `resultSummary` genérico y veraz: «No se pudo verificar el compare de GitHub (por ejemplo, un PR con 300 o más archivos); análisis no realizado» (INT línea 761; implementado en Core, `WI-CORE-046`). Console muestra ese texto tal cual, como texto libre, en el panel de fallo (`AnalysisRunDetailPage.tsx:23` y `257–258`; prueba `AnalysisRunDetailPage.test.tsx:153–169`, con y sin «300»). La UI no depende del número 300 ni lo interpreta.
- **Invariantes:**
  - No se afirma que el PR exceda 300 archivos: `UNVERIFIABLE` cubre otras causas (INT línea 761). Un mensaje específico queda diferido a la deuda «umbral de repo grande + progreso» (INT línea 761).
  - El límite de 300 archivos pertenece a GitHub Integration; el contrato de Core no lo fija ni lo hace configurable (INT línea 761; GH línea 49).
  - Nunca un `OK` parcial (GH línea 49).
  - Console no calcula batches ni umbrales.
  - Fuera de este happy path y no formalizado: si un PR grande puede llegar a `SUCCESS` por batches. SYS línea 116 deja los batches «sin fijar thresholds»; pendiente de cita contractual, no se afirma.
- **Prueba propuesta:** integración Core con fixture de compare `UNVERIFIABLE` (estado, Check `neutral`, texto de `resultSummary`); UI con mock para presentación literal del texto.
- **Fuente:** decisión del usuario (2026-10-12); INT §6.10 (línea 761); GH línea 49; SYS «CHANGESET, INDEX DELTA y símbolos», línea 116; HU06.

### OC12 — Cambios sin relevancia para pruebas unitarias

- **Entrada/precondiciones:** PR cuyo cambio no tiene impacto en pruebas según Core (SYS línea 150).
- **Salida/resultado observable:** Run `NO_TEST_RELEVANT_CHANGES`; sin propuestas. Console lo presenta con clase de éxito y etiqueta informativa, no como fallo (`status.ts:13` y `status.ts:22`).
- **Invariantes:** no se activa `ACTION_REQUIRED` porque cambió un método o por complejidad (SYS línea 143); la relevancia la determina Core (SYS línea 150); Check `success` (DEC-VAL-002, SYS línea 321).
- **Prueba propuesta:** integración Core con fixture de cambio sin impacto de tests; UI con mock rotulado para la presentación.
- **Fuente:** SYS «Baseline, generación y clasificación», línea 150; SYS «Contexto RAG y Functional Knowledge», línea 143; SYS línea 321; INT §6.10 (línea 680); HU06.

### OC13 — Impacto indirecto por símbolos relacionados

- **Entrada/precondiciones:** cambio que afecta símbolos relacionados sin modificarlos directamente.
- **Salida/resultado observable:** símbolos con `changeKind: 'POTENTIALLY_IMPACTED'` (INT línea 720; SYS línea 116), distinguibles de los `DIRECTLY_CHANGED` en el detalle del Run. Los campos `qualifiedName`, `filePath`, `kind` y `changeKind` constan en `AnalysisSymbolResponse` (INT §6.10, líneas 722–728).
- **Invariantes:** el impacto lo calcula Core (SYS línea 116); Console no añade relaciones; un símbolo no pasa a `DIRECTLY_CHANGED` por estar relacionado (pendiente de cita contractual: el espejo no lo afirma explícitamente). El contrato no fija si un `POTENTIALLY_IMPACTED` genera propuesta; este caso no lo afirma.
- **Prueba propuesta:** integración Core con fixture de símbolos relacionados (`changeKind` correcto); UI con mock rotulado para la separación visual.
- **Fuente:** SYS «CHANGESET, INDEX DELTA y símbolos», línea 116; INT §6.10 (`AnalysisSymbolResponse`, `SymbolChangeKind`, línea 720); HU03, HU06.

### OC14 — Conocimiento funcional desactualizado o contradicho

- **Entrada/precondiciones:** regla `ACTIVE` aplicable a un target y un test generado técnicamente válido cuya ejecución contradice el comportamiento que esa regla establece (SYS línea 136 y línea 152). Una regla `ACTIVE` no expira por un HEAD nuevo: es «procedencia, no vencimiento» (SYS línea 140).
- **Decisión confirmada (opción A, usuario, 2026-10-12):** la contradicción se clasifica como `BEHAVIORAL_MISMATCH` con evidencia; no se activa `ACTION_REQUIRED` ni se abre una pregunta nueva por este motivo. Declarado por Core, pendiente de cita contractual: la selección entre pedir decisión humana o clasificar con evidencia (SYS línea 136 admite ambas); este caso adopta la clasificación con evidencia por decisión del usuario.
- **Salida/resultado observable:** Run `BEHAVIORAL_MISMATCH` con evidencia de la discrepancia (SYS línea 152; INT línea 1158: `outcome` por ejecución con el vocabulario de clasificación técnica). Propuestas `HELD` y sin publicación (INT línea 926; SYS línea 164). Console muestra la discrepancia como tal, no como `ACTION_REQUIRED` ni como pregunta de Focus Mode (`AnalysisRunDetailPage.tsx:267`).
- **Invariantes:**
  - Core no concluye automáticamente que el código está mal; clasifica con evidencia (SYS línea 136).
  - Pendiente de cita contractual: qué regla `ACTIVE` se contrasta cuando hay varias y cómo se trata una regla «desactualizada» que la ejecución no contradice. Ni SYS ni INT §6.11 lo fijan.
  - La detección de contradicción semántica vía LLM sigue pendiente (INT línea 876); este caso no la cubre.
  - El conflicto al persistir una regla nueva sigue en OC05 (SYS línea 133).
- **Prueba propuesta:** integración Core con fixture de regla `ACTIVE` y test contradictorio (estado `BEHAVIORAL_MISMATCH`, `HELD`, sin `ACTION_REQUIRED`); UI con mock rotulado.
- **Fuente:** decisión del usuario (opción A, 2026-10-12); SYS «Contexto RAG y Functional Knowledge», líneas 133, 136, 140; «Baseline, generación y clasificación», línea 152; INT §6.12 (línea 926), §6.11 (línea 876); HU07, HU09.

### OC15 — Nuevo commit mientras se espera respuesta humana

- **Entrada/precondiciones:** Run `ACTION_REQUIRED` con preguntas `PENDING`; nuevo commit que produce otro HEAD (SYS línea 90; INT línea 640).
- **Salida/resultado observable:** el Run anterior pasa a `OBSOLETE` (SYS línea 91; INT línea 763); sus preguntas `PENDING` pasan a `OBSOLETE` y salen de Action Required (INT línea 769); se crea un Run para el HEAD nuevo, que genera sus propias preguntas si las necesita.
- **Respuesta tardía a una pregunta `OBSOLETE`:** `404 FUNCTIONAL_QUESTION_NOT_FOUND` (INT línea 774, INTEROP-2.9: pregunta «no accionable (por ejemplo, ya no `PENDING`, `OBSOLETE`…)»). Console no ofrece responderla: Focus Mode deja de mostrar la pregunta obsoleta (`FocusModePage.tsx:61`) y muestra «Esta pregunta ya no aplica…» (`FocusModePage.tsx:118–119`; `app/src/control-plane/errors.ts:105`). La detección es `isFunctionalQuestionObsolete` (`app/src/control-plane/errors.ts:100–102`); la bandeja se refresca (`action-required/queries.ts:63`). Prueba existente: `FocusModePage.test.tsx:296–314`.
- **Invariantes:** no se reanuda el Run viejo (INT línea 763); una pregunta de un HEAD anterior no crea conocimiento ni continuación (INT línea 880: «no se conserva»); el Run actual evalúa su propio contexto (INT línea 880).
- **Prueba propuesta:** integración Core con `synchronize` durante `ACTION_REQUIRED` (preguntas obsoletas, Run nuevo); UI con mock rotulado para ocultar preguntas obsoletas.
- **Fuente:** SYS líneas 90–91; INT §6.9 (línea 640), §6.10 (línea 763), §6.11 (líneas 769, 774, 880); `errors.ts`; `FocusModePage.tsx`; HU08, HU14.
