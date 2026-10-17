# WI-CONSOLE-013 — Verificación SDD

Modelo: sdd-analyst · configurado claude-sonnet-5-5 · atendido claude-sonnet-5-5 · esfuerzo low

Work item: WI-CONSOLE-013 «Rol Writer y abstención UNKNOWN en Focus Mode y Action Required» (ST-CONSOLE-015, HU07/HU08/HU14, sprint SMART V3, dependsOn WI-CONSOLE-011, externalDependencyGate G-PASSED). Solo verificación; no se editó código, state.json ni work-items.json.

## Veredicto: SUFFICIENT

Specs 013/014, SYSTEM-2.6 e INTEROP-2.7 (espejos) cubren roles, `Project.role`, `PROJECT_ROLE_INSUFFICIENT`, `outcome`/`abstention`/`scenarioKind`/`scenarioKey` y la bandeja. Sin contradicciones bloqueantes. Dos hallazgos menores en «Findings».

## Decision gate
- Fuente: `spec/contracts/system-contract.md`.
- blockingDecisionIds: [] (ninguno). No hay decisión `PENDING` ni `PROPOSED` con `Blocks` que alcance este WI.
- Decisiones aplicables, todas APROBADO (2026-10-08, por el usuario), sin campo `Blocks` y por tanto no bloqueantes:
  - `DEC-FK-002` (UNKNOWN es abstención auditada): define la conducta de Focus Mode/Action Required de este WI.
  - `DEC-ORG-003` (rol Writer): `ProjectRole = ADMIN | MAINTAINER | WRITER | READER`; Writer hace lo del Maintainer salvo responder preguntas funcionales y registrar `UNKNOWN`.
  - Contexto, no bloqueantes: `DEC-FK-001/003/004` (scenarioKey/scenarioKind solo se leen; Console no los calcula ni edita; reglas múltiples son WI-CONSOLE-015).
- No bloqueantes por `Blocks` ajeno: `DEC-INF-001` (aprovisionamiento remoto), `DEC-VAL-001` (código/evidencia empresarial). `DEC-GH-001`, `DEC-WEB-AUTH-001`, `DEC-INT-001`, `DEC-AUTH-001`, `DEC-IDEMP-001`, `DEC-ORG-001/002`: `Blocks: NONE`.
- Aclaración: «la pregunta sigue pendiente» es una regla de UI/dominio (la pregunta funcional queda `PENDING`), no una decisión abierta. No hay ninguna decisión pendiente que se muestre como resuelta.
- Registrar en `decisionGate` del WI: blockingDecisionIds [], nonBlocking [DEC-INF-001, DEC-VAL-001], approvedApplicable [DEC-FK-002, DEC-ORG-003].

## Spec aplicable (citas)
- `013/spec.md` línea 31 (UNKNOWN): la pregunta sigue pendiente y el Run sigue en `ACTION_REQUIRED`; Console muestra la abstención (quién, rol y cuándo, según `abstention`); nunca «resuelto», «continuando» ni «todas las preguntas respondidas». Console oculta o deshabilita la acción para Writer y Reader, pero el `403 PROJECT_ROLE_INSUFFICIENT` de Core es la autoridad; la acción nunca se decide en el navegador.
- `014/spec.md` (alineación SMART V3): `MAINTAINER` puede vincular, pausar, responder, publicar y crear experimentos; `403 PROJECT_ROLE_INSUFFICIENT` informa rol requerido/actual.
- `system-contract.md` línea 67/135/130: jerarquía Admin ⊃ Maintainer ⊃ Writer ⊃ Reader; responde/confirma Maintainer o Admin; Writer y Reader reciben `403`; UNKNOWN solo Maintainer/Admin.
- `interoperability-contract.md`: `ProjectRole` (línea 913), `FunctionalAbstentionSummary {count,lastAt,lastByUserId,lastByRole}` (766), `FunctionalQuestionResponse.scenarioKind/scenarioKey/abstention` (792-794), `FunctionalAnswerAcceptedResponse.outcome` (818), §6.11 UNKNOWN (854: 202 con `ABSTAINED`, `continuationAttemptId=null`, `knowledgeId=null`; HEAD cambiado → `OBSOLETE`; la siguiente pregunta es adaptativa, sin total fijo), `ProjectRoleInsufficientDetails {requiredRole,currentRole}` (930), matriz rol→operación (968), binding exige mínimo Writer (590).

