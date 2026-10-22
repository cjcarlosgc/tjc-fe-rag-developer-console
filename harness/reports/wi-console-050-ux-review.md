# WI-CONSOLE-050 — revisión UX (ciclo 1 de 2)

Modelo: ux-reviewer · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo low

**Veredicto: APPROVED**

Mediciones propias: dev server demo propio (puerto 5199, ya detenido), navegador integrado, HEAD b17ca25. Sesión mock mantenida con navegación SPA (pushState), sin recargas.

## Mediciones (scrollWidth/clientWidth)

El viewport «1280» quedó limitado por el panel a 1024 px (ver «No probado»).

| Página | 1024 doc | 375 doc | 320 doc | .table-frame / wrap (1024 / 375 / 320) |
|---|---|---|---|---|
| Experimento con resultado, detalle abierto | 1024/1024 | 375/375 | 320/320 | 1461/982 · 1461/333 · 1461/278 |
| Inventario | 1024/1024 | 375/375 | 320/320 | 982/982 · 627/333 · 627/288 |
| Historial de análisis (sin tabla) | 1024/1024 | 375/375 | 320/320 | n/a |
| Runs (sin tabla) | 1024/1024 | 375/375 | 320/320 | n/a |
| Comparación de estrategias pr53 | 1024/1024 | 375/375 | 320/320 | n/a |
| Comparación de estrategias pr52 | no medido | 375/375 | **354/320** | n/a |
| Comparación de recuperación pr52 con resultado (2 tablas) | no medido | 375/375 | **363/320** | 761/235 · 761/180 |
| Functional Knowledge lista | 1024/1024 | 375/375 | **328/320** (conocido, WI-047) | n/a |
| Functional Knowledge detalle (fk_total_empty_cart) | no medido | 375/375 | no medido | n/a |

Antes/después en Experimento (misma página, 1024 px, alternando `position` del frame por JS): static → documento 1342/1024 (desborde reproducido); relative → 1024/1024.

## Diseño no alterado

- El frame conserva scroll horizontal interno (`overflow-x: auto`, 1461 en 982/333/278) y `position: relative` es la única propiedad nueva. Es sin efecto visual salvo contener el `.visually-hidden`.
- Foco con teclado: Tab desde el `<summary>` llega a `.table-frame[role=region]` (`tabindex=0`, nombre «Detalle por target y repetición»), `:focus-visible` verdadero, contorno sólido de 2 px; captura sin anomalías.
- Columna «Contexto»: el `th` con span `.visually-hidden` sigue en el árbol de accesibilidad (`find` lo devuelve como «Contexto», más seis enlaces «Ver contexto →»).
- Sin diferencias visuales en las capturas tomadas.

## Cobertura del patrón

`.table-frame` está en `components.css` y se usa en Experimento e Inventario. La tabla de recuperación usa `.retrieval-table-wrap`, que no es `position: relative`, pero no contiene ningún `.visually-hidden` (0 hallados) y no desborda por ello. `StructuredAlternativeView` también tiene `<table>`; no se midió (ver «No probado»). El fix cubre el patrón real hoy; es latente si se añade `.visually-hidden` dentro de `.retrieval-table-wrap`.

## Hallazgos

| ID | Severidad | Detalle |
|---|---|---|
| H1 | Baja, fuera de alcance | Comparación de recuperación a 320 px con resultado: documento 363/320. Causa medida: `h2.retrieval-result-heading` (314 de contenido en 222 de caja). No es de tablas ni de este fix. Candidato a WI-047. |
| H2 | Baja, fuera de alcance | Comparación de estrategias pr52 a 320 px: 354/320 por `div`/`dt`/`dd` (sin tablas). Preexistente, candidato a WI-047. |
| H3 | Info | `.retrieval-table-wrap` sin `position: relative`: latente, sin desborde medido. No requiere cambio en este WI. |

Ningún hallazgo bloquea. Ninguno es regresión de bc17790.

## No probado

- 1280 px exactos: el panel limita a 1024 px; no se midió a 1280.
- `StructuredAlternativeView` (grafo del Context Explorer) y la vista de contexto.
- Lector de pantalla real, solo árbol de accesibilidad vía `find`.
- Resto de proyectos y datos de la demo (solo `prj_checkout_demo` y runs pr52/pr53, más billing/org_writer solo para localizar datos).
- Navegadores distintos al integrado; tema claro.
- No se editó código. Dev server detenido y viewport restaurado a desktop.
