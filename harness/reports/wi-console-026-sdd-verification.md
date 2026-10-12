Modelo: sdd-analyst · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo low

# WI-CONSOLE-026 — verificación SDD

**Fecha:** 2026-10-12 · **WI:** WI-CONSOLE-026 (HU12/HU15/HU17, ST-CONSOLE-028, W-SELECTED) · **Veredicto:** APPROVED_FOR_APPROVAL (con una nota de alcance para el usuario, ver c).

## Metadatos del WI
`storyIds` HU12/HU15/HU17 válidos; `taskIds` ST-CONSOLE-028 pertenece al `tasks.md` de la Feature 014 (línea 6, T-READY); `component` CONSOLE; `contractImpact=false`; `caseIds=[]`. Alcance aprobado por el usuario en `wi-console-026-scope-approval.md`. Sin desviaciones.

## (a) Qué dicen la spec y los contratos

- **spec 014 (spec.md, plan.md):** no definen texto de `EXPERIMENT_WORKER_LOST`, de `UNSUPPORTED_PROJECT` ni mencionan `attempt`/`technicallyEvaluable`/columnas Intento/Evaluable. Solo `tasks.md` ST-CONSOLE-028 enuncia las tres decisiones. La spec **no exige** «no disponible» ni omitir para esos campos; la regla «no disponible» de spec.md:32 es solo de Precision/Recall sin verdad de terreno.
- **INTEROP §6.5.1 (líneas ~284, 380-387):** `failureCode` es cadena abierta; el contrato **no prescribe copy**. Nota informativa (l. 284) dice que un FAILED «puede reanudarse», pero no define ruta de reanudación; el comentario de `failureMessages.ts` ya lo reconoce. `ExperimentRepetitionV27Additions`: `attempt: number` «no nulo (1 en filas previas)» y `technicallyEvaluable: boolean` «no nulo (true en filas previas)» — es decir, Core emite 1/true (nunca null) en filas previas; `pairId`/`pairPosition` sí son null en previas. `UNSUPPORTED_PROJECT` (l. 1465, §6.5.1/§6.15): 422 sin copy prescrito.
- **INTEROP §6.16 (l. 1152, 1247, 1283-1288):** `generation[].attempt: number | null`; `sandbox[].attempt: number` y `experimental[].attempt: number`, `technicallyEvaluable: boolean`, sin null. «Un dato no observado es null» aplica a los campos listados (executionId, requestId, …) pero **no** a attempt/technicallyEvaluable de `experimental[]`/`sandbox[]`.
- **SYSTEM:** nada específico sobre estos textos o campos (solo reglas generales de honestidad y mocks rotulados).
- **Consecuencia:** el cambio es de copy de Console y de fidelidad del mock; no hay contrato que modificar. Contra Core real nunca llegarán null (Core emite 1/true), por lo que `liveMapping`/`ExperimentComparison` solo ven null en el mock demo (o ante un Core que se desvíe).

## (b) Decisiones aplicables (Blocks)
Revisadas las decisiones de `spec/contracts/system-contract.md` y `spec/constitution/planning-model.md`: ninguna `PENDING`/`PROPOSED` tiene `Blocks` que alcance WI-CONSOLE-026. `DEC-VAL-001` (Blocks: ingestión/despliegue con código empresarial, evidencia empresarial) y `DEC-INF-001` no aplican a copy ni a mock. `DEC-EXP-FK-001` está APROBADO y no se toca. Gate: `blockingDecisionIds=[]`, `nonBlockingDecisionIds=[DEC-VAL-001, DEC-INF-001]` (no alcanzan el WI). **No bloquea.**

## (c) Tensión «omitir» vs. bundle sin null

Hallazgos:
1. **Mock actual inventa un valor distinto del contrato:** `evidenceExperimentRepetition` (mockBackend.ts ~2037-2048) usa `attempt ?? 1` (coincide con «1 en filas previas») pero `technicallyEvaluable: rep.technicallyEvaluable === true`, que convierte null en **false** (el contrato diría `true` en previas). Es el «1/false inventado».
2. La Console UI sí admite null (`experiments/types.ts:45-47`, `liveMapping.ts:174`); `orUnavailable` hoy muestra «no disponible».
3. El contrato del bundle no tiene representación de «ausente» para `experimental[].attempt/technicallyEvaluable` ni `sandbox[].attempt`; solo `generation[].attempt` admite null.

