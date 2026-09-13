# HU37 + HU38 — Focus Mode y bandeja Action Required

**Estado:** DONE
**Repository:** `tjc-fe-rag-developer-console`
**Story IDs:** HU37, HU38 (feature `013-pr-driven-control-plane`)
**Contrato:** SYSTEM-2.0 / INTEROP-2.0 §6.11 (Action Required y Functional Knowledge)

## Contexto

`T-001-sdd-2-baseline` (commit `766cd6f`) fue un re-baseline documental de SDD 2.0 que
explícitamente no autorizó implementación automática. El usuario confirmó el alcance a
implementar en este repo: HU37 (Focus Mode) + HU38 (bandeja Action Required), el
incremento recomendado por `spec/backlog-migration-sdd-2.0.md` para Developer Console.
`T-001-sdd-2-baseline` cierra `DONE` como bookkeeping (doc-only, `app/` no cambió con ese
commit); este reporte cubre el work item nuevo abierto para HU37/HU38.

## Alcance implementado

- **Dominio nuevo** `app/src/action-required/` (`types.ts`, `api.ts`, `queries.ts`):
  tipos fieles a INTEROP-2.0 §6.11 (`FunctionalQuestionResponse`,
  `FunctionalQuestionSetResponse`, `VisualAidResponse`, `SubmitFunctionalAnswerRequest`,
  `FunctionalAnswerAcceptedResponse`). No requirió modelar Project/Run/PR nuevo
  (HU30/HU32, Core-side, fuera de alcance): el propio `FunctionalQuestionResponse` trae
  denormalizado `repositoryName`/`pullRequestNumber`/`headSha`/`target`.
