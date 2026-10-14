# WI-CONSOLE-035 — verificación de suficiencia SDD

Modelo: sdd-analyst · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo low

Fecha: 2026-10-13. Solo lectura; no se tocó producto ni `state.json`/`work-items.json`.

## 1. Campos del contrato (tipos y nulabilidad reales)

| Campo | `app/src/action-required/types.ts` / `control-plane/types.ts:117-123` | INTEROP §6.11 (`interoperability-contract.md:722-728, ~800`) |
|---|---|---|
| `target.qualifiedName` | `string` (no nulo) | `string` |
| `target.filePath` | `string` (no nulo) | `RelativePath` (no nulo) |
| `target.kind` | `'CLASS'\|'METHOD'\|'FUNCTION'\|'INTERFACE'\|'TYPE'\|'TRAIT'\|'ENUM'` (no nulo) | idéntico |
| `scenarioKind` | `ScenarioKind` = EXPECTED_RESULT, BOUNDARY, EXCEPTION, STATE_TRANSITION, OBSERVABLE_SIDE_EFFECT, FUNCTIONAL_PRECONDITION (no nulo) | idéntico; preguntas históricas llegan `EXPECTED_RESULT` + `scenarioKey: 'LEGACY'` |
| `target.language`, `target.changeKind` | no nulos | disponibles, fuera del alcance aprobado |

Hallazgo clave: ninguno de los cuatro campos es nulable en el contrato ni en `types.ts`. El criterio «un campo null se muestra como sin dato» es una defensa de runtime (p. ej. respuesta live malformada), no un caso del contrato. Los valores son enums crudos (`METHOD`, `EXCEPTION`); no existe etiqueta en español definida: mostrar el valor crudo o introducir un mapa de etiquetas es una decisión de UX (sin heurística de dominio, pero conviene fijarla). No se necesitan campos nuevos ni Contract Sync.

## 2. Decisiones DEC con `Blocks`

Revisados `system-contract.md` (bloques `**Blocks:**`) y la constitución. Todos los `Blocks` son `NONE`, salvo `DEC-INF-*`/ingestión de código empresarial y evidencia empresarial (system-contract.md:305), que no alcanzan Focus Mode ni Action Required. `DEC-FK-001/-002/-004` (escenarios, abstención) están implementadas y solo se citan. Ninguna `PENDING`/`PROPOSED` bloquea este WI; coincide con el `decisionGate` del WI (`blockingDecisionIds: []`).

## 3. Cobertura de pruebas actual y riesgo de ruptura

`FocusModePage.test.tsx` (mock + live con fetch simulado) cubre: pregunta vigente y visualAid, avance, abstención `UNKNOWN` (`findByRole('status')` único + regex `^Abstención registrada · … · 1 abstención\(es\)$`), idempotencia, Writer/Reader sin botones y sin `group` «Respuesta», confirmación final y enlace Volver, HEAD cambiado, `returnTo`, conflicto HU51 (3 variantes), teclado (Tab/Enter/Espacio, foco en `.focus-mode-card`), foco tras error 5xx, `INTEROP-2.9` 404 obsoleto (`/Esta pregunta ya no aplica/`, `queryByRole('alert')` ausente), 403, `continuationAttemptId` opaco.

`ActionRequiredPage.test.tsx` cubre: `findAllByText('checkout-service',{selector:'.repo-name'})` con longitud exacta 2, `getByText('PR #NN',{selector:'.pr-ref'})`, filtro por workspace, líneas de abstención con regex, ausencia de `usr_`/«resuelto|continuando|todas las preguntas respondidas», Writer/Reader sin botones; el primer test valida `href` de los enlaces.

