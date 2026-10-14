# WI-CONSOLE-037 — verificación SDD

Modelo: sdd-analyst · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo low

## Veredicto: SUFICIENTE

Alcance aprobado por el usuario (`wi-console-037-scope-approval.md`), criterios en `work-items.json` verificables, sin cambios de contrato. Contract Sync clasificado NOT_RELEVANT. `decisionGate`: no encontré DEC con `Blocks` que alcance ContextExplorer ni PublishSection; el leader debe sustituir la nota "Pendiente de verificar" por este resultado (blockingDecisionIds vacío).

## 1. Escritores de la URL en ContextExplorerPage.tsx
Todos pasan por `updateParams` (L95-104) -> `setSearchParams(fn, {replace:true})`:
- L105 `updateParam` (envoltorio).
- L116 efecto: `trace` = selectedTraceId cuando difiere de traceParam (automático).
- L125 efecto: `node` = defaultNodeId cuando falta (automático).
- L169 clic en repetición: `updateParams({trace, node:null})`.
- L171 checkbox: `includeSuperseded`.
- L173/L174 botones de vista: `view=graph|list`.
- L194, L195, L199, L200 `onSelect` de grafo/lista: `node`.
Filtros (nodeSearch, signalKinds, showDiscarded) son estado local, no escriben URL.

## 2. Causa raíz probable de F1
`ContextExplorerPage.tsx:96-103`: el callback funcional de `setSearchParams` recibe `previous` derivado del `searchParams` capturado en el render (react-router-dom 7.x no encola actualizaciones funcionales como setState). Si el efecto L125 (o L116) y un clic (L174) ocurren antes del re-render, la segunda navegación `replace` parte del snapshot viejo y pisa la primera: `view=list` se pierde o `node` se pierde. El comentario L93-94 solo cubre dos llamadas en un mismo handler, no efecto + clic. Corrección esperada: componer desde la URL vigente (p. ej. `new URLSearchParams(window.location.search)` / `location` actual vía ref a la última URL, o `useRef` que acumula el último `URLSearchParams` escrito), no desde el render.

## 3. Esperas de WI-027 que pueden enmascarar el defecto (ContextExplorerPage.test.tsx)
- `waitForDefaultSelection` (L27-29) y sus usos en L42 (alterna vista) y L70 (cambia renderer): esperan a que el efecto de `node` ya se asentó antes de clicar, justo la carrera de F1. Es el enmascarador principal.
- L40 `findByRole(... calculateTotal)` antes del clic no basta; sin `waitForDefaultSelection` el test es el reproductor.
- L45 `waitFor(aria-pressed list)` es aserción legítima (no enmascara).
- L36/L71 en `seleccionar un candidato` y `cambia renderer` no esperan; el segundo sí usa la espera.
- Config global de timeouts (`testTimeout 15000`, `asyncUtilTimeout 5000`, según F2 del review 027): reducirlos solo después de corregir F1. No localicé el archivo de config con grep rápido; el implementer debe ubicarlo.
Prueba ROJO sugerida: renderizar, clic en "Vista de lista" inmediatamente tras la primera aparición del grafo (sin `waitForDefaultSelection`) y/o forzar determinismo disparando `updateParam('node')` y `updateParam('view')` en el mismo `act`; esperar `view=list` persistente (aria-pressed + tabla) tras asentarse el efecto.

## 4. PublishSection (AnalysisRunDetailPage.tsx L40-135)
Defecto: `showPublishButton` (L71) = `canPublish && !endedWithoutPublish && (busy || available.length>0)`. Con `publication.status==='PUBLISHED'`, `endedWithoutPublish` es false (L70 excluye PUBLISHED) y `busy` pasa a false; mientras las propuestas siguen `AVAILABLE` (ventana hasta el refetch por `useRefreshOnPublicationTerminal`, queries.ts:94-105) reaparece "Publicar N propuesta(s)". Tras recarga con propuestas PUBLISHED y otras AVAILABLE también se ofrece publicar según `available`.

