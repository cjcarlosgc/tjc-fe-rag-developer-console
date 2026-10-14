# WI-CONSOLE-035 — cierre

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Estado:** W-DONE. Destino de la regla visible antes de confirmar una respuesta funcional.

- Focus Mode: grupo «Destino de la regla» (Símbolo, Archivo, Tipo, Escenario; valores crudos del contrato, «sin dato» si faltan) y frase fija sobre los botones; solo con `canAnswer`; botones sin deshabilitar.
- Action Required: la tarjeta muestra el mismo destino (componente compartido `RuleTargetSummary`).
- Pruebas: ROJO 4 fallos → VERDE; suite 777/777; lint, `tsc -b --noEmit` y build verdes (reejecutados por el leader y el reviewer); 6 mutaciones del reviewer fallan como se espera.
- UX: contraste computado 9.95–16.2:1; sin scroll horizontal a 375/768/1024; h1>h2>h3. F1 (aria duplicada) corregido por el leader con `aria-labelledby` (cambio mínimo, 2 líneas, `FocusModePage.tsx`).
- Sin DTO, rutas ni Core; `CS-CORE-20261013-001/-002/-003` no se acusan ni resuelven aquí.
- Pendiente del usuario: etiquetas en español para `kind`/`scenarioKind` (hoy valores crudos); Tab visual real no probado (panel oculto).
- Evidencia del diagnóstico: `harness/reports/fase2-diagnostico-console.md` (ítem A).
