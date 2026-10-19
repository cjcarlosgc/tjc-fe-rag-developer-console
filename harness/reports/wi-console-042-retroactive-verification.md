# WI-CONSOLE-042 — verificación retroactiva (UI)

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**RETROACTIVIDAD DECLARADA.** WI abierto y cerrado después de ejecutado el trabajo. `implementationAgent: cross` (sesión coordinadora cross, por excepción puntual del usuario, sin WI ni `ux-reviewer` en su momento). Commit regularizado: `3f6341c`. Reporte de origen: `cross-fase4-ui-console-2026-10-18.md`. Revisan `reviewer` y `ux-reviewer`, ambos independientes de cross.

## Evidencia reproducida por el leader (Node 22, pnpm 12.14.0)

| Comprobación | Resultado |
|---|---|
| `pnpm lint` (incluye jsx-a11y) / `tsc -b --noEmit` / `format:check` / `build` | 0 / 0 / 0 / 0 |
| `pnpm test` | 79 archivos, 840/840 |
| Contraste calculado (WCAG, script propio) | `--text-dim` #8a8799: 5.83 (canvas), 5.62 (surface-1), 5.43 (surface-2), 5.05 (surface-3), 4.83 (panel) — AA ≥ 4.5; el valor anterior #716f82 daba 4.17/3.46 (fallaba). `--border-strong` #6a6688: 3.75–3.11 sobre las mismas superficies (≥ 3:1). `--muted` ≥ 8.86, `--text` ≥ 13.9, `--warning` ≥ 9.23, `--danger-text` ≥ 10.09 |
| Navegador (modo demo, `pnpm --dir app dev` con mock) | login: título «Acceso · RAG Test Studio», rótulos «DEMO · IDENTIDAD SIMULADA» y «DEMO · DATOS SIMULADOS» visibles; ruta inexistente: 404 dentro del shell, título «Página no encontrada · RAG Test Studio», enlace «Saltar al contenido», `color-scheme: dark`, enlaces de navegación de 40 px de alto |
| Hallazgo de medición | enlace de marca del shell mide 32 px y «Saltar al contenido» 37 px de alto (< 40 px); para revisión de `ux-reviewer` (el criterio de 40 px de cross-fase4 lista navegación, segmentados, selectores, píldoras y barra del grafo, no estos dos) |

## No verificado por el leader (se deja a los reviewers)

Captura en 375 px, zoom 200 %, reduced motion, foco restaurado en diálogos, y la fidelidad del marcado migrado a `StatusBadge`/`EmptyState`/`PageHeader` (24 insignias, 10 estados vacíos, 4 encabezados).

## Cobertura frente a WI-CONSOLE-005/006

Parcial; ninguno se cierra. Pendientes declarados por cross: primitives Button/Field/SegmentedControl/ProgressBar, partir páginas grandes, decisión sobre WebSocket (en espera por orden del usuario), revisión de contraste con herramientas.
