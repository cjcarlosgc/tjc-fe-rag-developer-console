Modelo: implementer · configurado claude-haiku-5-5 · atendido unknown · esfuerzo low

# WI-CONSOLE-032 — implementación

## Corte A

**Estado propuesto:** `CORTE_A_LISTO` pendiente de revisión humana. No es cierre del WI (faltan corte B y revisión del usuario).

### Alcance ejecutado

1. `app/src/control-plane/queries.ts`
   - `isTerminalPublicationStatus` (PUBLISHED|FAILED|STALE|CLOSED) e `isInProgressPublicationStatus` (PENDING|PUBLISHING).
   - `publicationPollIntervalMs(state, testMode?)`: `false` en terminal o tras error; en curso, `pollAfterMs` si es número >0, si no 2000 ms; en modo test 10 ms.
   - `usePublication(publicationId, pollAfterMs?)`: `useQuery` sobre `GET /test-publications/{id}` con `refetchInterval` derivado del estado; reintentos finitos (2) solo para errores de red/5xx, ninguno para 4xx.
   - `useRefreshOnPublicationTerminal(analysisRunId, publication)`: invalida `proposals` y `run` una sola vez por `publicationId` al llegar a terminal (ref, sin efecto repetido).
   - `usePublishTests`: el `onSuccess` ya no invalida en el POST. Se añade `onError` que invalida proposals/Run solo para `TEST_PUBLICATION_PROPOSAL_NOT_AVAILABLE` y `TEST_PUBLICATION_INVALID_RUN_STATUS` (relectura tras 409/422 de dominio).
   - Clave `controlPlaneKeys.publication(id)`, la misma clave que ya usaba la página.

2. `app/src/api/mockBackend.ts`
   - `POST` devuelve `202 PENDING` (pollAfterMs 300); la publicación queda `PENDING`, propuestas siguen `AVAILABLE`.
   - `GET` transita por lecturas: 1.ª lectura `PENDING → PUBLISHING`; 2.ª lectura al terminal. `PUBLISHED` marca propuestas `PUBLISHED`, con `branchName` `rag-tests/pr-<n>-<sha7>`, companion PR y URL https.
   - Escenarios deterministas por Run (`publicationJobs` + `DEMO_PUBLICATION_OUTCOME_BY_RUN`):
     - `arun_checkout_pr49` → `FAILED`, `failureMessage` rotulado «DEMO · DATOS SIMULADOS: …».
     - `arun_billing_pr17_2` → `STALE`, rotulado igual.
   - Códigos alineados con el contrato: `TEST_PUBLICATION_INVALID_RUN_STATUS` 409, `TEST_PUBLICATION_PROPOSAL_NOT_AVAILABLE` 422, `TEST_PUBLICATION_NOT_FOUND` 404 (antes `RUN_NOT_PUBLISHABLE`, `PROPOSAL_NOT_AVAILABLE`, `PUBLICATION_NOT_FOUND`; ninguna otra referencia en `src/`).
   - Los `Map` nuevos se declaran junto a `testPublications` (el `resetMockBackend()` de carga del módulo los usa).

3. Ajustes fuera del alcance literal (motivo: mantener coherencia de la demo tras el cambio de mock)
   - `app/src/control-plane/AnalysisRunDetailPage.tsx`: `PublishSection` sustituye su `useQuery` inline por `usePublication(publicationId)` y añade `useRefreshOnPublicationTerminal`. Sin él, la demo se quedaba en `PUBLISHING` sin sondeo y el test existente «Companion PR publicado» fallaba. No hay UI nueva ni cambio de render; el progreso, `role="status"`/`alert` y el botón son del corte B.
   - `app/src/control-plane/api.test.ts` (HU39/HU40): se añade una lectura intermedia que espera `PUBLISHING` antes de `PUBLISHED`. Motivo: la transición del mock es el cambio aprobado.

4. Pruebas nuevas: `app/src/control-plane/publicationPolling.test.tsx` (14 casos)
   - Clasificación de estados; `publicationPollIntervalMs` (terminal, error, pollAfterMs válido, fallback 2000, modo test).
   - Transiciones del mock PENDING→PUBLISHING→PUBLISHED con propuestas `PUBLISHED` solo al terminal; FAILED y STALE con rótulo DEMO; 422 y 409 de dominio.
   - Hook `usePublication` sondea hasta PUBLISHED; sin `publicationId` no consulta; `useRefreshOnPublicationTerminal` invalida una sola vez en terminal y no invalida en curso.

### Archivos tocados (corte A)

- `app/src/api/mockBackend.ts`
- `app/src/control-plane/queries.ts`
- `app/src/control-plane/AnalysisRunDetailPage.tsx`
- `app/src/control-plane/api.test.ts`
- `app/src/control-plane/publicationPolling.test.tsx` (nuevo)

No se tocaron `harness/state.json`, `harness/work-items.json`, `spec/`, DTO, rutas ni contratos. No hubo commit ni push. No se arrancó ningún servidor dev. El vite PID 27708 no se tocó.

### Evidencia (app/)

