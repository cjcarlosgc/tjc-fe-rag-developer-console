# WI-CONSOLE-046 — verificación de suficiencia SDD

Modelo: sdd-analyst · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo low

**Veredicto: SUFICIENTE** (sin decisiones bloqueantes; dos precisiones de redacción recomendadas, no bloqueantes).

## 1. Contrato (INTEROP-2.19 §6.6, `realtime-events.schema.json`)
- `subscribe:analysis-run` / `unsubscribe:analysis-run` llevan `{ analysisRunId }`; el aviso `analysis-run:update` lleva exactamente `AnalysisRunDetailResponse` (= GET `/analysis-runs/{id}`). Ack `SubscribeAck` de tres resultados; rol mínimo Reader (interop-contract.md ~448-471; schema líneas 16 y 86).
- Se emite por cada cambio de estado y de DTO visible; la creación no emite. Es best-effort y at-most-once, sin replay ni orden; el cliente reconcilia con el GET, que es la fuente de verdad. Una reconexión no restaura suscripciones (el cliente re-suscribe; `socket.ts` ya lo hace).
- Sin cambio de DTO ni de rutas: `contractImpact:false` es correcto. `subscribeAnalysisRunUpdates(id, onUpdate, onReconcile)` ya existe (WI-044) y cubre ack, reintentos, reconexión y limpieza.

## 2. Decisiones (Blocks)
- `DEC-RT-001` está APPROVED (2026-10-21). Única decisión `PENDING` en spec: `DEC-VAL-001` (system-contract.md ~303), con Blocks = ingestión/despliegue con código empresarial: no alcanza este WI. Ninguna otra `PROPOSED`/`PENDING` con Blocks sobre HU12/tiempo real. `decisionGate`: checked=true, blocking=[], nonBlocking=[].
- D2 de WI-044 queda resuelta por la aprobación literal del usuario (scope-approval).

## 3. Consumidores de `useAnalysisRun` y segundo consumidor
- Consumidores: `AnalysisRunDetailPage` (ruta `projects/:projectId/runs/:analysisRunId`), `RunComparisonPage` (`.../comparison`), `RetrievalComparisonPage` (`.../retrieval-comparison`) y `ExperimentPage` (ruta `projects/:projectId/experimental`, id por `?analysisRunId=`).
- `router.tsx` (líneas 22-48): todas son rutas hermanas hijas de `AppShell` (Outlet); un solo `element` de página montado a la vez. No hay rutas anidadas ni `createPortal`/pantallas persistentes que usen `useAnalysisRun`. Por tanto el detalle nunca coexiste montado con las otras tres.
- Único consumidor de `subscribeAnalysisRunUpdates` en `src` (grep): ninguno hoy; el WI introduce el primero y único. Además este WI engancha el hook solo al detalle, no a las otras pantallas. **No se crea segundo consumidor simultáneo del mismo analysis-run; no hace falta conteo de referencias en `unsubscribe`.** Se documenta como evaluado/no necesario (criterio 2). Latente: si en el futuro se enganchara otra pantalla que conviva con el detalle, `unsubscribe` emitiría el leave de sala aunque quede otro suscriptor local; fuera de alcance.
- Navegación entre dos Runs distintos dentro de la misma ruta: efecto con dependencia `analysisRunId` → cleanup antes del nuevo subscribe.

## 4. «El polling sigue como base»
- `useAnalysisRun` NO tiene `refetchInterval` (queries.ts ~202). El detalle no sondea el Run hoy. Sí sondean: `useAnalysisRunTrace` (solo mientras 409 `EVIDENCE_NOT_FINISHED`) y `usePublication` (mientras PENDING/PUBLISHING); ExperimentPage y RunComparisonPage tienen su propio polling.
- Significado correcto: no hay polling del Run que eliminar ni relajar; no se debe añadir uno (no aprobado). Tras el WI, el tiempo real será la única actualización en vivo del Run en el detalle (best-effort, at-most-once); el fallback es refetch manual/recarga, `staleTime`/foco de React Query y los refetch existentes. Con ack denegado o socket caído la pantalla queda como hoy.
- No es decisión pendiente: la aprobación de alcance dice «no se elimina ni se relaja», compatible. **Recomendación:** que el informe de implementación y el CHANGELOG digan «sin polling del Run que preservar; no se añade» y no repitan «polling base» para el Run (el criterio de aceptación 1 y el título lo sugieren; no contradicción, solo imprecisión).

