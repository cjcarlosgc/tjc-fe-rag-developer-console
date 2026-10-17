# WI-CONSOLE-020 — Implementación de adapters live SMART V3

Modelo: implementer · configurado `gpt-6-luna` · atendido unknown · esfuerzo low

## Corte entregado

- `UNKNOWN` y Functional Knowledge usan las rutas publicadas de `INTEROP-2.7 §6.11`; la abstención se transmite como `choice: "UNKNOWN"`, sin que Console compute escenario, autoridad ni continuación.
- OE2 usa las cuatro rutas live de §6.15 y conserva el `Idempotency-Key`; el cuerpo es exclusivamente `analysisRunId`, `symbolFilePath` y `symbolQualifiedName`.
- OE5 usa ese mismo anclaje publicado de Run/símbolo. La pantalla live recibe el Run desde el enlace de su detalle (`?analysisRunId=...`), de modo que no deriva un target del inventario. El mock DEMO conserva sus escenarios y rótulo.
- Trace y las tres variantes de `/evidence` usan las rutas de §6.16. Evidencia conserva el texto HTTP crudo con `apiRequestText` y solo lo parsea para la vista; no reserializa la descarga.
- Se añadieron/actualizaron pruebas live de adapters para rutas, cuerpos y `Idempotency-Key`; se conserva la semántica de `null` y no se deriva un veredicto de OE2/OE5.

## Verificación realizada

```text
cd app && npx vitest run src/action-required/api.test.ts src/retrieval-comparison/api.test.ts src/control-plane/operationalTrace.test.ts src/evidence/api.test.ts src/experiments/api.live.test.ts src/experiments/liveMapping.test.ts src/experiments/ExperimentPage.test.tsx
# 7 files passed, 113 tests passed

cd app && npm run build
# passed (TypeScript + Vite)

curl --connect-timeout 2 http://localhost:3000/health
# HTTP 000, curl 7: connection refused
```

## Límite de validación real contra Core local

No se pudo ejecutar HTTP real: `localhost:3000` no estaba levantado (curl 7, conexión rechazada). No se sustituyó por mock ni se usaron credenciales externas.

Además, el checkout local de Core inspeccionado en `/Users/jean/Tesis/workspaces/tjc-be-rag-core-api`, `HEAD 5e15577fe4ae6ba256a1cb00b61715b6c3d2874b`, todavía declara en `app/src/experiments/dto/create-experiment.dto.ts` el DTO heredado `projectId`/`targetId`, mientras que `INTEROP-2.7 §6.5` y la puerta externa de este WI requieren `analysisRunId`/`symbolFilePath`/`symbolQualifiedName`. Console implementa el contrato canónico publicado; esta diferencia requiere verificación/Contract Sync por el líder antes de declarar integración live efectiva. No se modificó Core.

## Estado

Implementación local y pruebas focales: lista para revisión. Validación HTTP contra Core real: pendiente de que el Core local correcto esté disponible.
