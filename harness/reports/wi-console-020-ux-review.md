# WI-CONSOLE-020 — Revisión UX

Modelo: ux-reviewer · configurado Codex gpt-6-luna · atendido gpt-6-luna · esfuerzo high

Alcance revisado: CTA Run → OE5, página de experimento y selector, acción requerida/Functional Knowledge, descarga de evidencia, comparación de retrieval y estados responsive del encabezado Run. Revisión UX únicamente; no se evaluó ni se declara comportamiento live.

Método: revisión estática del diff, especificación vigente de OE5/OE2 y estados de interfaz; ejecución de siete suites focalizadas, con mocks estrictos y sin transporte HTTP en el caso demo. Validador Harness ejecutado.

## Status: CHANGES_REQUESTED

## Hallazgos

1. **[P1] OE5 sigue disponible para un Run obsoleto.** `AnalysisRunDetailPage` solo excluye `ACTION_REQUIRED` de `canCompare`. La especificación de HU17 también excluye Runs obsoletos; el fixture `arun_billing_pr17` está obsoleto y conserva símbolos elegibles. Por tanto el botón «Comparar RAG vs GA» lleva a una comparación que no debería poder iniciarse. Ocultar/deshabilitar el CTA con explicación cuando `run.status === 'OBSOLETE'` y comprobar el estado equivalente para los demás estados no elegibles.
2. **[P2] Falta un estado vacío explicativo en OE5.** En modo live, si se abre la ruta sin `analysisRunId` o el Run no contiene símbolos `DIRECTLY_CHANGED` de tipo `METHOD`/`FUNCTION`, `selectable` queda vacío y «Ejecutar comparación» deshabilitado, pero la página conserva «Selecciona un target» y un `<select>` vacío. Indicar que se debe abrir OE5 desde un Run elegible y/o que ese Run no tiene símbolos elegibles, para que la ausencia de opciones no parezca un fallo de carga.

## Blockers

No hay bloqueos de entorno. Los dos hallazgos anteriores impiden aprobar UX hasta su corrección.

## filesAffected (revisados, sin edición productiva)

- `app/src/control-plane/AnalysisRunDetailPage.tsx`
- `app/src/control-plane/AnalysisRunDetailPage.test.tsx`
- `app/src/styles.css`
- `app/src/experiments/ExperimentPage.tsx`
- `app/src/experiments/ExperimentPage.test.tsx`
- `app/src/action-required/FunctionalKnowledgePage.tsx`
- `app/src/action-required/FunctionalKnowledgeDetailPage.tsx`
- `app/src/evidence/EvidenceDownload.tsx`
- `app/src/retrieval-comparison/RetrievalComparisonPage.tsx`

## Evidence

- `node harness/validate-harness.mjs` — `Harness V3 validation passed`.
- En `app/`: `npm test -- --run src/control-plane/AnalysisRunDetailPage.test.tsx src/experiments/ExperimentPage.test.tsx src/experiments/ExperimentComparison.test.tsx src/retrieval-comparison/RetrievalComparisonPage.test.tsx src/evidence/EvidenceDownload.test.tsx src/action-required/FunctionalKnowledgePage.test.tsx src/action-required/FunctionalKnowledgeDetailPage.test.tsx` — 7 archivos y 127 pruebas pasaron.
- `AnalysisRunDetailPage.test.tsx` confirma que el enlace Run → OE5 conserva `analysisRunId` en la query string.
- Las pruebas demo confirman rótulos `DEMO · DATOS SIMULADOS`, escenarios DEMO, ausencia de llamadas `fetch` en el mock, errores accionables y resultados con campos nulos.
- `styles.css:294` apila las acciones del encabezado con `flex-direction: column` y ancho completo a `max-width: 680px`.
- Revisión de `AnalysisRunDetailPage.tsx:142-144` y el escenario obsoleto de `mockBackend.ts:535-540` confirma el CTA OE5 ofrecido para un Run obsoleto con símbolo elegible.
- No se hizo prueba contra Core live ni se verificó un despliegue real.

## recommendedNextStep

Corregir los dos hallazgos, añadir estados de prueba para Run obsoleto y selector sin opciones y solicitar una nueva revisión UX de WI-CONSOLE-020.
