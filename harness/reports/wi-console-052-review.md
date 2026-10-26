# WI-CONSOLE-052 — revisión independiente

Modelo: reviewer · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

## Veredicto: APPROVED (con 2 observaciones menores no bloqueantes)

La aprobación del `reviewer` no sustituye la aprobación de alcance/contrato del usuario ni las revisiones de `contract-reviewer` y `ux-reviewer`. Los 375/1280 px los mide el `ux-reviewer`.

## Gates reproducidos (app/ y raíz, Node 22)
| Gate | Resultado |
|---|---|
| pnpm lint · tsc -b --noEmit · build · format:check · contracts:check | exit 0 |
| pnpm test --maxWorkers=4 | exit 0 · 95 archivos · 985 pruebas |
| sdd-check · validate-work-items (52 WI) · validate-harness · validate-completions (48) | exit 0 |

## Verificaciones
- Contrato: `interoperability-contract.md` (INTEROP-2.23) = `5de10cb7…`, idéntico a `git show 8c3eb0f:…` de Core. `inclusionReason` no se implementa (0 apariciones en el contrato; coherente con la nota del alcance).
- `ragLabels.ts`: `nameOrRaw`/`discardReasonName` usan `hasOwnProperty` (sin caída al prototipo), crudo para valores futuros, nunca vacío, «Descartado» como fallback. Correcto.
- `RagSidePanel.tsx`: fila «Capa» solo con `layer` truthy (entre Decisión y Motivo); «Estrategia de contexto» solo con `strategy` y sin inferir RANKED. Trazas antiguas (sin layer/strategy) no generan filas. Sin cambios de rutas, DTO, realtime ni polling (diff solo en tipos locales, ragLabels, panel, mock y pruebas).
- `types.ts`: opcionales correctos (`layer?: … | null`, `configuration.strategy?` etc.); `dependencyContext` no se consume.
- Mock: solo `trace_rag_order_total` lleva capas (solo SELECTED) y `strategy: 'LAYERED'`; `chunk-012` pasa a `BELOW_RELEVANCE_THRESHOLD` (score 0.41 < umbral 0.6, coherente). Conteos derivados del array; rótulos DEMO sin tocar; las trazas del experimento no cambian (prueba lo cubre).
- Spec 011 (spec.md y ST-CONSOLE-054 en tasks.md) y versiones INTEROP-2.23 actualizadas, consistentes con el código.

## Mutaciones propias (restauradas; `git diff` idéntico al previo, ragLabels.ts y RagSidePanel.tsx byte a byte)
| Mutación | Resultado |
|---|---|
| M1: `discardReasonName` sin fallback (`discardReasonLabel[reason]`) | ROJO: 3 fallos (2 de RagSidePanel, 1 de ragLabels) |
| M2: guarda de layer reemplazada por `true &&` | ROJO: 7 fallos (RagSidePanel y ContextExplorerPage) |
| M3: guarda de strategy reemplazada por `true &&` | ROJO: 6 fallos (incl. «no infiere RANKED») |

Nota: durante mi revisión apareció `harness/reports/wi-console-052-ux-review.md` (del `ux-reviewer` en paralelo, no mío); no lo toqué.

## Hallazgos
| # | Clase | Hallazgo |
|---|---|---|
| 1 | Menor / no bloqueante (pruebas) | `RagSidePanel.test.tsx`: la prueba «coloca “Capa” entre “Decisión” y “Motivo de descarte”» no verifica el orden (usa un descartado con `layer: null` y solo comprueba ausencia de «Capa» y presencia de «Motivo»). El nombre promete más de lo que afirma; el orden real (Decisión → Capa → Motivo) queda sin cobertura. Sugerido: candidato con `layer` y motivo y comparar posiciones de `dt`. |
| 2 | Observación (preexistente, fuera de alcance) | `ContextExplorerPage.tsx:70` y `RagGraph.tsx:73` indexan `discardReasonLabel[...]` directamente: un motivo con nombre de propiedad de Object (p. ej. `constructor`) devolvería una función en vez de «Descartado». Ya no ocurre en el panel (usa `discardReasonName`). Se puede unificar en un WI posterior; no afecta a los criterios. |

Sin hallazgos bloqueantes, sin `DECISION_REQUIRED`. Pendiente fuera de mi rol: contract-reviewer, ux-reviewer (mediciones a 375/1280 px), registro de revisión en el harness, push/PR/merge solo tras orden del usuario (Core desplegado).