Interpretación mínima propuesta (sin tocar contrato ni tipos `evidence/types.ts`):
- **Tabla ExperimentComparison (UI):** omitir las columnas «Intento» y «Evaluable» **solo cuando ninguna repetición** del resultado trae el dato (`attempt === null` y `technicallyEvaluable === null` en todas). Si alguna lo trae, se mantienen ambas columnas y la celda sin dato queda vacía (sin texto «no disponible», sin 1/false). Si algún día se prefiere «—» en el caso mixto es una decisión de copy menor; el caso mixto es inalcanzable con los fixtures actuales (todas las repeticiones de un experimento son de la misma época). `technicallyEvaluable=false` con `attempt=2` se sigue mostrando, incluida la marca «técnicamente no evaluable».
- **Mock del bundle (`evidenceExperimentRepetition`):** en una repetición legacy (`attempt === null` y `technicallyEvaluable === null`) **no emitir** la fila `experimental[]` ni la fila `sandbox[]` (en legacy `executionDurationMs` es null, así que no hubo ejecución y no hay `executionId`); `generation[]` se mantiene con `attempt: null` (admitido). Donde el dato existe, se emite tal cual (`rep.attempt`, `rep.technicallyEvaluable`), sin `=== true` ni `?? 1`. Los tipos del bundle y el contrato no cambian: el mock omite filas en un array, no emite null.
- Esto implica que el mock deja de ser fiel a «Core emite 1/true en previas». Es una desviación deliberada y aprobada por el usuario; debe quedar anotada en el comentario de la función y en el reporte.

**Marcas para el usuario (no bloquean, requieren que confirmes que la interpretación es la que querías):**
- «Omitir la fila» se interpreta como (i) columnas de la tabla cuando ningún dato existe y (ii) filas `experimental[]`/`sandbox[]` del bundle mock. Si en cambio querías mantener la fila del bundle con valores del contrato (1/true, como hace Core), eso contradice el criterio de aceptación 3 y sería `DECISION_REQUIRED`. Con el criterio aprobado tal como está redactado no hay decisión pendiente: **no** marco DECISION_REQUIRED, pero lo dejo visible.
- Nada requiere cambiar contrato ni DTO; si Core quisiera confirmar la semántica de «fila previa», sería un tema de Contract Sync fuera de este WI.

## (d) Archivos de `app/` a tocar, criterios y pruebas

**Código**
1. `app/src/experiments/failureMessages.ts`: `EXPERIMENT_WORKER_LOST` → «El experimento se interrumpió; vuelve a crearlo.»; actualizar el comentario (ya no «puede reanudarse»).
2. `app/src/control-plane/errors.ts` (l. 31): `UNSUPPORTED_PROJECT` es **la fuente única correcta** (la mapea `bindingErrorMessage`, que sirve a experimentos y a OE2 y descarta el `message` crudo de Core). Mantener el texto vigente «Este proyecto no tiene framework JEST, VITEST o PHPUNIT detectado.» (incluye PHPUNIT, correcto tras WI-CORE-029); exportar la constante para que el mock la reutilice.
3. `app/src/api/mockBackend.ts`: (i) l. ~1130, el `ApiError` demo usa la constante compartida en lugar de «El proyecto no tiene framework JEST, VITEST o PHPUNIT detectado (DEMO).» (variante real hoy; la UI ya la ignora pero es la segunda fuente); (ii) `evidenceExperimentRepetition` (~2000-2050): omitir `experimental[]` y `sandbox[]` en repeticiones legacy, sin `=== true` ni `?? 1`; ajustar el llamador que construye los arrays y el comentario; (iii) el texto DEMO del failureMessage l. 1067 («la cola agotó los intentos») no promete reanudar: no tocar. Importar la constante desde `control-plane/errors` en el mock: verificado que `errors.ts` no importa el mock, sin ciclo; confirmar al implementar.
4. `app/src/experiments/ExperimentComparison.tsx` (~176-206): columnas Intento/Evaluable condicionadas a que alguna repetición traiga el dato; celdas sin dato vacías; `orUnavailable`/`evaluableText` quedan para `pairId`/`pairPosition`.

