# WI-CONSOLE-009 — Contract Sync review

- Evento: `CS-CORE-20260927-001` (`WI-CORE-012`), importado en Console el 2026-09-27.
- Revisión fuente funcional del evento: `242ffbfa3eb0a6251aa42cc83bbbc06f0e5be279` (`feat(core): index PHP project snapshots`). El usuario confirmó que la fuente de espejo es el archivo actual del checkout Core; respecto de ese commit, su único cambio local es la fecha de corte `2026-09-27`, que Console también replica. El commit fuente se conserva sin reescritura.
- Alcance: `spec/contracts/interoperability-contract.md`, DTOs de ProjectVersion e inventario.
- Resultado: Console coincide byte por byte con el contrato actual INTEROP-2.6 del checkout Core. El diff desde INTEROP-2.5 contiene el bump de versión, la fecha de corte `2026-09-27`, `ProjectLanguage = TYPESCRIPT|PHP`, `TestFramework = JEST|VITEST|PHPUNIT`, y los campos `language` requeridos en ProjectVersion, resultados e inventario. Los campos `detectedFramework` aceptan `PHPUNIT`.
- Compatibilidad: cambio aditivo de respuestas; `language` requerido se satisface con `TYPESCRIPT` para versiones existentes. No se agregan rutas, requests ni efectos externos.
- Límite de Console: el framework detectado solo describe el inventario; Console no infiere disponibilidad de generación o ejecución. Core aún requiere `WI-CORE-013` para ese soporte.
- Comparación: no hay cambio de OAuth, Action Required ni autorización de ramas en la revisión fuente indicada; esas diferencias no forman parte de este Contract Sync.
- Decisiones: ninguna decisión PENDING cuyo `Blocks` alcance el cambio de tipos/demostración mock.
- Evaluación preliminar del implementer: el delta aditivo es compatible y su alcance está bien acotado; la aprobación del gate `contractReviewed` queda pendiente del handoff independiente del rol `contract-reviewer`.

La implementación y sus pruebas se documentan en `harness/reports/wi-console-009-implementation.md`.