## 5. uiImpact
- Sin cambio de markup, estilos, copy ni componentes. Sí cambia el comportamiento visible: el estado/contadores del Run (p. ej. `ACTION_REQUIRED`, `OBSOLETE`, cierre) se refrescan sin recargar. La actualización por `invalidateQueries` no pasa por `isPending` (solo la primera carga), así que no hay parpadeo de LoadingState.
- Propuesta: `uiImpact` visual = false; omitir `ux-reviewer` justificándolo (aprobación lo permite «si no cambia visualmente»). Reservar: si la implementación toca JSX/estilos, invocar `ux-reviewer`. Dejar la justificación escrita en el informe de implementación/cierre.

## 6. Riesgos y pruebas
- StrictMode (`main.tsx`): montaje-desmontaje-montaje del efecto; el subscribe→unsubscribe→subscribe es secuencial sobre el mismo socket; con `client.connected` falso no se emite `unsubscribe` espurio y el `teardown` quita los listeners. Probar mount/unmount doble sin fuga de listeners ni timers.
- Cambio de `analysisRunId`: clave del efecto; probar re-suscripción y que el aviso de otro id se ignore (`handleUpdate` ya filtra por id).
- Cierre de sesión/cambio de usuario: `AuthProvider` llama `resetSocket()` (teardown de `liveSubscriptions`); el hook depende de `userId` y no abre sin él; el cleanup posterior es no-op (`active=false`). Probar sin sesión → `subscribeAnalysisRunUpdates` no se llama (patrón de `useExperimentRealtime`), y con logout → liberación.
- Mock: `isMockDataSource()` → no suscribir.
- Qué invalidar: solo `controlPlaneKeys.run(id)` (aprobado: GET `/analysis-runs/{id}`, sin escribir el DTO en caché; usar `invalidateQueries` con la clave exacta, no `['control-plane','run']` genérica que tocaría otros Runs). Proposals y trace NO se invalidan: el trace ya sondea mientras 409 y proposals/Run los refresca `useRefreshOnPublicationTerminal`; un evento de Run que cambie propuestas (p. ej. fin de generación) podría dejar `proposals` obsoleto hasta su propio refetch. Es un riesgo conocido, aceptable y fuera de alcance; el reviewer debe verificarlo y, si lo considera relevante, registrarlo como DECISION_REQUIRED (ampliar invalidación a proposals/trace) en vez de hacerlo.
- Un aviso por ráfaga: sin limitador (correcto para analysis-run); evitar tormenta de GET es responsabilidad de React Query (dedup de invalidaciones en vuelo).

## Decisiones pendientes concretas
Ninguna bloqueante. Opcional (para el reviewer/usuario, no bloquea): ¿invalidar también `proposals`/`trace` ante `analysis-run:update`? Recomendación: no en este WI.

## Recomendaciones
1. Actualizar `decisionGate` (checked, sin bloqueantes) y registrar este informe.
2. Hook `useAnalysisRunRealtime(analysisRunId)` calcado de `useExperimentRealtime`, `refresh` = `invalidateQueries({ queryKey: controlPlaneKeys.run(id) })`, usado como `onUpdate` y `onReconcile`; llamarlo en `AnalysisRunDetailPage` antes de cualquier `return` temprano (los hooks deben ir antes de `isPending`).
3. Actualizar el comentario de `socket.ts` («Sin consumidor de pantalla por ahora (D2…)»).
4. Pruebas: con fake timers y socket simulado; aviso → refetch del GET; reconexión → refetch; sin sesión/mock → no abre; unmount/logout/cambio de id → sin listeners ni timers; doble montaje StrictMode.
5. Sin `contract-reviewer`: no hay impacto de integración nuevo.

Archivos afectados previstos: `app/src/control-plane/useAnalysisRunRealtime.ts` (nuevo), `app/src/control-plane/AnalysisRunDetailPage.tsx`, `app/src/api/socket.ts` (solo comentario), pruebas vitest, `CHANGELOG.md`, tasks.md.