**Pruebas**
5. `app/src/experiments/ExperimentPage.test.tsx`: l. ~184 (texto nuevo) y ~260 (verificar su aserción de copy); l. 219-226 sigue válido (no depende del texto exacto salvo «no tiene framework JEST, VITEST o PHPUNIT detectado»).
6. `app/src/control-plane/errors.test.ts` l. 116 y `app/src/retrieval-comparison/RetrievalComparisonPage.test.tsx` l. 184: preferible aserción contra la constante compartida (o dejar el literal); añadir una prueba que fije que experimentos y OE2 muestran el mismo texto.
7. `app/src/evidence/api.test.ts` (~l. 88 `every(technicallyEvaluable boolean)`) y `app/src/api/mockBackend.test.ts`: añadir caso de bundle de un experimento legacy sin filas `experimental[]`/`sandbox[]` y caso con datos (attempt=2, technicallyEvaluable=false) que sí las emite.
8. `app/src/experiments/ExperimentPage.test.tsx`/test de `ExperimentComparison`: legacy sin columnas «Intento»/«Evaluable» ni «1»/«No» inventados; con datos las columnas y la marca siguen visibles.
9. Se descarta tocar `liveMapping.ts` y `evidence/types.ts` (sin cambio de contrato). `liveMapping.test.ts` 101 sigue válido.

Fuera de `app/`: marcar ST-CONSOLE-028 en `tasks.md` solo con evidencia, por el leader.

**Criterios verificables**
- C1: ningún literal «puede reanudarse» en `app/src`; la alerta de WORKER_LOST muestra el texto nuevo; EXPERIMENT_FAILED y códigos desconocidos sin cambios.
- C2: `grep` de «framework JEST, VITEST» en `app/src` (no tests) devuelve una sola definición; la ruta de experimentos y la de OE2 renderizan idéntico texto.
- C3: bundle mock legacy no contiene `attempt: 1`/`technicallyEvaluable: false` inventados; con datos se conservan; la UI omite columnas solo si ninguna repetición trae el dato.
- C4: sin cambios en contratos, DTO, API, adapters live, `evidence/types.ts`; PHP demo sin tocar; rótulo DEMO · DATOS SIMULADOS intacto.
- C5: lint, `tsc -b --noEmit`, pruebas, build, validadores SDD/Harness y revisión `ux-reviewer` (contraste computado) verdes antes de la revisión humana.

**Riesgos**
- Omitir filas de un array contractual en el mock puede romper consumidores que unen `experimental[]` con `generation[]` por `repetition` (la vista de evidencia/`EvidenceDownload`): verificar que toleran la ausencia.
- Celda vacía en tabla: a11y menor; la tabla ya tiene `<th>` y la columna solo existe si hay datos.
- El texto «vuelve a crearlo» asume que Console permite crear un experimento nuevo desde esa pantalla; sí lo hace (creación manual), sin botón de reanudar.
- Divergencia intencional con la nota de INTEROP l. 284 («puede reanudarse»): es copy de Console, no contrato; no debe editarse el espejo.

## (e) Impacto contractual
No. Sin DTO, rutas, enums ni errores nuevos; solo copy y mock. `contract-reviewer` **no necesario** (coincide con la revisión de Contract Sync ya registrada). Si se quisiera pedir a Core aclarar «fila previa» o la reanudación, sería un asunto aparte.

## (f) Veredicto
**APPROVED_FOR_APPROVAL.** Sin `DECISION_REQUIRED` ni `BLOCKED`. Pide al usuario confirmar la interpretación de «omitir» descrita en (c) al aprobar el alcance de implementación.