- `npm run lint`: sin errores.
- `npx tsc -b --noEmit`: sin errores.
- `node node_modules/vitest/vitest.mjs run --maxWorkers=2`: 68 ficheros, 762 pruebas, todas en verde.

### Observaciones para el corte B y la revisión

- `traceFor` (trace operativo) toma la publicación más reciente sin mirar el estado: la traza mock muestra `PRESENT` también en `PENDING`/`FAILED`/`STALE`. Las pruebas de trace existentes dependen de ese comportamiento inmediato, así que no se cambió. Decidir en revisión si la traza debe reflejar el estado.
- El mock permite un segundo POST mientras una publicación está en curso (las propuestas siguen `AVAILABLE` hasta terminal). La UI del corte B debe impedir duplicados con `isInProgressPublicationStatus`.
- `usePublication` no se usa con `pollAfterMs` real desde la UI: `PublishSection` aún no guarda el `pollAfterMs` del `202` (lo hará el corte B; hoy usa fallback 2000 ms o 10 ms en test).

### Siguiente paso recomendado

Revisión humana del corte A (diff y evidencia arriba). Después, corte B (UI, README y `.env.example`) con revisión de `ux-reviewer`.

## Corte B

**Estado propuesto:** `CORTE_B_LISTO` pendiente de revisión de `ux-reviewer` y del Human Reviewer. No es cierre del WI.

### Alcance ejecutado

1. `app/src/control-plane/AnalysisRunDetailPage.tsx` (`PublishSection`)
   - Guarda `publicationId` y `pollAfterMs` del `202` y los pasa a `usePublication(publicationId, pollAfterMs)`.
   - Botón «Publicar N propuesta(s)» con `aria-disabled="true"` (no `disabled`, conserva foco); el `onClick` ignora el clic si hay publicación en curso o mutación pendiente. Texto «Publicando…» mientras `publishMutation.isPending` o la publicación está `PENDING`/`PUBLISHING`.
   - Sin botón si no hay propuestas `AVAILABLE` ni publicación en curso, si el rol no es Writer, o si la publicación terminó en `FAILED`/`STALE`/`CLOSED` (sin reintento automático ni botón que reenvíe lo mismo).
   - Región `role="status"` `aria-live="polite"` siempre montada: «Publicación en curso: PENDING…» / «PUBLISHING…» y «Publicación finalizada: <estado>» al terminal.
   - `PUBLISHED`: «Companion PR publicado», rama, número de PR y enlace «Abrir en GitHub» solo si la URL es http/https (`rel="noopener noreferrer"`, `target="_blank"`, texto accesible «se abre en una pestaña nueva»).
   - `FAILED`, `STALE`, `CLOSED`: `role="alert"` con copy propio y `failureMessage` cuando existe. STALE explica que el HEAD cambió y el Run vigente es otro; CLOSED indica que el companion PR se cerró y no se reabre.
   - Error del POST: `role="alert"` con `bindingErrorMessage` (sin reintento automático). Fallo al consultar la publicación: `role="alert"` que pide recargar.
   - Propuestas `PUBLISHED` sin `publicationId` (recarga): «Las propuestas ya fueron publicadas en un companion PR.», sin enlace ni rama inventados.
   - Rótulo `DEMO · DATOS SIMULADOS` (`demo-stamp`) cuando `isMockDataSource()` y hay publicación.
   - Refresco de propuestas y Run al terminal: `useRefreshOnPublicationTerminal` (corte A), sin cambios.

2. `app/src/control-plane/publicationView.ts` (nuevo): `safePublicationUrl` devuelve la URL solo si es http/https; si no, `null`.

3. `app/src/styles.css`: reglas mínimas `.button[aria-disabled="true"]` (opacidad y cursor como `:disabled`, sin elevación al pasar el ratón), `.publication-status`, `.publication-url` (color `#e0d5ff` sobre `#0b0b0d`, subrayado) y `.publication-panel` con `overflow-wrap: anywhere`. Se reutilizan `structured-error`, `success-note`, `demo-stamp`, `inline-error` y el foco global `a:focus-visible`.

4. Pruebas
   - `app/src/control-plane/PublishSection.test.tsx` (nuevo, 3 casos): PENDING → PUBLISHING → PUBLISHED con enlace seguro (`rel`, `target`), botón `aria-disabled` con foco conservado y un clic extra que no envía segundo POST (`createTestPublication` espiado, 1 llamada); FAILED (`arun_checkout_pr49`) y STALE (`arun_billing_pr17_2`) con `role="alert"` y sin botón; recarga con propuestas `PUBLISHED` sin `publicationId` (aviso sin enlace y sin botón).
   - `app/src/control-plane/publicationView.test.ts` (nuevo, 2 casos): solo http/https; `javascript:`, `data:`, `ftp:`, URL inválida, nulo y vacío no se enlazan.
   - `app/src/control-plane/AnalysisRunDetailPage.test.tsx` (HU39/HU40): la aserción de los badges `PUBLISHED` pasa a `waitFor`, porque las propuestas ahora se refrescan al llegar a terminal y no en el POST. Es un cambio de sincronización, no de expectativa.

