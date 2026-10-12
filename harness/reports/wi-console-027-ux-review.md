# WI-CONSOLE-027 — revisión UX

Modelo: ux-reviewer · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo low

**Veredicto:** APPROVED (sin cambios requeridos; 2 observaciones menores no bloqueantes).

Entorno: `npm --prefix app run dev -- --port 5174 --strictPort` con `VITE_DATA_SOURCE=mock VITE_AUTH_MODE=mock`, navegador real del panel, ruta `/projects/prj_checkout_demo/experimental?workspaceId=1000001`, escenarios elegidos en el selector «Target experimental». Servidor detenido al terminar.

## B1 — experimento FAILED (OE5, `ExperimentPage`)

| Escenario | Mensaje mostrado | Resultado |
|---|---|---|
| demo-scenario-failed-experiment-failed | «El experimento falló durante la ejecución.» + Detalle | OK |
| demo-scenario-failed-worker-lost | «El experimento se interrumpió; vuelve a crearlo.» + Detalle | OK |
| demo-scenario-failed-unknown | «…error no reconocido (código DEMO_UNKNOWN_FAILURE).» + Detalle | OK |

En los tres (1280 px; los dos últimos también a 375 px):
- Un único `role="alert"` (`.structured-error`), título «El experimento no se completó».
- Sin «Preparando experimento» ni «Ejecutando estrategias» tras resolverse; sin `role="status"`; sin `.live-indicator`, `.experiment-progress` ni barra; sin botón de reanudar (botones de `main`: Armar captura, Ejecutar comparación, Descargar evidencia); sin `.flow-connector`/comparación ni ganador.
- Rótulo «DEMO · DATOS SIMULADOS» presente dentro de la alerta (y en la evidencia).
- Foco: no se mueve (`document.activeElement` = body); la alerta se inserta dinámicamente y `role=alert` la anuncia. Aceptable.
- Desborde a 375 px: `scrollWidth` = 375 = viewport; alerta 20–355 px; ningún hijo la excede.

### Contraste (color computado real, fondo compuesto)
Fondo efectivo de la alerta: `rgba(244,63,94,0.08)` sobre `rgb(5,5,6)` ≈ `rgb(24,10,13)`.

| Elemento | Color | Ratio WCAG | Mínimo |
|---|---|---|---|
| Título (16 px) | rgb(255,216,216) | 14.78 | 4.5 OK |
| Mensaje y Detalle (16 px) | rgb(255,180,192) | 11.54 | 4.5 OK |
| Rótulo DEMO (10 px) | rgb(229,185,104) sobre rgb(29,26,16) | 9.50 | 4.5 OK |

## B2 — RETRIEVAL_COMPARISON_WORKER_LOST (OE2)

Texto verificado en `app/src/retrieval-comparison/failureMessages.ts`: «La comparación se interrumpió; vuelve a crearla.» Coherente en tono y estructura con «El experimento se interrumpió; vuelve a crearlo.» (género correcto).

**No alcanzable en el mock:** `mockBackend.ts` solo emite `RETRIEVAL_COMPARISON_FAILED` para comparaciones fallidas; ningún escenario produce `RETRIEVAL_COMPARISON_WORKER_LOST`. Queda cubierto por la prueba `retrieval-comparison/api.test.ts` (`/interrumpió/` y `/vuelve a crearla/`), no verificado en navegador. Por el render de `RetrievalComparisonPage` (usa `retrievalFailureText` en una nota de error y en el listado), el texto no cambia estructura.

## Observaciones no bloqueantes
1. Un instante (< ~600 ms) tras pulsar «Ejecutar comparación» se ve «Preparando experimento» mientras llega el primer estado; es el estado previo legítimo (aún no hay `status`), no un FAILED. No requiere cambio.
2. El rótulo DEMO usa 10 px; cumple contraste pero es pequeño. Es estilo global preexistente, fuera de alcance de este WI.

## Alcance
Solo lectura de código; no se editó ningún archivo salvo este informe. Verificación visual por JS/DOM y accesibilidad por árbol; sin lector de pantalla real.
