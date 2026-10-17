# WI-CONSOLE-015 — Revisión UX

Modelo: ux-reviewer · configurado sonnet (general-purpose con rol ux-reviewer) · atendido claude-sonnet-5-5 · esfuerzo medium

status: CHANGES_REQUESTED (1 bloqueante de copy/semántica, 6 no bloqueantes)

Alcance: corte sin commit de WI-CONSOLE-015 (FunctionalKnowledgePage, FunctionalKnowledgeDetailPage, AnalysisRunDetailPage, styles.css). Solo lectura; mock `console-mock` en navegador (detenido al terminar). Colores medidos con `getComputedStyle` y contraste WCAG calculado contra el fondo efectivo.

## Bloqueantes

### B1. «Regla actual» marca la regla vista, no la vigente, cuando la vista es SUPERSEDED
- evidence: en `/projects/prj_checkout_demo/functional-knowledge/fk_rounding_v1` la cadena queda `SUPERSEDED v0 · Ver regla →`, `SUPERSEDED v1 · «Regla actual»` (con `aria-current="step"` y borde acento), `ACTIVE v2 · Ver regla →`. La etiqueta «Regla actual» queda sobre una regla SUPERSEDED, mientras la regla realmente vigente (ACTIVE) aparece sin marca, con solo un enlace. El intro dice «La regla actual está marcada», lo que refuerza la lectura de que la marcada es la vigente. Un lector puede concluir que una regla reemplazada sigue en uso. Además en `fk_rounding_v2` «Regla actual» sí coincide con la vigente, así que el mismo rótulo significa dos cosas según la pantalla.
- filesAffected: `app/src/action-required/FunctionalKnowledgeDetailPage.tsx` (rótulo `fk-chain-note` e intro de «Cadena de reemplazo»); `FunctionalKnowledgeDetailPage.test.tsx` (aserciones del rótulo).
- recommendedNextStep: separar los dos conceptos. Opción mínima: marcar la regla que se está viendo con «Estás viendo esta regla» (o «Regla que estás viendo») y añadir «Vigente» a la regla ACTIVE de la cadena (texto, no solo el badge verde). Cambiar el intro a «De la regla más antigua a la más reciente. Se indica cuál estás viendo y cuál está vigente.» Mantener `aria-current="step"` en la vista. Ajustar tests: v1 muestra «Estás viendo esta regla» en v1 y «Vigente» en v2; v2 muestra ambos en la misma fila.

## No bloqueantes

### N1. Contraste del foco por debajo de 3:1 (global, no introducido por este corte)
- evidence: tras Tab real, el foco de «Ver regla →» es `outline: rgba(201,180,250,0.42) solid 3px`, offset 2px. Sobre #0b0b0d el color efectivo (~rgb 91,82,113) da ~2.7:1, bajo el 3:1 de componentes UI (WCAG 1.4.11) y contra el requisito de «contraste suficiente» de `spec/transversal/accessibility/spec.md`. El grosor (3 px) sí cumple. Es estilo global previo.
- filesAffected: `app/src/styles.css` (regla `:focus-visible` global).
- recommendedNextStep: ticket aparte para subir la opacidad del anillo (p. ej. acento pleno). No bloquea este WI.

### N2. Etiqueta «Escenario clave» en la tarjeta vs «Clave de escenario» en el detalle
- evidence: la tarjeta lee «Escenario clave order.calculateTotal.rounding» (`FunctionalKnowledgePage.tsx`, `<span>Escenario clave </span>`), que en español se lee como adjetivo («escenario importante»); el detalle usa «Clave de escenario».
- filesAffected: `app/src/action-required/FunctionalKnowledgePage.tsx` y su test.
- recommendedNextStep: unificar a «Clave de escenario».

