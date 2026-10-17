# WI-CONSOLE-035 — revisión técnica independiente

Modelo: reviewer · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Veredicto:** APPROVED (awayMode; no sustituye aprobación humana de alcance/arquitectura ni autoriza push).

## Alcance
- Solo presenta `target.qualifiedName`, `filePath`, `kind` y `scenarioKind` del contrato (INTEROP §6.11); `present()` solo distingue null/vacío -> «sin dato». Sin heurísticas de texto, lógica de dominio, campos nuevos, cambios a Core, mock ni tipos.
- Focus Mode: `role="group" aria-labelledby="rule-target-title"` con `h3` dentro de `.focus-mode-card`; frase fija justo antes del grupo «Respuesta», solo con `canAnswer`; ningún botón deshabilitado por esto.
- Action Required: mismo resumen en cada tarjeta; el enlace a Focus Mode se conserva (`.target-ref` retirado, símbolo ahora en la dl).
- Sin tocar `state.json`/`work-items.json`/specs por el reviewer. `tasks.md` solo añade ST-CONSOLE-036.

## Mutaciones (todas restauradas, verificado con cmp)
| Mutación | Resultado |
|---|---|
| quitar la frase «Tu respuesta se registrará…» | falla prueba de frase |
| quitar el campo Archivo | fallan 3 pruebas nuevas |
| «sin dato» -> «-» | falla prueba de nulos |
| quitar role/aria-labelledby del grupo | fallan 2 pruebas |
| quitar RuleTargetSummary de la lista | fallan prueba nueva y HU38 |
| frase fuera de `canAnswer` | falla prueba Writer/Reader |

## Gates (ejecutados por el reviewer, en app/)
- `npm run lint`: exit 0
- `tsc -b --noEmit`: exit 0
- vitest completo: 70 archivos / 777 pruebas pasan
- `npm run build`: OK (solo aviso de chunk >500 kB preexistente)
- `harness/validate-harness.mjs`: OK; `validate-work-items.mjs`: OK (34 WI); `scripts/sdd-check.mjs`: OK

## Hallazgos (no bloqueantes)
1. Menor: en `tasks.md` la línea ST-CONSOLE-036 quedó después del párrafo final «La implementación antigua…»; conviene moverla antes al cerrar el WI.
2. Info (ya registrado por UX): enums crudos en inglés (decisión UX pendiente del Human Reviewer); la prueba de nulos usa cast `as unknown as` deliberado, el mock no muestra nulos (honesto con el contrato).
3. Info: Tab/foco visible real no probado por UX (panel oculto); regla CSS global aplica.
4. CS-CORE-20261013-001/-002/-003 no se acusan aquí, conforme al alcance.
