# WI-CONSOLE-021 — Revisión UX

Modelo: ux-reviewer · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo low

Alcance revisado: cortes B1/B2/C de `WI-CONSOLE-021`: experimentos OE5, comparación OE2, trace operativo, evidencia versionada y las representaciones PHP/PHPUnit. No se revisó ni activó ningún adapter live: `/evidence` permanece explícitamente en mock hasta `WI-CONSOLE-020`.

Método: revisión estática de componentes, estados, tests y estilos; interacción real contra Vite con `VITE_DATA_SOURCE=mock` el 2026-10-10. Estados recorridos: PHP/PHPUnit completado, `503 LLM_PROVIDER_UNAVAILABLE` reintentable y `EXPERIMENT_WORKER_LOST`.

## Status: APPROVED

## Hallazgos

1. Honestidad y jerarquía (OK). La fuente se anuncia globalmente como `DEMO · DATOS SIMULADOS`; el laboratorio vuelve a marcar que sus métricas son narrativas, y el panel de evidencia precisa que es un paquete técnico de Core, no registro académico. No se anuncia la simulación como flujo live ni se promete capacidad de Core no activada.
2. PHP/PHPUnit (OK). El escenario DEMO muestra `PHP_LARAVEL_PHPUNIT` y `PHPUNIT` como valores abiertos, con etiqueta DEMO también dentro de la configuración. El copy no interpreta el perfil como disponibilidad general de generación/ejecución y no declara ganador.
3. Estados de error y feedback (OK). El `503` se expone con `role=alert`, mensaje de acción comprensible, correlation ID y botón nativo `Reintentar`. `EXPERIMENT_WORKER_LOST` expone también `role=alert`, copy específico y detalle del backend, sin barra de progreso residual ni falso control de reanudación. Los códigos desconocidos tienen representación de respaldo según componente y pruebas.
4. Datos incompletos (OK). `null` se representa como `—`, `sin datos` o `no disponible` según el campo; un cero legítimo se conserva. La tabla especifica en texto la no evaluabilidad y los contadores, y no deriva una conclusión automática de los deltas o tasas.
5. OE2, trace y evidencia (OK). Las tablas tienen caption, encabezados `scope`, región con etiqueta y foco; trace conserva estados `NOT_APPLICABLE`/campos nulos sin inventar información. La descarga tiene botón nativo, texto de disponibilidad antes del estado terminal, `role=status` durante/progreso de descarga y `role=alert` en errores. El foco visible de los controles de evidencia es explícito, con objetivo de 40 px.
6. Accesibilidad básica (OK). Los selectores usan `label` asociado, las acciones son botones nativos, los avisos dinámicos usan `status` o `alert`, y los textos críticos no dependen solo de color. La navegación, breadcrumbs y encabezados son coherentes con la superficie existente. Las pruebas cubren Enter/Espacio para la descarga y el reintento mantiene el foco.
7. Observación no bloqueante. Durante `loading`, los botones de evidencia usan `aria-disabled` en vez de `disabled`; el guard interno impide duplicar la petición. La semántica es suficiente para este corte, pero al tocar ese componente conviene migrar al atributo `disabled` o documentar deliberadamente que se conserva enfocable para comunicar el estado.

## Blockers

Ninguno.

## filesAffected (revisados, sin edición productiva)

- `app/src/experiments/ExperimentPage.tsx`
- `app/src/experiments/ExperimentComparison.tsx`
- `app/src/retrieval-comparison/RetrievalComparisonPage.tsx`
- `app/src/control-plane/OperationalTraceSection.tsx`
- `app/src/control-plane/AnalysisRunDetailPage.tsx`
- `app/src/evidence/EvidenceDownload.tsx`
- `app/src/styles.css`
- pruebas asociadas de `experiments/`, `retrieval-comparison/`, `control-plane/` y `evidence/`

## Evidence

- Mock real: `http://127.0.0.1:5174/projects/prj_checkout_demo/experimental` con `VITE_DATA_SOURCE=mock`.
- Escenario `DEMO · proyecto PHP con PHPUnit`: perfil y runner visibles, configuración parcial con valores no disponibles y rótulos DEMO.
- Escenario `DEMO · error 503 LLM_PROVIDER_UNAVAILABLE (reintentable)`: alerta legible, correlation ID y `Reintentar` visibles.
- Escenario `DEMO · FAILED EXPERIMENT_WORKER_LOST`: alerta específica, detalle y ausencia de progreso/acción ficticia de reanudación.
- Revisión de `EvidenceDownload.test.tsx`, `ExperimentPage.test.tsx`, `ExperimentComparison.test.tsx`, `RetrievalComparisonPage.test.tsx` y `OperationalTraceSection.test.tsx`: controles, etiquetas, estados y regresiones cubiertos.

## recommendedNextStep

Presentar el corte al Human Reviewer con este veredicto UX y las evidencias contractual/técnica. Mantener `WI-CONSOLE-020` sin iniciar hasta que el usuario apruebe y se cierre `WI-CONSOLE-021`.
