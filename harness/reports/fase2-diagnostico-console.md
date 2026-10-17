# Fase 2 — Diagnóstico de Console (solo lectura)

Fecha: 2026-10-13. Base: Console HEAD `d72fdb0` (árbol limpio). Core consultado por `git show` (nunca por su árbol de trabajo). Objetivo de Jean: «seguir puliendo lo ya construido; no contradecir el paper ni la tesis», sin funcionalidades nuevas. Este informe no implementa nada ni autoriza WI: cada corrección necesita la aprobación de alcance de Jean en el chat de Console.

## Resumen

1. **(A) HITL.** La pregunta de Core ya trae el símbolo, el archivo y el fragmento correctos; la regla se persiste con la respuesta cruda del usuario (`functional-knowledge.service.ts:251` en Core). La pantalla solo muestra `qualifiedName` junto a los botones. Cambio mínimo solo en Console: mostrar destino (nombre, archivo, tipo, escenario) y una frase «se registrará como regla de X».
2. **(B) Experimentos.** B1, B2 y B3 se arreglan solo en Console. B4 tiene la raíz en Core (backlog #4 / IDEA-024); la UI solo puede dejar de preseleccionar el constructor.
3. **(C) Contract Sync.** Pendientes con destino Console: `CS-CORE-20261013-001/-002/-003` (INTEROP-2.13/2.14/2.15). Solo cambia `interoperability-contract.md`; todo es aditivo. SYSTEM no cambió desde 2.12.
4. Ningún ítem propuesto contradice el paper ni la tesis; dos cautelas en C.

## Tabla por ítem

| Ítem | Evidencia | Causa | Cambio mínimo | Riesgo | ¿Roza paper/tesis? |
| --- | --- | --- | --- | --- | --- |
| A | Console `FocusModePage.tsx:134` (solo `PR # · qualifiedName`), `:135-137`, `:140-155`; `types.ts:40,46-48`; `ActionRequiredPage.tsx:49`. Core `functional-context-evaluator.service.ts:62-81`, `functional-question.response.ts:75,99` (`visualAid` siempre `null`). | La regla se asocia por `questionId`; Core no valida que el texto corresponda al símbolo. La UI no muestra archivo, tipo ni escenario. | Bloque «Destino de tu respuesta» con `target.qualifiedName`, `filePath`, `kind`, `scenarioKind`, y la frase «Tu respuesta se registrará como regla para <símbolo>». No deshabilitar botones «hasta ver» (no hay señal fiable). | Bajo; `ux-reviewer` obligatorio. | No; refuerza `protocol.md:28`. |
| A-heurística | `FASE2_BACKLOG.md` fila 2 | Detectar «texto ajeno» exige semántica | NO proponer en Console: sería validación de Core (cambio de contrato) | Falsos positivos | Fuera de «sin funcionalidades nuevas» |
| B1 | `ExperimentPage.tsx:28` (`useState`), `:71`, `:74`; `router.tsx:44-45`; `:26` ya usa `useSearchParams` | El id vive solo en estado de React | `?experimentId=` en la misma ruta; leerlo al montar | Bajo | No |
| B2 | `ExperimentPage.tsx:74` (560 ms sin `refetchIntervalInBackground`), `main.tsx:10` (`refetchOnWindowFocus:false`); patrón igual en `RunComparisonPage.tsx:27`, `control-plane/queries.ts:85-86,207`, `retrieval-comparison/queries.ts:41-48,78`, `context-explorer/queries.ts:29` | TanStack Query pausa el intervalo con la pestaña oculta | `refetchIntervalInBackground: true` en sondeos largos; detener ante error; usar `pollAfterMs` donde el contrato lo da | Medio-bajo: más peticiones en segundo plano | No |
| B3 | `ExperimentPage.tsx:82` (`disabled`), `:74` sin `isError`, `:66` | Botón sin motivo; error de consulta tragado → «Preparando…» eterno | Nota `role="status"` con el motivo; bloque de error con correlation id y «Reintentar» | Bajo | No |
| B4 | `ExperimentPage.tsx:40,46-52`; `run-comparison/types.ts:39-47`; Core `experiments.service.ts:140-175`, `php-parser.service.ts:174-181` | El contrato da por elegible un símbolo que Core no resuelve; Console toma el primero | Ordenar poniendo al final `constructor`/`__construct` (sin filtrar) y nota previa; mensaje claro para `UNRESOLVABLE_TARGET` | Medio-bajo (heurística por nombre) | No |
| C-2.13 | `CS-CORE-20261013-001`, Core `15f03e5…`; `StrategyMetricsResponse` + `technicallyValidRate`, `assertionFailureCount` | Aditivo | Espejar byte a byte; opcional mostrarlas tolerando `null`, sin derivar ganador ni CF/CO | Bajo | Cautela: `protocol.md:31` define VT = `technicallyValidRate` |
| C-2.14 | `CS-CORE-20261013-002`, Core `dcfee56f…`; `dependencyContext?` en `RagContextTraceDetailResponse` (§6.7) | Aditivo, solo PHP | Espejar; opcional lista informativa sin sumar a `contextTokens` | Bajo | Cautela: tesis 3.3.5/3.3.9 (topK=10, 0.7/0.3, presupuesto 8000): hasta 300 tokens «aparte»; no presentarlo como parte del top-10 |
| C-2.15 | `CS-CORE-20261013-003`, Core `334708c2…`; `final?: true` | Aditivo, solo PHP | Espejar (estado final = 334708c2); opcional marca «final» | Bajo | Solo informativo; no afirmar «mockeable» |
| C-otros | `-008` (github-integration), `-010` y `-012` (sandbox) | No son de Console | Ninguno | — | No |

Espejo: un solo archivo cambia, `interoperability-contract.md`, de `50f8bd53…` (2.12) a `1c793c6f…` (2.15). `system-contract.md` ya coincide (`d180d4b1…`).

## Requiere Core / solo Console

| Requiere Core | Solo Console |
| --- | --- |
| B4 definitivo (constructores como target o fuera de «elegible») | A: destino visible y frase de registro |
| Validación de respuestas que mencionan otro símbolo (cambio de contrato) | B1, B2, B3 |
| `visualAid` estructurado (función nueva) | B4 paliativo; C: espejos y campos opcionales |
| Presupuesto/ranking de `dependencyContext` (decisión de Core/tesis) | |

## Orden recomendado de WI (numeración tentativa; no implementar)

1. **WI-CONSOLE-034 — Contract Sync 2.13–2.15.** Espejar `interoperability-contract.md` desde Core `334708c2`; acusar y resolver `-001/-002/-003`; sin UI ni DTO.
2. **WI-CONSOLE-035 — HITL: destino visible.** Focus Mode y Action Required.
3. **WI-CONSOLE-036 — Experimentos: estado y errores.** B1, B3 y B4.
4. **WI-CONSOLE-037 — Sondeo en segundo plano.** B2.
5. **WI-CONSOLE-038 (opcional, tras 1) — UI informativa 2.13–2.15.** Requiere revisión de paper.

## Lo que no se pudo verificar

- Qué mostraba la pantalla en el run f17b5305 ni quién escribió el texto «CANCELLED…»: la causa humana se infiere de que `normalizedRule` es la respuesta cruda.
- Que Core desplegado exponga `technicallyValidRate` y `assertionFailureCount` en `/results` (PAPER_READINESS lo marca NO verificado).
- Cómo nombra Core los constructores en `analysis_symbols`.
- Comportamiento real de TanStack Query en pestañas ocultas con la versión instalada (se asume el documentado).
- No existe un documento de paper o tesis como tal en `Universidad`: se contrastó con `protocol.md`, `INCIDENTES_Y_LIMITACIONES.md`, `PAPER_READINESS.md` y `FASE2_BACKLOG.md`.
