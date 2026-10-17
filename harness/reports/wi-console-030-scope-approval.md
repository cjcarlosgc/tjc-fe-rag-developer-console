# WI-CONSOLE-030 — aprobación de alcance

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Fecha:** 2026-10-12
**Autoriza:** usuario (Human Reviewer), en el chat.

Sobre la lista de correcciones diferidas (`harness/reports/console-deferred-corrections.md`, grupo C) el usuario respondió literalmente: «hazlo todo de una». Confirmó «1» = un WI por grupo en el orden A, F, C; este WI corresponde al grupo C (A = WI-CONSOLE-028, F = WI-CONSOLE-029).

## Alcance aprobado (solo el mock y sus pruebas; Console en live no cambia)

1. C1: Project demo PHP propio (framework PHPUNIT, lenguaje PHP, rotulado DEMO · DATOS SIMULADOS) con un Run y símbolos PHP; la semilla `rcmp_demo_seed_php` pasa a ese Run, sin romper conteos de listados existentes.
2. C2: Runs QUEUED/PROCESSING del mock (`arun_checkout_pr53`, `arun_billing_pr25`) visibles en listados, contadores y métricas solo si es viable sin debilitar pruebas; si no, se deja y se documenta el motivo.
3. C3: el 409 `FUNCTIONAL_KNOWLEDGE_CONFLICT` del mock compara `targetRef` + `scenarioKey` según DEC-FK-001/INTEROP-2.7 §6.11 (regla verificada en el contrato), con prueba.
4. C4: un caso demo que dispare `UNSUPPORTED_PROJECT` en OE2, sin cambiar el copy unificado en WI-CONSOLE-026.

## Fuera de alcance

`reasoningEffort` ilustrativo y `checkId` null, adapters live, contratos, API, UI nueva (salvo exponer un estado ya soportado), accesibilidad global, F1 (ContextExplorerPage), OC02/OC08/OC10/OC11/OC14/OC15 y WI-CONSOLE-004. Esta aprobación no cubre push, PR, merge ni infraestructura externa.

Revisión independiente: mientras `awayMode.enabled` sea `true` y por el «hazlo todo de una» del usuario, la hace el agente `reviewer`; no sustituye decisiones `DEC` ni aprobaciones de alcance o contrato.
