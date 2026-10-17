# WI-CONSOLE-015 — Revisión UX 2 (delta de la Corrección 1)

Modelo: ux-reviewer · configurado sonnet (general-purpose con rol ux-reviewer) · atendido claude-sonnet-5-5 · esfuerzo medium

status: APPROVED (0 bloqueantes, 2 observaciones no bloqueantes)

Alcance: solo el delta de la Corrección 1 contra `wi-console-015-ux-review.md` (B1, N2, N3, N5, N6). Solo lectura; mock `console-mock` en navegador (detenido y viewport restablecido al terminar). Colores con `getComputedStyle`, contraste WCAG calculado contra el fondo efectivo.

## Estado de lo pedido

- B1 RESUELTO. `fk_rounding_v1`: fila SUPERSEDED v1 = «Estás viendo esta regla» (`aria-current="step"`, borde acento rgb 201,180,250); fila ACTIVE v2 = «Vigente» + «Ver regla →». La regla reemplazada ya no se presenta como vigente. `fk_rounding_v2`: «Estás viendo esta regla» y «Vigente» en la misma fila, sin enlace a sí misma. Intro: «De la regla más antigua a la más reciente. Se indica cuál estás viendo y cuál está vigente.» Los dos conceptos son inequívocos y se comunican por texto, no solo por color/borde.
- Color y contraste del texto nuevo: ambos rótulos (`.fk-chain-note`) computan `rgb(234,231,247)` (#eae7f7), peso 700, sobre rgb(11,11,13): 16.17:1 (AA y AAA).
- N2 RESUELTO: la tarjeta lee «Clave de escenario» (consistente con el detalle).
- N3 RESUELTO: `.fk-card-meta` ya no declara `color` muerto; el comentario del bloque dice la verdad (hereda #bcbac9, 10.31:1).
- N5 RESUELTO: en `fk_rounding_v2` el `dd` contiene `<code title="9f8e7d6c5b4a…">9f8e7d6</code>` más «commit completo: 9f8e7d6c5b4a39281706f5e4d3c2b1a098765432» en `.visually-hidden` (clase preexistente, styles.css:149). Computado: 1×1 px, `position:absolute`, `clip: rect(0,0,0,0)`, `overflow:hidden`, `nowrap`. Visualmente no se ve (solo 7 caracteres) y no crea desborde: a 1024 px el único nodo que excede es un botón de cabecera preexistente («Cerrar sesión», scrollWidth 1037, no relacionado con este corte); a 375 px scrollWidth 375 y cero nodos desbordados. El texto oculto sí entra en `innerText` del `dd`, por lo que lo leen lectores de pantalla.
- N6 RESUELTO (con matiz, ver O1): en `prj_org_metrics_demo`, filtro Superseded → «Sin reglas / Todavía no hay conocimiento funcional persistido para este filtro.» dentro de un `div role="status"`; botón Superseded `aria-pressed=true`; texto #eae7f7. Antes del filtro el mismo `div` existe vacío con `role="status"`; durante la carga pierde el rol y lo anuncia `LoadingState` (sin duplicar).
- 375 px (`fk_rounding_v2`): sin desbordamiento horizontal; la cadena envuelve (alto 354 px), cada fila apila badge, regla y notas; «Estás viendo esta regla» y «Vigente» quedan en la misma línea y legibles.

## Observaciones no bloqueantes

- O1. El rol `status` del wrapper se conmuta (sin rol mientras carga, con rol al terminar) y el contenido «Sin reglas» aparece en el mismo instante en que el rol se añade. Algunos lectores de pantalla no anuncian una región live cuyo rol y contenido llegan a la vez. Mejora opcional: mantener `role="status"` siempre en el wrapper y renderizar `LoadingState` fuera de él con `aria-live` propio, o `aria-live="polite"` fijo en el wrapper. No bloquea; mejor que el estado previo (sin anuncio) y cumplía la intención del AC. No pude verificar el anuncio real con lector de pantalla.
- O2. A 375 px el sello PROPUESTA del panel «Runs que usaron esta regla» se estira a ~190 px de alto (flex stretch), preexistente de HU52 y fuera del delta. Seguimiento aparte, junto con N1 (contraste del foco), N4 y la jerarquía H3/H2 del Run de la revisión anterior.

## Resumen

- status: APPROVED
- blockers: ninguno
- findings: O1, O2 (no bloqueantes); B1, N2, N3, N5, N6 resueltos
- filesAffected (revisados): `app/src/action-required/FunctionalKnowledgeDetailPage.tsx`, `app/src/action-required/FunctionalKnowledgePage.tsx`, `app/src/styles.css`
- evidence: mediciones en navegador descritas arriba (v1, v2, `prj_org_metrics_demo`, 375 px)
- recommendedNextStep: cerrar la revisión UX del WI; O1/O2 y N1/N4 como seguimiento fuera de este WI.
