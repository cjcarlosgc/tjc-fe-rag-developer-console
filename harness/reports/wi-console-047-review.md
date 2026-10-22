# WI-CONSOLE-047 — revisión independiente (ciclo 1 de 2)

Modelo: reviewer · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Rango:** `git diff 6049f3b..HEAD` (ee65422, 47f3fd3, a61e984, 28c9cf8; docs 16a8fcf, b476200). 85 archivos, todos bajo `app/src/`, `harness/` y `spec/`.
**Veredicto: APPROVED** (con observaciones no bloqueantes).

## Gates reproducidos por el reviewer

| Gate | Resultado |
|---|---|
| `pnpm lint` | exit 0 |
| `pnpm exec tsc -b --noEmit` | exit 0 |
| `pnpm test --maxWorkers=4` | 92 archivos, 934 pruebas, todas pasan (exit 0) |
| `pnpm build` | exit 0 |
| `pnpm format:check` | exit 0 |
| `pnpm contracts:check` | exit 0 |
| `node scripts/sdd-check.mjs` | SDD check OK |
| `node harness/validate-work-items.mjs` | passed (47 WI) |
| `node harness/validate-harness.mjs` | passed |
| `validate-completions` | no corrido (se ejecuta al cierre) |

## Verificación por punto

1. **Seis observaciones y alcance:** cumplidas. Táctil (`.brand`, `.skip-link`, `.project-tabs a` con `min-height: var(--target-min)`), Focus Mode sin desborde (`overflow-wrap` en `h2`, además `.pr-ref` y `.action-required-list` para 320 px), glosario, conteos del demo, pantalla de configuración y verificación a11y con informe que declara lo no probado (lector de pantalla, migas de pan y «Ver todos» < 40 px, focus trap sin diálogos modales). Los pendientes están declarados y fuera del listado aprobado.
2. **Fuera de alcance:** ningún cambio en DTO, rutas, contratos, `contracts/`, realtime, socket ni hooks de realtime; sin archivos nuevos en `ui/` (solo pruebas); `reasoningEffortMessage` no tocado; sin cambios fuera de `app/src`, `harness`, `spec`. `ConfigurationErrorScreen` es composición local de `main.tsx` (props `{ issue }` específicas, sin variantes ni API genérica, usa clases existentes `content`, `page-heading`, `feedback error-state`); **no la considero primitive**, sin `DECISION_REQUIRED`.
3. **Traducción:** revisé todo el diff no-test (≈55 archivos). Solo cambian texto visible, comentarios, `aria-label`, mensajes de `ApiError`/`errors.ts` y etiquetas de pestañas. Los códigos de error (`PROJECT_NOT_FOUND`, `WORKSPACE_ADMIN_REQUIRED`, etc.), `role`, `target.kind`, `scenarioKey`, enums y claves de mapas quedan intactos; el filtro de inventario conserva los valores `ALL/MISSING` y traduce solo el rótulo; los rótulos `DEMO` y «Functional Knowledge» siguen; no se reinterpreta MAINTAINER/ADMIN. No encontré ninguna cadena traducida usada como identificador ni comparada con `===`. Una cadena traducida sí cambia texto de mensaje (`UNSUPPORTED_PROJECT_MESSAGE`), pero es una constante compartida por mock y prueba.
4. **Mock:** `deriveActionRequiredRunStatus` es coherente (preguntas PENDING mandan; Run no vigente no entra; PR #17 queda OBSOLETE, fuera de la bandeja; `mockListActionRequired` además filtra por status). El Run `arun_checkout_pr52` conserva ids y forma de contrato (`AnalysisRunDetailResponse`). Riesgo de `throw` al cargar: bajo. Los 5 seeds con `ACTION_REQUIRED` (pr42, pr24, pr52, org_metrics_pr15, org_writer_pr21) tienen pregunta PENDING vigente; la prueba de coherencia carga el seed completo y pasa. El throw solo salta si alguien introduce un seed incoherente, que es el efecto buscado.
5. **Arranque:** `main.tsx` valida con `getDataSource()` + `resolveConfigurationError` antes de cargar nada; `router` y `AuthProvider` se cargan con `import()` solo si la configuración es válida; en live inválida muestra la pantalla; en mock nunca bloquea y `client.ts` cae a mismo origen. La pantalla no recibe ni muestra el valor (la prueba usa `ftp://user:secret@host` y verifica que `secret` no aparezca). `StrictMode`, `QueryClientProvider`, `AuthProvider` y `RouterProvider` se mantienen; el build genera chunks sin errores. El valor válido no cambia (`baseUrl` idéntico sin barra final). `VITE_GITHUB_INTEGRATION_API_URL` y Supabase no se tocan.
6. **Pruebas:** sin `.skip`/`.only`/`xit`/`xdescribe` (la única coincidencia es el nombre `.skip-link`); sin reloj real (`canAnimateCanvas` no usa temporizadores; main/client usan `vi.resetModules` y `stubEnv`). Las guardas CSS están rotuladas como débiles y fallan si se quita la declaración (el `ruleBody` devuelve `''` y `toContain` falla); la de reduced motion incluye autocomprobación del detector (300 ms rechazado, `none` aceptado). La prueba de coherencia del mock tiene lista cerrada de ids y conteos por Run, por lo que no es tautológica pese a que el filtro del inbox deriva del status; un cambio en los seeds la rompe.
7. **AppShell y CSS:** `aria-label` del nav «Navegación principal» intacto; el enlace Action Required fija nombre completo `Action Required, N pendientes en todos tus Workspaces` (comienza con el texto visible, cumple label-in-name) y el badge es `aria-hidden`. `.pr-ref` y `.action-required-list` solo añaden `min-width: 0`/`overflow-wrap`/`minmax(0,1fr)`; sin regresión.

**Registro:** WI-CONSOLE-005 y 006 siguen `W-PLANNED`. WI-CONSOLE-047 está `W-IN_REVIEW` en `work-items.json` y `state.json` (`activeWorkItem`) con campos coherentes; `ST-CONSOLE-049` figura `T-IN_PROGRESS` en `spec/features/010-product-experience/tasks.md`; Contract Sync con 4 eventos `NOT_RELEVANT` motivados. El árbol de trabajo estaba limpio.

## Hallazgos (todos no bloqueantes)

1. **Menor, `app/src/api/mockBackend.ts:~1104`:** el comentario del `actionRequiredRuns.set('arun_checkout_pr52', …)` dice «sin AnalysisRun propio en control-plane», pero este WI le añadió uno (líneas ~1357-1391). Actualizar el comentario.
2. **Menor, `app/src/main.tsx`:** si el `import()` dinámico falla (chunk no disponible), la promesa queda sin `catch` y la página en blanco. Pasa solo con despliegue roto; sugerido, no exigido.
3. **Menor, proceso:** `CHANGELOG.md` figura en `specPaths` del WI pero no se tocó en el rango; confirmar si se actualiza al cierre.
4. **Observación (preexistente, no introducida):** tras responder una pregunta en el mock, el `status`/`actionRequiredCount` del Run no se recalcula (solo `arun_billing_pr24` cambia a `BEHAVIORAL_MISMATCH`); el inbox sigue coherente porque filtra la pregunta, pero el estado del Run puede quedar `ACTION_REQUIRED`. Fuera de alcance.
5. **Declarado por el implementer (aceptado):** objetivos < 40 px en migas de pan y «Ver todos», nombre en mayúsculas por `text-transform`, lector de pantalla real no probado.

## Resumen

`status`: APPROVED. `blockers`: ninguno. `recommendedNextStep`: corregir el comentario del hallazgo 1 si el leader lo desea, esperar el `ux-reviewer` independiente y ejecutar `validate-completions` al cierre. Archivos de evidencia: `harness/reports/wi-console-047-{scope-approval,sdd-verification,implementation,a11y-verification}.md`.
