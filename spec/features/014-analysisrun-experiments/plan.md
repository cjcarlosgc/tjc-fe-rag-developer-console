# 014 — Plan experimental de Console

1. Auditar los adapters y mocks existentes frente a INTEROP-2.6 §6.5 y retirar selección manual de ProjectVersion/TestTarget que no parta del Run.
2. Crear subtareas y WIs locales para HU17 al seleccionar implementación; coordinar con Core mediante Contract Sync antes de activar live.
3. Definir con Core el contrato HU18 de captura one-shot, incluidas carreras y vigencia del HEAD, antes de crear UI productiva. La demo puede mostrarlo solo como simulado.
4. Verificar métricas, trazas, permisos, estados terminales, accesibilidad y separación mock/live; cerrar gates y revisión independiente.

## Cortes SMART V3

`WI-CONSOLE-014` (OE2) depende de `WI-CORE-022`; `WI-CONSOLE-018` (presentación OE5) depende de `WI-CORE-025`; `WI-CONSOLE-019` (wording) es independiente. Los mocks siguen rotulados `DEMO · DATOS SIMULADOS` y los adapters live no se escriben contra campos que Core no haya publicado.

## Diseño técnico SMART V3

OE2 vive en el módulo nuevo `app/src/retrieval-comparison` (tipos, api, queries y página) con un CTA junto a «Run comparison →» en `AnalysisRunDetailPage`; no reutiliza `RunComparisonPage`, que auto-inicia con un único símbolo elegible. OE2 no usa los gates de OE5 y solo requiere un Run visible y rol Writer. Los modelos de OE5 se extienden en `experiments/types.ts` y `experiments/liveMapping.ts`; las tasas se muestran como diferencias neutras. El modelo (`gpt-6-luna`) y el esfuerzo de razonamiento los fija Core por `DEC-EXP-004`; Console solo los muestra.
