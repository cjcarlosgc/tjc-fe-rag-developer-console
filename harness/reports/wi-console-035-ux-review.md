# WI-CONSOLE-035 — revisión UX/accesibilidad

Modelo: ux-reviewer · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo low

**Estado:** APPROVED (con observaciones menores). Mock en navegador real (vite en 5174, `VITE_DATA_SOURCE=mock VITE_AUTH_MODE=mock`), servidor detenido al terminar.

## Contraste computado (getComputedStyle + ratio WCAG, fondo compuesto real)

| Elemento | Ratio | Resultado |
|---|---|---|
| Título «Destino de la regla» | 10.30 | OK |
| dt | 9.95 / 10.31 | OK |
| dd | 15.61 / 16.17 | OK |
| «sin dato» (dd.rule-target-empty, cursiva) | 9.95 | OK |
| Nota (frase fija) | 10.31 | OK |
| code de la nota | 15.61 | OK |

«sin dato»: el mock no trae nulos; se inyectó la clase `rule-target-empty` y el texto en un dd por DOM y se midió. Cursiva confirmada además del color (no solo color).

## Teclado
- Controles de la tarjeta en orden DOM: Sí, No, Depende, No lo sé, textarea, «Responder solo con este texto». Ningún botón de respuesta deshabilitado; el último solo lo está con el texto libre vacío (comportamiento previo, no de este WI).
- El bloque nuevo no añade tab stops (solo texto). Regla global `a/.button/textarea:focus-visible` (outline 3px acento) aplica.
- Limitación: el panel del navegador no estaba visible y no pude pulsar Tab real ni ver captura; no verifiqué foco visible en pantalla, solo la regla CSS. Sin trampas por construcción (sin JS nuevo de foco).

## Responsive
Sin scroll horizontal (scrollWidth == innerWidth) a 375, 768 y 1024 en lista y Focus Mode. Con un filePath largo sin separadores inyectado a 375, el dd rompe línea (`overflow-wrap:anywhere`), borde derecho 309 < tarjeta 335.

## Lector de pantalla
- Jerarquía h1 «Contexto funcional» → h2 pregunta → h3 «Destino de la regla»: correcta.
- Redundancia: `role=group aria-label` + h3 con el mismo texto hace que se anuncie dos veces. Menor.
- dl/dt/dd con pares en div: válido. Frase fija ocurre antes de los botones en el DOM, dentro de la misma tarjeta.
- Lista: se quitó `.target-ref` de la cabecera; el símbolo está ahora en la dl dentro del enlace-tarjeta, así el nombre accesible del enlace es largo (pregunta + 4 pares). Aceptable; ver F2.

## Honestidad del copy
- «Tu respuesta se registrará como regla para X» es exacto con el contrato. La nota «No lo sé solo registra una abstención» es honesta (DEC-FK-002). Sin promesas de efectos que Core no confirma.
- Valores crudos (CLASS, METHOD, EXCEPTION, STATE_TRANSITION…) en inglés/mayúsculas mezclados con UI en español: ver F3.

## Sin heurísticas ni dominio
Solo `qualifiedName`, `filePath`, `kind`, `scenarioKind` del contrato; `present()` solo detecta null/vacío. Sin mapas, sin comparación de texto. OK.

## Hallazgos
- F1 (menor): título h3 + aria-label del group duplican el anuncio. Sugerido: `aria-labelledby` apuntando al h3 (o quitar role=group; la dl ya se anuncia). No bloquea.
- F2 (menor): en la lista, el destino queda dentro del `<Link>` entero; nombre accesible largo. Aceptable; opcional.
- F3 (menor/decisión): enums crudos sin etiqueta en español; ya registrado como decisión de UX pendiente del Human Reviewer.
- F4 (info): foco visible y Tab real no probados en pantalla (panel oculto).

## Handoff
- status: APPROVED
- blockers: ninguno
- filesAffected: app/src/action-required/RuleTargetSummary.tsx, FocusModePage.tsx, ActionRequiredPage.tsx, app/src/styles.css (solo lectura; no se editó código)
- evidence: mediciones computadas arriba; scrollWidth == innerWidth en 375/768/1024; jerarquía de encabezados h1/h2/h3
- recommendedNextStep: Human Reviewer decide F1 (aria-labelledby) y F3 (etiquetas); revisión Tab visual rápida opcional.
