# Cierre — WI-CONSOLE-013

**Fecha:** 2026-10-08
**Estado:** `W-DONE`
**Historias:** HU07, HU08, HU14
**Subtarea:** ST-CONSOLE-015

## Resultado

- Helper unico de roles (`app/src/projects/roles.ts`, `hasRole`) con `ProjectRole = ADMIN | MAINTAINER | WRITER | READER`; Writer puede publicar, vincular, pausar/reactivar y lanzar experimentos. El rol viene de `Project.role` entregado por Core.
- Focus Mode y Action Required: Writer y Reader no ven «No lo sé» ni las respuestas y ven la nota de rol; el `403 PROJECT_ROLE_INSUFFICIENT` de Core sigue siendo autoritativo.
- `UNKNOWN` es abstencion auditada: `outcome=ABSTAINED`, la pregunta sigue pendiente, el Run en `ACTION_REQUIRED`, linea «Abstencion registrada · rol · fecha · n abstencion(es)» sin usuario ni id, y nunca «resuelto», «continuando» ni «todas las preguntas respondidas». El mock devuelve `ABSTAINED` con `continuationAttemptId=null` y `knowledgeId=null`.
- Spec: `014-organizations-access/spec.md` (rol `WRITER`) y `ST-CONSOLE-015` a `T-DONE`.

## Revision y dependencias

- SDD, decisionGate (`blockingDecisionIds: []`), UX (inicial y de la correccion), contractual de la correccion y revision independiente del usuario: `APPROVED`.
- Ciclos de correccion: 1 de 2 (`wi-console-013-user-review.md` conserva el `CHANGES_REQUESTED` previo).
- Contract Sync `before-done`: PASS `2026-10-08T21:42:41.171Z`; `CS-20260920-003`, `CS-20260921-001/002/003` quedan `NOT_RELEVANT` para este WI.

## Verificaciones (leader, 2026-10-08)

- `app/`: `npm run lint` OK; `vitest run --maxWorkers=2` 57 archivos / 472 pruebas verdes; `npm run build` OK (advertencia no bloqueante de bundle >500 kB).
- Validadores del Harness: ver commit de cierre. No se hizo push ni PR.

## Observaciones no bloqueantes

a. El color computado de `.abstention-note` y `.role-note` en el navegador es `rgb(188, 186, 201)`, no `#eae7f7`: otra regla lo sobrescribe. El contraste real es ≈10:1 sobre `#0b0b0d` (cumple AA); el «16.17:1» del reporte de correccion no es el valor real.
b. El anillo de foco global mide ≈2.7:1 (<3:1): deuda transversal previa, no introducida por este WI.
c. El caso «HEAD cambio + `UNKNOWN`» no esta definido por INTEROP-2.7 §6.11; el mock mantiene un comportamiento provisional y la semantica queda diferida a WI-CORE-018.
d. El foco no se restaura en `onError` ni al resolver via `resolveConflict` en Focus Mode.

Siguiente elegible: `WI-CONSOLE-015`.
