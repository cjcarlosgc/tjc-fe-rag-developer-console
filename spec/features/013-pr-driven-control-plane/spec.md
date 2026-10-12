# 013 — Control plane PR-driven

**Estado:** aprobado como comportamiento objetivo; aceptación de cada HU requiere evidencia propia.
**Historias:** HU01, HU02, HU07–HU09, HU12–HU16
**Contrato operativo vigente:** SYSTEM-2.12 / INTEROP-2.12 / GH-INTEROP-1.7.

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

Ver `spec/operational-cases.md`: OC01–OC15 están catalogados para formalización P2, happy paths primero. Subcasos, aceptación y evidencia se enlazan por subtarea/WI; el catálogo no significa cobertura completa.

Esta sección formaliza los happy paths (`WI-CONSOLE-004`, corte 4). Describe solo lo que ya establecen SYSTEM-2.12, INTEROP-2.12 y GH-INTEROP-1.7 y esta feature. Cada caso indica qué observa el usuario en Console y qué determina Core. Ningún caso se declara implementado ni cubierto: las «pruebas propuestas» son descripciones; los mocks rotulados `DEMO · DATOS SIMULADOS` solo verifican presentación y no prueban cobertura del backend. Un caso marcado `DECISION_REQUIRED` no está formalizado y no debe implementarse hasta que se resuelva la pregunta indicada. Los subcasos `OCxx.a` no se añaden aquí.

Abreviaturas de fuente: **SYS** = `spec/contracts/system-contract.md`; **INT** = `spec/contracts/interoperability-contract.md`; **GH** = `spec/contracts/github-integration-contract.md`.

### OC01 — Cambio sin tests y con contexto suficiente

- **Entrada/precondiciones:** PR ready con `baseRef` igual a `integrationBranch`; Run creado para el HEAD vigente; baseline de tests existentes en verde; no hay conocimiento funcional faltante (no se activa `ACTION_REQUIRED`); no hay tests existentes suficientes para el cambio.
- **Salida/resultado observable:** Run `SUCCESS`; propuestas `AVAILABLE` con `relativePath`, `target` y `contentSha256`; Check del SHA del Run. Console muestra estado, diff y propuestas; la validez la determina Core.
- **Invariantes:** un Run por PR/HEAD; `SUCCESS` solo tras validación en Sandbox aislado sin credenciales GitHub; sin duplicados; sin autorreparación; Console no clasifica.
- **Prueba propuesta:** integración Core↔Sandbox con fixture de cambio sin tests (estado, propuestas y conclusión del Check); UI con mock rotulado solo para presentación.
- **Fuente:** SYS «Trigger PR-driven y lifecycle», «Baseline, generación y clasificación», «Publicación human-in-the-loop»; INT §6.10, §6.12.

### OC02 — Cambio con tests ya aportados por developer o agente

- **DECISION_REQUIRED:** los contratos no definen cómo se trata un PR que ya incluye tests aportados por developer o agente. Pregunta: ¿esos tests se validan como candidatas (con propuestas y estado `SUCCESS`), o se tratan como tests existentes y producen `NO_ADDITIONAL_TESTS_REQUIRED` (OC03)? Qué debe mostrar Console en cada caso. `DEC-EXP-003` no aplica: se refiere al agente generalista de experimentos.

### OC03 — Tests existentes suficientes; no duplicar

- **Entrada/precondiciones:** baseline en verde; tests existentes que Core considera suficientes para el cambio.
- **Salida/resultado observable:** Run `NO_ADDITIONAL_TESTS_REQUIRED`; no se presentan propuestas duplicadas para demostrar actividad (HU10: el resultado declara que no se necesitan más candidatas).
- **Invariantes:** no se generan duplicados; la suficiencia la decide Core; Console no infiere suficiencia desde la lista de tests.
- **Prueba propuesta:** integración Core con fixture de tests existentes suficientes (estado final y ausencia de propuestas nuevas); UI con mock rotulado para la presentación del estado.
- **Fuente:** SYS «Baseline, generación y clasificación»; INT §6.10 (`AnalysisRunStatus`), §6.12; HU10.