## Findings
1. (Menor, spec) `014/spec.md` sección «Alineación SMART V3» aún dice `role: ADMIN|MAINTAINER|READER` y «MAINTAINER puede vincular… publicar… experimentos». La nota inicial del mismo bloque declara que `ProjectRole` pasa a incluir WRITER y que la enmienda prevalece; `DEC-ORG-003` y los AC del WI lo aclaran. Recomendación: el Leader o analista alinea esas dos viñetas al consolidar (sin bloquear).
2. (Menor, spec) `ST-CONSOLE-015` en `tasks.md` sigue `T-BACKLOGGED`/sin marcar; el Leader debe pasarla a estado ready al abrir el WI.
3. Los tipos `outcome`, `abstention`, `scenarioKind`, `scenarioKey` están marcados «pendiente» en INTEROP-2.7 (WI-CORE-018/020); el WI solo los consume en mock. En live, el adapter debe conservar el `PendingContractError` (AC6; verificación en WI-CONSOLE-020).
4. `ActionRequiredPage` no filtra por rol y no requiere cambio de rol; solo debe mostrar la abstención por pregunta (ver cortes).

## Inventario de archivos en `app/src` (a tocar)
Rol y helper:
- `projects/types.ts:45` `ProjectRole` agregar `'WRITER'`. Crear helper único `hasRole(role, min)` con orden READER < WRITER < MAINTAINER < ADMIN (p. ej. `projects/roles.ts`, con su prueba) y exportar.
- Reemplazar `ADMIN || MAINTAINER` por `hasRole(role,'WRITER')` salvo responder preguntas (`'MAINTAINER'`):
  - `experiments/ExperimentPage.tsx:23` (crear experimento → WRITER).
  - `run-comparison/RunComparisonPage.tsx:70` y mensaje línea 152.
  - `control-plane/AnalysisRunDetailPage.tsx:51` (publicar → WRITER) y mensaje línea 86.
  - `control-plane/IntegrationsPage.tsx:34-35` (binding/pausar → WRITER; `canReactivateBinding` mantiene Admin si `REVOKED`) y mensajes líneas 189/215.
  - `projects/ProjectDetailPage.tsx:55` (`canMaintain` → WRITER; revisar si el nombre debe pasar a `canOperate`). Las líneas 67/90 son `ADMIN` puro: no tocar.
  - `action-required/FocusModePage.tsx:51` (`canAnswer` → MAINTAINER) y nota línea 136.
