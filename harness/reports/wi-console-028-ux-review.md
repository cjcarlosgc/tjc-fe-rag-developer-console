Modelo: ux-reviewer · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo low

# WI-CONSOLE-028 — revisión UX (contraste computado, teclado, 375/768/1024/1440 px)

Método: Playwright/Chromium headless con `getComputedStyle`, alfa compuesto sobre fondo efectivo (WCAG), foco con Tab real. ANTES = HEAD 8e59df1 servido desde un worktree temporal (puerto 5175); DESPUÉS = árbol de trabajo (puerto 5174), ambos con mock. Rutas: run `arun_checkout_pr42`, focus, action-required, runs, retrieval-comparison, functional-knowledge, experimental, project, home.

| Punto | ANTES | DESPUÉS |
|---|---|---|
| Anillo de foco (botón, enlace, textarea, select) | `rgba(201,180,250,.42)` 3px: 2.70-2.71:1; textarea solo outline UA 3.29:1 | `rgb(201,180,250)` 3px: 10.58-10.67:1 |
| «VS» (`.versus`) | 4.17:1 | 10.68:1 |
| `.breadcrumbs-sep` (decorativo) | 1.45:1 | 4.17:1 |
| `.repo-chip .repo-sep` | 3.89:1 | 9.95:1 |
| Desborde a 375 px, detalle de Run | scrollWidth 526 > 375 (6 elementos) | 375 = 375 |
| Desborde cabecera a 768 / 1024 px (todas las pantallas) | 900 > 768 y 1037 > 1024 | 768 = 768 y 1024 = 1024 tras el Corte B (también 375 y 1440) |
| Sellos DEMO/PROPUESTA a 375 px | 335 de 335 (estirado) / 87 px aplastado y desbordando | 180 px (ancho de contenido) / 166-195 px dentro del padre |
| Encabezados detalle de Run | H1 → H3 «Símbolos cambiados» | H1 → H2, sin saltos |
| Functional Knowledge `role=status` | solo tras `isSuccess` | presente desde la carga |
| Tabla de experimentos | `.table-frame` scroll interno, `tabIndex=0` | igual (operable por teclado) |

Foco a la tarjeta tras error / ABSTAINED: no reproducible en el mock (nunca falla ni devuelve ABSTAINED). Se apoya en pruebas RTL con fetch spy; prueba de mutación en el worktree ANTES: los 2 tests nuevos fallan sin el fix.
«—» en Intento/Evaluable: no producible en el mock; cubierto solo por el test RTL de fixture mixto.

Corte B (cabecera): fila 1 marca + nav, fila 2 badges + email + «Cerrar sesión» a 768/1024; una sola fila de 73 px a 1440; foco visible 3px en «Cerrar sesión» en los 4 anchos.

Hallazgos: M1 (cabecera, mayor, preexistente) CERRADO por el Corte B. Menores no bloqueantes: `summary` conserva outline UA 1px azul 3.29:1 (fuera de alcance); email truncado con elipsis a 768/1024; bordes `.button.secondary` (~1.2:1) y P@10/R@10 (`#5b4d86`, ~2.7:1) sin cambio, decisión documentada (WI-005/006). Observaciones: dos regiones `status` coexisten durante la carga de Functional Knowledge; orden de foco con lector de pantalla NO verificado.

Veredicto: APPROVED (tras 1 ciclo de corrección).
