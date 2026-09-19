# Progreso actual

**HU35/36/39/40 activan adapters live contra Core real (2026-09-18/19).**
Handoff de Core: esas 4 historias quedaron implementadas y desplegadas
(Functional Knowledge/Action Required real, companion PR; Checks los
publica Core directo en GitHub sin API nueva para Console — se confirmó
que el `details_url` ya apunta a la ruta correcta del router). Verificado
DTO por DTO contra el código fuente real de `tjc-be-rag-core-api` antes de
tocar nada, mismo patrón que HU30. Se activaron 7 funciones
(`listActionRequired`/`getContextQuestionSet`/`submitFunctionalAnswer`/
`listFunctionalKnowledge` en `action-required/api.ts`,
`listTestProposals`/`createTestPublication`/`getTestPublication` en
`control-plane/api.ts`), reemplazando `PendingContractError` por llamadas
reales. Se encontró y corrigió una regresión propia: dos tests de
`ProjectsPage.test.tsx` mockeaban `fetch` sin discriminar por URL, y al
activar `listActionRequired` en vivo esa petición recibía la forma
equivocada (`Page<Project>` en vez de `Page<FunctionalQuestionResponse>`),
crasheando `ActionRequiredPreview` sin error boundary. Corregido.
`tsc -b --noEmit`/lint/build limpios, 312 pruebas en verde (+8). Probado
en vivo con un PR real (`cjcarlosgc/tjc-fe-ts-repo-test#1`) hacia la rama
vinculada: el webhook de Core (HU31, ya implementado) creó un
`AnalysisRun` real visible en la Console, con símbolos reales detectados
del repo real. Se encontró y reportó a Core (no es bug de Console) un
`GITHUB_APP_WEBHOOK_SECRET` desincronizado entre GitHub y Render que
causaba `401 INVALID_WEBHOOK_SIGNATURE` en la primera entrega del webhook;
corregido regenerando el secreto en ambos lados. El Run real quedó en
`PROCESSING` (análisis LLM en curso) al cierre de esta sesión — queda
pendiente confirmar visualmente Action Required/companion PR de punta a
punta una vez termine (la extensión Claude in Chrome se desconectó otra
vez, mismo problema intermitente ya documentado). Ver
`harness/reports/HU35-HU36-HU39-HU40-live-adapters.md`. `activeWorkItem`
vuelve a `null`.

**HU30 activa adapters live contra Core real + fix de carrera en auth (2026-09-18).**
El usuario pidió empezar a integrar contra el backend real. Se confirmó que
Core ya tiene un backend desplegado en Render con HU30 implementado de
verdad (DTOs verificados leyendo su código fuente, coinciden exacto con los
tipos de Console) y un proyecto Supabase real compartido que Console nunca
había cableado. Con permiso explícito se conectó `.env` local a ambos y se
probó login GitHub OAuth real en el navegador (clic manual del usuario, el
botón no respondía a automatización). Se activaron los 6 adapters live de
repository binding (antes `PendingContractError` a propósito hasta esta
aprobación). Durante la prueba se encontró y corrigió un bug real de
Console: `AuthProvider` sincronizaba el Bearer en un `useEffect([session])`
que corre después de los efectos de rutas hijas montadas por `RequireAuth`
en el mismo commit — la primera consulta tras login salía sin token, Core
respondía 401 y la Console deslogueaba sola. Se descartó una hipótesis
cruzada de Core (comillas en el header) con logs temporales; la causa real
fue solo la carrera de efectos. Corregido sincronizando durante el render.
Verificado end-to-end contra producción: login real, discovery real de
repos (paso que ni Core había probado), y el usuario conectó
`cjcarlosgc/tjc-fe-ts-repo-test` de verdad — confirmado leyendo directo de
la base de datos de Core (`installationId` resuelto server-side, nunca
enviado por el navegador). `tsc -b --noEmit`/lint/build limpios, 308
pruebas en verde (sin cambios de conteo, solo se reescribió el describe
live de HU30). Ver
`harness/reports/HU30-live-adapters-and-auth-race-fix.md`. `activeWorkItem`
vuelve a `null`.