- `projects/ProjectsPage.tsx:284` solo muestra `workspace.role` (WorkspaceRole ADMIN|MEMBER): sin cambio.
- `control-plane/errors.ts`: mensaje amigable para `PROJECT_ROLE_INSUFFICIENT` con `requiredRole`/`currentRole` (verificar si ya existe; hoy hay entradas como `WORKSPACE_ADMIN_REQUIRED` en línea 22).
Tipos y datos de la feature:
- `action-required/types.ts`: `ScenarioKind` (según INTEROP-2.7), `FunctionalAbstentionSummary`, `FunctionalQuestionResponse.scenarioKind/scenarioKey/abstention`, `FunctionalAnswerAcceptedResponse.outcome: 'ANSWERED'|'ABSTAINED'`. Alinear comentarios de cabecera INTEROP-2.4 → 2.7.
- `action-required/queries.ts` (`useSubmitFunctionalAnswer`, líneas 44-53): usar `outcome` (ABSTAINED → invalidar igualmente, pero exponer el resultado para que la UI muestre la abstención; no limpiar como respondida). `action-required/api.ts:46` revisar el adapter live (PendingContractError).
- `action-required/FocusModePage.tsx`: para Writer/Reader no renderizar «No lo sé» ni YES/NO/DEPENDS/FREE_TEXT y mostrar la nota; con `abstention` mostrar la línea de abstención; no mostrar la tarjeta de «Contexto funcional confirmado» tras ABSTAINED; roles `status`/`alert`.
- `action-required/ActionRequiredPage.tsx`: mostrar la línea de abstención por ítem cuando `question.abstention` y el estado del Run como ACTION_REQUIRED.
- `api/mockBackend.ts`: `ProjectRole` rank con WRITER (línea 657: añadir `WRITER: 1` y renumerar); `requireProjectRole` para respuestas de preguntas (líneas 1016, MAINTAINER; ya correcto) y para publicar/experimentos/binding (líneas 786, 814, 1163, 1193, 1206, 1327: bajar a `'WRITER'` donde corresponda); UNKNOWN (≈1043-1062) devuelve `{outcome:'ABSTAINED', continuationAttemptId:null, knowledgeId:null}` sin cambiar `question.status` ni `sequence`, y actualiza `question.abstention` (count+1, `lastAt`, `lastByUserId` mock, `lastByRole` = `project.role`). Respuestas no UNKNOWN devuelven `outcome:'ANSWERED'`, incluido 409 `FUNCTIONAL_KNOWLEDGE_CONFLICT` y rama `headChanged` (OBSOLETE). Sembrar `scenarioKind`/`scenarioKey` en las preguntas del mock y añadir un seed WRITER (ver sección rutas).
Pruebas existentes afectadas:
- `action-required/FocusModePage.test.tsx:33-41` («UNKNOWN también avanza»): debe invertirse a «permanece, muestra abstención, no avanza, sin texto prohibido».
- `action-required/FocusModePage.test.tsx` (resto, flujos Sí/No y agotar preguntas): revisar que el `outcome` no rompa; `ActionRequiredPage.test.tsx` y `FunctionalKnowledge*.test.tsx` por el nuevo tipado.
- `action-required/api.test.ts`: el shape de `FunctionalAnswerAcceptedResponse` gana `outcome`.
- `experiments/ExperimentPage.test.tsx`, `run-comparison/RunComparisonPage.test.tsx`, `control-plane/AnalysisRunDetailPage*`, `IntegrationsPage.test.tsx`, `projects/ProjectDetailPage` tests (si existen): casos de rol Writer/Reader y mensajes cambiados.
- `experiments/noAutomaticVerdict.test.tsx` (WI-019): no debe romperse; no tocar.
- Nuevas: `projects/roles.test.ts` (matriz hasRole), pruebas de Focus Mode para Writer/Reader/ABSTAINED y de bandeja con abstención; 403 `PROJECT_ROLE_INSUFFICIENT` autoritativo.

## Rutas y fixtures del mock
- Modo mock: `VITE_DATA_SOURCE=mock` (o `vite dev` sin variable); banner `DEMO · DATOS SIMULADOS`. No hay selector de rol en UI (`setRole`/switch no existen): el rol es el campo `role` del Project en `seed()` de `api/mockBackend.ts:221-224`; cambiar de rol = abrir otro Project/Run.
- Projects y roles hoy: `prj_checkout_demo` (ADMIN, personal), `prj_billing_demo` (ADMIN, personal), `prj_org_orders_demo` (MAINTAINER, org `team-sandbox`), `prj_org_metrics_demo` (READER, org `observability-lab`). Falta un Project WRITER: añadir p. ej. `prj_org_writer_demo` (WRITER) con Run en `ACTION_REQUIRED`, o cambiar el seed de `orders-api` a WRITER según decida el implementer, manteniendo cobertura MAINTAINER.
- Focus Mode: `/action-required/:analysisRunId`. Action Required: `/action-required`.
- Runs con pregunta pendiente: `arun_checkout_pr42` (ADMIN, 2 preguntas; `fq_` en checkout; ideal para probar UNKNOWN→ABSTAINED), `arun_billing_pr17`, `arun_billing_pr24` (caso BEHAVIORAL_MISMATCH tras responder), `arun_checkout_pr52`, `arun_org_metrics_pr15` (READER, pregunta `fq_org_metrics_pr15_1`: Focus Mode muestra solo nota de lectura hoy).
- Para ver Reader: `/action-required/arun_org_metrics_pr15`. Writer: requiere el nuevo seed. ABSTAINED: `arun_checkout_pr42` con «No lo sé» (debe mantener la pregunta). Para ABSTAINED en bandeja, sembrar una pregunta con `abstention` precargado (`count`, `lastAt`, `lastByRole`) para mostrar la línea sin pasar por la mutación.
- Pruebas: los tests usan el mock por `VITE_DATA_SOURCE`/helpers propios (ver `renderFocusMode` en `FocusModePage.test.tsx`).