- **Mock-first**: fixtures nuevas en `app/src/api/mockBackend.ts` (`seedActionRequired`,
  `mockListActionRequired`, `mockGetContextQuestionSet`, `mockSubmitFunctionalAnswer`),
  con dos Runs demo:
  - `arun_checkout_pr42` (acme/checkout-service PR#42): dos preguntas adaptativas
    encadenadas (`CouponPolicy.apply`, `OrderService.calculateTotal`), cubre el
    escenario **action required** normal y la respuesta **`UNKNOWN`/"No lo sé"** (no
    crea `knowledgeId` pero sí continúa el Run).
  - `arun_billing_pr17` (acme/billing-engine PR#17): una pregunta sobre
    `DiscountEngine.applyDiscount`; `headChanged: true` simula que llegó un HEAD nuevo
    mientras se respondía — cubre el escenario **corrección/nuevo HEAD**: la pregunta
    queda `OBSOLETE` (no `ANSWERED`) y el Run no se reanuda (`continuationAttemptId:
    null`).
  - Adapters `live` lanzan `PendingContractError` (mismo patrón que `context-explorer/
    api.ts` y `artifacts/api.ts`) — Core todavía no publica estas rutas.
- **Páginas**: `ActionRequiredPage.tsx` (bandeja, una entrada por Run con pregunta
  vigente) y `FocusModePage.tsx` (página dedicada, no modal, ruta
  `/action-required/:analysisRunId`) con botones `Sí/No/Depende/No lo sé` +
  aclaración de texto libre opcional (`FREE_TEXT`), render de `visualAid` por `kind`, y
  estado de cierre distinto para "contexto confirmado" vs. "sin pregunta vigente"
  (cubre el caso de Run obsoleto sin sobre-prometer conocimiento no confirmado por el
  DTO).
- **Deep-link `returnTo` (HU38)**: `RequireAuth.tsx` ahora codifica la ruta de origen
  también en `?returnTo=` (antes solo `state.from` de React Router, que no sobrevive una
  recarga completa); `LoginPage.tsx` lo lee y navega ahí tras `signIn`, validando que sea
  una ruta interna (`safeReturnTo`, rechaza `//` y URLs absolutas) para evitar
  open-redirect.
- **Router y nav**: rutas `/action-required` y `/action-required/:analysisRunId` en
  `router.tsx`; link "Action Required" en la topbar de `AppShell.tsx`.
- **Estilos**: clases nuevas en `app/src/styles.css` (`.topbar-nav`, `.action-required-*`,
  `.focus-mode-card`, `.visual-aid*`, `.answer-choices`, `.field textarea`) reutilizando
  tokens Black Glass existentes (`--surface-1`, `--border-subtle`, `--accent`,
  `.demo-stamp`).

## Fuera de alcance (explícito, no implementado)

- Adapters live / GitHub real (HU30, HU31 Core-side).
- HU35/HU36 (persistencia de Functional Knowledge, continuación real del Run) —
  simulados en memoria del mock, no como dominio propio del frontend.
- HU39/HU40 (Checks, companion PR, publicación) y HU44/HU45 (retiro legacy,
  colaboración multiusuario).
- Cobertura completa de los nueve escenarios mock-first de la spec de la feature 013 —
  varios requieren pantallas de Run/Checks que no existen todavía (cortes 3-4 del
  `plan.md` de la feature). Esta entrega cubre los dos escenarios directamente
  relevantes a Focus Mode/Action Required: action required normal y
  corrección/HEAD nuevo.

## Verificación

- `npx tsc --noEmit`: sin errores.
- `pnpm run lint`: sin errores (el repo usa `pnpm`, no `npm`, pese a que ambos
  lockfiles coexisten — `npm run build` falla por resolución de `@tsparticles/engine`
  no hoisteado bajo `npm`, un problema de instalación preexistente y no relacionado con
  este work item; `pnpm run build`/`lint`/`test` sí funcionan limpio).
- `pnpm test -- --run`: **162 pruebas pasan** (antes: 143; +19 nuevas: `action-required/
  api.test.ts` con casos mock y live, `ActionRequiredPage.test.tsx`,
  `FocusModePage.test.tsx`, y ampliaciones a `RequireAuth.test.tsx`/`LoginPage.test.tsx`
  para `returnTo`).
- `pnpm run build`: build de producción limpio.
- Recorrido manual en navegador (Claude in Chrome) contra `pnpm run dev`: deep-link sin
  sesión a `/action-required/arun_checkout_pr42` → redirige a
  `/login?returnTo=%2Faction-required%2Farun_checkout_pr42` → tras autenticar vuelve
  exactamente ahí → responde ambas preguntas (una con "No lo sé") → pantalla de
  "Contexto funcional confirmado" → "Volver" regresa a la bandeja, que ya no lista ese
  Run → abre el Run de billing (`SYMBOL_RELATION` renderizado) → responde → pantalla de
  "Sin preguntas pendientes en este Run" (headChanged, no reanuda). Sin errores de
  consola.
- Gate de diseño (`stitch` MCP, proyecto `11524813659221805644`): `list_screens` no
  tiene ninguna pantalla para "Focus Mode" ni "Action Required" (EP12 es una épica
  nueva sin referencia visual en Stitch todavía) — sí existen para HU30/GitHub
  ("Seleccionar repositorio GitHub", "Crear Pull Request"), fuera de este alcance. Se
  aplicaron los tokens Black Glass vigentes (colores, tipografía JetBrains Mono para
  metadatos, `.demo-stamp`) sin una comparación 1:1 contra un mock de Stitch, documentado
  aquí como excepción justificada del gate de `harness/roles/design-reviewer.md`.

## Nota de proceso (2026-09-13)

El usuario pidió codificar en la SDD que el agente commitea por cada corte lógico
verificable sin pedir permiso commit a commit, pero nunca hace `push` sin solicitud
humana explícita en la sesión. Actualizado en `harness/WORKFLOW.md` (paso 6 de "Commits
y cierre de sprint") y `spec/constitution/delivery-workflow.md` ("Puerta de push").