**HU48 cierra el selector de símbolo múltiple y Replay (2026-09-17).** Tras
cerrar HU30, se preguntó al usuario con qué seguir y eligió completar los 2
ítems pendientes de HU48 en `tasks.md` (sin bloqueo de contrato, ya dentro
del alcance aprobado). `findEligibleSymbols` en `run-comparison/types.ts`
devuelve todos los símbolos elegibles de un Run (antes solo el primero);
`RunComparisonPage` muestra un selector cuando hay más de uno y sigue
arrancando sola cuando hay exactamente uno (sin regresión). Nuevo
`listRunComparisons`/`mockListRunComparisons` (§6.5
`GET /analysis-runs/{id}/experiments`) lista todos los trials de un Run;
botón "Repetir comparación (Replay)" lanza uno nuevo sin perder los
anteriores, cada uno con su propio progreso vía una `TrialCard`
independiente. Durante la verificación manual se corrigió un detalle:
`TrialCard` usaba `initialData` en vez de `placeholderData` para la snapshot
inicial del trial — el patrón correcto para no interferir con el fetch/
polling normal de React Query. Verificación: `tsc -b --noEmit`/lint/build
limpios, 302 pruebas en verde (+4), recorrido manual en navegador confirmó
el selector y que Replay agrega trials sin perder los anteriores; el avance
automático de progreso no pudo verse completo en vivo porque la pestaña
controlada por la extensión reporta `visibilityState: hidden` y
`refetchInterval` de React Query no refresca en segundo plano por defecto
(limitación del entorno de automatización, no del código — la progresión
completa sí está cubierta por la suite de tests). Ver
`harness/reports/HU48-symbol-selector-replay.md`. `activeWorkItem` vuelve a
`null`.

**HU30 se reconcilia con el binding user-centric de INTEROP-2.2 (2026-09-17).**
Core subió SYSTEM-2.2/INTEROP-2.2 (solo especificación): reemplaza el
onboarding "installation-centric" por uno "user-centric" — discovery de
repositorios vía provider token OAuth, verificación de acceso de la GitHub
App a un repo concreto (`AUTHORIZED`/`NOT_AUTHORIZED` con CTA de
configuración/revalidación), ramas reales y creación del binding sin
`installationId` (Core lo resuelve). A pedido del usuario se comiteó primero
el sync de spec/contratos (`971b997`, doc-only) y luego se planeó
(`EnterPlanMode`/`ExitPlanMode`, aprobado) antes de tocar código. Se
reconstruyó `control-plane/{types,api,queries}.ts`, `demoRepositories.ts` y
`api/mockBackend.ts` contra la nueva forma, y se agregó a `AuthSession` un
`githubProviderToken` + `linkGitHub()` (vincula GitHub a una sesión de correo
sin cambiar de usuario, HU29) porque el flujo de discovery no tenía sentido
sin eso. `IntegrationsPage` pasa de un flujo de 2 pasos a uno de 4
(conectar GitHub → descubrir → verificar acceso → elegir rama y vincular).
Sigue **sin activar live** — las 4 rutas nuevas rechazan con
`PendingContractError` hasta aprobación humana explícita, como pedía
`tasks.md`. Verificación: `tsc -b --noEmit`/lint/build limpios, 298 pruebas
en verde (+16), recorrido manual en navegador confirmado esta vez (camino
feliz y camino NOT_AUTHORIZED→revalidar) sin errores de consola. Ver
`harness/reports/HU30-github-app-centric-binding.md`. Se detectó y corrigió
un hallazgo de proceso: `tsc --noEmit` sin `-b` no verificaba nada en este
repo por la config de referencias — usar `tsc -b --noEmit` de ahora en
adelante para chequeos intermedios (`pnpm build` ya usaba `-b` internamente,
así que cortes anteriores cerrados con `pnpm build` no están afectados).
`activeWorkItem` vuelve a `null`.

**HU52 y HU49 cierran el corte HU48–HU55 (2026-09-16).** A pedido del
usuario de retomar la sesión pausada ("continua la implementacion"), se
implementaron las 2 historias que quedaban pendientes del corte anterior,
ambas sin contrato de Core y como capa especulativa (mismo patrón que
HU50/HU54: tipos propios, `ProposedCapabilityError`, badge
`.proposal-stamp`). HU52: `action-required/speculative/ruleUsage.ts`, panel
"Runs que usaron esta regla" en `FunctionalKnowledgeDetailPage`, coincidencia
local por símbolo == `targetRef`. HU49: `run-comparison/speculative/
captureNextPr.ts`, panel `CaptureNextPrPanel` en `ExperimentPage`, estado
`ARMED`/`OFF` por proyecto; al capturar navega a `RunComparisonPage` (HU48)
sin duplicar su lógica. Sin webhook real para "el próximo PR elegible", se
documentó un botón de demo explícito ("Simular llegada del PR") como
desviación deliberada. Verificación: `tsc`/`lint`/`build` limpios, 282
pruebas en verde (+9). El recorrido manual en navegador no pudo confirmarse
por la misma desconexión intermitente de la extensión Claude in Chrome ya
documentada en sesiones previas. Con esto, las 8 historias de
`console-backlog-formalization.md` (HU48–HU55) quedan todas con alguna
implementación en Console — ver `harness/reports/HU49-HU52-speculative-closure.md`.
`activeWorkItem` vuelve a `null`.

