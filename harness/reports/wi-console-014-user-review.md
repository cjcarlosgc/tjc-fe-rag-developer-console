# WI-CONSOLE-014 — Veredicto del Human Reviewer

Revisor: human-reviewer (usuario, distinto del implementer). Fecha: 2026-10-08. Sin modelo (revisión humana).

**Veredicto:** `APPROVED`, con las decisiones siguientes tomadas en el chat.

## Decisiones

1. **`correlationId` en FAILED (N4 de `wi-console-014-ux-review-2.md`):** no se acepta la desviación. Se pide a Core que lo exponga en el DTO de estado de la comparación de retrieval (INTEROP-2.7 §6.15). La solicitud queda redactada en `wi-console-014-core-request-correlationid.md` (el harness no soporta un evento saliente desde un WI de consumo) y registrada como dependencia externa abierta para `WI-CONSOLE-020`, que debe mostrarlo cuando Core lo publique. El criterio «FAILED muestra correlationId» del AC4 queda **pendiente de dependencia externa**, no cumplido.
2. **Código de error de resultados de una comparación FAILED** (el mock usa `409 RETRIEVAL_COMPARISON_NOT_FINISHED`): se deja como está; es una pregunta abierta para Core antes de `WI-CONSOLE-020`, incluida en la solicitud.
3. **Verdad de terreno:** la UI no la ofrece (prevalece el AC3); en live `metrics` será `null` y se muestra «no disponible».

## Observaciones no bloqueantes

El usuario las difiere al cierre; están registradas en `wi-console-014-closure.md` sin abrir WI.

Ciclos de corrección: 1 de 2. La aprobación no autoriza push, PR, deploy ni cambios de infraestructura externa.

Evidencia relacionada: `wi-console-014-sdd-verification.md`, `wi-console-014-implementation.md`, `wi-console-014-contract-review.md`, `wi-console-014-ux-review.md`, `wi-console-014-correction-1.md`, `wi-console-014-ux-review-2.md`, `wi-console-014-core-request-correlationid.md`, `wi-console-014-closure.md`.
