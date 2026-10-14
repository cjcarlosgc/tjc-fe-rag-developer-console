# WI-CONSOLE-038 — aprobación de alcance

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Fecha:** 2026-10-14
**Autoriza:** usuario (Human Reviewer), en el chat de Console.

## Cita literal

> «Apruebo un WI mínimo de Console que estabilice PublishSection.test.tsx esperando las insignias PUBLISHED tras el refetch de propuestas, solo en la prueba, sin cambiar producto, contratos ni pantallas; sin push ni despliegue sin mi orden.»

## Alcance aprobado

1. `app/src/control-plane/PublishSection.test.tsx` (prueba «PENDING → PUBLISHING → PUBLISHED…»): la aserción síncrona `expect(screen.getAllByText('PUBLISHED')).toHaveLength(3)` pasa a esperar el refetch de propuestas, con el mismo número y el mismo texto.
2. Revisar en ese archivo (y en `AnalysisRunDetailPage.test.tsx` si comparte el patrón) otras aserciones síncronas sobre el mismo estado post-refetch; corregir solo las de la misma ventana y documentar cuáles.
3. Prueba ROJO→VERDE reteniendo el refetch de propuestas con una puerta.

## Fuera de alcance

Cualquier cambio en `app/src` que no sea una prueba, setup/`vite.config`, timeouts globales, contratos, DTO, pantallas, sondeo, otros hallazgos diferidos, push, PR o despliegue.

## Notas de registro

- Revisión independiente: mientras `awayMode.enabled` sea `true`, la hace el agente `reviewer`; no sustituye decisiones `DEC` ni aprobaciones de alcance o contrato.
- Id: `WI-CONSOLE-038` estaba nombrado en reportes como reservado a la UI informativa de campos nuevos; ese WI necesitará otro id (igual que pasó con `WI-CONSOLE-037`).