Selectores/textos que el cambio podría romper:
- `findByRole('status')`/`getByRole('status')`: es único hoy (div de abstención). Un segundo `role="status"` lo rompería. El bloque de destino no debe usar `role=status` ni `aria-live`.
- `queryByRole('group',{name:'Respuesta'})` ausente para Writer/Reader: el nuevo grupo debe tener un nombre distinto del exacto «Respuesta» (p. ej. «Destino de la regla»); además el destino puede seguir visible a Reader/Writer.
- `.pr-ref` y `.repo-name`: no reutilizar estas clases ni añadir `RepoChip` en el nuevo bloque (las aserciones de conteo/selector se romperían). `.target-ref` ya existe en la lista; reusarlo para otro nodo no afecta a los tests.
- `queryByText(/resuelto|continuando|todas las preguntas respondidas/i)`: la frase nueva y las etiquetas no deben contener esas palabras.
- `getByText(<pregunta>)`/`closest('.focus-mode-card')`: el bloque debe quedar dentro de `.focus-mode-card` y no repetir el texto de la pregunta.
- `getByText('Solo un Maintainer o Admin puede…')`: no tocar esa nota.
- `findByText('PR #42 …')` no se usa con texto completo; hoy el span `PR #N · qualifiedName` y la frase nueva comparten `qualifiedName`, pero ninguna prueba hace `getByText(qualifiedName)` (grep). Si se parte la frase con `<code>`, `getByText` de la frase completa no la encontrará: usar `toHaveTextContent` en la prueba nueva.
- Enlaces de la lista: el nombre accesible del `<a>` crece; las pruebas no usan `getByRole('link',{name})` en la lista (solo índice y href).

## 4. Mock (`app/src/api/mockBackend.ts`)

Siete preguntas, todas con `filePath` y campos no nulos:

| Pregunta | qualifiedName | kind | filePath | scenarioKind |
|---|---|---|---|---|
| fq_checkout_pr42_1 | CouponPolicy.apply | METHOD | src/domain/CouponPolicy.ts | EXCEPTION |
| fq_checkout_pr42_2 | OrderService.calculateTotal | METHOD | src/domain/OrderService.ts | BOUNDARY |
| fq_billing_pr17_1 | DiscountEngine | CLASS | src/domain/DiscountEngine.ts | BOUNDARY |
| fq_billing_pr24_1 | InvoiceService.applyLateFee | METHOD | src/domain/InvoiceService.ts | STATE_TRANSITION |
| fq_checkout_pr52_1 | ShippingAddressValidator.validate | METHOD | src/domain/ShippingAddressValidator.ts | EXPECTED_RESULT |
| fq_org_writer_pr21_1 | PaymentRetry.schedule | METHOD | src/payments/PaymentRetry.ts | BOUNDARY |
| fq_org_metrics_pr15_1 | (ver fixture) | METHOD | (ver fixture) | FUNCTIONAL_PRECONDITION |

Hay variedad de símbolos y escenarios; ninguna pregunta tiene null. El tipo estricto no admite `null`, por lo que «incluida una pregunta con campos nulos» en el mock exige o bien (a) un cast `as unknown as` en un fixture dedicado (cambio mínimo, queda como fixture no contractual y debe rotularse como simulación defensiva) o (b) NO añadirla al mock y cubrir el null solo con una prueba de componente/live que inyecte JSON con null. Recomendación: (b) para el mock por honestidad (el mock no debe mostrar un caso que el contrato prohíbe), más prueba live con fetch simulado; si el usuario exige la pregunta nula visible en demo, (a) con cast y nota.

## 5. Criterios de aceptación verificables y riesgos

