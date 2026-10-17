# WI-CONSOLE-031 — cierre

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

Sincronización de INTEROP-2.9 y SYSTEM desde el Contract Sync de WI-CORE-045. `W-DONE` tras revisión contractual, UX e independiente (`reviewer`, awayMode, ciclo 1 de 2).

- Espejos desde Core `30b9acdfbc063b027ad891799574b4553574559e` (descendiente de `76053463`): INTEROP-2.9 SHA-256 `cf9c7c3167d99b67191caf9ec7c057a5ee3c7a0ccee8f303e55ba6708a08ca25`; SYSTEM `fe48d5d3f4980ce0e47d13b1750b3b827cf848184e9145086aeb07a81b0625a6`; GH-INTEROP sin cambio `584839c91a088918028bbe80cbf209d8d341246bcf3536288cff1ad0b02c1b34`.
- `CS-CORE-20261012-005` acusado y resuelto; `CS-CORE-20261012-006` (github-integration) queda `C-PENDING`.
- Producto: `404 FUNCTIONAL_QUESTION_NOT_FOUND` al responder = pregunta obsoleta («Esta pregunta ya no aplica…», `role="status"`, refresco de question-set e inbox, sin reintento); mock alineado a ese código. `continuationAttemptId` sigue sin ser seguible y `DEC-VAL-002` (PROPOSED) no aparece en la UI.
- Gates (leader): lint, `tsc -b --noEmit`, vitest 748/748 con `--maxWorkers=2` y sin límite, build, validate-harness, validate-work-items, validate-completions y `scripts/sdd-check.mjs`.
- Observaciones no bloqueantes: `focus-mode-obsolete` sin CSS ni `:focus-visible` propios (UX); `obsoleteQuestionId` no se resetea (inocuo); el panel «sin pregunta vigente» puede coexistir con el aviso; el refetch del inbox no está asertado en prueba (la query no se monta en Focus Mode).
- `WI-CONSOLE-004` permanece `W-READY`. Este WI no es su re-aprobación.
