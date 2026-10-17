# WI-CONSOLE-020 — Corte C: verificación final de adapters live

Modelo: leader · configurado gpt-6-luna · atendido unknown · esfuerzo xhigh

## Resultado

La corrección de Console hace obligatorios `evaluableRepetitions` y
`nonEvaluableRepetitions` en la respuesta y el modelo OE5. Ambos contadores se
propagan sin inferencia; con cero repeticiones evaluables, las tasas y las tres
medias de duración permanecen `null` y `failures` queda vacío. Los fixtures DEMO
conservan el rótulo de simulación y no se introducen ganadores ni CF/CO derivados.

## Evidencia

- Implementer corte C (`GPT-6 Luna / medium`, atendido `unknown`): seis archivos
  bajo `app/src/**`; la prueba focal de `liveMapping` pasó 14/14. No hubo cambios
  de Core, contratos ni Harness por el implementer.
- Console: 67 archivos y 724 pruebas pasaron en el conjunto focal final;
  `pnpm lint`, `pnpm build` y `git diff --check` pasaron.
- Core local: `/health` devolvió 200 y el conjunto ejecutado devolvió 141 archivos,
  2,076 pruebas aprobadas. El DTO OE5 V3 acepta `analysisRunId`,
  `symbolFilePath` y `symbolQualifiedName`; el inbox de Core marca
  `CS-CONSOLE-20261010-001` como `C-RESOLVED` por `WI-CORE-035`.
- Contract Sync: `implementation-delivery` y `before-review` de
  `WI-CONSOLE-020` no tienen eventos relevantes pendientes.
- UX reviewer corte C: `APPROVED`; los contadores se muestran, `null` se presenta
  como «sin datos», no hay ganador automático y DEMO sigue explícito.
- Contract reviewer corte C: ciclo 1 encontró la fixture inválida de cero
  evaluables; tras la corrección, ciclo 2 `APPROVED`.

## Límite explícito

Los endpoints protegidos de Core (`trace`, `evidence` y Functional Knowledge)
responden 401 sin sesión; por ello este reporte no afirma una llamada HTTP
autenticada ni un experimento PHP real. El piloto E2E requiere una sesión y un
Project PHP con PR/binding válidos. Es evidencia adicional de integración, no una
corrección pendiente del adapter ni una afirmación de que los mocks son live.

## Siguiente paso

Presentar el diff y esta evidencia al Human Reviewer. No cerrar el WI hasta su
veredicto; el E2E PHP se ejecutará al disponer del repositorio y el Project
autenticado.