5. Documentación
   - `README.md` (raíz): sección «Pruebas live: configuración de URLs». `VITE_CORE_API_URL` para todas las rutas, incluida la publicación de pruebas; `VITE_GITHUB_INTEGRATION_API_URL` debe apuntar al GitHub Integration real salvo que haya uno local; la publicación live depende de la configuración de Core. Sin secretos.
   - `app/.env.example`: comentarios del mismo criterio. Valor por defecto sin cambios (`http://localhost:3002`).

### Archivos tocados (corte B)

- `app/src/control-plane/AnalysisRunDetailPage.tsx`
- `app/src/control-plane/publicationView.ts` (nuevo)
- `app/src/control-plane/publicationView.test.ts` (nuevo)
- `app/src/control-plane/PublishSection.test.tsx` (nuevo)
- `app/src/control-plane/AnalysisRunDetailPage.test.tsx`
- `app/src/styles.css`
- `README.md`
- `app/.env.example`
- `harness/reports/wi-console-032-implementation.md` (esta sección)

No se tocaron `harness/state.json`, `harness/work-items.json`, `spec/`, DTO, rutas ni contratos. No hubo commit ni push. No se arrancó ningún servidor dev; el vite PID 27708 no se tocó.

### Evidencia (app/)

- `npm run lint`: sin errores.
- `node node_modules/typescript/bin/tsc -b --noEmit`: sin errores. (`npx tsc` resuelve a un paquete ajeno, `tsc@2.0.4`, y no sirve.)
- `node node_modules/vitest/vitest.mjs run --maxWorkers=2`: 70 ficheros, 768 pruebas, todas en verde.
- `npm run build`: correcto (aviso habitual de tamaño de chunk, no nuevo).

### Decisiones y puntos a revisar

- Tras FAILED/STALE/CLOSED no se ofrece botón de publicar en la sesión. Es la lectura del «sin reintento» del alcance; si el Human Reviewer prefiere permitir una nueva publicación iniciada por el usuario, es un cambio pequeño en `showPublishButton`.
- La traza operativa (`traceFor`, observación del corte A) sigue sin reflejar el estado de la publicación. No se cambió en este corte.
- No se ha verificado visualmente a 375/768/1024 ni el contraste con un navegador. Queda para `ux-reviewer`.

### Cómo ver cada estado (modo mock, `VITE_DATA_SOURCE=mock`)

- PUBLISHED: `/projects/prj_checkout_demo/runs/arun_checkout_pr45`, pulsar «Publicar 3 propuesta(s)».
- FAILED: `/projects/prj_checkout_demo/runs/arun_checkout_pr49`, pulsar «Publicar 4 propuesta(s)».
- STALE: `/projects/prj_billing_demo/runs/arun_billing_pr17_2`, pulsar «Publicar 2 propuesta(s)».
- Recarga con propuestas ya publicadas: volver a `arun_checkout_pr45` después de publicar.

### Siguiente paso recomendado

`ux-reviewer` sobre la UI (obligatorio por ser cambio visible), luego revisión del Human Reviewer del diff y de la evidencia. Después, el WI puede pasar a cierre si el usuario lo aprueba.

## Corrección ciclo UX 1

Origen: `harness/reports/wi-console-032-ux-review.md` (CHANGES_REQUESTED, hallazgos 1, 2 y siguiente paso).

- **Desborde (hallazgo 1):** las alertas FAILED/STALE/CLOSED llevan la clase `publication-alert` con `overflow-wrap: anywhere; min-width: 0` en el contenedor y sus `p`, `code` y `strong` (`app/src/styles.css`). Sin cambios en `.structured-error` para otros usos.
- **Foco (hallazgo 2):** `PublishSection` (`app/src/control-plane/AnalysisRunDetailPage.tsx`) envuelve el resultado de la publicación en `div.publication-result` con `tabIndex={-1}`. Al pasar a estado terminal, un `useEffect` mueve el foco a esa región solo si `document.activeElement` era `null`, `body` o el propio botón «Publicar» (ref `publishButtonRef`).
- **Siguiente paso (copy):** FAILED sustituye «Console no reintenta automáticamente» por «Revisa el motivo; Core no reintenta automáticamente. Cuando el problema se corrija, vuelve a abrir el Run o espera el siguiente HEAD del PR.». STALE conserva su texto y añade «El HEAD del PR cambió: abre el Run vigente del Pull Request para publicar sus propuestas.». CLOSED pasa a «El companion PR se cerró y no se reabre.» (clase `publication-next-step`). No hay botón de reintento ni automatismo.
- **Pruebas:** `app/src/control-plane/PublishSection.test.tsx` añade dos casos: FAILED (clase de desborde, siguiente paso, foco del botón trasladado a `.publication-result`) y STALE (siguiente paso). El mock no contiene CLOSED, así que ese estado queda cubierto solo por el copy.
- **Gates (app/):** `npm run lint` OK; `tsc -b --noEmit` OK; vitest 70 ficheros / 770 tests OK; `npm run build` OK.
- **Pendiente:** verificación visual a 375 px y en navegador real para confirmar el desborde corregido; no se hizo en este ciclo.