## Copy exacto (citado de contrato y criterios)
- Nota Writer/Reader en Focus Mode: «Solo un Maintainer o Admin puede responder esta pregunta funcional» (AC2; reemplaza «Tu rol es de solo lectura. Un Maintainer o Admin puede responder esta pregunta funcional.»).
- Línea de abstención: «Abstención registrada · {lastByRole} · {lastAt} · {count} abstención(es)» (AC3); sin nombre de usuario ni id (no mostrar `lastByUserId`).
- Textos prohibidos tras ABSTAINED: «resuelto», «continuando», «todas las preguntas respondidas».
- Acción oculta para Writer/Reader: botón «No lo sé» y respuestas YES/NO/DEPENDS/FREE_TEXT.
- Mensajes «Un Maintainer o Admin puede publicar» (AnalysisRunDetailPage:86), RunComparisonPage:152 («un Maintainer o Admin puede crear comparaciones») e IntegrationsPage:189/215 deben corregirse a Writer o superior; el copy exacto no está fijado en el contrato (lo propone el implementer y lo revisa ux-reviewer; p. ej. «Tu rol es de solo lectura. Un Writer, Maintainer o Admin puede publicar estas propuestas.»).
- Mock de mensaje 403 existente: «Tu rol {role} no permite esta acción; se requiere {requiredRole}.»

## Cortes propuestos
Conviene dos cortes (mismo implementer, secuenciales):
1. Corte A (rol): tipo `WRITER`, `hasRole`, reemplazo de comprobaciones y mensajes en las 6 pantallas, ranking del mock y seed Writer, pruebas de rol. Criterios 1 y parte de 2.
2. Corte B (abstención): tipos nuevos, mutación con `outcome`, mock ABSTAINED/UNKNOWN, Focus Mode (nota Writer/Reader, línea de abstención) y Action Required, pruebas y accesibilidad. Criterios 2-4.
Cierre: lint, test, build, `node harness/validate-harness.mjs`, revisión `ux-reviewer` (UI) y luego revisión humana. Cada commit con `Refs: HU07, HU08, HU14`.

## Contract impact y Contract Sync
- `contractImpact` del WI es `false` y `publishesContract` `false` (correcto): Console consume campos nuevos de INTEROP-2.7 ya adoptados en `WI-CONSOLE-011` (mirror ya copiado); no define ni publica contrato. No emite Contract Sync saliente. Si el implementer detecta discrepancia mirror↔Core, sería BLOCKED/DECISION_REQUIRED, no un cambio de contrato local.
- Clasificación de eventos para ESTE WI (ninguno trae `scopePaths`; los digests ya están en `harness/state.json` líneas 53-63):
  - `CS-20260920-003` (INTEROP-2.3, lifecycle del binding): NOT_RELEVANT para WI-013 (el WI no cambia el adapter de enable/DELETE).
  - `CS-20260921-001` (SYSTEM/INTEROP-2.4, identidad/workspaces/roles): **relevante como contexto de lectura**: define `Project.role` derivado por Core, `workspace` y `PROJECT_ROLE_INSUFFICIENT` que el WI consume; no requiere acción nueva (ya ACKNOWLEDGED y adoptado en WI-011; el rol Writer lo enmienda INTEROP-2.7). Clasificar «relevante, sin acción adicional».
  - `CS-20260921-002` (bundle A, identidad GitHub): NOT_RELEVANT.
  - `CS-20260921-003` (bundle B, workspaces/roles/acceso; HU58-HU64): NOT_RELEVANT para el código nuevo (ya implementado, solo contexto de la jerarquía previa); mismo digest que en WI-012.
  - Sugerencia: registrar la clasificación en el report de cierre con los mismos digests que `wi-console-012-contract-sync-scope-review.md`.

## Riesgos
- Writer pierde la capacidad de responder aunque antes (rol Maintainer por `write`) sí podía: cambio observable ya aprobado (DEC-ORG-003); hasta WI-CORE-019 Core sigue devolviendo MAINTAINER para `write`. Console no puede asumir ni forzar ese rol.
- Ocultar controles no es autorización: mantener el 403 como resultado autoritativo y mostrar su mensaje.
- Copy de roles en pantallas ajenas (ProjectDetail, Integrations) puede discrepar de la jerarquía; revisar en el diff.
- Reutilización de `canMaintain`/nombres: evitar dejar variables llamadas «Maintainer» que ahora permiten Writer.

## UI visible
Sí (Focus Mode, Action Required, nota de rol en cinco pantallas). Requiere `ux-reviewer` antes de la revisión humana; mocks rotulados `DEMO · DATOS SIMULADOS`; accesibilidad: foco visible, no depender solo de color, `role="status"`/`"alert"`.
