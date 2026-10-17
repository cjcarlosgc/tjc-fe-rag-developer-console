# WI-CONSOLE-027 — aprobación de alcance

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Fecha:** 2026-10-12
**Autoriza:** usuario (Human Reviewer), en el chat.

Sobre la lista de correcciones diferidas (`harness/reports/console-deferred-corrections.md`, grupos B y D) el usuario respondió literalmente: «hazlo todo de una». Después pidió seguir el orden recomendado, que coloca este WI (grupos B y D) tras `WI-CONSOLE-026`.

## Alcance aprobado

1. B1: un experimento `FAILED` muestra el fallo real en una alerta (`role="alert"`) con el mensaje por `failureCode` de `app/src/experiments/failureMessages.ts`, sin «Preparando experimento», sin spinner, sin promesa de reanudación, sin botón de reanudar y sin ganador.
2. B2: `RETRIEVAL_COMPARISON_WORKER_LOST` con un texto coherente con `EXPERIMENT_WORKER_LOST` y su prueba.
3. B3: eliminar el hook `useEvidence` solo si no tiene consumidores; si alguno lo usa, se deja y se reporta.
4. D: estabilizar la suite de Vitest (intermitente bajo carga) con diagnóstico basado en evidencia y el mínimo cambio (configuración y/o ajustes de pruebas), sin debilitar aserciones, sin `skip` y sin ocultar fallos.

## Fuera de alcance

- Contratos, API, adapters live, proyecto demo PHP, accesibilidad y CSS global (otro WI), mocks de listados.
- Esta aprobación no cubre push, PR, merge ni infraestructura externa.

Revisión independiente: mientras `awayMode.enabled` sea `true` y por el «hazlo todo de una» del usuario, la hace el agente `reviewer`; no sustituye decisiones `DEC` ni aprobaciones de alcance o contrato.
