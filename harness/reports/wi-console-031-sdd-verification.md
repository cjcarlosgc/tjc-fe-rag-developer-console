# WI-CONSOLE-031 — verificación de suficiencia SDD

Modelo: sdd-analyst · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo low

**Veredicto: SUFICIENTE** (sin DECISION_REQUIRED, con tres puntos de atención en la sección 5).

## 1. Decisiones con `Blocks` que alcanzan este WI

Fuente: `spec/contracts/system-contract.md` (Console, SYSTEM-2.9) y Core `30b9acdf`.

- `DEC-VAL-002` (PROPOSED): `Blocks` = «solo el work item de código que alinee OC08 (clasificación por símbolo en `validation/analysis-run-validation-job.handler.ts` y `sandbox/map-sandbox-result.ts`); no bloquea trabajo documental ni otros work items». Es código de Core. No alcanza a WI-CONSOLE-031. Efecto: Console no la muestra como regla vigente y no cambia ningún copy ni mock por ella. El espejo trae la línea que dice «ver DEC-VAL-002 (PROPOSED)»; basta que ninguna pantalla de `app/` la cite (grep: ninguna cita).
- `DEC-FK-001` a `DEC-FK-005`: aprobadas; `Blocks: NONE` (o resueltas en WI-CORE-018/020). No bloquean. `DEC-FK-002` (UNKNOWN = abstención) ya está implementada en Console.
- Otras con `Blocks` no vacío (`DEC-VAL-001` ingestión/despliegue empresarial, la de GCE/despliegue, etc.): no alcanzan una sincronización documental ni un manejo de 404.
- Resultado: `decisionGate.blockingDecisionIds: []` es correcto. Nota: `nonBlockingDecisionIds` está vacío aunque conviene listar `DEC-VAL-002` ahí; la nota ya lo explica, sin impacto bloqueante.

## 2. Evento `CS-CORE-20261012-005`

Fuente: WI-CORE-045, INTEROP-2.9, `targets: [console]`, `breaking: false`, `sourceRevision: 30b9acdf…`, `status: C-PENDING`.

`requiredAction` exige:
1. Espejar INTEROP-2.9 y el texto de SYSTEM byte por byte, sin cambio de DTO.
2. Tratar `404 FUNCTIONAL_QUESTION_NOT_FOUND` al enviar una respuesta como pregunta obsoleta y refrescar el inbox.
3. No asumir que `continuationAttemptId` no nulo es consultable.
4. No mostrar `DEC-VAL-002` como regla vigente.

No exige: cambio de DTO, rutas, enums ni códigos nuevos en Console; live; nuevas pantallas; tocar `functionalBehaviorValidated`/`resultSummary` de OC11 (solo se espeja el texto; Console ya muestra lo que llega). Es aditivo y aclaratorio (Core ya emitía ese 404).

Nota de contenido (Core §6.11 `POST …/answers`): el orden de errores es Run no visible → `404 ANALYSIS_RUN_NOT_FOUND`; pregunta inexistente/otra/no accionable → `404 FUNCTIONAL_QUESTION_NOT_FOUND`; rol menor que Maintainer → `403`. Un Reader/Writer que responde tarde recibe 404, no 403.

## 3. Comportamiento actual de Console

`ApiError` (`app/src/api/client.ts:1-11`) expone `status`, `correlationId`, `code`, `details`. Basta `error.status === 404 && error.code === 'FUNCTIONAL_QUESTION_NOT_FOUND'`, sin cambio de cliente.

Envío de respuesta:
- `app/src/action-required/api.ts:47-57` (`submitFunctionalAnswer`) hace `apiRequest` POST; cualquier 404 llega como `ApiError`; no hay tratamiento específico.
- `app/src/action-required/queries.ts:49-62` (`useSubmitFunctionalAnswer`): solo `onSuccess` invalida `questionSet` y `['action-required','list']`. No hay `onError`; un 404 no refresca la pregunta ni el inbox.
- `app/src/action-required/FocusModePage.tsx:60-73` y `75-87`: `onError` solo devuelve el foco (`cardRef.current?.focus()`). Línea 150 muestra `bindingErrorMessage(submitAnswer.error)` + Correlation ID. Línea 56 solo distingue `FUNCTIONAL_KNOWLEDGE_CONFLICT`.
- `app/src/control-plane/errors.ts` (`codeMessages`, `bindingErrorMessage`): no contiene `FUNCTIONAL_QUESTION_NOT_FOUND`; un 404 genérico cae al mensaje por defecto del error. El texto «Esta pregunta ya no aplica» **no existe en ningún sitio** (grep en `app/src` y `spec`: 0 resultados; solo existe un «ya no aplica» no relacionado en `control-plane/IntegrationsPage.tsx:97`).
- `app/src/action-required/ActionRequiredPage.tsx` (inbox, 59 líneas): sin cambios necesarios; se refresca por invalidación de la query `['action-required','list']`.
- `FocusModePage.tsx:100-109`: si tras refrescar ya no hay `currentQuestion`, muestra «Sin preguntas pendientes en este Run … puede que el HEAD haya cambiado». Es coherente con el estado obsoleto.

