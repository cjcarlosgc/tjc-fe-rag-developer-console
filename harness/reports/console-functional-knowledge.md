# Functional Knowledge (HU35/HU36 Console-side)

**Estado:** DONE
**Repository:** `tjc-fe-rag-developer-console`
**Story IDs:** HU35, HU36 (feature `013-pr-driven-control-plane`)
**Contrato:** SYSTEM-2.0 / INTEROP-2.0 §6.11

## Contexto

Mayor gap identificado en el inventario handoff-vs-implementado (turno anterior):
INTEROP-2.0 §6.11 ya define `FunctionalKnowledgeResponse` y
`GET /projects/{projectId}/functional-knowledge`, pero nunca se había implementado
en el frontend. El handoff la pide como pantalla propia ("Functional Knowledge",
pantalla 6). El usuario pidió explícitamente continuar con este corte.

## Alcance implementado

- **Tipos** en `action-required/types.ts` (misma sección del contrato que Action
  Required): `FunctionalKnowledgeSource`, `FunctionalKnowledgeStatus`,
  `FunctionalKnowledgeResponse`, `FunctionalKnowledgeListPage` — copiados
  literalmente de INTEROP-2.0 §6.11, reutilizando el `FunctionalScope` ya existente
  desde HU37/38. **No se agregó ningún campo fuera del contrato** — en particular,
  "Runs that used this rule" que pide el handoff no está en
  `FunctionalKnowledgeResponse` y se omitió deliberadamente en vez de inventarlo.
- **`api.ts`/`queries.ts`**: `listFunctionalKnowledge(projectId, status?)` /
  `useFunctionalKnowledge`, rama live con `PendingContractError` (mismo patrón que
  el resto del módulo).
- **Mock**: 4 fixtures sobre los dos proyectos demo, narrativamente conectadas a lo
  ya construido — `fk_coupon_expiry` y `fk_discount_engine` (ACTIVE, una por
  proyecto; esta última es la regla que en la narrativa permitió el `SUCCESS` de
  `arun_billing_pr17_2`), y un par `fk_rounding_v1`/`fk_rounding_v2` sobre
  `OrderService.calculateTotal` (SUPERSEDED → ACTIVE vía `supersedesId`) que
  demuestra el escenario de supersesión del handoff (§37) con datos coherentes con
  PR #45.
- **Páginas**: `FunctionalKnowledgePage` (`/projects/:id/functional-knowledge`,
  lista con badge `ACTIVE`/`SUPERSEDED` y filtro por estado, mismo patrón visual de
  `.segmented`/`.list-toolbar` que `RunHistoryPage`) y
  `FunctionalKnowledgeDetailPage` (`/projects/:id/functional-knowledge/:knowledgeId`,
  regla normalizada, pregunta/respuesta originales, scope, target, fuente, creado, y
  trazabilidad bidireccional de supersesión — "reemplaza a" / "reemplazada por" —
  resuelta contra la misma lista del proyecto, sin necesitar un endpoint nuevo).
- **`ProjectDetailPage.tsx`**: nuevo link "Functional Knowledge →" en el panel de
  repository binding, junto a "Ver Runs"/"Gestionar integración" (solo visible
  cuando el proyecto tiene binding, igual criterio que esos otros dos).

## Fuera de alcance (explícito, documentado en el plan aprobado)

- Detección de conflicto en vivo durante Focus Mode (§39 del handoff) — requeriría
  que Core exponga esa señal; no existe en INTEROP-2.0 todavía.
- "Runs that used this rule" — no es parte del contrato ratificado.
- Sub-nav por proyecto con tabs — el link vive como acción en `ProjectDetailPage`,
  no como tab de un shell nuevo.

## Verificación

- `npx tsc --noEmit`, `pnpm run lint`, `pnpm test -- --run` (**200 pruebas**, +9
  desde el cierre del corte anterior: `action-required/api.test.ts` ampliado,
  `FunctionalKnowledgePage.test.tsx`, `FunctionalKnowledgeDetailPage.test.tsx`,
  `ProjectDetailPage.test.tsx` ampliado) y `pnpm run build` — todo en verde.
- **Recorrido manual en navegador no se pudo confirmar en esta sesión** — la
  extensión Claude in Chrome se desconectó (3 intentos fallidos de
  `tabs_context_mcp`). Mismo bloqueo ya documentado en un corte anterior de este
  repo (`sprint3-history-realtime-retry`). No bloquea el cierre porque tsc/lint/
  test/build cubren la lógica; queda pendiente una verificación visual manual.

## Commits de este corte

`537ad17` (apertura), `23d8213` (tipos/mocks/API), `3f3e7e7` (páginas + link), y
este mismo commit de cierre. Ninguno pusheado.
