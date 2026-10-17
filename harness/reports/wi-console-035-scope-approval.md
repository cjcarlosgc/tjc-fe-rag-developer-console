# WI-CONSOLE-035 — aprobación de alcance

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Fecha:** 2026-10-13
**Autoriza:** usuario (Human Reviewer), en el chat de Console.

## Cita literal

> «Apruebo el alcance de WI-CONSOLE-035: mostrar en Action Required el destino de la regla (símbolo, archivo, tipo y escenario) antes de confirmar, sin heurísticas de texto ni lógica de dominio. Sin push ni despliegue sin mi orden.»

## Alcance aprobado

1. Focus Mode (`FocusModePage.tsx`) y, por consistencia, la lista de Action Required (`ActionRequiredPage.tsx`) muestran el destino de la regla con campos que el contrato ya trae: `target.qualifiedName`, `target.filePath`, `target.kind` y `scenarioKind` (INTEROP §6.11).
2. Frase fija pegada sobre los botones: «Tu respuesta se registrará como regla para <qualifiedName>».
3. Accesible (bloque con encabezado o `role="group"` con nombre, sin depender solo del color); no se deshabilitan botones; un campo `null` se muestra como «sin dato» sin inventar.

## Fuera de alcance

Heurísticas de texto o advertencias por «texto ajeno», lógica de dominio, campos nuevos del contrato, cambios a Core, derivar ganador/CF/CO, sondeo en segundo plano, experimentos, Contract Sync 2.13–2.15, `visualAid` estructurado, WI-CONSOLE-036/037/038, push, PR o despliegue.

## Notas de registro

- El id `WI-CONSOLE-034` no existe en el registro (el 034 del diagnóstico era tentativo); este WI usa 035 por instrucción del usuario. La subtarea es `ST-CONSOLE-036`.
- Origen: `harness/reports/fase2-diagnostico-console.md`, ítem A (documento de diagnóstico de solo lectura, referencia del WI).
- Revisión independiente: mientras `awayMode.enabled` sea `true`, la hace el agente `reviewer`; no sustituye decisiones `DEC` ni aprobaciones de alcance o contrato.
