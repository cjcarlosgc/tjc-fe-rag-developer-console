# WI-CONSOLE-042 — revisión independiente (reviewer)

Modelo: reviewer · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Veredicto: APPROVED** (ciclo 1 de 2). Hallazgos solo LOW/INFO; ninguno bloquea.

Alcance: corrección técnica de `3f6341c` (regularización retroactiva, `implementationAgent: cross`). La UX la revisa `ux-reviewer` en paralelo (`wi-console-042-ux-review.md`). No se editó código ni JSON de harness.

## Método anti-formato
`git show -w --stat` no neutraliza el reflujo de Prettier. Se extrajo `app/src` de `3f6341c~1`, se formateó con el `.prettierrc.json` nuevo y se hizo `diff -r` contra `3f6341c`. Resultado: los únicos diffs restantes son cambios reales, todos revisados línea por línea (no-test y test). CSS (`styles.css` → 9 archivos) no se revisó token a token; lo cubre ux-reviewer.

## Verificación por foco
- **api/polling.ts**: respeta `pollAfterMs` (ExperimentPage lo guarda del 202 y llama `pollDelayMs(acceptedPollMs, 560)`), acota a [250 ms, 30 s], ignora valores no finitos o <=0 y cae al fallback. Atajo de test (10 ms) único, solo con `MODE==='test'`. Los 9 `MODE==='test'` previos quedan sustituidos (grep: ya no hay ramas dispersas en código no-test). Nota: en las demás consultas (`context-explorer`, `control-plane` trace, `evidence`, `retrieval-comparison`, `run-comparison`) el valor es el fallback fijo (900/560), no un `pollAfterMs` de Core; igual que antes, sin regresión.
- **loadMockBackend / carga diferida**: único import estático de `mockBackend` fuera de tests es `loadMockBackend.ts` (dinámico); `test/setup.ts` es de pruebas. Todas las ramas `getDataSource()==='mock'` usan `loadMockBackend()`; las ramas live no lo tocan. Build reproducido: `mockBackend-*.js` 107.95 kB como chunk aparte, `index-*.js` 986.89 kB (cifras de cross: 108 / 987 kB, confirmadas). Los datos del mock (`demo-scenario-legacy`) no están en el chunk principal; solo la lista de etiquetas del selector (`demoExperimentOptions.ts`, pequeña, etiquetas `DEMO ·`, visible solo con mock). Rótulos `DEMO · DATOS SIMULADOS`, `DEMO · IDENTIDAD SIMULADA`, `DEMO · GITHUB SIMULADO`, `DEMO · ELIMINAR/REACTIVAR SIMULADO` presentes en el bundle; no se retiró ninguno y se añadió el de GitHub que pide la spec. No se presenta mock como live.
- **api/baseUrl.ts**: valida http(s), recorta barras finales, vacío = mismo origen; `socket.ts` reutiliza el `baseUrl` exportado de `client.ts` (sin duplicar). Tiene test. Ver hallazgo L2.
- **StatusBadge / EmptyState / PageHeader**: marcado equivalente al original (misma clase base `status-badge`, `empty-inline`, `page-heading`/`eyebrow`/`h1`, mismo orden). Diferencias menores de marcado: en `ProjectsPage` el separador " · " junto al badge del último Run pasó de `{' '}` + `· ` a ` ·{' '}` (mismo texto renderizado). Los tonos/clases usados coinciden con los previos.
- **routeTitles / 404 / errorElement**: patrones cubren las rutas de `router.tsx`; ruta desconocida deja que `NotFoundPage` fije el título; `errorElement` en `/login` y en el shell; `RouteError` trata 404 de router y error de render en español. Con tests (`routeTitles.test.ts`, `navigationAccessibility.test.tsx`, `sharedComponents.test.tsx`).
- **Autoridad / permisos / textos de dominio**: ningún archivo de `action-required/*` cambia lógica de roles ni gating (solo primitives, import dinámico del mock y breadcrumb). `roleGating.test.tsx` y los tests de MAINTAINER/ADMIN/WRITER/UNKNOWN solo cambian formato. El texto de `IntegrationsPage` sobre roles Admin es idéntico. Los cambios de texto son: "Proyectos"→"Projects" (glosario aprobado en design-system), etiquetas de `AnalysisRunStatus` en español (`status.ts`), "Volver a Proyectos"→"Volver a Projects"; los tests se actualizaron coherentemente y no se debilitó ninguna aserción (dos `findByRole`→`waitFor` en tests son equivalentes).
- **Secretos**: `vite-env.d.ts` solo tipa `VITE_AUTH_MODE/SUPABASE_URL/SUPABASE_ANON_KEY` (variables públicas por diseño); sin valores, tokens ni `.env` en el commit.
- **Refactor `Loaders.tsx`**: `ConstellationIcon` movido a `ConstellationIcon.tsx` y `canAnimateCanvas` a módulo propio; lógica idéntica.

## Reporte y registro
- `cross-fase4` y `wi-console-042-retroactive-verification.md` declaran la retroactividad e `implementationAgent: cross` (línea "RETROACTIVIDAD DECLARADA"). Evidencia real presente (lint, tipos, pruebas, build, format:check, contraste calculado, navegador) y coincide con lo que reproduje.
- WI-CONSOLE-005 y WI-CONSOLE-006 siguen `W-PLANNED` en `harness/work-items.json`; la cobertura parcial está documentada.
- WI-CONSOLE-042 en `W-IN_REVIEW`, `contractImpact: false`.

## Gates reproducidos (Node 22)
| Comando | Resultado |
|---|---|
| `node scripts/sdd-check.mjs` | SDD check OK |
| `node harness/validate-work-items.mjs` | OK (CONSOLE, 42 WI) |
| `node harness/validate-harness.mjs` | OK |
| `node harness/validate-completions.mjs` | OK (38 WI completados) |
| `pnpm lint` / `pnpm exec tsc -b --noEmit` / `pnpm format:check` | 0 / 0 / 0 |
| `pnpm test -- --maxWorkers=4` | 79 archivos, 840/840 |
| `pnpm build` | OK; index 986.89 kB, mockBackend 107.95 kB, css 67.58 kB |

Aviso de build: chunk principal > 500 kB (preexistente, declarado). Limpieza: `dist/` (ignorado) y temporales eliminados; sin servidores.

## Hallazgos
- **L1 (LOW)** `ProjectsPage`: "Projects conectados" mezcla español e inglés de forma poco natural; se aplicó el reemplazo "Proyectos"→"Projects" también donde el glosario podría preferir "Proyectos conectados" o "Projects" a secas. Criterio de idioma: decisión de ux-reviewer; no bloquea.
- **L2 (LOW)** `resolveBaseUrl` lanza al importar `client.ts`: una `VITE_CORE_API_URL` inválida rompe la carga de la app entera (pantalla en blanco) en lugar de un error en español. Falla rápido a propósito y el mensaje es claro en consola; considerar mostrarlo en `RouteError` en un WI posterior.
- **I1 (INFO)** `pollAfterMs` de Core solo se respeta en el sondeo del experimento; los demás sondeos usan valor fijo. Mejora futura, no regresión.
- **I2 (INFO)** Mediciones de 32 px (marca) y 37 px (skip link) < 40 px reportadas por el leader: se deja a ux-reviewer; no son de corrección técnica.
