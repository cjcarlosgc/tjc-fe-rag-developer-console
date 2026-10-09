# WI-CONSOLE-017 — Revisión UX (ux-reviewer)

Modelo: ux-reviewer · Sonnet 5.5 Low. Ciclo 1 de 2: CAMBIOS REQUERIDOS (1 bloqueante menor), corregido por el Leader (cambio mínimo de CSS) y verificado en navegador.

Verificado en el mock (http://localhost:5173): descarga real por Enter en Run SUCCESS, ACTION_REQUIRED, Reader y Experimento (ancla blob con `download=evidence-<kind>-<id>.json`), `role="status"` «Descarga preparada» y «Esquema de evidencia: v1»; QUEUED sin control; sin errores de consola; sin EV-OE*, veredictos ni «evidencia científica/empresarial»; rótulo DEMO · DATOS SIMULADOS y nota «Paquete técnico de Core; no es el registro académico.»; botón 40 px de alto.

Contraste medido con color computado real (fondo efectivo): botón 15.72:1; hint/nota 10.31:1; status 10.67:1; demo-stamp 9.50:1.

Hallazgos:
- B1 (bloqueante menor, CORREGIDO): anillo de foco global translúcido ~2.7:1. Se añadió `.evidence-button:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px }`; verificado con Tab real: `outline` rgb(201,180,250) sólido 3px (≈10:1 sobre el fondo).
- N1 (CORREGIDO): demo-stamp de 10 px subido a 12 px.
- N2: la rama deshabilitada (aria-disabled + hint) es inalcanzable en las páginas (se monta solo con sujeto terminal); queda cubierta por pruebas unitarias. Aceptado.
- N3: borde del botón 1.15:1; el texto identifica el control. Se deja como deuda del tema.
- N4/N5: regiones status adicionales en Run y estado «Descarga preparada» persistente: menores, sin cambio.
- No verificado en navegador: comparación de retrieval (polling pausado por pestaña oculta; revisada por código y cubierta por prueba de página), ruta 409/error (el mock no tiene disparador para un sujeto terminal; cubierto por pruebas), `.inline-error` no medido.
