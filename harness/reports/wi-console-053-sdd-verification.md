# WI-CONSOLE-053 — verificación SDD

Modelo: sdd-analyst · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo low

**Fecha:** 2026-10-30 · **Veredicto: SUFICIENTE_CON_NOTAS**

## 1. Suficiencia
- §6.17 y `AnalysisRunSummaryResponse.experimentCapture` (`{captureId, reservedAt} | null`, siempre presente) están espejados; la spec 014 (HU18) ya fija sección, botones, aviso, badge y roles; criterios del WI verificables.
- Nota: el criterio dice «Writer no arma» y la spec 014 dice «Reader y Writer ven solo el estado»; consistentes. Contrato: Reader lista (GET), Maintainer arma/desarma.
- Nota: la spec 014 sigue con «Estado: HU18 requiere contrato antes de implementación productiva» (línea 4) y la tarea ST-CONSOLE-055 está sin marcar: actualizar al cerrar.
- No hay contrato para consultar «qué Run reservó»: solo `reservedAnalysisRunId` en la captura RESERVED (enlace posible desde la lista del Project).

## 2. Decisiones DEC
No encontré en `spec/` ninguna DEC con `Blocks` que alcance HU18/captura/Project/Run (los `Blocks` hallados en system-contract son NONE o de despliegue). Coincide con el `decisionGate` del WI (DEC-RAG-001 no aplica). Bloqueantes: ninguna.

## 3. Riesgos y recomendaciones
- **Ubicación:** de acuerdo con la sección «Captura de experimentación» en `ProjectDetailPage.tsx` entre «Repository binding» (h2 en línea ~151) y «Zona de peligro» (~201). Hook nuevo en `queries.ts` (lista, `limit` pequeño; usar solo la más reciente para el estado) y mutaciones que invaliden la lista. Estado derivado: la captura más reciente; ARMED = armada; RESERVED/DISARMED/ninguna = no armada.
- **Badge:** `StatusBadge tone="warn"` (o muted) en `RunsPage.tsx` y `AnalysisRunDetailPage.tsx` cuando `experimentCapture != null`; con texto, no solo color (daltonismo del usuario). Tolerar `undefined`.
- **HU49 (`run-comparison/CaptureNextPrPanel.tsx` + `speculative/captureNextPr.ts`, usado en `ExperimentPage.tsx` y `mockBackend.ts`):** hoy es simulador local; su coexistencia puede confundir (dos «capturas del siguiente PR»). Recomiendo dejarlo intacto en este WI y, en un WI posterior, rotularlo más claramente como simulación o retirarlo; su texto no debe presentarse como el control real. Riesgo: el mock de HU18 no debe reutilizar el estado del simulador.
- **Roles:** `hasRole(role,'MAINTAINER')` para botones; el rol viene del Project. Reader/Writer: solo estado, sin botones ni texto de «no tienes permiso» ruidoso (una línea informativa basta).
- **Core no desplegado:** `GET` con 404 (ruta ausente, `code` distinto de `PROJECT_NOT_FOUND`, ver patrón en `api.ts` línea ~68) o 5xx/red no debe romper el Project. Propongo: la sección aislada en su propio componente con su propia consulta; 404 sin `PROJECT_NOT_FOUND` => mensaje «Captura no disponible en esta versión de Core» (sin reintentos agresivos, sin ocultar la página); otros errores => `ErrorNote` en la sección. Los botones se deshabilitan mientras el estado sea desconocido. Las demás secciones no dependen de ella.
- **Desborde 375 px:** botones en `flex-wrap`, aviso con texto que quiebre línea, `min-height` 40 px (criterio del WI); badge con `white-space: normal` o abreviado en la tabla de Runs; verificar con capturas.
- **Mock/DEMO:** el mock debe devolver 409/404 con los códigos del contrato y al menos un Run con `experimentCapture`; rotular la sección «Datos simulados» en modo demo. Cuidado: contar Runs/rótulos DEMO sin romper conteos.
- **Efecto de la acción:** armar suprime el Check del siguiente PR elegible y no se deshace salvo desarmar; no es destructivo (reversible con «Desarmar» mientras ARMED). El repo solo usa confirmación para la acción destructiva «Eliminar Project» (`role="group"` con foco en Cancelar). **Recomiendo no pedir confirmación** al armar/desarmar y confiar en el aviso persistente; opcional: texto explicativo previo al botón. Si el ux-reviewer pide confirmación, reutilizar el patrón de foco existente.
- Realtime: el campo no emite `analysis-run:update` por sí solo; refrescar con GET (no prometer actualización en vivo).
- Captura olvidada suprime el Check: el aviso debe ser visible y persistente (ya en criterios).

## 4. Rótulos propuestos (español)
| Elemento | Texto |
|---|---|
| Sección (h2) | Captura de experimentación |
| Descripción (siempre) | Reserva el siguiente PR elegible de este Project para experimentación. |
| Botón armar | Armar captura |
| Botón desarmar | Desarmar |
| Aviso (ARMED) | Captura armada: el siguiente PR elegible se reservará para experimentación y su Check no se publicará en GitHub. Desarma la captura si no quieres que ocurra. |
| Estado Reader/Writer | Captura armada / Sin captura armada (solo Maintainer o superior pueden armar o desarmar). |
| Estado RESERVED | Última captura reservada para un Run (enlace al Run si `reservedAnalysisRunId`). |
| Badge | Reservado para experimentación |
| 409 | Ya hay una captura armada en este Project. Desárma­la antes de armar otra. (actualizar la lista) |
| 404 | No hay una captura armada para desarmar. (actualizar la lista) |
| 403 | No tienes permiso para armar o desarmar capturas en este Project. |
| Cargando | Cargando captura de experimentación… |
| Error | No se pudo cargar la captura de experimentación. + reintentar |
| Vacío | Sin capturas armadas. |
| Core sin soporte | Captura de experimentación no disponible en esta versión de Core. |
| Demo | Datos simulados |
| Botones en curso | Armando… / Desarmando… |

Nota: no encontré glosario específico de «captura» en el design system; usar términos de la spec 014 (que ya usa «captura», «reservar», «Check»). No inventado: el texto exacto del glosario no fue verificado línea a línea.
