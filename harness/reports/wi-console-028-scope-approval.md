# WI-CONSOLE-028 — aprobación de alcance

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Fecha:** 2026-10-12
**Autoriza:** usuario (Human Reviewer), en el chat.

Sobre la lista de correcciones diferidas (`harness/reports/console-deferred-corrections.md`, grupo A) el usuario respondió literalmente: «hazlo todo de una», y confirmó «1» = un WI por grupo en el orden recomendado. Este WI toma el grupo A (interfaz y accesibilidad).

## Alcance aprobado (solo correcciones concretas ya medidas, mínimas y verificables)

1. Anillo de foco global ≈2.7:1 → ≥3:1 sobre los fondos reales (tokens CSS compartidos).
2. Contraste: «VS» de la cabecera de estrategias 4.02:1 → ≥4.5:1; separadores de breadcrumbs 1.45:1 y `repo-sep` 3.89:1 (si son decorativos y ocultos a tecnologías de asistencia, se documenta y se aplica el mínimo razonable sin cambiar el diseño; si transmiten información, ≥3:1); bordes del botón de evidencia 1.15:1 y de P@10/R@10 ≈2.7:1 solo si WCAG 1.4.11 lo exige (se evalúa y se documenta).
3. Desbordes horizontales a 375 px y de 13 px a 1024 px (`.analysis-run-summary`, `symbol-list`, `test-proposal-item`, `status-badge`, botón de cabecera, tabla de experimentos con datos) con CSS, sin quitar contenido; sellos DEMO y PROPUESTA de `ruleUsage` a ancho de contenido a 375 px.
4. Comportamiento accesible: restaurar el foco en `onError` y cuando `ABSTAINED` llega por `resolveConflict` en Focus Mode; el wrapper `role="status"` del estado vacío de Functional Knowledge conserva el rol mientras carga; jerarquía de encabezados correcta en el detalle del Run (H3 antes de H2); celdas Intento/Evaluable sin dato en una corrida mixta muestran «—» (decisión previa del usuario: se omiten las columnas solo cuando NINGUNA repetición trae el dato).

## Relación con WI-CONSOLE-005 y WI-CONSOLE-006

Ambos siguen `W-PLANNED`. Este WI NO los reemplaza ni los cierra: 005 sigue siendo la consolidación completa del sistema visual (primitives, tokens, grep de colores arbitrarios, capturas de todas las rutas) y 006 la auditoría de accesibilidad completa (formularios, tablas, dialogs, grafos, zoom 200 %, objetivo de 40×40 px, reduced motion, lector de pantalla real). Aquí solo se corrigen los puntos concretos ya medidos de la lista anterior, para no duplicar trabajo; lo que 005/006 audite después parte de este estado.

## Fuera de alcance

- Rediseño visual, nuevos componentes, contratos, API, adapters live, mocks de listados, proyecto demo PHP, auditoría WCAG completa (WI-CONSOLE-006) y verificación con lector de pantalla real (queda documentada como no verificada).
- Cambios de comportamiento funcional o de copy, salvo el «—».
- Esta aprobación no cubre push, PR, merge ni infraestructura externa.

Revisión independiente: mientras `awayMode.enabled` sea `true` y por el «hazlo todo de una» del usuario, la hace el agente `reviewer`; no sustituye decisiones `DEC` ni aprobaciones de alcance o contrato.