### OC04 — Falta contexto funcional; pedir intervención

- **Entrada/precondiciones:** target `DIRECTLY_CHANGED` que necesita un resultado esperado, borde, excepción o transición de estado no establecido por una regla `ACTIVE` aplicable.
- **Salida/resultado observable:** Run `ACTION_REQUIRED` (no `ERROR`); pregunta `PENDING` visible en Action Required (`GET /action-required`) y en Focus Mode, con target, pregunta, motivo y respuesta; el Check enlaza al Run. Una respuesta válida devuelve `202` y continúa el mismo Run en el mismo HEAD con un `continuationAttemptId`. Console presenta la pregunta; no decide cuándo se activa.
- **Invariantes:** la elegibilidad es determinista y estructural (`DEC-FK-003`); la pregunta es atómica (`scenarioKind`/`scenarioKey` los deriva Core); el job termina y no deja runners esperando; solo Maintainer o Admin responden; el autor del PR no gana autoridad por serlo; Writer y Reader reciben `403 PROJECT_ROLE_INSUFFICIENT`.
- **Prueba propuesta:** integración Core: fixture sin regla → `ACTION_REQUIRED` → respuesta → continuación del mismo Run; E2E live con cuenta Maintainer tras `WI-CONSOLE-020`; UI con mock rotulado para Focus Mode.
- **Fuente:** SYS «Contexto RAG y Functional Knowledge»; INT §6.10, §6.11; `DEC-FK-003`; HU07, HU08.

### OC05 — Respuesta humana revela inconsistencia

- **Entrada/precondiciones:** Run `ACTION_REQUIRED` con pregunta `PENDING`; existe una regla `ACTIVE` con mismo scope, `targetRef` y `scenarioKey`.
- **Salida/resultado observable:** la respuesta sin `conflictResolution` responde `409 FUNCTIONAL_KNOWLEDGE_CONFLICT` con `details: FunctionalKnowledgeConflictResponse`, sin persistir ni avanzar el Run. Focus Mode muestra la regla existente junto a la propuesta. Reenvío con `SUPERSEDE` persiste la nueva regla `ACTIVE` y pasa la anterior a `SUPERSEDED` (`supersedesId`); con `KEEP_EXISTING` registra la respuesta sin `knowledgeId` y no toca la regla vigente.
- **Invariantes:** el conflicto no se resuelve automáticamente; solo existe entre reglas con mismo scope, `targetRef` y `scenarioKey`; reglas con otro `scenarioKey` coexisten; la detección de contradicción semántica vía LLM sigue pendiente y este caso no la cubre; `conflictId` expira si el HEAD cambia.
- **Prueba propuesta:** integración Core: segunda respuesta sobre el mismo escenario → `409`; reenvíos `SUPERSEDE` y `KEEP_EXISTING`; UI con mock rotulado para la comparación de reglas en Focus Mode.
- **Fuente:** SYS «Contexto RAG y Functional Knowledge» (HU09); INT §6.11 (HU09, `DEC-FK-001`).

### OC06 — Push posterior a corrección de implementación

- **Entrada/precondiciones:** Run previo en `PROCESSING` o `ACTION_REQUIRED` para el HEAD A; nuevo commit (incluido force-push) que produce el HEAD B.
- **Salida/resultado observable:** Run A pasa a `OBSOLETE` con transición `GITHUB_HEAD_SUPERSEDED` en su historial; se crea Run B para el HEAD B. Console muestra A como obsoleto y el Check vigente es el de B.
- **Invariantes:** un Run por PR/HEAD; el Run A no se reanuda; un resultado tardío de A no publica Check actual; todo Check pertenece al SHA de su Run.
- **Prueba propuesta:** integración Core con eventos normalizados `synchronize` (lifecycle y ausencia de Check actual para A); E2E live con push real en repositorio de prueba tras `WI-CONSOLE-020`.
- **Fuente:** SYS «Trigger PR-driven y lifecycle», «AnalysisRun, Job y Check»; INT §6.9, §6.10.

