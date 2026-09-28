# WI-CONSOLE-009 — Evidencia de implementación

## Cambio

- La copia `spec/contracts/interoperability-contract.md` coincide byte por byte con el contrato actual de Core (`INTEROP-2.6`, fecha de corte `2026-09-27`). El delta revisado es ProjectLanguage (`TYPESCRIPT|PHP`), TestFramework (`JEST|VITEST|PHPUNIT`) y `language` en ProjectVersion, results e inventory DTOs.
- Los tipos compartidos en Console incorporan los DTOs/versiones y unions canónicos; el historial live propaga `language`/framework y los fixtures TypeScript declaran `TYPESCRIPT`.
- Pruebas tipadas cubren el mapeo `PHP/PHPUNIT` y una respuesta de inventario PHP. La vista permanece de cobertura y no expone botón ni mensaje que afirme generación/ejecución lista antes de `WI-CORE-013`.
- No se cambió UI productiva, rutas HTTP, mocks a datos PHP, Core, Sandbox, OAuth, Action Required ni autorización de ramas.

## Verificación

- Tests focalizados: `npm test -- src/analysis/api.live.test.ts src/inventory/InventoryPage.test.tsx` — 2 archivos, 6 tests passed.
- Suite completa: `npm test` — 53 archivos, 427 tests passed.
- `npm run lint` — passed.
- `npm run build` — passed; Vite reporta warning informativo de bundle principal (~999 kB minificado, umbral 500 kB), sin fallo de build.
- Harness tests: `node --test harness/*.test.mjs` — 19 passed.
- `node harness/validate-work-items.mjs`, `node harness/validate-harness.mjs`, `git diff --check` y comparación byte por byte del espejo INTEROP-2.6 con Core — passed.

Después de registrar `CS-CORE-20260927-001` como `C-RESOLVED`, el checkpoint `implementation-delivery` pasó: cero syncs relevantes pendientes; el evento objetivo consta entre los resueltos. Los cuatro eventos históricos clasificados `NOT_RELEVANT` están limitados a este WI y tienen reporte/digest en el Harness.
