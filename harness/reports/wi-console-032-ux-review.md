Modelo: ux-reviewer · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo low

# WI-CONSOLE-032 — revisión UX

**Veredicto final: APPROVED** (re-revisión ciclo 1). Ciclo 0: CHANGES_REQUESTED (1 hallazgo medio, 1 medio-bajo), ambos corregidos; ver «Re-revisión ciclo 1».

## Método
Vite en puerto 5174 con `VITE_DATA_SOURCE=mock VITE_AUTH_MODE=mock` (el `.env` local fuerza supabase; sin AUTH_MODE=mock solo se ve el login), navegador real, `getComputedStyle`. Rutas: pr45 (PUBLISHED), pr49 (FAILED), billing pr17_2 (STALE). Servidor 5174 detenido al terminar.

## Cumple
- PENDING y PUBLISHING observables en `role="status"` `aria-live="polite"` («Publicación en curso: PENDING…» → «PUBLISHING…» → «Publicación finalizada: X»).
- Botón: «Publicando…» con `aria-disabled="true"`, conserva foco; dos clics seguidos y Enter por teclado no generan segundo POST (una sola publicación, transición única).
- PUBLISHED: rama `rag-tests/pr-45-e5e5e5e → feature/rounding-mode`, «PR companion #145», enlace https `target=_blank rel="noopener noreferrer"` con texto oculto «se abre en una pestaña nueva». Foco visible en el enlace: outline sólido 3px #c9b4fa (ratio sobre fondo >3:1).
- FAILED y STALE: `role="alert"` con título, motivo y «Console no reintenta automáticamente». Rótulo «DEMO · DATOS SIMULADOS» presente en la región y en el failureMessage del mock.
- Contraste medido (texto sobre fondo efectivo): status 10.3, enlace 14.2, code 15.6, strong 16.2, nota 10.3, sello demo 9.5, texto de alerta 11.7, título de alerta 15.0. Todos ≥4.5:1. Bordes de panel/alerta (~1.2–1.8:1) son decorativos; la información no depende de ellos.
- 375/768/1024 px: sin desborde horizontal en el panel PUBLISHED incluso con rama, URL y estado de 120–150 caracteres sin espacios.

## Hallazgos
1. **Medio — desborde horizontal en alertas FAILED/STALE/CLOSED con `failureMessage` largo sin espacios** (p. ej. una URL). `.structured-error p` tiene `overflow-wrap: normal`; en 375 px el párrafo mide 1982/239 px y la página gana scroll horizontal. `.publication-panel` sí lo previene, las alertas no. Corrección sugerida: aplicar `overflow-wrap: anywhere; min-width: 0` a las alertas de publicación (p. ej. clase `publication-alert`) en `app/src/styles.css`.
2. **Medio-bajo — pérdida de foco al llegar a estado terminal.** Cuando el botón desaparece (FAILED/STALE/CLOSED, o PUBLISHED sin propuestas disponibles) el `activeElement` pasa a `BODY`; un usuario de teclado/lector pierde su posición y la región `role="alert"` no recibe foco. Sugerencia: al terminal, mover el foco al contenedor de resultado (`tabIndex={-1}`) o al enlace/alerta, o mantener un elemento focalizable estable.
3. **Informativo — sondeo en pestaña oculta.** React Query pausa el `refetchInterval` con la pestaña en background (por eso la sesión headless se quedó en PUBLISHING hasta forzar visibilidad). Comportamiento esperable y se reanuda al volver; no bloquea.
4. **Informativo — texto desactivado.** `.button[aria-disabled]` usa opacity .52 sobre el botón primario; texto de «Publicando…» queda atenuado (componente inactivo, exento de WCAG 1.4.3, pero el mensaje de estado vive en la región status).

## Callejón sin salida tras FAILED/STALE/CLOSED
Sin botón de publicar el usuario queda sin siguiente paso: las alertas dicen qué pasó y que Console no reintenta, pero no qué hacer. Acción esperable (copy, sin reintento automático): en STALE, «Abre el Run vigente del PR (HEAD actual) y publica desde allí» con enlace al Run vigente si el Run lo expone; en FAILED, «Revisa el motivo y, si persiste, contacta al equipo / recarga la página para verificar el estado en Core; una nueva publicación requiere un nuevo Run»; en CLOSED, «El companion PR se cerró; genera un nuevo análisis desde el PR». Es mejora de copy, no bloquea; se recomienda incluirla en el mismo ajuste del hallazgo 1. No hay reintento engañoso: ningún botón reenvía lo mismo.

## Honestidad
UI no promete merge ni reintento; STALE/CLOSED explican la causa. Sin datos inventados al recargar (nota genérica sin enlace ni rama).

## Siguiente paso
Corregir hallazgos 1 y 2 (y copy de siguiente acción), re-ejecutar gates y devolver a revisión.


## Re-revisión ciclo 1

**Veredicto final: APPROVED.**

Método: vite 5174 (mock, `--strictPort`), navegador real emulando 375 px; publicación disparada con foco en el botón y sondeo forzado (pestaña oculta). Servidor detenido al terminar.

- **Hallazgo 1 (desborde) corregido:** alerta FAILED con `failureMessage` forzado a URL de 400+ caracteres y `/x` repetidos: párrafo 239/239, alerta 275/275, documento 375/375; `overflow-wrap: anywhere`, clase `publication-alert`, `role="alert"`.
- **Hallazgo 2 (foco) corregido:** `document.activeElement` pasa del botón «Publicar» a `DIV.publication-result` (tabIndex -1) al llegar a FAILED, STALE y PUBLISHED.
- **Copy de siguiente paso:** FAILED «Revisa el motivo; Core no reintenta automáticamente. Cuando el problema se corrija, vuelve a abrir el Run o espera el siguiente HEAD del PR.»; STALE «El HEAD del PR cambió: abre el Run vigente del Pull Request para publicar sus propuestas.». Sin botón de reintento. CLOSED no existe en el mock; solo verificado por prueba unitaria/copy.
- **Sin regresiones:** PUBLISHED (pr45) conserva rama, «PR companion #145», enlace https `_blank` `noopener noreferrer` con texto oculto de pestaña nueva, sin alerta, sin desborde a 375 px; contraste del texto de alerta (rgb 255,180,192) y enlace (224,213,255) sobre fondo oscuro sin cambios respecto a la medición previa (>=4.5:1); teclado: tras foco en la región, Tab avanza al enlace.
- **Observación informativa (fuera de WI-032, no bloquea):** en billing pr17_2 a 375 px el `h1` «Firma nueva de DiscountEngine.applyDiscount» mide 443/335 y da scroll horizontal de página (463). El diff de WI-032 no toca ese encabezado; es preexistente y conviene tratarlo en otro WI (`overflow-wrap` en `.page-heading h1`). El panel de publicación queda dentro del viewport (277/277).
