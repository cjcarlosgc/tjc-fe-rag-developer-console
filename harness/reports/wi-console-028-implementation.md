Modelo: implementer · configurado claude-haiku-5-5 · atendido unknown · esfuerzo low

# WI-CONSOLE-028 — informe de implementación

Alcance: `app/` (código y pruebas). No se tocó `harness/state.json`, `harness/work-items.json`, `tasks.md`, specs, contratos, DTO, API, adapters ni copy (salvo «—»). Sin commit ni push.

## 1. `app/src/styles.css`

- **Foco** (líneas 32, 51, 333, 395): `rgba(201,180,250,.42)` → `var(--accent)`. Línea 32 añade `textarea:focus-visible` al selector global: antes el textarea solo cambiaba `border-color` (líneas 59) y no tenía anillo. `--signal-focus` de `.rag-node.is-focused` no se tocó.
- **Contraste**:
  - `.versus` (234): `--text-dim` → `--muted` (4.02:1 → ≈9:1).
  - `.breadcrumbs-sep` (139): `--border` → `--text-dim` (1.45:1 → ≈4:1; separador decorativo `aria-hidden`, supera 3:1).
  - `.repo-chip .repo-sep` (437): `--text-dim` → `--muted` (3.89:1 → ≈9:1; la «/» es texto informativo del «org/repo», sin `aria-hidden`).
- **Desbordes**:
  - `.run-heading-actions` (21): `flex-wrap: wrap; justify-content: flex-end; min-width: 0`.
  - `.status-badge` (148): `max-width: 100%; overflow-wrap: anywhere`.
  - `.demo-stamp` (115) y `.proposal-stamp` (117): `align-self: flex-start; width: fit-content; max-width: 100%`.
  - `.analysis-run-summary` (469-472): `> * { max-width:100%; min-width:0 }` y `code { overflow-wrap:anywhere }`.
  - `.symbol-list li` (480): `flex-wrap: wrap`; `.symbol-list code` (481): `overflow-wrap:anywhere; min-width:0`.
  - `.test-proposal-item` (484): `flex-wrap: wrap`; `code` (485): `overflow-wrap:anywhere; min-width:0`.
  - `.repetition-detail` (260): `min-width:0; max-width:100%`; nueva regla `.experiment-results` (261): `min-width:0; max-width:100%` (la clase existe en `ExperimentComparison.tsx:91` pero no tenía CSS). `.table-frame` (overflow-x:auto, tabIndex=0) intacto.
  - Ajuste de apariencia para el h3→h2 (ver punto 4): `.analysis-run-summary h2 { font-family: inherit; font-size: 1.17em; margin: 1em 0 }` (valores del h3 por defecto del navegador, sin tokens nuevos).

## 2. `app/src/action-required/FocusModePage.tsx`

- `submit`: añadido `onError: () => cardRef.current?.focus()`.
- `resolveConflict`: `onSuccess` con `else cardRef.current?.focus()` cuando `outcome === 'ABSTAINED'`; añadido `onError: () => cardRef.current?.focus()`.

## 3. `app/src/action-required/FunctionalKnowledgePage.tsx`

- Línea 49: `<div role={knowledgeQuery.isSuccess ? 'status' : undefined}>` → `<div role="status">` (siempre montado).

## 4. `app/src/control-plane/AnalysisRunDetailPage.tsx`

- Línea 167: `<h3>Símbolos cambiados</h3>` → `<h2>`; apariencia conservada con la regla CSS del punto 1.

## 5. `app/src/experiments/ExperimentComparison.tsx`

- Líneas 200 y 203: `''` → `'—'` en Intento y Evaluable cuando el valor es null. `showRunColumns` intacto.

## Decisión documentada: bordes (WCAG 1.4.11)

- Botón de evidencia (`.button.secondary`, borde `--border-subtle`, 1.15:1): NO se cambia. Tiene etiqueta de texto visible con contraste ≥4.5:1; la etiqueta identifica el control. Cambiarlo solo para este botón rompería la consistencia; cambiar `.button.secondary` globalmente es rediseño (WI-005/006).
- P@10/R@10 (`.retrieval-metric-key`, `border-color: #5b4d86`, ≈2.7:1): NO se cambia. No es un control; el valor se identifica por etiqueta y negrita/tamaño. El hex fuera de tokens queda para WI-005.

