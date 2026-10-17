# WI-CONSOLE-016 — Revisión UX / accesibilidad / honestidad de mocks

Veredicto: **APPROVED** (sin bloqueantes; 4 no bloqueantes).

Metodo: navegador real (panel integrado) contra el mock. El servidor 5173 estaba detenido por el usuario y no se reinició; se levantó una instancia aparte en el puerto 5174 con `VITE_DATA_SOURCE=mock VITE_AUTH_MODE=mock` y se detuvo al terminar. Contraste calculado con `getComputedStyle` y composición real de fondos.

## Evidencia

- Contraste AA (texto, pr45): títulos 16.2:1; texto secundario (`--muted`) 9.95-10.3:1; ids `code` 10.3:1; botón Copiar 15.7:1; badge PRESENT 10.5:1; badge NOT_APPLICABLE 15.6:1. Ningún texto bajo 4.5:1.
- Foco real con Tab: botón Copiar con `outline: 3px solid rgb(255,255,255)`, offset 2px (blanco sobre ~#0b0b0d, >15:1; cumple >=3:1). `:focus-visible` solo se activa con teclado (correcto).
- Copiar: 9 botones en pr45; nombres únicos y accesibles («Copiar retrieval_id ret_demo_pr45_total»), contienen el texto visible «Copiar» (2.5.3 OK). Tamaño 68x40. Enter mantiene el foco en el botón; el estado queda en `role="status"` vinculado por `aria-describedby`. En el navegador de automatización el portapapeles se rechazó y se mostró «No se pudo copiar» sin romper (camino de fallo verificado; el camino «Copiado» queda cubierto solo por RTL).
- Headings: H1 (run) > H2 «Trace operativo» > H3 (Repositorio y PR, Analysis Run, Changeset, Target: X, Publicación) > H4 (Retrieval, Contexto, Generación, Ejecuciones). Sin saltos dentro de la sección.
- NOT_APPLICABLE: badge de texto con borde discontinuo (no solo color) y nota «No aplica: el flujo terminó antes de este paso.»; 0 `role="alert"` en pr42, pr47, pr22. Informativo, no error.
- Honestidad: `outcome` BEHAVIORAL_MISMATCH mostrado tal cual en pr46, sin CUMPLE/NO CUMPLE ni veredicto inventado; `functionalRuleIds` vacío = «ninguna»; `checkId` nulo = «sin dato»; sin targets (pr22) muestra «Sin targets» con `targetCount: 0`.
- Rótulo demo: «DEMO · DATOS SIMULADOS» en la cabecera (`demo-stamp`) y nota «Datos simulados: …» dentro de la sección, también en los estados 409.
- QUEUED (pr53) y PROCESSING (pr25): mensaje informativo en `role="status"`, 0 alertas; el detalle muestra «En cola» / «Procesando».
- Reflow a 375 px: ningún elemento de `.operational-trace` desborda; `.trace-fields` pasa a 1 columna; sin objetivos táctiles <24 px.
- Reduced-motion: regla global (styles.css:293) más `transition: none` del botón; el bloque no añade animaciones propias.
- Roles: el componente no recibe ni ramifica por rol (revisado en código); `OperationalTraceSection` se monta sin condición. El mock fija el rol por proyecto y los runs con trace solo existen en proyectos ADMIN, por lo que Reader/Writer/Admin no se pudieron comparar en el navegador. Queda cubierto por inspección de código.

## Bloqueantes

Ninguno.

## No bloqueantes

- **N1 — La nota demo ámbar nunca se aplica.** `app/src/styles.css:~524` `.trace-demo-note { color: #e5b968 }` (especificidad 0,1,0) pierde ante `.panel p { color: var(--muted) }` (0,1,1). Color computado real: `rgb(188,186,201)`, igual que el texto normal, así que el aviso «Datos simulados» pasa desapercibido. Corrección: `.operational-trace .trace-demo-note { color: #e5b968; }` (el ámbar sobre #0b0b0d da ~10:1, cumple AA). Lo mismo aplica a `.trace-na-note` / `.trace-no-data`, que hoy coinciden con muted por casualidad.
- **N2 — El estado del botón Copiar nunca se limpia ni se re-anuncia.** `app/src/ui/CopyButton.tsx`: tras «Copiado» el texto permanece indefinidamente y, si se vuelve a copiar, el contenido idéntico no dispara un nuevo anuncio. Corrección: volver a `idle` tras ~2-3 s con `setTimeout` (limpiar en unmount) o forzar un cambio de texto entre intentos.
- **N3 — `aria-describedby` apunta a un `role="status"` mutable.** El lector leerá «No se pudo copiar» como descripción en cada foco posterior y además lo anuncia como live region (doble ruido); hay además 9 live regions vacías. Corrección: quitar `aria-describedby` y dejar solo la live region, o usar una única live region por sección.
- **N4 — Desborde horizontal de página en móvil, fuera de WI-016.** A 375 px, `scrollWidth` 570: lo causan `ul.symbol-list`, `li.test-proposal-item` y `status-badge` de las secciones previas de `AnalysisRunDetailPage`. No pertenece al trace (ningún elemento de `.operational-trace` desborda); se registra como deuda de la página.

## Notas menores

- La lista «Símbolos cambiados» es H3 directamente bajo H1 (preexistente, no del WI).
- El camino «Copiado» y el rol Reader/Writer no se vieron en navegador; se recomienda al Human Reviewer probar Copiar en un contexto con permiso de portapapeles.

filesAffected (revisados): `app/src/control-plane/OperationalTraceSection.tsx`, `app/src/ui/CopyButton.tsx`, `app/src/ui/clipboard.ts`, `app/src/styles.css` (bloque WI-CONSOLE-016), `app/src/control-plane/AnalysisRunDetailPage.tsx`.
recommendedNextStep: pasar a Human Reviewer; aplicar N1 y N2 es opcional y barato, no requiere nueva revisión UX.