Comportamiento esperado por estado de publicación:
| Estado | Botón/oferta | Texto/aviso |
|---|---|---|
| sin publicación (pending null) | visible si `canPublish` y `available>0` | cabecera de disponibles |
| PENDING / PUBLISHING | "Publicando…" aria-disabled (busy), sin segundo POST | `Publicación en curso: X…` |
| PUBLISHED | OCULTO (también en ventana pre-refetch) y sin párrafo "Publicar nunca hace merge"/oferta | panel Companion PR + "Publicación finalizada: PUBLISHED" |
| FAILED | oculto (sin cambios) | alert "Publicación fallida" |
| STALE | oculto (sin cambios) | alert STALE |
| CLOSED | oculto (sin cambios) | alert CLOSED |
Propuestas: AVAILABLE ofrecen publicar solo si no hay publicación PUBLISHED y rol WRITER+; PUBLISHED sin `pending` y sin publicación -> aviso "ya fueron publicadas" (L102), sin botón cuando `available` es 0. Caso a decidir por el implementer (cubierto por el alcance "tras recargar con propuestas ya PUBLISHED"): mezcla available>0 + published>0 sin publicación en memoria; no contradice el alcance mantener oferta solo para las AVAILABLE, pero el criterio literal pide ocultar cuando las propuestas ya están PUBLISHED. Recomiendo ocultar el botón si `published.length>0 && available.length===0` (ya implícito) y cubrir con prueba la mezcla; si hay duda de semántica, `DECISION_REQUIRED` al usuario antes de ocultar con available>0.
Cambio mínimo sugerido: `const publishedNow = publication?.status==='PUBLISHED'`; `showPublishButton = canPublish && !endedWithoutPublish && !publishedNow && (busy || available.length>0)`; condicionar párrafo de cabecera L78 igual.

## 5. Tests existentes relacionados
- `PublishSection.test.tsx`: L39 PENDING->PUBLISHING->PUBLISHED (L66 afirma sin botón tras el terminal, ya con refetch hecho); L73-79 y L86-91 (STALE/FAILED/CLOSED sin botón); L94-104 recarga con propuestas PUBLISHED sin enlace; L110-126 errores/duplicado.
- `AnalysisRunDetailPage.test.tsx`: L27-34, L92/L100, L147-149, L203.
- `publicationPolling.test.tsx` (API/polling; no UI).
Falta: aserción inmediata en la ventana PUBLISHED-antes-del-refetch (hay que retrasar/controlar el refetch de propuestas, p. ej. `mockStartExperiment`-style con respuesta de listado diferida) y mezcla available+PUBLISHED.
- ContextExplorer: ver sección 3; ninguna prueba cubre clic sin espera ni dos escritores en el mismo ciclo.

## 6. Riesgos
- Reescribir `updateParams` con `window.location` puede romper `MemoryRouter` en pruebas (renderApp); preferir `useLocation` + ref actualizada de forma síncrona en cada escritura.
- Efectos L116/L125 siguen compitiendo con clics; asegurar que acumulan sobre la última URL escrita.
- Ocultar botón con AVAILABLE residual puede impedir republicar propuestas nuevas válidas; mantener la regla a PUBLISHED de la publicación en memoria y no a cualquier propuesta publicada.
- Reducir timeouts globales fuera de alcance salvo confirmación de que F1 ya no los necesita (permitido por el WI).
- Corridas repetidas sin límite de workers requeridas por el criterio; correr varias veces.

## 7. Archivos afectados
- app/src/context-explorer/ContextExplorerPage.tsx
- app/src/context-explorer/ContextExplorerPage.test.tsx
- app/src/control-plane/AnalysisRunDetailPage.tsx
- app/src/control-plane/PublishSection.test.tsx (y posiblemente AnalysisRunDetailPage.test.tsx)
- opcional: config de vitest (timeouts), CHANGELOG.md y tasks.md (ST-CONSOLE-039) por el leader.
Sin tocar: contratos, DTO, rutas, mockBackend de listados, pantallas nuevas.
