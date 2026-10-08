# WI-CONSOLE-013 — Corrección 1 (tras CHANGES_REQUESTED)

Modelo: implementer · configurado claude-haiku-5-5 · atendido unknown · esfuerzo low

Sin commit, sin push. No se tocó `harness/state.json` ni `harness/work-items.json`. Código solo en `app/`.

## 1. Contraste y legibilidad

Fondo real de la tarjeta: `.panel` y `.focus-mode-card` / `.action-required-item` usan `var(--surface-1)` = `#0b0b0d`.

Razones de contraste calculadas (WCAG, luminancia relativa, sobre `#0b0b0d`):

| Color | Ratio |
|---|---|
| `#eae7f7` (texto usado en las notas nuevas) | 16.17:1 |
| `--muted` `#bcbac9` (usado por `.empty-inline-note`) | 10.31:1 |
| `--text-dim` `#716f82` | 4.02:1 (insuficiente para texto pequeño; no se usa) |

El problema reportado era de tamaño (13px) y tono tenue, no solo de tono. Cambios:

- `app/src/styles.css`: clases propias `.abstention-note` (14px, `#eae7f7`, borde izquierdo 3px `--signal-semantic`) y `.role-note` (14px, `#eae7f7`, borde izquierdo punteado `--accent`). El indicador de la nota no depende del color: la forma del borde y el texto la identifican. `.empty-inline-note` global no se modificó.
- `FocusModePage.tsx` y `ActionRequiredPage.tsx`: la línea de abstención usa `abstention-note` (sin `empty-inline-note`). La nota «Solo un Maintainer o Admin…» usa `role-note`.

## 2. Pruebas Writer/Reader y abstención

Nuevas pruebas:

- `app/src/test/roleGating.test.tsx`: Experiment, RunComparison y AnalysisRunDetail con rol Writer y Reader. Se usa un stub de prueba de `useProject` (`vi.mock` sobre `../projects/queries`) que solo sobreescribe `role`. Motivo: `prj_org_writer_demo` y `prj_org_metrics_demo` tienen `currentVersionId: null`, así que ExperimentPage no tiene inventario. No se modificó el seed. El rechazo real de rol del backend mock sigue en `requireProjectRole`.
- `app/src/control-plane/IntegrationsRoles.test.tsx`: Integrations con seeds reales (`prj_org_writer_demo` WRITER, `prj_org_metrics_demo` READER).
- `app/src/action-required/FocusModePage.test.tsx`: tres pruebas nuevas de teclado y del caso provisional de HEAD (ver punto 3).
- `app/src/action-required/ActionRequiredPage.test.tsx`: abstención que mantiene la pregunta sin identidad de usuario ni texto prohibido, y Writer/Reader sin botones de respuesta ni «No lo sé».

Las aserciones de Writer/Reader en Focus Mode ya existían y se conservan.

## 3. HEAD cambiado y respuesta UNKNOWN

INTEROP-2.7 §6.11 solo fija que la pregunta queda OBSOLETE. No se inventó semántica.

- `app/src/api/mockBackend.ts`: comentario sobre el bloque `headChanged`. Comportamiento provisional del mock, no definido por §6.11, diferido a WI-CORE-018. El mock sigue devolviendo `outcome: ABSTAINED` sin registrar abstención (comportamiento previo, sin cambio).
- Prueba `INTEROP-2.7 (comportamiento provisional del mock): «No lo sé» con HEAD cambiado deja la pregunta OBSOLETE sin abstención registrada`: tras responder, aparece «Sin preguntas pendientes en este Run» y no aparece «Abstención registrada».

## 4. Teclado, foco y anuncio

Hallazgo: el botón «No lo sé» se deshabilita durante el envío (`disabled={submitAnswer.isPending}`) y, al hacerlo, el foco se pierde en `body`. Corrección:

- `FocusModePage.tsx`: `cardRef` sobre la tarjeta (`tabIndex={-1}`). Al resolver con outcome `ABSTAINED` se llama `cardRef.current?.focus()`. `useRef` se declara antes de los returns tempranos.
- `styles.css`: `.focus-mode-card:focus-visible` con el mismo anillo que el resto de controles. Los botones ya tenían `:focus-visible` global (`.button:focus-visible`), así que no se añadió nada más para ellos.
- El contenedor `role="status"` ya estaba siempre montado dentro de la tarjeta cuando hay pregunta vigente. Se verificó que la abstención se anuncia dentro de él.

Pruebas añadidas (userEvent): Tab desde «Sí» hasta «No lo sé» (tres Tab), Enter y aserción de la línea dentro de `role="status"` con foco en la tarjeta; Espacio también activa «No lo sé».

## Archivos tocados

- `app/src/styles.css`
- `app/src/action-required/FocusModePage.tsx`
- `app/src/action-required/ActionRequiredPage.tsx`
- `app/src/action-required/FocusModePage.test.tsx`
- `app/src/action-required/ActionRequiredPage.test.tsx`
- `app/src/api/mockBackend.ts` (solo comentario; sin cambio de comportamiento)
- `app/src/test/roleGating.test.tsx` (nuevo)
- `app/src/control-plane/IntegrationsRoles.test.tsx` (nuevo)
- `harness/reports/wi-console-013-correction-1.md` (nuevo)

## Resultados de checks (desde app/)

- `npx tsc -b --noEmit`: sin errores.
- `npm run lint`: sin errores.
- `npx vitest run --maxWorkers=2`: 57 archivos, 472 pruebas, todas pasan (antes 55 / 459).
- `npm run build`: correcto (aviso habitual de chunk > 500 kB, no bloqueante).

Pendiente de revisión: revisión visual de contraste en navegador y revisión `ux-reviewer` del delta, según el flujo del harness.
