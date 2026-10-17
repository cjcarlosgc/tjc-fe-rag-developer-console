# WI-CONSOLE-014 — Corrección 1 (hallazgos de la revisión UX)

Modelo: implementer · configurado claude-haiku-5-5 · atendido unknown · esfuerzo low

Estado: READY_FOR_REVIEW (sin commit ni push; la revisión independiente la hace el Human Reviewer).

Fuente: `harness/reports/wi-console-014-ux-review.md` (CHANGES_REQUESTED). Alcance: B1, B2, B3, N1, N2, N3, N4. No se tocó `harness/state.json`, `harness/work-items.json` ni `spec/`.

## Cambios

- **B1 (previa obsoleta).** `RetrievalComparisonPage.tsx`: efecto que invalida `retrievalComparisonKeys.list(analysisRunId)` cuando el detalle en curso llega a `COMPLETED` o `FAILED` (`isTerminalRetrievalStatus`). Antes solo se invalidaba en el éxito del POST (PENDING).
- **B2 (foco del CTA).** `styles.css`: `.run-heading-actions .button:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }`. Solo afecta al CTA de la cabecera del Run.
- **B3 (instrucción falsa al Reader).** `statusMessage` en reposo: «Comprobando tu rol…» mientras carga; «Este Run no tiene símbolos para comparar.» sin símbolos elegibles; «Elige un símbolo y pulsa…» solo con rol Writer+; en otro caso «Solo lectura: puedes consultar las comparaciones previas.»
- **N1.** `formatConfigValue` en `types.ts`: `null` se muestra como «no aplica» en `semanticWeight`, `structuralWeight` (y `finalTopK`, por uniformidad).
- **N2.** `structuralRelationLabel(relation, mode)`: en SEM el `null` es «no aplica»; en SE conserva «Sin relación estructural».
- **N3.** `<caption>` «Candidatos por ranking del modo SE|SEM»; `<h3>` «Métricas del modo SE|SEM»; contenedor desplazable con `role="region"` y `aria-label` «Candidatos del modo …».
- **N4.** FAILED propio: `ErrorNote` con failureCode y failureMessage (sustituye al `<p role="alert">` manual). Previa FAILED en la lista: muestra failureCode (en `<code>`) y failureMessage. El DTO `RetrievalComparisonStatusResponse` no trae `correlationId`, así que no se muestra referencia; ver «Bloqueos».

## Pruebas

Archivo: `app/src/retrieval-comparison/RetrievalComparisonPage.test.tsx`. Se añadieron 4 pruebas antes de tocar el componente; las 4 fallaron (14 pasaban) y pasan tras el cambio:

- `B1: al completar, la lista de previas deja de mostrar la comparación en curso como Pendiente` (espera 3 previas «Completada (COMPLETED)»: 2 seed + la nueva).
- `B3: un Reader recibe un estado de solo lectura, sin invitación a elegir ni pulsar` (READER_RUN).
- `N1-N3: SEM no muestra «null» ni «Sin relación estructural»; captions, métricas y regiones distinguen el modo`.
- `N4: una previa FAILED muestra failureCode y failureMessage visibles`.

Nota de prueba: en el primer intento de B3 la espera encontró el `role="status"` de la pantalla de carga; la prueba se ajustó a `waitFor` sobre el estado montado.

## Comandos (en `app/`)

| Comando | Resultado |
| --- | --- |
| `node node_modules/vitest/vitest.mjs run src/retrieval-comparison/` | 2 ficheros, 38 pruebas: pasan |
| `npm run lint` | exit 0 |
| `node node_modules/vitest/vitest.mjs run --maxWorkers=2` | 59 ficheros, 547 pruebas: pasan |
| `npx tsc -b --noEmit` | exit 0 |
| `npm run build` | exit 0 (solo aviso pre-existente de tamaño de chunk) |

Nota de entorno: `npx vitest` directo devuelve 127 en este shell; se usa `node node_modules/vitest/vitest.mjs`, mismo binario.

## Evidencia en navegador (http://localhost:5173, sin reinicio)

- **B2, CTA «Comparar retrieval SE vs SEM»** (`/projects/prj_checkout_demo/runs/arun_checkout_pr49`, Tab desde «Run comparison →»): `:focus-visible` = true; `outline-style: solid`; `outline-width: 3px`; `outline-offset: 2px`; `outline-color: rgb(201, 180, 250)` (= `--accent` #c9b4fa). Contraste del anillo frente a fondo `rgb(11, 11, 13)`: **10.67:1** (antes ≈2.7:1 con el anillo global `rgba(201,180,250,.42)`).
- **B3, Reader** (`/projects/prj_org_metrics_demo/runs/arun_org_metrics_pr15/retrieval-comparison`): `role=status` = «Solo lectura: puedes consultar las comparaciones previas.»; sin `#retrieval-symbol`; sin botón «Comparar retrieval».

## Bloqueos y decisiones abiertas

- **N4 correlationId.** El DTO de estado de §6.15 no incluye `correlationId`; el FAILED propio muestra failureCode y failureMessage, pero no referencia de soporte. Si el AC exige correlationId también aquí, hace falta que Core lo exponga en el DTO (fuera de esta corrección) o aceptar la desviación; decisión del Human Reviewer.
- **B2 verificado en Chrome por teclado; no hay prueba unitaria.** jsdom no evalúa `:focus-visible` de hojas de estilo; la evidencia es la medición de navegador de arriba.
- **N5-N8** del informe UX no se tocaron (fuera del alcance pedido).

## filesAffected

- `app/src/retrieval-comparison/RetrievalComparisonPage.tsx`
- `app/src/retrieval-comparison/RetrievalComparisonPage.test.tsx`
- `app/src/retrieval-comparison/types.ts`
- `app/src/styles.css`
- `harness/reports/wi-console-014-correction-1.md` (este informe)

## evidence

Ver tabla de comandos y medición de navegador. Pruebas nuevas: 4 rojas antes, 4 verdes después; suite completa 547/547.

## recommendedNextStep

Revisión del Human Reviewer sobre el diff de estas cuatro fuentes y este informe. Decidir N4 (correlationId en el DTO de estado o desviación aceptada). Tras el veredicto, si procede, commit por corte (sin push).
