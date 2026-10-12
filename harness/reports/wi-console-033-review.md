Modelo: reviewer · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

# WI-CONSOLE-033 — revisión técnica independiente (awayMode), ciclo 2

**Veredicto: APPROVED** (sin hallazgos bloqueantes; no hay DEC ni cambio de contrato).

## Historial

- Ciclo 1: CHANGES_REQUESTED. La prueba «un Run INFRASTRUCTURE_FAILURE con propuestas AVAILABLE no es publicable» era vacua: con `PublishSection` montado en INFRASTRUCTURE_FAILURE seguía pasando (31/31) porque las aserciones de ausencia se evaluaban antes de que cargaran las propuestas. Los demás puntos (espejos, alcance de app/, conteos, estado del Harness, WI-CONSOLE-004, DEC) cumplían.
- Ciclo 2: corrección solo de prueba, verificada abajo.

## Evidencia del ciclo 2

- Mutación reproducida en copia aislada del scratchpad (el repo no se tocó; copia eliminada):
  - Código real: `AnalysisRunDetailPage.test.tsx` 31/31 pasan.
  - Mutado (`PublishSection` también para `INFRASTRUCTURE_FAILURE`): 1 falla, la prueba de WI-CONSOLE-033, con «expected document not to contain element, found <button», 30 pasan. Ahora la prueba protege la regresión.
- Cambios en app/: `git status --short app` solo muestra `app/src/api/mockBackend.ts` y `app/src/control-plane/AnalysisRunDetailPage.test.tsx`; ningún cambio de producto, `types.ts` ni `api.ts`. La corrección espera con `waitFor` a que desaparezca «Cargando propuestas…» y a que no exista el botón «Publicar» antes de afirmar la ausencia; no debilita pruebas previas.
- `tasks.md` `ST-CONSOLE-035` ya menciona 2.10, 2.11 y 2.12 y `-007`, `-009` y `-011` (observación menor del ciclo 1 resuelta).
- Sin cambios respecto al ciclo 1 en: espejos SYSTEM/INTEROP/GH-INTEROP == `864aa837` (SHA-256), `validate-harness` verde, 70 ficheros/772 pruebas verdes en la corrida del ciclo 1, `-007`/`-009`/`-011` C-RESOLVED, WI-CONSOLE-004 W-READY, DEC-INF-002/DEC-VAL-002 ausentes de app/src.

## Pendiente para el cierre del leader (no bloqueante)

Marcar `ST-CONSOLE-035` como T-DONE, registrar en `CHANGELOG.md` y cerrar el WI; push/PR solo bajo petición explícita del usuario.

filesAffected revisados: `app/src/api/mockBackend.ts`, `app/src/control-plane/AnalysisRunDetailPage.test.tsx`, `app/src/control-plane/AnalysisRunDetailPage.tsx` (solo lectura), `spec/features/013-pr-driven-control-plane/tasks.md`, además de los listados en el ciclo 1.
