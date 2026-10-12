# WI-CONSOLE-004 — reaprobación de alcance y decisiones

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Fecha:** 2026-10-12
**Autoriza:** usuario (Human Reviewer), en el chat de Console. La aprobación anterior (`wi-console-004-scope-approval.md`, «si») se consumió con la pausa a `W-READY` (`wi-console-004-pause.md`) y queda como antecedente.

## Cita literal del usuario

«Confirmo las decisiones OC02, OC10, OC11, OC14, OC15 y OC08 y apruebo el alcance de WI-CONSOLE-004, con el orden de prioridad OC01, OC03, OC04, OC05, OC06, OC07, OC08, OC09, OC12, OC13 y luego OC02, OC10, OC11, OC14, OC15.»

## Decisiones confirmadas (contenido relayado por la sesión Cross; el usuario las confirmó en la cita)

- **OC02:** un test aportado en el mismo PR cuenta como existente, sin ejecutarlo; no se rotula «validado por ejecución».
- **OC10:** V1 mínimo: `indexMode: BOOTSTRAP` y texto de estado del bootstrap; Console muestra solo texto de estado, sin porcentajes ni progreso inventado; el umbral y el progreso real son deuda con nombre de Core + Integration.
- **OC11:** Run `INFRASTRUCTURE_FAILURE` con check neutral y mensaje genérico veraz de PR grande (Core ya lo implementó, `WI-CORE-046`); el texto se muestra tal cual en `resultSummary` como texto libre, sin depender de «300».
- **OC14:** opción A: `BEHAVIORAL_MISMATCH` con evidencia, sin `ACTION_REQUIRED`.
- **OC15:** la respuesta tardía a una pregunta obsoleta se rechaza con `404 FUNCTIONAL_QUESTION_NOT_FOUND`; Console no ofrece responder una pregunta `OBSOLETE` (INTEROP-2.9; implementado en `WI-CONSOLE-031`).
- **OC08:** `DEC-VAL-002` aprobada e implementada en Core (SYSTEM-2.10 en adelante).

## Alcance aprobado

Solo documental, solo Feature 013 y catálogo (`spec/operational-cases.md`): (A) completar OC02, OC10, OC11 y OC14 con las decisiones; (B) formalizar OC15; (C) corregir en la Feature 013 las afirmaciones de OC03, OC04, OC06, OC07 y OC08 contra los contratos espejados vigentes (SYSTEM-2.12, INTEROP-2.12, GH-INTEROP-1.7); (D) registrar el orden de prioridad del usuario. Regla de evidencia: toda afirmación nueva cita sección contractual espejada o `archivo:línea` de Console; lo que solo conste por Cross/Core sin cita se marca «declarado por Core, pendiente de cita contractual».

## Fuera de alcance

`app/`, UI, API, contratos, espejos, infraestructura, subcasos `OCxx.a` y comportamiento nuevo. No se declara ningún caso implementado, cubierto, `O-READY` ni `O-COVERED`. Esta aprobación no cubre push, PR, merge ni despliegue; el modo fuera de casa no los autoriza.

## Decision gate

Sin decisiones con `Blocks` que alcancen este WI. `DEC-VAL-001` permanece `PENDING` y bloquea solo código/evidencia empresarial (no afecta documentación de happy paths). `DEC-VAL-002` está aprobada e implementada en Core (SYSTEM-2.12, «DEC-VAL-002», `Blocks: NONE`).