## Pruebas añadidas o ajustadas

- `FocusModePage.test.tsx` (nuevas, RTL + fetch spy como el test live existente, sin clases nuevas):
  - Fallo 500 en el submit → `alert` y foco en `.focus-mode-card` (contenedor localizado con `closest`, como ya hace el test de teclado).
  - Conflicto 409 → «Reemplazar regla vigente» → 202 `ABSTAINED` → foco en el contenedor. El mock no alcanza esta rama (`mockBackend.ts` 1596-1601 siempre responde ANSWERED tras resolver), por eso se usa fetch spy.
- `FunctionalKnowledgePage.test.tsx`: ajustado «carga» a `getAllByRole('status')` (LoadingState y el wrapper coexisten durante la carga). Nueva: la región `status` existe vacía durante la carga y sigue siendo la misma tras cargar.
- `AnalysisRunDetailPage.test.tsx` (nueva): «Símbolos cambiados» es h2 y ningún encabezado salta más de un nivel; el primero tras h1 es h2 (`arun_checkout_pr42`).
- `ExperimentComparison.test.tsx` (nueva): fixture mixto (una fila con intento 1 y evaluable, otra con ambos null) → «—» en la segunda fila y columnas presentes. El test existente con todo null sigue sin columnas.

## Gates (app/)

`npm --prefix app run lint`: sin salida de error (exit 0).

`cd app && npx tsc -b --noEmit`: exit 0.

Tests focalizados (`src/action-required`, `AnalysisRunDetailPage.test.tsx`, `ExperimentComparison.test.tsx`): 9 files, 151 tests passed.

`cd app && node node_modules/vitest/vitest.mjs run --maxWorkers=2`: 67 files, 728 tests passed.

`npm --prefix app run build`: built in 471 ms (aviso existente de chunk >500 kB, no bloqueante).

## No verificado (pendiente)

- Contraste computado, anillo de foco y desbordes a 375/768/1024 px en navegador: NO verificado en esta sesión. Requiere verificación visual/`ux-reviewer`.
- Orden real de foco con lector de pantalla: NO verificado.
- No se ejecutó la prueba «falla sin el fix» para los tests de foco; se comprobó que pasan con el cambio.

## Corte B (ciclo de corrección 1): desborde de la cabecera global

- Causa: `.topbar-inner` era flex nowrap por encima de 680 px y `.topbar-badges` no podía envolver; `.user-menu` quedaba sin ancho y «Cerrar sesión» salía por la derecha.
- Cambio (solo `app/src/styles.css`):
  - `.topbar-inner`: `flex-wrap: wrap; gap: 8px 24px` (base, antes `gap: 24px`). La regla ≤680 px existente se mantiene.
  - `.topbar-badges`: `flex-wrap: wrap` (ya tenía `min-width: 0`).
- Sin tokens nuevos. A ≥1320 px el contenido cabe en una fila, así que no cambia el layout de escritorio.
- Medición (Playwright/Chromium headless, servidor mock 5176, `document.documentElement.scrollWidth` vs `clientWidth`):

| Ancho | `/` | run `arun_checkout_pr42` | focus | experimentos |
|---|---|---|---|---|
| 375 | 375 / 375 | 375 / 375 | 375 / 375 | 375 / 375 |
| 768 | 768 / 768 | 768 / 768 | 768 / 768 | 768 / 768 |
| 1024 | 1024 / 1024 | 1024 / 1024 | 1024 / 1024 | 1024 / 1024 |
| 1440 | 1440 / 1440 | 1440 / 1440 | 1440 / 1440 | 1440 / 1440 |

  Antes del cambio: 768 → 900 > 768 y 1024 → 1037 > 1024 (medición del ux-reviewer).
- Gates: `npm --prefix app run lint` exit 0; `cd app && npx tsc -b --noEmit` exit 0; `vitest run --maxWorkers=2`: 67 archivos, 728 tests passed.
- Pendiente: revisión visual de la segunda fila de la cabecera a 768/1024 px (solo se midió el desborde, no la estética del wrap) y el criterio de «sin cambios a 1320 px+» verificado por inspección, no por captura comparativa.