### OC07 — Defecto detectable sin intervención humana

- **Entrada/precondiciones:** target con regla `ACTIVE` aplicable; test generado técnicamente válido cuya aserción contradice esa regla.
- **Salida/resultado observable:** Run `BEHAVIORAL_MISMATCH`; propuestas `HELD`; no se acepta `POST /analysis-runs/{id}/test-publications`. Console distingue la discrepancia de un fallo técnico y no presenta veredicto propio.
- **Invariantes:** sin autorreparación de la aserción ni modificación de código productivo; la clasificación la decide Core con regla vigente; mientras exista `BEHAVIORAL_MISMATCH` no se crea publicación.
- **Prueba propuesta:** integración Core con fixture de regla y test contradictorio (estado, `HELD`, rechazo de publicación); UI con mock rotulado para la distinción visual.
- **Fuente:** SYS «Baseline, generación y clasificación», «Publicación human-in-the-loop»; INT §6.10, §6.12; HU13.

### OC08 — Test generado falla técnicamente

- **Entrada/precondiciones:** test generado con namespace, import, API, mock, setup o sintaxis inválidos.
- **Salida/resultado observable:** Run `TECHNICAL_GENERATION_FAILURE`; propuestas `HELD`. Console lo distingue de `BEHAVIORAL_MISMATCH` e `INFRASTRUCTURE_FAILURE`.
- **Invariantes:** un fallo técnico no se presenta como discrepancia de comportamiento; sin autorreparación semántica; sin publicación.
- **Prueba propuesta:** integración Core con fixture de import inválido (estado y ausencia de clasificación como mismatch); UI con mock rotulado para la distinción.
- **Fuente:** SYS «Baseline, generación y clasificación»; INT §6.10, §6.12; HU11, HU13.

### OC09 — Suite existente ya fallaba

- **Entrada/precondiciones:** baseline relevante de tests existentes en rojo.
- **Salida/resultado observable:** Run `BASELINE_FAILED`. Console muestra el baseline roto y no atribuye la falla a pruebas generadas.
- **Invariantes:** el baseline se ejecuta antes de atribuir una falla a pruebas generadas; el estado lo determina Core.
- **Prueba propuesta:** integración Core con fixture de suite roja (estado `BASELINE_FAILED` y ausencia de clasificación de generación); UI con mock rotulado.
- **Fuente:** SYS «Baseline, generación y clasificación»; INT §6.10; HU04, HU11.

### OC10 — Primer análisis de repositorio grande

- **DECISION_REQUIRED:** el contrato fija `indexMode: BOOTSTRAP` para el primer análisis (INT §6.10), pero no define el criterio de «snapshot suficiente» del bootstrap ni qué progreso intermedio debe mostrar Console durante un análisis largo (INT §6.6 solo cubre `ProjectVersion`). Pregunta: ¿qué estado o progreso visible debe presentar Console mientras dura el bootstrap de un repositorio grande, y qué criterio de suficiencia debe cumplir Core antes de completar el Run?
- **Fuente:** SYS «AnalysisRun, Job y Check», «CHANGESET, INDEX DELTA y símbolos»; INT §6.6, §6.10; HU03.

### OC11 — PR o commit grande

- **DECISION_REQUIRED:** SYS indica que los PR grandes «se filtran, priorizan y pueden dividirse en batches sin fijar thresholds». Pregunta: ¿qué criterios de filtrado y priorización son observables para Console, qué debe mostrar al dividir en batches (lista de batches, estado parcial), y puede un PR grande llegar a `SUCCESS` por batches? Como límite ya fijado, GH §Operaciones indica que una compare que alcanza 300 archivos es `UNVERIFIABLE`, nunca un `OK` parcial.
- **Fuente:** SYS «CHANGESET, INDEX DELTA y símbolos»; GH §Operaciones Core → GitHub Integration; HU06.

