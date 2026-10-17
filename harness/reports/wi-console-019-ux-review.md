# WI-CONSOLE-019 — Revisión UX

Modelo: ux-reviewer (ejecutado con general-purpose) · configurado unknown · atendido claude-sonnet-5-5 · esfuerzo unknown

Alcance: nota `ExperimentConditionsNote` (div `.contract-note.experiment-conditions-note`, `role="note"`) en `ExperimentPage` y `RunComparisonPage`. Método: revisión estática (diff, componente, `app/src/styles.css`, tests); no se arrancó dev server ni navegador, por lo que no hay verificación visual.

## Status: APPROVED (con observaciones menores no bloqueantes)

## Hallazgos

1. Jerarquía y ubicación (OK). En ExperimentPage la nota queda tras el encabezado y antes de `CaptureNextPrPanel`/panel de ejecución, de modo que el contexto se lee antes de ejecutar. En RunComparisonPage queda tras el `page-heading` y antes del aviso DEMO/API. Es texto plano de una sola frase, sin protagonismo excesivo.
2. Consistencia (OK). Reutiliza `.contract-note` (borde punteado, `--surface-1`, `--muted`), sin CSS nuevo (`styles.css` sin cambios). La clase `experiment-conditions-note` no tiene reglas; sirve solo de gancho.
3. Contraste (OK). Texto `--muted` #bcbac9 sobre `--surface-1` #0b0b0d: aprox. 10:1, supera AA/AAA. No usa color como único portador de significado (no hay glifo ni semántica cromática).
4. Accesibilidad (OK). `role="note"` es válido; el contenido es un `<p>` con texto completo, sin dependencia de icono, legible por lectores. Sin foco ni interacción.
5. Sin veredicto ni promesa de paridad (OK). El texto describe condiciones y diferencias de estrategia sin términos de ganador/superior/paridad; `noAutomaticVerdict.test.tsx` lo verifica con regex y selectores.
6. Responsive (OK, sin verificar visualmente). Es un flex con un único hijo `p` de texto que fluye; no hay anchos fijos ni overflow previsible a 375px.
7. Menor (no bloqueante): `.contract-note p` aplica `margin: 5px 0 0`, de modo que el texto queda ~5px más abajo que el padding simétrico. Cosmético.
8. Menor (a verificar visualmente): en RunComparisonPage hay dos `.contract-note` apilados (la nueva y el aviso DEMO/API). No se encontró regla de separación vertical explícita para `.contract-note` consecutivos; confirmar en navegador que existe espacio entre ambos (puede venir de reglas de `section`). Además, la nota nueva carece de glifo/encabezado, lo que la distingue del aviso DEMO/API; es aceptable y deseable (no compite con él).

## Riesgo residual (fuera de alcance, WI-CONSOLE-018)

`ExperimentComparison` usa `.positive-delta` (verde `--success`) y `.negative-delta` (rojo `--danger`) en los deltas de tasas, con signo `+`/número (el signo mitiga la dependencia del color) pero el verde/rojo puede leerse como juicio implícito de «mejor/peor» y entrar en tensión con la nota de condiciones y la ausencia de veredicto. Tratar en WI-CONSOLE-018.

## Blockers
Ninguno.

## filesAffected (revisados, sin edición)
- app/src/experiments/ExperimentConditionsNote.tsx
- app/src/experiments/ExperimentPage.tsx
- app/src/run-comparison/RunComparisonPage.tsx
- app/src/experiments/noAutomaticVerdict.test.tsx
- app/src/styles.css (sin cambios; `.contract-note`, `.positive-delta`/`.negative-delta`)

## Evidence
Revisión estática de diff y CSS; cálculo de contraste a partir de tokens `:root`. Sin captura visual.

## recommendedNextStep
Aprobar desde UX. Opcional: confirmar visualmente en mock el espaciado entre las dos notas en RunComparisonPage antes del cierre humano; abordar deltas verde/rojo en WI-CONSOLE-018.