Mock (`app/src/api/mockBackend.ts`):
- `:1649` pregunta inexistente → `404 QUESTION_NOT_FOUND` (código no contractual).
- `:1650` pregunta no `PENDING` → `409 QUESTION_NOT_PENDING` (código no contractual; debería ser `404 FUNCTIONAL_QUESTION_NOT_FOUND`, que es lo que emite Core).
- `:1652-1658` `headChanged`: marca la pregunta `OBSOLETE` y devuelve `202` con `continuationAttemptId: null`; comentario ya «PROVISIONAL». Core real: en ese caso la respuesta tardía recibe 404 si la pregunta ya era no accionable al llegar. El mock mantiene el 202 (no definido por §6.11 según su comentario); no es obligatorio cambiarlo, pero el caso «responder una pregunta ya obsoleta» necesita un camino en el mock que produzca el 404.

Usos de `continuationAttemptId`:
- `types.ts:77-79` (DTO, `string | null`, comentario INTEROP-2.7) — correcto.
- Solo se lee en tests (`api.test.ts:31,42,72,141`) y en el mock. Ningún componente de producto lo lee, lo muestra ni lo consulta. Cumple «no asumir consultable» por construcción. Falta únicamente actualizar el comentario de `types.ts:77` para fijar INTEROP-2.9 (opaco, no consultable, `null` también tras `ANSWERED` si el Run sigue en `ACTION_REQUIRED`), y opcionalmente un test que lo congele.
- Atención: `FocusModePage.tsx:67,81` trata `outcome !== 'ABSTAINED'` como «respondido» y limpia el texto; con `ANSWERED` y `continuationAttemptId: null` la pregunta siguiente llega por refresco. Sin cambio.

¿Ya cumple? Parcialmente: lo del `continuationAttemptId` y `DEC-VAL-002` sí; el 404 obsoleto **no** (sin copy, sin refresco en error, mock con códigos no contractuales).

¿Requiere cambio de DTO/ruta? **No.** El 404 es un `ApiError` ya soportado; el cambio es de presentación e invalidación de queries dentro de lo existente. No hay `DECISION_REQUIRED`.

Qué falta (mínimo):
1. `errors.ts`: mapear `FUNCTIONAL_QUESTION_NOT_FOUND` → «Esta pregunta ya no aplica…» (o helper `isFunctionalQuestionObsolete(error)` junto a `isLlmProviderUnavailable`).
2. `queries.ts`/`FocusModePage.tsx`: en `onError`, si es ese 404, invalidar `questionSet(analysisRunId)` y `['action-required','list']`, limpiar `pendingAnswer`, y mostrar el aviso como estado no destructivo (no como error genérico con «Reintentar» que reenvíe la misma pregunta). No ofrecer reintentar la misma `questionId`.
3. `mockBackend.ts:1649-1650`: alinear a `404 FUNCTIONAL_QUESTION_NOT_FOUND` para pregunta inexistente/no accionable (conservar `ANALYSIS_RUN_NOT_FOUND` en `:1646`).
4. Comentario de `types.ts:77`.
5. Pruebas (ver sección 5).

Spec a enmendar mínimamente: ninguna spec de Console describe el 404 obsoleto hoy (grep de `FUNCTIONAL_QUESTION_NOT_FOUND` en `spec/`: solo la fila de `tasks.md:22`). La fuente normativa será el espejo INTEROP-2.9 §6.11. La enmienda propia: (a) `spec/features/013-pr-driven-control-plane/tasks.md` (casilla ST-CONSOLE-033 y evidencia) y (b) si se quiere dejar el comportamiento UI escrito, una línea en la spec funcional de Action Required (HU37/Focus Mode) de la feature que la describa; la 013 no lo hace (sus OC no incluyen el 404). Recomendación: no abrir enmienda funcional nueva; basta tasks.md + `CHANGELOG.md`, porque el copy y el refresco derivan literalmente del `requiredAction` del evento y del contrato espejado.

## 4. Referencias de versión INTEROP-2.8

Vigentes (actualizar a INTEROP-2.9):
- `spec/README.md:10` — «copia espejo byte por byte `INTEROP-2.8`».
- `spec/constitution/architecture.md:3` — `SYSTEM-2.9 / INTEROP-2.8 / GH-INTEROP-1.7`.
- `spec/features/013-pr-driven-control-plane/plan.md:5` y `spec.md:5` y `spec.md:41` — `SYSTEM-2.9/INTEROP-2.8/GH-INTEROP-1.7` / `SYSTEM-2.9, INTEROP-2.8 y GH-INTEROP-1.7`.
- `spec/contracts/interoperability-contract.md:3` (`**Versión:** INTEROP-2.8`, más «Compatible con» y «Fecha de corte») — se reemplaza entero por el espejo.
- `spec/contracts/system-contract.md` — el texto cambia con el espejo (línea 68 cita «INTEROP-2.8 §6.13 y §6.14»; la versión SYSTEM ya es 2.9, verificar si Core `30b9acdf` la mantiene).

