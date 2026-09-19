# HU52 y HU49 — cierre de las 8 capacidades formalizadas en HU48–HU55

**Estado:** DONE
**Repository:** `tjc-fe-rag-developer-console`

## Contexto

Continuación explícita del corte HU48–HU55 dejado en pausa el 2026-09-15
(ver `harness/progress/current.md`). Ese corte había resuelto 6 de las 8
historias (HU48/50/51/53/54/55); quedaban pendientes **HU52** ("Runs que
usaron esta regla") y **HU49** ("Capture next PR"), ambas sin contrato de
Core, ambas P2/P4 y sin bloqueador que exigiera esperar. `activeWorkItem`
seguía en `null` — se retomó bajo el mismo patrón especulativo ya usado en
HU50/HU54 (tipos propios, `ProposedCapabilityError`, badge
`.proposal-stamp`), sin pedir aprobación de alcance nueva porque el alcance
ya estaba acordado en la sesión anterior.

## HU52 — trazabilidad inversa de Functional Knowledge

`action-required/speculative/ruleUsage.ts` (`getRuleUsage(knowledgeId)`) +
`mockGetRuleUsage` en `mockBackend.ts`. Coincidencia local: mismo `projectId`
+ algún símbolo del `AnalysisRun` con `qualifiedName === targetRef` de la
regla. Panel nuevo "Runs que usaron esta regla" en
`FunctionalKnowledgeDetailPage`, con badge `PROPUESTA` y estado vacío
explícito cuando no hay coincidencias (p. ej. `fk_discount_engine`, cuyo
`targetRef` es un método pero los fixtures de Run solo tocan la clase
contenedora — caso real de "sin uso todavía", no un bug).

**Limitación de demo documentada** (código + `spec.md`): la coincidencia no
distingue qué versión de la regla estaba `ACTIVE` en el momento de cada Run
— para el par `fk_rounding_v1`/`fk_rounding_v2` (mismo `targetRef`,
superseded→active) ambos listarían los mismos Runs si se consultaran por
separado. No se resolvió por ser una simplificación aceptable a nivel de
propuesta sin contrato; una implementación real necesitaría que Core
persista el vínculo Run↔FK explícitamente.

## HU49 — Capture next PR

`run-comparison/speculative/captureNextPr.ts` (`getCaptureNextPrState`,
`armCaptureNextPr`, `disarmCaptureNextPr`, `simulateNextEligiblePullRequest`)
+ mocks correspondientes, estado `ARMED`/`OFF` por proyecto (no global).
Panel `CaptureNextPrPanel` insertado en `ExperimentPage` ("Modo
experimental"), separado y por encima del flujo legacy de selección manual
de target (HU19) que sigue debajo sin tocarse. Al capturar, navega a
`RunComparisonPage` — la página de HU48 arranca la comparación sola al
detectar un símbolo elegible, así que HU49 no reimplementa esa lógica.

**Desviación de demo deliberada** (documentada en `spec.md`): el mecanismo
objetivo espera pasivamente "el próximo `AnalysisRun` elegible del flujo
normal", pero no existe un webhook real que lo dispare en esta Console. Se
optó por un botón explícito "Simular llegada del PR (demo)", visible solo
mientras está `ARMED`, que fabrica ese Run bajo demanda — permite demostrar
la transición `ARMED`→captura→`OFF` en vivo sin inventar un mecanismo pasivo
que no podría funcionar sin un backend real detrás.

Restricciones del handoff (§39) respetadas explícitamente: no es un toggle
permanente (vuelve solo a `OFF` tras una captura), no reemplaza ni
paraleliza el motor de HU48, no se implementó antes que HU48.

## Verificación

`tsc --noEmit`, `pnpm lint` y `pnpm build` limpios. 282 pruebas en verde
(+9 sobre las 273 previas: 5 en `FunctionalKnowledgeDetailPage.test.tsx`,
4 en `ruleUsage.test.ts` para HU52; 7 en `captureNextPr.test.ts` y 2 nuevos
en `ExperimentPage.test.tsx` para HU49 — el conteo exacto por archivo está
en los commits). El recorrido manual en navegador no pudo confirmarse: la
extensión Claude in Chrome no conectó en ningún intento de esta sesión
(mismo bloqueo intermitente ya documentado en sesiones previas) — queda
pendiente para cuando la extensión esté disponible.

## Resultado

Con este corte, las 8 historias formalizadas en
`console-backlog-formalization.md` (HU48–HU55) tienen todas alguna
implementación en Console:

| HU | Contrato | Implementación |
|---|---|---|
| HU48 | Definido (INTEROP-2.1 §6.5), sin adapter live | Mock-first normal |
| HU49 | Sin contrato (`PROPOSED`) | Especulativa |
| HU50 | Sin contrato (`PROPOSED`) | Especulativa |
| HU51 | Definido (INTEROP-2.1 §6.11), sin adapter live | Mock-first normal |
| HU52 | Sin contrato (`PROPOSED`) | Especulativa |
| HU53 | Definido (INTEROP-2.1 §6.10), sin adapter live | Mock-first normal |
| HU54 | Sin contrato (`PROPOSED`) | Especulativa |
| HU55 | Definido, sin ruta en Core | Ya cubierto por mock existente |

Ninguna capacidad especulativa (HU49/50/52/54) tiene forma de contrato
aprobada — cualquiera de ellas puede requerir rediseño si Core define una
forma distinta a la fabricada localmente. `activeWorkItem` vuelve a `null`.
No hay gaps abiertos conocidos del handoff `experimentos.md` ni de
`console-backlog-formalization.md` sin al menos una implementación de demo.