### N3. Comentario CSS afirma un color que no es el real
- evidence: `.fk-card-meta { color: #eae7f7 }` pero el computado es `rgb(188,186,201)` (#bcbac9, `.action-required-item p` gana por especificidad), 10.31:1: cumple AA. El comentario del bloque y el reporte de implementación lo mencionan, pero el CSS declarado sigue mintiendo. `.fk-group-count`, `.fk-missing` y `.fk-chain li` sí resuelven a #eae7f7 (16.76:1 / 16.17:1 / 15.61:1).
- filesAffected: `app/src/styles.css`.
- recommendedNextStep: borrar el `color` muerto de `.fk-card-meta` o subir su especificidad; sin impacto visual.

### N4. «sin procedencia registrada» repetido hasta 3 veces y solo en cursiva
- evidence: `fk_rounding_v1` muestra el texto tres veces seguidas (Confirmada por, Rol, Commit de origen). Contraste correcto (15.61:1) y el texto, no el color, comunica la ausencia, pero la repetición es ruido. En `fk_import_tax` el commit es «sin procedencia registrada» aunque la fuente sea importación; correcto, pero puede leerse como dato faltante.
- filesAffected: `app/src/action-required/FunctionalKnowledgeDetailPage.tsx`, `knowledgeScenarios.ts` (`MISSING_PROVENANCE_LABEL`).
- recommendedNextStep: aceptable tal cual. Mejora opcional: si las tres son null, una sola línea «Regla histórica: sin procedencia registrada» en lugar de tres filas.

### N5. Commit completo solo en `title`
- evidence: `<code title="9f8e7d6c5b…">9f8e7d6</code>` en `fk_rounding_v2`; el valor completo no es accesible por teclado ni táctil (el spec transversal exige que la información esencial de tooltips por hover esté también en el panel o descripción accesible).
- filesAffected: `app/src/action-required/FunctionalKnowledgeDetailPage.tsx`.
- recommendedNextStep: el AC pide `title`, pero añadir además `aria-label` con el SHA completo o un texto visualmente oculto; o dar al `code` `tabIndex={0}` solo si el equipo lo acepta.

### N6. Vacío tras filtro no se anuncia; jerarquía previa en AnalysisRunDetailPage
- evidence: «Sin reglas» (`.empty-inline`) no tiene `role="status"`, de modo que cambiar el filtro a Superseded con 0 resultados no se anuncia. En `/runs/arun_checkout_pr45` la jerarquía es H1 · H3 «Símbolos cambiados» · H2 «Propuestas de prueba» · H2 «Contexto recolectado» · H3: hay un H3 antes de cualquier H2 (previo a este corte; la retirada del bloque «Qué más alimentó este contexto» no lo empeora).
- filesAffected: `app/src/action-required/FunctionalKnowledgePage.tsx`; `app/src/control-plane/AnalysisRunDetailPage.tsx`.
- recommendedNextStep: añadir `role="status"` al vacío; ticket aparte para la jerarquía del Run.

## Verificado conforme

- Orden y etiquetas en español de grupos: Resultado esperado, Borde, Excepción, Precondición funcional (grupos vacíos omitidos); «Otros» para desconocidos. h1 > h2 por grupo (con conteo «2 reglas», «1 regla»), sin saltos en la lista ni en el detalle (h1 · Procedencia, Pregunta y respuesta, Cadena de reemplazo, Runs que usaron esta regla, todos h2).
- Varias reglas ACTIVE/SUPERSEDED bajo el mismo target (OrderService.calculateTotal en Borde) son distinguibles por texto del badge (ACTIVE / SUPERSEDED), no solo por color.
- Contraste (computado): badges ACTIVE 12.74:1, SUPERSEDED 9.95:1, target-ref 10.67:1, code 10.30:1, descripciones 10.31:1, dt 9.95:1, dd 15.61:1, PROPUESTA 7.23:1; sellos DEMO 9.50–11.16:1. Todo AA. Nada usa `--text-dim`.
- Enlaces «Ver regla →» subrayados y distinguibles; el estado «actual» de la cadena se comunica por texto y `aria-current`, además del borde.
- Procedencia: `fk_import_tax` muestra «Importación aprobada» + «Referencia de importación docs/reglas-negocio.md#L12»; la fila de referencia no aparece para HUMAN_ANSWER. Rol «Admin» (ConfirmingRole) y solo id de usuario.
- Cadena completa v0→v1→v2 con enlaces a las otras reglas conservando `workspaceId`; sin ciclos.
- Bloque «Qué más alimentó este contexto» ausente en AnalysisRunDetailPage; sin rastro de «Test existente».
- Rótulos DEMO · DATOS SIMULADOS presentes en lista, detalle y run. El panel «Runs que usaron esta regla» conserva el sello PROPUESTA (HU52). No se promete nada de Core ausente: Fuente/Procedencia describen datos, y la copia «Es trazabilidad, no vencimiento» no promete comportamiento.
- Teclado: Tab llega a «Ver regla →» con foco visible (ver N1 sobre contraste del anillo).
- Responsive 375 px: `scrollWidth` 375, sin desbordamiento horizontal de página en lista ni detalle; la cadena envuelve (alto 354 px). Los únicos nodos que exceden son los enlaces de `ProjectTabs` (nav con scroll propio, previo).
- Roles: READER (`prj_org_metrics_demo`) ve la lista (grupo «Precondición funcional») y solo botones de filtro; no hay acciones de escritura expuestas.
- Carga: «Cargando reglas…» con `role="status"` confirmado.

## No verificado en vivo
- Error (`role="alert"` + «Reintentar») y vacío tras filtro: el panel de navegador quedó en `visibilityState=hidden` y los timers de react-query no avanzaron, por lo que no pude observarlos. Se verificó por código: `ErrorState` usa `role="alert"` con botón «Reintentar»; el vacío es `.empty-inline` «Sin reglas» (ver N6). Las pruebas del implementer los cubren.
- Rol WRITER (`prj_org_writer_demo`): no recorrido; la página no ofrece acciones por rol, por lo que no se espera diferencia.

## Resumen
- status: CHANGES_REQUESTED
- blockers: B1 (ambigüedad de «Regla actual» en regla SUPERSEDED)
- filesAffected: `app/src/action-required/FunctionalKnowledgeDetailPage.tsx`, `FunctionalKnowledgeDetailPage.test.tsx`, `FunctionalKnowledgePage.tsx`, `FunctionalKnowledgePage.test.tsx`, `app/src/styles.css`
- recommendedNextStep: corregir B1 (y de paso N2, N3, N6 vacío con `role="status"`, que son triviales); volver a revisar solo la cadena. N1, N4, N5 y la jerarquía del Run pasan a seguimiento fuera de este WI.