Verificables (propuestos para ROJO→VERDE):
1. Focus Mode: dentro de `.focus-mode-card` hay un `role="group"` (o `<h3>`+región) con nombre «Destino de la regla» que contiene qualifiedName, filePath, kind, scenarioKind del mock (`CouponPolicy.apply`, `src/domain/CouponPolicy.ts`, `METHOD`, `EXCEPTION`).
2. La frase «Tu respuesta se registrará como regla para CouponPolicy.apply» aparece en el DOM antes de los botones (`compareDocumentPosition`) y solo cuando `canAnswer`; no aparece para Reader/Writer.
3. Ningún botón cambia su `disabled` por este bloque; los tests existentes de botones/teclado/foco pasan sin edición.
4. Action Required: cada ítem muestra símbolo, archivo, tipo y escenario dentro del `<a>` existente; `href` sin cambios.
5. Null (live): respuesta con `target.filePath: null` o `scenarioKind: null` muestra «sin dato» y no lanza error ni inventa valor; sin cast en producto más allá de normalización a texto.
6. No cambios en `types.ts`, cliente HTTP, Core ni contratos; `git diff` sin `spec/contracts/*`.
7. Gates: lint, `tsc -b --noEmit`, vitest, build, `validate-harness`, y revisión `ux-reviewer` (375/768/1024 px, contraste, orden de lectura).

Riesgos:
- Jerarquía de headings: hoy h1 → h2 (pregunta). Un título del bloque debe ser h3 (o usar `aria-label`/`aria-labelledby` sin heading) para no saltar niveles ni competir con el h2.
- Duplicación del `qualifiedName` en el chip superior `PR #N · qualifiedName`; decidir si se conserva (recomendado conservar para no romper nada) o se deja solo el PR.
- Etiquetas de `kind`/`scenarioKind`: enums crudos en inglés frente a la UI en español; sin mapa, riesgo de UX; con mapa, es presentación pura pero requiere cubrir los 7+6 valores (exhaustividad con `Record<…>`).
- `filePath` largo en 375 px: requiere `overflow-wrap:anywhere`/`word-break`.
- Texto «Tu respuesta se registrará…» sobre botones que incluyen «No lo sé» (abstención, no registra regla — SYSTEM `DEC-FK-002`): la frase fija puede ser engañosa para esa opción. Debe quedar acotada a las respuestas (Sí/No/Depende/texto libre) o redactarse para que no afirme registro en la abstención.
- Frase fija con un `qualifiedName` vacío/`null`: definir la salida («sin dato»).

## 6. Veredicto

**SUFICIENTE con tres precisiones menores** (ninguna bloquea; resolverlas en el handoff al implementer o con una respuesta breve del usuario):
1. ¿Etiquetas de `kind`/`scenarioKind`: valor crudo o mapa en español (presentación pura)?
2. Mock con nulos: ¿opción (b) solo prueba live con null, o (a) fixture con cast visible en demo?
3. «No lo sé» (UNKNOWN) no registra regla: ¿la frase se muestra solo para Sí/No/Depende/texto libre, o se mantiene fija con la excepción explicada junto al botón?

## Handoff

- status: DONE (verificación completada)
- findings: contrato sin nulos en los cuatro campos; sin DEC bloqueantes; riesgos de selectores listados (status único, group «Respuesta», `.pr-ref`/`.repo-name`, regex prohibidos); el mock no permite null sin cast; frase fija vs abstención UNKNOWN es el riesgo semántico principal.
- blockers: ninguno.
- filesAffected: solo este reporte (`harness/reports/wi-console-035-sdd-verification.md`). Archivos de producto previstos para el implementer: `app/src/action-required/FocusModePage.tsx`, `ActionRequiredPage.tsx`, sus tests, estilos y, opcionalmente, `app/src/api/mockBackend.ts`.
- evidence: lectura de `types.ts`, `control-plane/types.ts:117-123`, `interoperability-contract.md` §6.11, `mockBackend.ts:366-481`, `FocusModePage.tsx`, `ActionRequiredPage.tsx`, ambos tests, `system-contract.md` bloques `Blocks`.
- recommendedNextStep: resolver las 3 precisiones (el leader puede fijar defaults: crudo/mapa a decidir, opción (b), frase solo en respuestas), luego delegar a `implementer` con ROJO→VERDE y ux-reviewer.
