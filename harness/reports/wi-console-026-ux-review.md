Modelo: ux-reviewer · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo low

# WI-CONSOLE-026 — revisión UX (ciclo 1 de 2)

**Veredicto: APPROVED** (sin bloqueantes). Revisión UX/accesibilidad/honestidad de mocks; no sustituye al reviewer técnico ni a la aprobación humana.

## Método

Navegador real, mock en `http://localhost:5174` (`VITE_DATA_SOURCE=mock VITE_AUTH_MODE=mock`, levantado aparte porque el 5173 estaba en modo live/Supabase y redirigía a GitHub real). Ruta `/projects/prj_checkout_demo/experimental`, escenarios elegidos en el selector y ejecutados. Contraste con `getComputedStyle` (color y fondo efectivo compuesto por alfa) y ratio WCAG 2.x.

## Textos

| Caso | Resultado observado |
|---|---|
| EXPERIMENT_WORKER_LOST | Título «El experimento no se completó», cuerpo «El experimento se interrumpió; vuelve a crearlo.», más «Detalle: DEMO: el worker dejó de responder y la cola agotó los intentos.» y rótulo DEMO · DATOS SIMULADOS. |
| UNSUPPORTED_PROJECT (demo-error-unsupported-project) | «Este proyecto no tiene framework JEST, VITEST o PHPUNIT detectado. · Correlation ID: demo-correlation-id». Una sola frase, sin «(DEMO)». |
| UNSUPPORTED_PROJECT en OE2 | No verificable en navegador: el mock no lo dispara en la comparación de retrieval (solo `startExperiment`). Queda cubierto por `RetrievalComparisonPage.test.tsx` contra la constante única; se confía en la prueba. |

## Tabla «Ver detalle por target y repetición»

- `demo-scenario-legacy`: columnas = Target, Repetición, Estrategia, Válida, Par, Posición, Failure type, Duración, Ejecución en Sandbox, Tokens, Contexto. **Sin Intento ni Evaluable**; no aparece «1.º», «Sí» ni «no disponible» en esas dos columnas. Los 12 «no disponible» restantes son Par/Posición/otros campos legítimamente ausentes.
- `demo-scenario-mixed-sandbox`: columnas Intento y Evaluable presentes. Filas: «2.º | No + marca técnicamente no evaluable», «1.º | Sí», «1.º | Sí». Sin «no disponible» en esas columnas.
- `demo-scenario-no-evaluable`: 3 filas «2.º | No + marca», 1 fila «1.º | Sí».
- Ningún escenario muestra ganador automático (búsqueda de «ganador/winner/mejor estrategia»: 0 coincidencias).
- Rótulo DEMO · DATOS SIMULADOS presente en cabecera y en los bloques de resultado/evidencia (3 apariciones en escenarios con resultado; en el error 422 solo el badge global de cabecera).

## Contraste medido (texto normal requiere ≥ 4.5:1)

| Elemento | Color | Fondo efectivo | Ratio | Tamaño |
|---|---|---|---|---|
| Mensaje de error (cuerpo, worker-lost y 422) | rgb(255,180,192) | rgb(24,10,13) | **11.54:1** | 16px |
| Título del error | rgb(255,216,216) | rgb(24,10,13) | 14.78:1 | 16px |
| Resumen de error en fila (infra/compilación) | rgb(255,180,192) | rgb(24,10,13) | 11.54:1 | 11px |
| Marca «técnicamente no evaluable» | rgb(234,231,247) | rgb(5,5,6) | **16.76:1** | 11px |
| Rótulo DEMO · DATOS SIMULADOS | rgb(229,185,104) | rgb(29,26,16) | 9.5:1 | 10px |

Todos superan 4.5:1. Capturas: tabla mixed-sandbox con columnas Intento/Evaluable y marca punteada legible (vista en navegador durante la revisión).

## Observaciones no bloqueantes

1. La tabla tiene scroll horizontal interno (1454px de contenido en 982px) al sumar las dos columnas; preexistente en diseño, solo ocurre cuando hay datos.
2. En el mensaje worker-lost el «Detalle: DEMO: el worker dejó de responder…» menciona «worker» y «cola», vocabulario interno; es texto del mock y va marcado DEMO, pero en live conviene confirmar que `failureMessage` de Core no filtre internals.
3. `app/src/retrieval-comparison/failureMessages.ts` mantiene su propio texto de worker lost («…antes de terminar.»), distinto en estilo al de experimentos; consistente con el alcance aprobado, pero quedará una divergencia de tono («vuelve a crearlo» vs sin acción).
4. Celdas Intento/Evaluable vacías en una fila sin dato dentro de una corrida mixta quedan sin texto: honesto, pero un lector asistivo recibe una celda vacía; considerar «—» (decisión de producto, no obligatoria).
5. Texto concatenado «No» + «técnicamente no evaluable» (en `textContent`) se separa visualmente por el inline-block con margen; para lectores de pantalla se anuncia seguido sin pausa, aceptable.

## Resumen

status: APPROVED · blockers: ninguno · filesAffected: `app/src/experiments/ExperimentComparison.tsx`, `app/src/experiments/failureMessages.ts`, `app/src/control-plane/errors.ts`, `app/src/api/mockBackend.ts` · recommendedNextStep: revisión humana del diff con este reporte y la decisión pendiente sobre «omitir» (sección c de `wi-console-026-sdd-verification.md`).