### OC12 — Cambios sin relevancia para pruebas unitarias

- **Entrada/precondiciones:** PR cuyo cambio no tiene impacto en pruebas según Core.
- **Salida/resultado observable:** Run `NO_TEST_RELEVANT_CHANGES`; sin propuestas. Console presenta el cambio como irrelevante para pruebas, no como fallo.
- **Invariantes:** no se activa `ACTION_REQUIRED` porque cambió un método o por complejidad; la relevancia la determina Core.
- **Prueba propuesta:** integración Core con fixture de cambio sin impacto de tests; UI con mock rotulado para la presentación.
- **Fuente:** SYS «Baseline, generación y clasificación», «Contexto RAG y Functional Knowledge» (elegibilidad de `ACTION_REQUIRED`); INT §6.10; HU06.

### OC13 — Impacto indirecto por símbolos relacionados

- **Entrada/precondiciones:** cambio que afecta símbolos relacionados sin modificarlos directamente.
- **Salida/resultado observable:** símbolos con `changeKind: POTENTIALLY_IMPACTED`, distinguibles de los `DIRECTLY_CHANGED` en el detalle del Run (`qualifiedName`, `filePath`, `kind`).
- **Invariantes:** el impacto lo calcula Core; Console no añade relaciones; un símbolo no pasa a `DIRECTLY_CHANGED` por estar relacionado. El contrato no fija si un `POTENTIALLY_IMPACTED` genera propuesta; este caso no lo afirma.
- **Prueba propuesta:** integración Core con fixture de símbolos relacionados (`changeKind` correcto); UI con mock rotulado para la separación visual.
- **Fuente:** SYS «CHANGESET, INDEX DELTA y símbolos»; INT §6.10 (`AnalysisSymbolResponse`); HU03, HU06.

### OC14 — Conocimiento funcional desactualizado o contradicho

- **DECISION_REQUIRED:** SYS fija que una regla `ACTIVE` no expira por un HEAD nuevo y que, si una regla vigente contradice un cambio, «Core solicita decisión humana o clasifica con evidencia». Ambas vías no están elegidas. Pregunta: ¿cuál es el happy path (solicitud de decisión humana mediante una pregunta/conflicto, o clasificación con evidencia sin intervención), y qué estado y acción debe ver Console en cada caso? El reemplazo explícito de una regla ya está cubierto en OC05 (`SUPERSEDE`).
- **Fuente:** SYS «Contexto RAG y Functional Knowledge» (HU09, procedencia); INT §6.11; HU07, HU09.

### OC15 — Nuevo commit mientras se espera respuesta humana

- **Entrada/precondiciones:** Run `ACTION_REQUIRED` con preguntas `PENDING`; nuevo commit que produce otro HEAD.
- **Salida/resultado observable:** el Run anterior pasa a `OBSOLETE`; sus preguntas `PENDING` pasan a `OBSOLETE` y salen de Action Required; se crea un Run para el HEAD nuevo, que genera sus propias preguntas si las necesita. Console no ofrece responder la pregunta obsoleta.
- **Invariantes:** no se reanuda el Run viejo; una pregunta de un HEAD anterior no crea conocimiento ni continuación; la reevaluación de cualquier regla potencial se hace contra el Run actual. El código de error de una respuesta enviada sobre una pregunta `OBSOLETE` no está fijado en el contrato y no se formaliza aquí.
- **Prueba propuesta:** integración Core con `synchronize` durante `ACTION_REQUIRED` (preguntas obsoletas, Run nuevo); UI con mock rotulado para ocultar preguntas obsoletas.
- **Fuente:** SYS «Contexto RAG y Functional Knowledge»; INT §6.10, §6.11 (`UNKNOWN` y HEAD cambiado); HU08, HU14.
