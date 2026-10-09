# WI-CONSOLE-014 — Re-revisión UX (corrección 1)

Modelo: ux-reviewer · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo low

Estado: APPROVED (con una decisión abierta para el humano: N4 correlationId)

Alcance: verificación acotada de B1, B2, B3, N1–N4 de `wi-console-014-ux-review.md` frente a `wi-console-014-correction-1.md`. Sin edición de código. Mock en `http://localhost:5173` sin reiniciar. Viewport restablecido a escritorio.

## Resultado por hallazgo

- **B1 CERRADO.** Lanzado como Writer en `arun_checkout_pr49` (formatCurrency): el estado pasó a «Comparación completada…» y la previa `rcmp_demo_2001` pasó de «Pendiente (PENDING)» a «Completada (COMPLETED)» con «Ver resultado».
- **B2 CERRADO.** Con Tab/Shift+Tab reales llegué al CTA «Comparar retrieval SE vs SEM» en `/projects/prj_checkout_demo/runs/arun_checkout_pr49`: `:focus-visible` true, `outline: solid 3px`, offset 2 px, color `rgb(201,180,250)` sobre fondo `rgb(5,5,6)`: ≈ 11:1 (≥ 3:1).
- **B3 CERRADO.** Reader (`prj_org_metrics_demo`, pr15): `role=status` = «Solo lectura: puedes consultar las comparaciones previas.» (16.8:1); sin selector `#retrieval-symbol` ni botón de comparar.
- **N1 CERRADO.** Ninguna cadena «null» en el resultado; los pesos y `combinedScore` en SEM muestran «no aplica».
- **N2 CERRADO.** «Sin relación estructural» aparece solo en la tabla SE; la tabla SEM muestra «no aplica» (24 celdas).
- **N3 CERRADO.** Captions «Candidatos por ranking del modo SE|SEM»; h3 «Modo SE», «Métricas del modo SE», «Modo SEM», «Métricas del modo SEM»; contenedores con `role=region`, `aria-label` «Candidatos del modo …» y `tabindex=0`.
- **N4 PARCIAL (decisión abierta).** Las previas FAILED ahora muestran failureCode y failureMessage (verificado en vivo con `rcmp_demo_seed_failed`: DEMO_EMBEDDING_INDEX_UNAVAILABLE + mensaje). El FAILED propio usa `ErrorNote` (por código/prueba; no producible desde el mock). El DTO de §6.15 no trae `correlationId`, así que FAILED no puede mostrarlo: desviación respecto del AC, a decidir por el Human Reviewer (exponerlo en Core o aceptar la desviación). No se considera defecto de la implementación.

## Findings (no bloqueantes, nuevos o residuales)

- Nit: en Reader sin previas, el estado dice «puedes consultar las comparaciones previas» mientras la lista dice «Todavía no hay comparaciones…». No es falso ni accionable en vano; aceptable.
- Nit entorno: React Query pausa el polling en pestaña oculta (`document.hidden`); en la verificación la comparación solo avanzó al forzar visibilidad. No es defecto del producto.
- N5, N6, N7, N8 sin cambios (fuera del alcance de la corrección; N8 y N7 pre-existentes/no atribuibles). Se observó además en pr15 a 1024 px un desbordamiento de 13 px causado por un `BUTTON.button.secondary` global (cabecera), pre-existente y no atribuible a esta WI.

## Blockers

Ninguno.

## Evidence

- Contraste computado (fondo compuesto) sobre todos los nodos de texto de `<main>` con resultado SE/SEM (336 nodos), excluyendo los separadores globales pre-existentes (N8): mínimo 9.5:1 (sello DEMO), resto ≥ 9.9:1. Textos nuevos o cambiados (status Reader 16.8:1, captions, h3, «no aplica», failureCode/failureMessage) por encima de 4.5:1.
- Previas en `arun_checkout_pr49`: FAILED con código y mensaje, COMPLETED con «Ver resultado», tras lanzar: la nueva en COMPLETED.
- `role=status` estable y sin `role=alert` en el ciclo normal (sin cambios respecto a la primera revisión).

## recommendedNextStep

Pasar a la revisión del Human Reviewer; decidir N4 (correlationId en el DTO de estado de §6.15 o desviación aceptada).
