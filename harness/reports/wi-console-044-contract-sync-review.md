# WI-CONSOLE-044 — revisión de Contract Sync

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

`CS-CORE-20261021-001` (target console, INTEROP-2.18) ya está `C-RESOLVED` en su parte contractual por WI-CONSOLE-043; este WI ejecuta su acción requerida de código y verifica cada ítem (handshake con token, no abrir sin sesión, `connect_error`, subscribe/ack, `ExperimentStatusResponse`, comentario de `socket.ts`). `-002`/`-003` no apuntan a Console. Los cuatro eventos históricos sin `scopePaths` se clasifican NOT_RELEVANT para este WI con los mismos digests de WI-CONSOLE-043 (contenido sin cambios): este WI no toca bindings, autorización de roles, Projects ni membresía.
