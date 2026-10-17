# WI-CONSOLE-015 — Implementación (corte único)

Modelo: implementer · configurado claude-haiku-5-5 · atendido claude-haiku-5-5 · esfuerzo low

Work item: WI-CONSOLE-015 «Procedencia de Functional Knowledge y varias reglas ACTIVE» (ST-CONSOLE-017, HU07/HU09).
Fuentes: `harness/reports/wi-console-015-sdd-verification.md`, AC de `harness/work-items.json`, `spec/contracts/interoperability-contract.md` INTEROP-2.7 §6.11.

Estado: implementado en el árbol de trabajo. Sin commit, sin push, sin cambios en `harness/state.json`, `harness/work-items.json` ni `spec/`. Pendiente: revisión ux-reviewer (UI) y revisión humana.

## Decisiones aplicadas

1. Adapter live: `listFunctionalKnowledge` responde `PendingContractError` (sin llamar a Core), con prueba en `api.test.ts`. Nota: `api.ts` no tiene `getFunctionalKnowledge`; el detalle reutiliza la lista, así que no se añadió ninguna función nueva.
2. `ruleUsage` (HU52, `action-required/speculative/ruleUsage.ts`) no se tocó. Su panel «Runs que usaron esta regla» se conserva con sello PROPUESTA.
3. Etiquetas en español centralizadas en `action-required/knowledgeScenarios.ts` (Resultado esperado, Borde, Excepción, Transición de estado, Efecto observable, Precondición funcional; desconocido a «Otros»; «sin procedencia registrada» para campos null).
4. Retirada la procedencia especulativa: `context-explorer/speculative/contextProvenance.ts` y su test, `mockGetContextProvenance`, el import de tipo en `mockBackend.ts`, el query y el bloque «Qué más alimentó este contexto» (incluido «Test existente») de `AnalysisRunDetailPage.tsx`, y la clase `.context-provenance` huérfana. Se conserva `.context-provenance-list` porque la usa el panel de ruleUsage.
5. Los mocks conservan los ids y targets usados por FocusMode (`fk_shipping_zone` para el 409), por `control-plane/api.test.ts` (`fk_coupon_expiry`, `fk_discount_engine`) y por el resto de pruebas.

## Archivos tocados

- `app/src/action-required/types.ts`: `FunctionalKnowledgeResponse` con `scenarioKind`, `scenarioKey`, `confirmedByUserId`, `confirmedRole`, `originHeadSha`, `sourceRef` (INTEROP-2.7 §6.11).
- `app/src/action-required/knowledgeScenarios.ts` (nuevo): orden de escenarios, etiquetas, `groupByScenarioKind`, `shortSha`, `supersessionChain` (sin ciclos ni ids ausentes), `scenarioLabel`, `confirmingRoleLabel`.
- `app/src/action-required/knowledgeScenarios.test.ts` (nuevo).
- `app/src/action-required/api.ts`: live → `PendingContractError`.
- `app/src/action-required/FunctionalKnowledgePage.tsx`: grupos por escenario (h2 por grupo), filtro conservado, varias ACTIVE por target.
- `app/src/action-required/FunctionalKnowledgeDetailPage.tsx`: bloque Procedencia, cadena de reemplazo completa (`ol`, `aria-current="step"`), panel ruleUsage intacto.
- `app/src/action-required/FunctionalKnowledgePage.test.tsx`, `FunctionalKnowledgeDetailPage.test.tsx`, `api.test.ts`: reescritos o actualizados con conteos literales.
- `app/src/api/mockBackend.ts`: semilla nueva (ver abajo) y SUPERSEDE con campos nuevos; sin `mockGetContextProvenance`.
- `app/src/control-plane/AnalysisRunDetailPage.tsx` y `.test.tsx`: bloque retirado, prueba de ausencia.
- `app/src/styles.css`: se elimina `.context-provenance`; se añaden `.fk-*` al final del bloque de action-required.
- Eliminados: `app/src/context-explorer/speculative/contextProvenance.ts` y `contextProvenance.test.ts` (la carpeta `speculative` queda vacía y se borra).

## Semilla mock (DEMO · DATOS SIMULADOS)