Código `app/`: `app/src` no referencia `INTEROP-2.8`, `SYSTEM-2.9` ni la versión actual (grep: 0). Sin cambios de versión en producto. `package.json` solo contiene versiones de paquetes (`5.102.8`, `19.2.8`), no relacionadas.

Históricas, no tocar: `CHANGELOG.md`, `harness/reports/**`, `harness/contract-sync/**`, `spec/features/013…/tasks.md:16,18` (ST-CONSOLE-026/027 ya cerradas, describen SYSTEM-2.8/2.9/INTEROP-2.8 en su momento), comentarios `INTEROP-2.x §6.x` de `app/src` (citan la versión que definió cada regla).

Precedente WI-CONSOLE-025 (commit `90d491e`, 20 archivos): tocó `spec/README.md` (SYSTEM-2.8→2.9), `spec/constitution/architecture.md`, `spec/features/013…/plan.md`, `spec.md`, `tasks.md` (casilla + ST-CONSOLE-027 T-DONE), los dos contratos, `CHANGELOG.md`, `harness/state.json`, `harness/work-items.json`, reportes de cierre/revisión/contract-review e inbox de eventos. Cero cambios en `app/`. Este WI sigue el mismo patrón más el corte de producto de la sección 3.

## 5. Riesgos, archivos y pruebas

Riesgos:
- Espejo: usar `git show 30b9acdf:spec/contracts/{interoperability,system}-contract.md` y verificar SHA-256; el working tree de Core puede estar adelantado (`CS-CORE-20261012-006` es de github-integration, no se espeja aquí).
- Mock: cambiar `QUESTION_NOT_PENDING` 409→404 puede romper tests existentes que dependan del código previo (buscar en `*.test.ts*` antes de editar; grep inicial no encontró `QUESTION_NOT_PENDING` en tests).
- UX: el aviso del 404 no debe parecer error del usuario ni ofrecer reintento de la misma pregunta; requiere revisión `ux-reviewer` (cambio visible de UI). Rol insuficiente + pregunta obsoleta ahora devuelve 404 (no 403): no mostrar «solo Maintainer» para ese caso.
- `DEC-VAL-002`: no citarla en copy; el aviso de sincronización no debe presentar la regla PROPOSED como vigente.
- Cierre del evento: `-005` solo pasa a resuelto con evidencia (tests, gates y revisión); `-006` queda C-PENDING (github-integration).

Archivos esperados:
- Contratos y SDD: `spec/contracts/interoperability-contract.md`, `spec/contracts/system-contract.md` (espejo), `spec/README.md`, `spec/constitution/architecture.md`, `spec/features/013-pr-driven-control-plane/{plan,spec,tasks}.md`, `CHANGELOG.md`.
- Producto: `app/src/control-plane/errors.ts` (mensaje/helper), `app/src/action-required/queries.ts` y/o `FocusModePage.tsx` (invalidación y aviso), `app/src/api/mockBackend.ts:1649-1650`, `app/src/action-required/types.ts:77` (comentario).
- Harness: `harness/work-items.json`, `harness/state.json`, `harness/contract-sync/inbox/CS-CORE-20261012-005.yaml` (acuse), reportes del WI.

Pruebas a añadir:
- `action-required/api.test.ts`: `submitFunctionalAnswer` live con respuesta `404 {code:'FUNCTIONAL_QUESTION_NOT_FOUND'}` → `ApiError` con `status 404` y `code`; mock: pregunta ya `ANSWERED`/`OBSOLETE` → mismo código.
- `action-required/FocusModePage.test.tsx`: 404 al responder muestra «Esta pregunta ya no aplica», no muestra el mensaje genérico ni «Correlation ID» como error de usuario, refetch de `context-questions` y del inbox (`/action-required`), y no deja botones reenviando la misma pregunta; un 404 `ANALYSIS_RUN_NOT_FOUND` conserva su mensaje actual; `403 PROJECT_ROLE_INSUFFICIENT` sin cambio.
- `ActionRequiredPage.test.tsx`: tras invalidación, la pregunta obsoleta desaparece del listado.
- `errors.test` (si existe) o test del helper: mapeo del código.
- Test de regresión de `continuationAttemptId` no nulo: no se renderiza ni se usa en ninguna ruta/consulta (p. ej. la UI no emite requests distintas a `context-questions` y `action-required` tras `202`).
- Gates: lint, `tsc -b --noEmit`, vitest, build, `node harness/validate-harness.mjs` y validador SDD.