**Implementación mock-first de HU48–HU55, en curso (2026-09-15).** A pedido
del usuario ("continua por orden de prioridad, y todos los que estén listos
para implementar"), se verificó de nuevo el estado de contrato de las 8 HU
registradas el día anterior: ninguna tenía forma aprobada todavía. El
usuario eligió explícitamente avanzar con "mock-first especulativo,
etiquetado como tal" para las 8 — se diseñó una capa especulativa nueva
(tipos propios por HU, `ProposedCapabilityError` distinto de
`PendingContractError`, badge `.proposal-stamp` violeta distinto de
`.demo-stamp`). A mitad de implementar HU48, un peer de Core
(`tjc-be-rag-core-api`, sesión `snapshot-intelligence-changeset`) avisó por
mensaje cross-session que acababa de definir contrato (sin implementar)
para 4 de las 8: HU48 (§6.5, `CreateExperimentRequest` reapunta a
`AnalysisRun`+símbolo), HU51 (§6.11, `conflictResolution`/`409
FUNCTIONAL_KNOWLEDGE_CONFLICT`), HU53 (§6.10, `AnalysisRunDetailResponse.history`)
y HU55 (§6.10, `GET /analysis-runs` sin `projectId`). Se preguntó al usuario
cómo priorizar y eligió "realinear ya, antes de seguir": se sincronizó el
mirror de contratos, se rehizo HU48 contra la forma real (dejó de ser
especulativo, ahora usa `PendingContractError` como el resto del
mock-first normal — sin tocar el adapter live de HU19, que sigue sirviendo
contra el controller viejo de Core), y se implementaron HU51/HU53
directamente contra el contrato real (ya no capa especulativa). HU55 no
necesitó código nuevo (el mock ya lo cubría completo), solo se corrigió un
mensaje de error desactualizado. HU54 se implementó como capa especulativa
genuina (sigue sin contrato) — panel de lista junto al grafo RAG real de
HU27, sin tocarlo. HU50 también especulativo (sin contrato): badge de
cobertura previa por símbolo.

Completadas en este corte: HU48, HU50, HU51, HU53, HU54, HU55 (7 commits,
uno por HU/corrección + uno de sync de contrato). Verificación tras cada
commit: `tsc`/`lint`/`test`/`build` en verde (267 pruebas). Quedan
pendientes: HU52 (trazabilidad inversa "Runs que usaron esta regla",
especulativa, sin contrato) y HU49 (Capture next PR, P4, depende de HU48 ya
implementado). `activeWorkItem` en `null` — usuario pidió parar por hoy,
retomar HU52/HU49 en la próxima sesión sin re-verificar contrato de las 6
ya cerradas (solo las 2 restantes, si Core manda algo nuevo).

**Formalización de HU48–HU55 (2026-09-14, registro puro, sin código).** Tras
preguntar cómo entrar a un experimento desde un Run, se confirmó que esa
capacidad (`experimentos.md`) nunca tuvo HU asignado — el usuario pidió
auditar si había "otros casos así" antes de planear implementación. Un
research cruzó los ~20 `harness/reports/` y los 3 handoffs contra el
HU01–HU47 completo de `spec/backlog.md` y encontró 7 capacidades sin
historia (8 HU nuevas, una se partió en P1/P4). Registradas como `PROPOSED`
(HU48/49 en `spec/features/014-analysisrun-experiments/`, nueva; HU50/51/
52/53/55 extendiendo `013-pr-driven-control-plane`; HU54 extendiendo
`011-context-explorer`), cada una con su bloqueador explícito (todas
dependen de que Core publique un contrato/señal que hoy no existe). Cero
implementación. `spec/backlog.md` queda pendiente de homologar con
Core/Sandbox — se avisa por mensaje, sin bloquear. Ver
`harness/reports/console-backlog-formalization.md`.

**Cierre de gaps mock-first — MVP control plane completo (2026-09-14).** A
pedido del usuario, tras cerrar el work item de adapters live: 5 escenarios
mock nuevos dentro del contrato ya aprobado (INFRASTRUCTURE_FAILURE,
bootstrap vía `indexMode`, "PR grande" resumido desde `symbols`, `STALE`
proposals, caso "respuesta revela inconsistencia" que muta un Run a
BEHAVIORAL_MISMATCH al responder su pregunta — 9→14 AnalysisRuns demo);
badge de conteo en "Action Required" del nav + `ProjectTabs` (sub-nav
persistente Overview/Runs/Functional Knowledge/Integrations por proyecto,
"History" fuera a propósito por falta de contrato); selector de repositorio
en el mock de instalación de GitHub App (antes siempre vinculaba el repo por
defecto). Caso 2 (cobertura previa), conflicto de Functional Knowledge y
timeline de Run siguen genuinamente bloqueados por el contrato, documentados
sin implementar. Verificación: tsc/lint/build limpios, 235 pruebas en verde,
recorrido manual en navegador confirmando cada escenario end-to-end. Ver
`harness/reports/console-mock-first-gap-closure.md`. `activeWorkItem` vuelve
a `null`.

**Adapters live de Analysis Runs + historial de ProjectVersion (2026-09-14).**
A pedido del usuario ("implementa las funciones que el backend expone en SDD
2.1"), se leyeron los 6 controllers reales de `tjc-be-rag-core-api` (no solo
el contrato aprobado) antes de tocar código — work item pasó por
SPEC_VERIFIED/AWAITING_APPROVAL/IN_PROGRESS explícitos en `harness/state.json`.
Se conectaron `getAnalysisRun`/`listAnalysisRuns` (`control-plane/api.ts`) y
`listAnalysisHistory` (`analysis/api.ts`) contra los endpoints reales; el
listado global de Analysis Runs sin `projectId` (usado por `RunsPage`/
`ProjectsPage`) no tiene ruta en Core ni en el contrato, sigue rechazando en
vivo con mensaje propio. El resto (binding, Checks/publicación, Action
Required, Functional Knowledge, context-traces) sigue sin controller, sin
tocar. El usuario también compartió `~/Downloads/experimentos.md` (handoff de
reorientación de Experiments a P0/P1/P4, también enviado a Core): se entregó
la clasificación KEEP/ADAPT/DEFER/DROP que pide, sin implementar P1/P4 todavía
(explícitamente diferido por el propio handoff para no interrumpir P0). ZIP/
generación manual UI queda tal cual. Ver `harness/reports/console-analysisrun-live-adapters.md`
y `harness/reports/console-experiments-analysisrun-classification.md`.
Verificación: tsc/lint/build limpios, 223 pruebas en verde. `activeWorkItem`
vuelve a `null`.

**SDD 2.1 / SYSTEM-2.1 / INTEROP-2.1 (2026-09-14).** RAG Core retira ZIP upload
y generación manual como ruta de producto (sin compatibilidad legacy paralela,
a diferencia de `INTEROP-2.0`): `POST /projects/index`, los 5 modos manuales +
`POST /test-runs` y asociados, los 4 endpoints de artifacts, el evento
`test-run:update` y el endpoint de trazas run-scoped (HU27) quedan retirados;
Experiments (HU19) se conserva pero `POST /experiments` con `targetId` nuevo
queda sin ruta hasta reapuntarlo a `AnalysisRun` (P1/P4 futuro). A pedido
explícito del usuario tras handoff cross-session verificado contra el repo
`tjc-be-rag-core-api` real: se hizo mirror byte-por-byte de los contratos, bump
de `sddVersion`/línea base declarativa en `spec/` (sin reescribir reportes
históricos) y auditoría de UI/mocks (todo queda `KEEP` con nota de superseded
en spec, ningún componente ni ruta se tocó/borró). Ver
`harness/reports/console-interop-2.1-sync.md`. `activeWorkItem` sigue `null`.

Sesión de prueba manual con RAG Core y Test Execution Sandbox reales corriendo en local (Docker
Desktop) deriva en conectar el resto de adapters live que solo funcionaban en mock: listado de
proyectos (HU01), envío/progreso/resultados de generación (HU08-14) y el experimento RAG vs
agente generalista (HU19, con `BASELINE` retirado del vocabulario interno y `startExperiment`
corregido para enviar el `targetId` real en vez de una etiqueta). Verificado end-to-end contra el
backend real, incluyendo un experimento completo. `activeWorkItem` vuelve a `null`; feature 010
(product-experience) sigue con sus pendientes propios sin cambios (ver su `tasks.md`). Ver
`harness/reports/live-adapters-generation-projects-experiments.md` para hallazgos de esta prueba
(no son código de este repo, no se tocó `tjc-be-rag-core-api`).

SDD 1.14 / SYSTEM-1.4 / INTEROP-1.5 elimina el bloqueo contractual de Sprint 3: Core ya fijó e implementó historial, WebSockets y retry manual; HU23/autorreparación está descartada. El work item queda `SPEC_VERIFIED` para HU20/HU21/HU22/HU24. El código frontend aún debe implementar adapters live, lifecycle de `Idempotency-Key` y manejo de `UNSUPPORTED_PACKAGE_MANAGER`; nunca debe recibir el Bearer Core↔Sandbox. Esta actualización no tocó `app/`.

Modo demo end-to-end en revisión. `VITE_DATA_SOURCE=mock` sirve un escenario
stateful y visible que enlaza proyectos, historial multiversión, indexación,
inventario por ProjectVersion, generación, progreso, validación, artifacts y
comparación RAG vs Agente generalista. Los componentes consumen los mismos servicios que
el modo live; el mock no realiza requests HTTP.

Los adapters live de ProjectVersion, resultados e inventario conservan los DTO
confirmados de RAG Core. SDD 1.5 / SYSTEM-1.1 / INTEROP-1.0 aprueba además contratos para listado,
generación, run, artifacts y experimentos; sus adapters live continúan sin implementar. La
verificación final incluye 38 pruebas y recorrido manual en navegador sin errores
ni warnings de consola.

El SDD local sube a 1.4: incorpora el contrato común de los tres componentes, alcance de proyectos TypeScript-only, validación empresarial exclusivamente live, `GENERALIST_AGENT` sin identificador heredado `BASELINE` y puerta `decisionGate`. El work item actual no queda bloqueado porque es demo y no implementa contratos live pendientes.

El SDD local sube a 1.5 con la copia universal `INTEROP-1.0`. El mock deja de ser fuente provisional de DTOs; deberá adaptarse junto con el código live en work items posteriores. `DEC-EXP-002` sigue bloqueando exclusivamente la ejecución real de HU19.

SDD 1.6 queda homologada como línea base conjunta de los tres repositorios y formaliza la entrega Git común: cada commit es un cambio coherente con `Refs: HU...`; cada work item conserva su revisión y, antes del push de cierre de sprint, el reviewer debe aprobar y documentar el rango acumulado exacto que se publicará. `SYSTEM-*` e `INTEROP-*` conservan versionado propio. Commit y push continúan requiriendo solicitud humana explícita.

SDD 1.7 / SYSTEM-1.2 aprueba como entorno temporal de desarrollo y prevalidación la MacBook encendida con Docker Desktop y su VM Linux. El destino previsto continúa siendo una VM Linux remota, pero `DEC-INF-001` mantiene `PENDING` la selección del proveedor, priorizando opciones gratuitas sin asumir que cumplen capacidad, disponibilidad o seguridad. INTEROP-1.0 no cambia.

SDD 1.8 / SYSTEM-1.3 / INTEROP-1.1 confirma que el frontend consume exclusivamente RAG Core: envía el ZIP por `POST /projects/index` y no conoce Supabase Storage, PostgreSQL, credenciales ni signed URLs Core↔Sandbox. `@supabase/supabase-js` y `SUPABASE_PUBLISHABLE_KEY` no se incorporan sin una feature futura aprobada que los necesite.

SDD 1.9 registra para Developer Console que `DEC-EXP-002` está APROBADO: HU19 ya no está bloqueada por decisión y el adapter live podrá implementarse contra `INTEROP-1.1` cuando RAG Core publique las rutas. Las decisiones de embeddings y chunking permanecen internas a Core y no agregan lógica ni dependencias al frontend. Docker Desktop local sigue siendo suficiente para integrar y prevalidar durante Sprint 2-4; `DEC-INF-001` conserva PENDING el proveedor remoto hasta después de Sprint 4.

HU07 (`sprint1-analysis-history-demo`) cierra `DONE`: demo completa verificada (lint, test, build, navegador sin errores), design-system migrado a tema oscuro inspirado en Superhuman sin regresión de contraste. El adapter live de listado de versiones queda fuera de esta tarea, bloqueado por backend. `activeWorkItem` vuelve a `null`.

Al intentar seleccionar el siguiente work item (Sprint 3, feature 009-history-repair-retry / HU20, HU23, HU24), la puerta de decisiones detecta un bloqueo de contrato: `spec/contracts/rag-core-api.md` marca "Historial, WebSockets, reparación y retry" como PENDING (RAG Core no fijó endpoints, eventos WebSocket ni DTOs) y prohíbe expresamente que el frontend invente nombres de evento o comandos de retry. El work item queda `BLOCKED` sin iniciar `IN_PROGRESS`.

SDD 1.14 / SYSTEM-1.4 / INTEROP-1.5 resuelve ese bloqueo (ver nota de arriba) y `sprint3-history-realtime-retry` (HU20/HU21/HU22/HU24) cierra `DONE`: historial paginado de generaciones, adapter Socket.IO reutilizable (`api/socket.ts`) cableado como complemento del polling existente en análisis (HU21) y run (HU22), y retry manual de un target `INVALID`/`FAILED` con lifecycle de `Idempotency-Key` (`api/idempotency.ts`). `spec/transversal/demo-mode/spec.md` amplía su alcance mock a HU20/HU24; HU21/HU22 quedan fuera del mock porque ese modo no abre transporte de ningún tipo. Verificación: lint/test (59 pruebas)/build en verde; el recorrido manual en navegador no pudo confirmarse en esta sesión por desconexión de la extensión Claude in Chrome. Adapters live de proyectos, generación, artifacts y experimentos siguen PENDING, fuera de este work item. `activeWorkItem` vuelve a `null`.

**Checkpoints humanos (2026-09-06):** `DEC-MET-001` queda condicionada a completar antes una prueba end-to-end satisfactoria en local con RAG Core, Test Execution Sandbox y Docker Desktop ejecutándose todos a la vez. La auditoría de accesibilidad (transversal `accessibility`, dentro de HU25/HU26) se envía deliberadamente al final del backlog, después de navegación/filtros, consolidación visual y adapters live.

Se selecciona `sprint4-product-experience-partial` (HU25/HU26, Sprint 4) por ser 100% frontend y verificable sin depender de un backend real. Entrega parcial `IN_REVIEW`: componente `Breadcrumbs` de jerarquía en las 8 páginas internas, buscador de proyectos (>4) y filtro de estado en historial de generaciones, y consolidación del patrón `.list-toolbar`/`.list-search` reutilizado por inventario e historial. Quedan explícitamente pendientes dentro de 010: revisión de patrón de tablas/diff/dialogs, la auditoría de accesibilidad (pospuesta por decisión humana) y la revisión manual en navegador (bloqueada por desconexión de la extensión Claude in Chrome). Verificación: lint/test (64 pruebas)/build en verde. Adapters live siguen fuera de alcance.

SDD local sube a **2.0** (commit `766cd6f`): re-baseline documental de `T-001` que adopta `SYSTEM-2.0`/`INTEROP-2.0` y el nuevo control plane PR-driven (feature 013). Ese commit no tocó `app/` ni autorizó implementación automática (ver `harness/reports/T-001-sdd-2.0.md` y `spec/backlog-migration-sdd-2.0.md`). `T-001-sdd-2-baseline` cierra `DONE` como bookkeeping (doc-only, ya `approved:true`).

Se selecciona el incremento recomendado para este repo: **HU37 (Focus Mode) + HU38 (bandeja Action Required)**, confirmado explícitamente por el usuario tras revisar el backlog de migración. Usa únicamente `FunctionalQuestionResponse`/`FunctionalQuestionSetResponse` de INTEROP-2.0 §6.11, que ya trae denormalizado el contexto de PR — no requiere construir el dominio Project/Run/PR nuevo (HU30/HU32, fuera de alcance, Core-side). Mock-first; adapters live quedan `PendingContractError` igual que el resto de capacidades pendientes. Nuevo `returnTo` por query string en el guard de auth para que un deep-link sobreviva un login intermedio (no existía; `RequireAuth`/`LoginPage` solo usaban `state.from` de React Router).

**HU37/HU38 cierra `DONE` (2026-09-13).** Dominio nuevo `app/src/action-required/` (types/api/queries), fixtures mock de dos Runs (`arun_checkout_pr42` action-required normal con dos preguntas encadenadas; `arun_billing_pr17` corrección/HEAD nuevo, la pregunta queda `OBSOLETE` sin reanudar), páginas `ActionRequiredPage`/`FocusModePage`, ruta y nav en `AppShell`, `returnTo` seguro en `RequireAuth`/`LoginPage`. Ver `harness/reports/HU37-HU38-focus-mode-action-required.md`. Verificación: `tsc --noEmit`/lint/build limpios con `pnpm` (el repo usa `pnpm`, no `npm`, pese a que ambos lockfiles coexisten — `npm run build` falla por `@tsparticles/engine` no hoisteado, preexistente y no relacionado), 162 pruebas en verde (+19), recorrido manual en navegador de los tres escenarios sin errores de consola. Gate de diseño: el proyecto Stitch de referencia no tiene pantallas para Focus Mode/Action Required (EP12 nueva); se aplicaron los tokens Black Glass vigentes sin comparación 1:1. Fuera de alcance: adapters live, HU35/36 (persistencia real de Functional Knowledge), HU39/40, HU44/45, y los escenarios de los 9 que requieren pantallas de Run/Checks aún no construidas. `activeWorkItem` vuelve a `null`.

**Nota de proceso (2026-09-13):** el usuario pidió que el agente commitee por cada corte lógico verificable sin pedir permiso en cada uno, pero nunca haga `push` sin solicitud humana explícita en la sesión. Codificado en `harness/WORKFLOW.md` (paso 6) y `spec/constitution/delivery-workflow.md` ("Puerta de push").

Se selecciona el resto de la feature 013 como un solo corte grande, autónomo, a pedido explícito del usuario ("mostrar una versión mockeada completa de la nueva dirección"): **HU30 (repository binding/GitHub App), HU32 (`AnalysisRun` por PR/HEAD y obsolescencia), HU39 (Check por HEAD) y HU40 (revisión/publicación por companion PR)**, mock-first, con los 9 escenarios de `spec.md` representados. Decisión de diseño: el `details_url` que exige INTEROP-2.0 §6.12 (`/projects/{projectId}/runs/{analysisRunId}`) colisiona con la ruta legacy de generación (`RunPage`, ZIP-based, HU44 pendiente de retirar); este corte usa `/analysis-runs` y `/analysis-runs/:analysisRunId` en su lugar, documentado como desviación deliberada hasta que HU44 libere la ruta. Sigue fuera de alcance: adapters live, HU31/35/36/44/45.

**HU30/HU32/HU39/HU40 cierra `DONE` (2026-09-13).** Dominio `app/src/control-plane/` (types/api/queries/status), 9 fixtures de `AnalysisRun` sobre los dos proyectos demo cubriendo cada escenario de `spec.md` (action required, success, behavioral mismatch, existing tests sufficient, corrección/HEAD nuevo vía pr17→pr17_2, baseline failed, technical generation failure, no relevant changes, publication/freshness), `RunsPage`/`AnalysisRunDetailPage`/`IntegrationsPage`, panel de binding en `ProjectDetailPage`, nav "Runs". Simplificaciones de demo documentadas: el estado inicial de las 2 fixtures compartidas con `action-required` es independiente (no derivado en vivo) y la publicación de companion PR es inmediata (sin paso `PUBLISHING` intermedio). Ver `harness/reports/HU30-HU32-HU39-HU40-control-plane-mock.md`. Verificación: tsc/lint/build limpios, 183 pruebas en verde (+21; una de `ContextExplorerPage` no relacionada fue flaky bajo carga y pasó en aislamiento), recorrido manual en navegador de los 9 escenarios + publicación + reconexión de binding sin errores de consola. Con esto, el mock-first del Developer Console para SDD 2.0 queda completo salvo lo Core-side (HU35/36) y P4 (HU44/45). `activeWorkItem` vuelve a `null`.

Tras revisar la demo corriendo, el usuario pide reorientar la Console para que el flujo ZIP deje de ser la navegación/UX principal, sin borrar capacidades reutilizables (inventario, generación, historial, artifacts, experimentos, context explorer), y un mock más completo de login+binding GitHub (no integración real, fuera de alcance de T-001). Mapa KEEP/ADAPT/DEFER/DROP verificado por grep: **no existe código del demo GitHub viejo** en `src/` — nada que DROP a nivel de código. `Projects`/`ProjectDetailPage` → ADAPT (banner y panel de binding apuntan a SDD 2.0); `analysis/inventory/generation/artifacts/experiments/context-explorer` → DEFER (mismo código y rutas, solo se reubica el punto de entrada a una página nueva `LegacyToolsPage`); `control-plane/*` y `action-required/*` → KEEP. Ningún archivo de dominio se borra ni pierde cobertura de pruebas. Ver el plan completo en el reporte de cierre.

**Reorientación cierra `DONE` (2026-09-13).** Login GitHub mock (`AuthAdapter.signInWithGitHub`, botón "Continuar con GitHub" en `LoginPage`; `supabaseAuthAdapter` implementa el método real vía `signInWithOAuth` para cuando exista un proyecto Supabase real, sin probarse en vivo todavía). `LegacyToolsPage` nueva (`/projects/:id/legacy`) recibe intacto el flujo ZIP que antes vivía en `ProjectDetailPage`; esta última queda solo con el panel de binding y un link discreto a legacy. Banner y copy de `ProjectsPage` apuntan al tour de `/analysis-runs` en vez de al ZIP. Ver `harness/reports/console-sdd2-reorientation-github-login-mock.md`. Verificación: tsc/lint/build limpios, 190 pruebas en verde (+7), recorrido manual en navegador del login GitHub → Proyectos → detalle sin ZIP → Herramientas legacy con el flujo ZIP intacto, sin errores de consola. `activeWorkItem` vuelve a `null`.

A pedido del usuario ("solo quitarlo visualmente, no del código fuente"), el link a "Herramientas legacy" en `ProjectDetailPage` se oculta (commit `f467acf`) — la ruta y `LegacyToolsPage` siguen intactos, solo dejan de ser alcanzables desde la navegación visible.

El usuario compartió un handoff frontend (`Handoff Frontend — Pantallas objetivo SDD 2.0.md`) con las 7 pantallas principales esperadas para la Console. Se hizo un inventario comparándolo contra lo construido y contra INTEROP-2.0, identificando: vocabulario de proposals del handoff (`READY_FOR_REVIEW/REJECTED`) no coincide con el contrato ratificado (`AVAILABLE`, sin `REJECTED`) — se mantiene el contrato; la ruta de Run Detail que pide el handoff (`/projects/{id}/runs/{runId}`, igual al `details_url` de INTEROP-2.0 §6.12) colisionaba con el Run legacy; `Experiments` en nav global del handoff contradecía haberlo movido a legacy. El usuario decidió los tres: mantener contrato, liberar la ruta ahora, devolver Experiments a visible (fuera de legacy). **Cierra `DONE`:** `AnalysisRunDetailPage` pasa a `/projects/:projectId/runs/:analysisRunId`; el Run de generación legacy se muda a `/projects/:projectId/legacy/runs/...` (mismo código/pruebas, solo prefijo); "Modo experimental" vuelve a `ProjectDetailPage` como acción propia, fuera de `LegacyToolsPage`. Ver `harness/reports/console-run-route-canonical-experiments-visible.md`. Verificación: tsc/lint/build limpios, 191 pruebas en verde, recorrido manual en navegador confirmando la ruta canónica y ambos flujos (nuevo y legacy) intactos. Gaps grandes identificados y diferidos explícitamente: pantalla `Functional Knowledge` (tipo ya en INTEROP-2.0 §6.11, sin implementar), `INFRASTRUCTURE_FAILURE` sin fixture, sub-nav por proyecto, badge de conteo, timeline por Run, escenarios ampliados del handoff, y destino de "Experiments" en nav global. `activeWorkItem` vuelve a `null`.

Se selecciona el mayor gap identificado: **Functional Knowledge** (pantalla 6 del handoff, HU35/HU36 Console-side), a pedido explícito del usuario ("continua con ese corte"). INTEROP-2.0 §6.11 ya define `FunctionalKnowledgeResponse` y `GET /projects/{projectId}/functional-knowledge`, sin implementar todavía. Vive en `action-required/` (misma sección del contrato que Action Required; `FunctionalScope` ya existía ahí). No se agregan campos fuera del contrato (ej. "Runs that used this rule" del handoff, que no está en INTEROP-2.0, se omite).

**Cierra `DONE` (2026-09-13).** `FunctionalKnowledgeResponse`/`FunctionalKnowledgeListPage` en `action-required/types.ts`, `listFunctionalKnowledge` (live -> `PendingContractError`), 4 fixtures sobre los dos proyectos demo (2 ACTIVE independientes + un par SUPERSEDED→ACTIVE sobre `OrderService.calculateTotal` que demuestra la supersesión del handoff §37). `FunctionalKnowledgePage` (lista + filtro por estado) y `FunctionalKnowledgeDetailPage` (regla normalizada, pregunta/respuesta, trazabilidad bidireccional de supersesión) en `/projects/:id/functional-knowledge[/:knowledgeId]`; link nuevo en `ProjectDetailPage`. Ver `harness/reports/console-functional-knowledge.md`. Verificación: tsc/lint/build limpios, 200 pruebas en verde (+9); el recorrido manual en navegador no pudo confirmarse por desconexión de la extensión Claude in Chrome (mismo bloqueo ya visto en `sprint3-history-realtime-retry`), queda pendiente. `activeWorkItem` vuelve a `null`.