- `prj_checkout_demo`: 7 reglas. ACTIVE (5): `fk_coupon_expiry` (CouponPolicy.apply, EXCEPTION), `fk_shipping_zone` (ShippingAddressValidator.validate, EXPECTED_RESULT), `fk_rounding_v2` (OrderService.calculateTotal, BOUNDARY), `fk_total_empty_cart` (OrderService.calculateTotal, EXPECTED_RESULT), `fk_import_tax` (TaxCalculator.rate, FUNCTIONAL_PRECONDITION, APPROVED_IMPORT con `sourceRef` `docs/reglas-negocio.md#L12`). SUPERSEDED (2): `fk_rounding_v1` y `fk_rounding_v0`, cadena v0 → v1 → v2, con campos de procedencia null.
- `prj_billing_demo`: `fk_discount_engine` ACTIVE (BOUNDARY).
- `prj_org_orders_demo` (MAINTAINER), `prj_org_writer_demo` (WRITER), `prj_org_metrics_demo` (READER): una ACTIVE cada uno.

## Comandos y resultados (en `app/`)

- `npm run lint`: sin errores.
- `npx vitest run --maxWorkers=2`: última corrida completa 57/57 archivos y 503/503 pruebas en verde.
- `npm run build`: OK (solo la advertencia habitual de chunk > 500 kB).
- Incidencia: en dos corridas completas en paralelo fallaron pruebas por timeout bajo carga (`HU39/HU40 … companion PR`, 5 s, y `context-explorer … seleccionar un candidato`, 1 s de waitFor). Ambas pasan aisladas (`npx vitest run <archivo>`). No están en el alcance de este corte. Se reporta como flaky por carga.
- Grep: `contextProvenance`, `getContextProvenance`, `ContextProvenance` y `context-provenance` (sin `-list`) dan 0 en `app/src`, salvo la prueba negativa de AnalysisRunDetailPage que afirma que el bloque ya no aparece.

## Colores computados (navegador, modo mock)

Medido con `getComputedStyle` en `prj_checkout_demo`:

- `.fk-group > h2`, `.fk-group-count`, `.fk-chain li`, `.fk-missing`, `.fk-chain-note`: `rgb(234, 231, 247)` (#eae7f7). Contraste sobre #0b0b0d: 16.17:1.
- `.fk-card-meta` (texto de la clave de escenario en la tarjeta): `rgb(188, 186, 201)` (#bcbac9, `--muted`). Lo sobrescribe `.action-required-item p` por especificidad. Contraste: 10.31:1, cumple AA. Se deja así y no es un color prohibido.
- Ningún texto informativo nuevo usa `--text-dim`.

## Cómo ver cada estado en el mock

Arrancar: `.claude/launch.json` → `console-mock` (`VITE_DATA_SOURCE=mock VITE_AUTH_MODE=mock npm --prefix app run dev -- --port 5173`). Rutas:

- Lista con agrupación: `/projects/prj_checkout_demo/functional-knowledge` (grupos Resultado esperado 2, Borde 3, Excepción 1, Precondición funcional 1; Transición de estado y Efecto observable no aparecen).
- Filtro Active: botón «Active» (5 tarjetas, sin SUPERSEDED). Filtro Superseded: botón «Superseded» (solo grupo Borde, 2 tarjetas).
- Vacío: `/projects/prj_org_orders_demo/functional-knowledge` y botón «Superseded» → «Sin reglas».
- Error: `/projects/prj_no_existe/functional-knowledge` → bloque role="alert" con «Reintentar».
- Carga: al entrar, role="status" «Cargando reglas…».
- Detalle con procedencia completa: `/projects/prj_checkout_demo/functional-knowledge/fk_coupon_expiry` (usr_demo_admin, Admin, sha a1b2c3d con title completo, sin cadena).
- Importación con sourceRef: `/…/fk_import_tax` (fila «Referencia de importación» y «sin procedencia registrada» en el commit).
- Histórica con nulls y cadena de 3: `/…/fk_rounding_v1` (tres «sin procedencia registrada»; cadena v0 → v1 (actual) → v2).
- Cadena desde la punta: `/…/fk_rounding_v2`.
- Roles: mismas rutas con proyectos `prj_org_orders_demo`, `prj_org_writer_demo`, `prj_org_metrics_demo`; solo los tres filtros son botones.
- Live: `VITE_DATA_SOURCE=live` → error de contrato pendiente en la lista.
- Run sin bloque especulativo: `/projects/prj_checkout_demo/runs/arun_checkout_pr45`.

## Pendiente y riesgos

- ux-reviewer para las etiquetas en español y el contraste final de `.fk-card-meta`, y la revisión humana antes de declarar WI terminado.
- En el mock, el conflicto 409 sigue comparando solo por `targetRef` (no por `targetRef + scenarioKey` como DEC-FK-001). No era requisito del AC y no se cambió para no alterar FocusMode. Pregunta al Leader: ¿se alinea el mock ya o se deja para WI-CONSOLE-020?
- `ruleUsage` (HU52) sigue siendo especulativo y sin contrato, como decidió el Leader.
- `spec/features/013-pr-driven-control-plane/tasks.md` y `harness/*.json` no se tocaron en este corte.

## Correccion 1 (tras revision UX de leela)

Modelo: implementer · configurado claude-haiku-5-5 · atendido claude-haiku-5-5 · esfuerzo low. Sin commit, sin push, sin cambios en `harness/state.json`, `harness/work-items.json` ni `spec/`.

Alcance: B1 bloqueante y N2, N3, N5, N6 de `harness/reports/wi-console-015-ux-review.md`. N4 no se cambia (opcional).

Cambios:

- B1 (`app/src/action-required/FunctionalKnowledgeDetailPage.tsx`): la regla vista lleva «Estás viendo esta regla» y conserva `aria-current="step"` y el borde. La regla ACTIVE de la cadena lleva «Vigente». Si la vista es la ACTIVE, ambos textos van en la misma fila. Intro: «De la regla más antigua a la más reciente. Se indica cuál estás viendo y cuál está vigente.»
- N2 (`FunctionalKnowledgePage.tsx`): «Escenario clave» pasa a «Clave de escenario» en la tarjeta.
- N3 (`app/src/styles.css`): se elimina el `color` muerto de `.fk-card-meta`. El color real es #bcbac9 (`--muted`, 10.31:1, WCAG AA), heredado de `.action-required-item p`. El comentario del bloque se actualiza. El texto de este informe ya era correcto; no requirió cambio adicional.
- N5 (`FunctionalKnowledgeDetailPage.tsx`): además del `title` con el SHA completo, se añade `<span className="visually-hidden">commit completo: <sha></span>` (clase existente). El `code` visible sigue mostrando 7 caracteres.
- N6 (`FunctionalKnowledgePage.tsx`): la región de estado es un `div` que permanece montado en la misma posición. Tiene `role="status"` solo cuando la consulta está en éxito (durante la carga lo anuncia `LoadingState`, sin duplicar). El «Sin reglas» se renderiza dentro de esa región.

Archivos tocados:

- `app/src/action-required/FunctionalKnowledgeDetailPage.tsx` y `.test.tsx`
- `app/src/action-required/FunctionalKnowledgePage.tsx` y `.test.tsx`
- `app/src/styles.css`
- `harness/reports/wi-console-015-implementation.md` (esta sección)

Pruebas nuevas o ajustadas:

- Cadena v1: «Estás viendo esta regla» en v1 y «Vigente» en v2; v1 no lleva «Vigente».
- Cadena v2: ambos textos en la misma `li`, sin enlace en la fila actual.
- SHA: el texto «commit completo: <sha>» existe y tiene clase `visually-hidden`; el `title` se mantiene.
- Vacío: `role="status"` contiene «Sin reglas» y el nodo es el mismo tras filtrar.
- Etiqueta: «Clave de escenario» aparece 7 veces en `prj_checkout_demo` y «Escenario clave» no aparece.

Resultados (en `app/`):

- `npm run lint`: sin errores.
- `npx vitest run --maxWorkers=2`: 57/57 archivos y 505/505 pruebas en verde.
- `npm run build`: OK (solo la advertencia habitual de chunk > 500 kB).

Verificacion en navegador (mock `console-mock`, detenido al terminar):

- `fk_rounding_v1`: cadena SUPERSEDED «Estás viendo esta regla», SUPERSEDED con «Ver regla →», ACTIVE «Vigente» con «Ver regla →».
- `.fk-card-meta` computado: `rgb(188, 186, 201)` (#bcbac9).
- `fk_rounding_v2`: «Vigente» y «Estás viendo esta regla» en la misma fila; SHA completo en el texto oculto (1px) y en `title`.
