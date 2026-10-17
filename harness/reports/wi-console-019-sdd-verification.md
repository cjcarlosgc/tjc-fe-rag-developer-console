# WI-CONSOLE-019 — Verificación SDD

Modelo: sdd-analyst · configurado claude-sonnet-5-5 · atendido claude-sonnet-5-5 · esfuerzo low

Work item: WI-CONSOLE-019 «Copy de OE5 y ausencia de veredictos automáticos» (ST-CONSOLE-021, HU17, sprint SMART V3). Solo verificación; no se editó código, state.json ni work-items.json.

## Veredicto: SUFFICIENT

## Decision gate
- Fuente: `spec/contracts/system-contract.md`.
- blockingDecisionIds: [] (ninguno).
- nonBlockingDecisionIds: `DEC-INF-001` (PENDING; Blocks: aprovisionamiento remoto), `DEC-VAL-001` (PENDING; Blocks: código empresarial/evidencia empresarial). Ninguna alcanza este WI (solo copy/UI con mocks).
- Decisiones aplicables ya APROBADAS: `DEC-EXP-FK-001` (condiciones experimentales externas controladas, sin paridad estricta), `DEC-EXP-003`, `DEC-EXP-004`. Sin `PROPOSED` aplicables.

## Spec aplicable
- `spec/features/014-analysisrun-experiments/spec.md` sección «OE5 — presentación y wording»: usar «condiciones experimentales externas controladas»; no «paridad estricta de información»; sin ganador automático ni afirmación de superioridad; CF/CO no derivados de `valid`/`passed`.
- `tasks.md` línea 5: ST-CONSOLE-021 T-READY. `plan.md` indica que WI-019 es independiente de WI-018.
- Accesibilidad transversal: la nota debe ser texto estático legible (contraste AA), sin depender del color; no introduce controles nuevos.

## Hallazgos del código
- Comparación RAG vs agente: `app/src/run-comparison/RunComparisonPage.tsx` (existe; h1 «RAG vs Agente generalista sobre este Run», líneas ~105-110; renderiza `ExperimentComparison` en línea ~46). Ruta registrada en `app/src/router.tsx`.
- `app/src/experiments/ExperimentPage.tsx`: h1 «RAG vs Agente generalista» y párrafo «Compara la recuperación RAG con un agente que explora el código y reúne sus propias referencias.» (línea 41); también renderiza `ExperimentComparison`.
- `app/src/experiments/ExperimentComparison.tsx` es compartido por ambas páginas (línea 27).
- Mock: `app/src/api/mockBackend.ts` (`experimentResult`, ~721; no existe `app/src/mocks`). No contiene copy de paridad/ganador.
- Grep case-insensitive en `app/src` (paridad, parity, ganador, winner, superior, mejor, gana, wins, outperform, veredicto, verdict, idéntic, equivalen): cero ocurrencias en UI, mocks y tests; la única coincidencia es un comentario no visible en `mockBackend.ts:874` («sin equivalente en el handoff»), irrelevante.
- `positive-delta`/`negative-delta`: solo en `ExperimentComparison.tsx` línea 27 y `styles.css:239-240`. Colorean verde/rojo la diferencia de tasas (validRate/passedRate), lo que sugiere un ganador implícito por color. Es alcance de WI-CONSOLE-018 (ST-CONSOLE-020), que las presenta como diferencias neutras.
- Texto que implica paridad estricta: ninguno. Texto de RunComparisonPage («mismo HEAD, changeset y símbolos») es descriptivo del Run, no afirma paridad de información; conviene mantenerlo pero la nota nueva precisa la asimetría.
- Banner `DEMO · DATOS SIMULADOS` está en `ui/AppShell.tsx:36`; no se toca.

## Alcance exacto de archivos (a tocar por el implementer)
1. Nuevo componente pequeño de nota compartida, p. ej. `app/src/experiments/ExperimentConditionsNote.tsx` (texto exacto, constante exportada para la prueba).
2. `app/src/experiments/ExperimentPage.tsx`: insertar la nota (tras el encabezado experimental, antes de `lab-boundary` o junto al párrafo de la línea 41).
3. `app/src/run-comparison/RunComparisonPage.tsx`: insertar la nota bajo el `page-heading` (junto a la línea 108).
4. `app/src/styles.css`: estilo mínimo de la nota solo si hace falta (reutilizar `contract-note`/`eyebrow` si basta).
5. Tests: `app/src/experiments/ExperimentPage.test.tsx`, `app/src/run-comparison/RunComparisonPage.test.tsx` (aserción de nota) y un test negativo nuevo (p. ej. `app/src/experiments/noAutomaticVerdict.test.tsx`).

Texto exacto de la nota: «Comparación bajo condiciones experimentales externas controladas. RAG usa recuperación SE + ContextBuilder + conocimiento funcional aplicable; el agente generalista explora en solo lectura sin conocimiento persistente.»

Límites: no tocar contratos (`spec/contracts`), `types.ts`, `api.ts`, `liveMapping.ts`, mock de datos ni lógica de tasas. No tocar `positive-delta`/`negative-delta` ni la tabla de tasas (WI-CONSOLE-018). Excepción solo si el implementer/ux-reviewer considera que el color verde/rojo declara ganador: entonces coordinar con el Leader, preferiblemente dejándolo a WI-018 y registrándolo como riesgo residual.

## Textos a quitar o reformular
- Ninguno que implique paridad estricta (grep limpio). Opcional: el párrafo de ExperimentPage línea 41 puede mantenerse; no afirma igualdad de información.
- Mantener el copy existente de RunComparisonPage («no sustituye ni bloquea el resultado del Run»).

## Diseño de la prueba negativa
- Renderizar: `ExperimentPage` y `RunComparisonPage` en modo mock con resultado completado (que monte `ExperimentComparison` con tasas donde RAG > agente y viceversa), más la vista de contexto si se monta fácilmente.
- Tomar `container.textContent` (y `document.body.textContent`) y fallar con `expect(...).not.toMatch(/paridad|ganador|superior|winner|mejor (estrategia|resultado)|gana\b|outperform|veredicto/i)`. Términos obligatorios: «paridad», «ganador», «superior».
- Aserción positiva: la nota exacta aparece en ambas pantallas (`getByText` con la cadena completa).
- Caso de tasas invertidas: no aparece ningún elemento con rol/estado «ganador» ni insignia de resultado automático derivada de validRate/passedRate.
- Verificar también que el banner `DEMO · DATOS SIMULADOS` sigue presente.

## Riesgos
- Colisión con WI-CONSOLE-018 en `ExperimentComparison.tsx`: evitar editarlo; la nota va en las páginas, no en el componente compartido.
- Color verde/rojo en deltas puede leerse como veredicto; mitigado por WI-018 (neutralizar). Debe quedar documentado si WI-019 cierra antes.
- La prueba negativa no debe usar «superior» de forma que falle por textos legítimos futuros (p. ej. «superior» en otro contexto); hoy hay 0 coincidencias.
- Accesibilidad: la nota debe ser texto plano (no tooltip), contraste AA.

## UI visible
Sí. Se agrega una nota visible en `ExperimentPage` y `RunComparisonPage`. Requiere revisión de `ux-reviewer` antes de la revisión humana, además de lint, pruebas, build y `node harness/validate-harness.mjs`.

## Siguiente paso recomendado
Leader: registrar `decisionGate` (blocking: [], nonBlocking: [DEC-INF-001, DEC-VAL-001]), pasar a W-SPEC_VERIFIED y delegar a `implementer` (Low) con el alcance anterior; tras la implementación, `ux-reviewer` y revisión del Human Reviewer.
