# WI-CONSOLE-008 — Evidencia de implementación

## Cambios

- Se importaron `CS-CORE-20260927-003` y `CS-GH-20260927-001` y se registró su recepción en Console.
- Se actualizaron las copias locales de SYSTEM e INTEROP desde Core y de GH-INTEROP desde GitHub Integration.
- Se alinearon las referencias vigentes de arquitectura, las features 011–016 y el transversal api-client con INTEROP-2.6/GH-INTEROP-1.2; `spec/README.md` refleja los espejos actuales.
- Los comentarios de adapters de Console nombran GH-INTEROP-1.2.
- Se agregó una prueba live simulada a `RunsPage.test.tsx`: con `projectId`, Console solicita el endpoint del Project, renderiza los Runs recibidos de Core y no usa el listado global como fallback. No se cambió la lógica ni el aspecto de la UI.

## Verificación de los espejos

| Contrato | SHA-256 Console | SHA-256 canónico | Resultado |
| --- | --- | --- | --- |
| `system-contract.md` | `287345915036cb55e3c681d9eaa3995cece16442fde56b24621ac2b663330aad` | `287345915036cb55e3c681d9eaa3995cece16442fde56b24621ac2b663330aad` | idéntico |
| `interoperability-contract.md` | `1f5cc04a7fc73388a49d1c1de4f79f873d0e95edec7db6e102b5f828f6a2f852` | `1f5cc04a7fc73388a49d1c1de4f79f873d0e95edec7db6e102b5f828f6a2f852` | idéntico |
| `github-integration-contract.md` | `9c58c9afa1d2bda201b604d82d606a57e86b3244578d14054f2cb5a9a7f5d9b6` | `9c58c9afa1d2bda201b604d82d606a57e86b3244578d14054f2cb5a9a7f5d9b6` | idéntico |

Las fuentes se verificaron en Core (`a99b3c315738966d956e9cb08833b2c42a7c85e5`) y GitHub Integration (`35bd9f2006240ebcd12ce0c3353d3a43bb1c1d0c`).

## Checks

- Prueba focalizada: `npm test -- src/control-plane/RunsPage.test.tsx src/control-plane/api.test.ts` — 2 archivos, 79 pruebas aprobadas.
- Suite completa: `npm test` — 53 archivos, 428 pruebas aprobadas.
- `npm run lint` — aprobado.
- `npm run build` — aprobado. Vite advirtió que el bundle JavaScript minificado supera 500 kB; no impidió el build.
- `git diff --check` — aprobado.
- `node harness/contract-sync.mjs check --checkpoint implementation-delivery --work-item WI-CONSOLE-008 --record` — aprobado, sin eventos relevantes pendientes; cuatro eventos anteriores a la baseline quedaron clasificados `NOT_RELEVANT` solo para este WI.
- `node harness/validate-work-items.mjs`, `node harness/validate-harness.mjs`, `node scripts/sdd-check.mjs` y `node harness/validate-completions.mjs` — aprobados después de importar y resolver los eventos.

No se modificaron Core ni GitHub Integration. No se desplegó ni se hizo cutover.
