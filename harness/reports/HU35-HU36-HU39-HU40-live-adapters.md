# HU35/HU36/HU39/HU40 — Adapters live activados contra Core real

**Estado:** DONE
**Repository:** `tjc-fe-rag-developer-console`

## Contexto

Tras cerrar HU30 en vivo (login GitHub real, discovery, binding), Core
mandó un handoff cross-repo confirmando que HU35/36 (Functional Knowledge/
Action Required), HU39 (Checks — sin API nueva del lado Console, Core
publica el Check directamente en GitHub) y HU40 (companion PR) quedaron
implementados y desplegados (SYSTEM-2.2/INTEROP-2.2 §6.11-§6.12).

Antes de tocar código se verificó DTO por DTO leyendo el código fuente real
de `tjc-be-rag-core-api` (controllers, DTOs, servicios) y se confirmó que
coincide exacto con lo que Console ya tenía mockeado — mismo patrón que se
usó para verificar HU30. Se confirmó además con Core que el `details_url`
que arma para el Check nativo (`/projects/{projectId}/runs/{analysisRunId}`)
ya coincide con la ruta real del router de Console, sin ajustes de ningún
lado.

## Cambios

- **`action-required/api.ts`**: `listActionRequired`, `getContextQuestionSet`,
  `submitFunctionalAnswer`, `listFunctionalKnowledge` dejan de rechazar con
  `PendingContractError` y llaman a `apiRequest` real contra las rutas
  exactas de INTEROP-2.2 §6.11. `submitFunctionalAnswer` omite la clave
  `answer` cuando es `null` — el DTO real de Core (`SubmitFunctionalAnswerRequestDto`)
  la declara `@IsOptional()` sin aceptar `null` explícito. Un
  `409 FUNCTIONAL_KNOWLEDGE_CONFLICT` sigue llegando como `ApiError` con
  `details: FunctionalKnowledgeConflictResponse` — `FocusModePage` ya lo
  consumía así, sin cambios ahí.
- **`control-plane/api.ts`**: `listTestProposals`, `createTestPublication`,
  `getTestPublication` activados de la misma forma.
- **Tests**: se reescribieron los describe "live" de ambos dominios con
  `fetch` mockeado (URL/método/headers/body exactos), reemplazando los tests
  que asumían `PendingContractError`.

## Bug de regresión encontrado y corregido durante la verificación

Al correr la suite completa, `ProjectsPage.test.tsx` empezó a fallar
(`Cannot read properties of undefined (reading 'qualifiedName')` dentro de
`ActionRequiredPreview`). Causa: dos tests de ese archivo mockeaban `fetch`
sin discriminar por URL (`mockResolvedValue`/`mockImplementation` genérico
para cualquier llamada). Antes, `listActionRequired` en modo live rechazaba
sincrónicamente con `PendingContractError` sin llegar a `fetch`, así que
`ProjectsPage` (que también renderiza `ActionRequiredPreview` vía
`useActionRequiredList`) nunca disparaba esa petición en esos tests. Al
activar el adapter real, la petición a `/action-required` sí se dispara y
recibía la forma de `Page<Project>` (la que el mock genérico devolvía para
cualquier URL) en vez de `Page<FunctionalQuestionResponse>` —
`ActionRequiredPreview` intentaba leer `question.target.qualifiedName`
sobre un objeto `Project` sin esa forma, y como es un error de render sin
error boundary, tumbaba el árbol entero. Corregido devolviendo una página
`{items: [], nextCursor: null}` para URLs que incluyen `/action-required` en
esos dos mocks.

## Verificación

`tsc -b --noEmit`/lint/build limpios. 312 pruebas en verde (+8 sobre las
309 previas a este corte, incluida la regresión corregida).

En vivo contra Render+Supabase+GitHub reales: se abrió un PR real
(`cjcarlosgc/tjc-fe-ts-repo-test#1`) hacia la rama vinculada `development`.
El webhook de Core (HU31, ya implementado, no documentado antes en
`tasks.md`) creó un `AnalysisRun` real, visible en la Console
(`Runs` del proyecto y su detalle) mostrando símbolos reales detectados
del repo real (bootstrap, primer análisis del proyecto). Durante la prueba
se encontró y corrigió del lado de Core (no de Console, reportado como
hallazgo cruzado) un `GITHUB_APP_WEBHOOK_SECRET` desincronizado entre GitHub
y Render que causaba `401 INVALID_WEBHOOK_SIGNATURE` en la primera entrega;
tras regenerar el secreto en ambos lados y hacer "Redeliver", el webhook se
procesó con éxito.

El Run quedó en `PROCESSING` real (análisis LLM en curso) al cierre de esta
sesión — pendiente de confirmar visualmente Action Required/companion PR
end-to-end una vez termine, porque la extensión Claude in Chrome se
desconectó (mismo problema intermitente ya documentado en sesiones
anteriores).

## Fuera de alcance / pendiente

- No se probó todavía el flujo completo de responder una pregunta funcional
  en vivo (depende de que el Run real llegue a `ACTION_REQUIRED`), ni la
  publicación de un companion PR real (depende de que llegue a `SUCCESS`
  con propuestas `AVAILABLE`). Ninguno de estos 4 flujos tenía smoke test
  end-to-end real del lado de Core tampoco, según su propio handoff — esta
  sería la primera validación de punta a punta para ambos repos.
- HU44/45 (retiro legacy, colaboración) sigue como la única tarea
  genuinamente pendiente del lado de Console, sin bloqueo de Core.
