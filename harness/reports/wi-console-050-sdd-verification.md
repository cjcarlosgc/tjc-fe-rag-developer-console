# WI-CONSOLE-050 — verificación SDD

Modelo: sdd-analyst · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo low

**Fecha:** 2026-10-22 · **Lane:** STANDARD · `uiImpact=true` · `contractImpact=false` · **Solo lectura de producto.**
**Veredicto: SUFFICIENT_WITH_NOTES**

## 1. Suficiencia SDD

- `storyIds` HU17 y HU18 válidos (HU01–HU18). `ST-CONSOLE-052` existe en `spec/features/014-analysisrun-experiments/tasks.md` (`T-IN_PROGRESS`, enlaza WI-CONSOLE-050, HU17/HU18). `component` CONSOLE. `dependsOn` WI-CONSOLE-047 (cerrado).
- Alcance aprobado por el usuario (`wi-console-050-scope-approval.md`, cita literal). `activeWorkItem` en `state.json` coincide con `work-items.json`.
- Criterios de aceptación (5) coherentes con el alcance aprobado (causa raíz mínima, auditoría con mediciones, guarda estática ROJA al revertir, gates, reviewer + ux-reviewer máx. 2 ciclos).
- Nota: `specPaths` lista este reporte y `contract-sync-review`; ambos existen tras esta verificación.

## 2. Decisiones (`Blocks`)

Ninguna DEC con `Blocks` alcanza este WI. La única `Blocks` no `NONE` en `spec/` es `system-contract.md:305` (ingestión/despliegue con código empresarial; no bloquea código de demostración) y no aplica a una regla CSS. No hay DEC `PENDING`/`PROPOSED` sobre layout. `decisionGate` (`checked: true`, `blockingDecisionIds: []`) es correcto; se puede actualizar la nota a «sin DEC aplicable (verificado)».

## 3. Contrato

`contractImpact=false` confirmado: solo CSS + guarda estática de prueba. Sin DTO, rutas, enums, eventos ni copy. `contract-reviewer` no necesario; Contract Sync NOT_RELEVANT ya registrado.

## 4. Specs a actualizar

- `spec/transversal/design-system/spec.md` y `spec/features/014-analysisrun-experiments/spec.md`: no mencionan `table-frame`, `visually-hidden`, overflow ni tablas (grep sin resultados). No hay texto que se contradiga.
- Nota breve opcional propuesta (no editada) para el design-system, en la sección de layout/accesibilidad: «Los contenedores con `overflow` que alojan contenido `.visually-hidden` (`position:absolute`) deben ser ancestro posicionado (`.table-frame` lo es) para que no extiendan el scroll del documento.» Es opcional; basta con CHANGELOG + `tasks.md`.
- `CHANGELOG.md`: nueva entrada al cierre. `tasks.md`: ya registrado ST-CONSOLE-052.

## 5. Riesgos y límites

- **Causa raíz verificada en código:** `components.css:198` `.visually-hidden{position:absolute;…}`; `components.css:418` `.table-frame{overflow-x:auto}` sin `position`; `ExperimentComparison.tsx:257-258` pone `<span class="visually-hidden">Contexto</span>` dentro de un `th`. Sin ancestro posicionado el span se ubica respecto del bloque inicial y extiende el scroll del documento.
- **Efecto de `position:relative` en `.table-frame`:** es seguro para el diseño (no desplaza flujo). Revisar: (a) el focus ring `.table-frame[role='region']:focus-visible` (`components.css:760`, outline con offset 2px) no se recorta ni cambia (outline no depende de position); (b) no hay `sticky` dentro de `.table-frame` (el único `sticky` es `.side-panel`, `context-explorer.css:347`, ajeno a la tabla); (c) usuarios de la clase: `InventoryView.tsx:45`, `StructuredAlternativeView.tsx:19` (`.table-frame.structured-alternative`), `ExperimentComparison.tsx:241` (`role=region`, `tabIndex=0`). Medir las tres (y cualquier descendiente absoluto/`z-index`) antes/después. Otros `visually-hidden` (RetrievalComparisonPage.tsx:335 en botón, AnalysisRunDetailPage.tsx:145 en enlace, IntegrationsPage.tsx:233 `p` status) no están dentro de `.table-frame`: auditar medición, corregir solo si hay desborde real; el `p role=status` y los de botón/enlace quedan en contenedores no `overflow`.
- **Guarda estática:** hay un archivo reutilizable `app/src/styles/cssRegressionGuards.test.ts` (helper `ruleBody`, regex de bloque exacto `selector {`). Añadir una prueba que exija `position: relative` en `.table-frame` leyendo `components.css`; debe fallar ROJA al revertir (verificarlo ejecutándola sin el arreglo). Es guarda débil (jsdom no mide layout): la evidencia de navegador (scrollWidth vs clientWidth a 1280/375/320) es obligatoria y complementaria.
- **No tocar:** pendientes de WI-CONSOLE-047 (DR-1..4, H5/H6 salvo coincidencia exacta), `reasoningEffortMessage`, WI-CONSOLE-005/006, autoridad MAINTAINER/ADMIN sobre Functional Knowledge, rótulos DEMO, copy, DTO, rutas, contratos, realtime, primitives nuevas.

## Resultado

`status`: SUFFICIENT_WITH_NOTES · `blockers`: ninguno · `filesAffected`: `app/src/styles/components.css`, `app/src/styles/cssRegressionGuards.test.ts`, `CHANGELOG.md`, evidencia en `harness/reports/` · `recommendedNextStep`: gates `sddVerified` y `noBlockingDecisions` a pasar; implementer aplica el cambio mínimo + guarda y mide antes/después; reviewer y ux-reviewer (sin contract-reviewer).
