# WI-CONSOLE-042 — revisión UX / accesibilidad / honestidad de mocks

Modelo: ux-reviewer · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo low

## Veredicto: APPROVED (con observaciones no bloqueantes)

Revisión en navegador, modo demo (`VITE_DATA_SOURCE=mock VITE_AUTH_MODE=mock`, puerto 5180, servidor detenido al terminar). Recorrido: login, Projects, Runs, Action Required, Focus Mode, detalle de Run, Integrations, 404. Sin cambios de código ni de harness.

## Verificado y correcto
- Honestidad de mocks: «DEMO · IDENTIDAD SIMULADA» (login y shell), «DEMO · DATOS SIMULADOS» (shell y listas), «DEMO · GITHUB SIMULADO» (Integrations), aviso «Datos simulados: los ids de esta sección son de demo» en Trace, «Paquete técnico de Core; no es el registro académico». Nada simulado se presenta como live.
- Títulos por ruta correctos (Acceso, Projects, Runs, Action Required, Foco de contexto funcional, Detalle del Run, Integración con GitHub, Página no encontrada).
- Skip link «Saltar al contenido» recibe el primer Tab; foco visible: outline 3 px sólido (#c9b4fa), offset 2 px (cumple ≥ 2 px).
- `aria-current` correcto en Runs y Action Required; 404 dentro del shell con acción «Volver a Projects».
- Controles de navegación, botones y selects: 40 px. Tema oscuro con `color-scheme: dark`.
- 375 px: sin desbordamiento horizontal en login, Projects, Runs, detalle de Run y 404; shell se apila legible.
- Autoridad MAINTAINER/ADMIN sobre Functional Knowledge: sin reinterpretación (Focus Mode mantiene «Tu respuesta se registrará como regla»; «No lo sé» solo abstención).
- `prefers-reduced-motion`: reglas presentes en motion.css, trace.css y components.css, y `canAnimateCanvas`; no probado en ejecución.

## Hallazgos
| # | Sev. | Pantalla | Hallazgo |
|---|---|---|---|
| 1 | Baja | Shell (todas) | Enlace de marca 32 px de alto y «Saltar al contenido» 37 px de alto (< 40 px). El skip link solo aparece al enfocarlo y mide 184 px de ancho; la marca tiene 161 px de ancho y es un enlace secundario (Projects/home). Incumple la letra de la spec (40×40) pero el riesgo real es mínimo; recomendado corregir con `min-height: var(--target-min)`. No bloquea. |
| 2 | Baja | Integrations (y vistas de proyecto) | Pestañas de proyecto (Overview, Runs, Historial, Functional Knowledge, Integrations) miden 39 px de alto (1 px bajo el mínimo). |
| 3 | Baja | Focus Mode a 375 px | Desborda horizontalmente (scrollWidth 413 > 375): se pierde el ancho del viewport. Viola «viewports reducidos no pierden contenido». Probable bloque «SYMBOL RELATION» o líneas de relación. Corregir en WI-CONSOLE-005/006 (que siguen pendientes). |
| 4 | Baja | Projects, Runs, detalle | Enlaces en texto (breadcrumb «Projects/Runs», «Historial de transiciones», «Ver todos →») de 17–18 px: aceptables como texto inline según la spec; «Historial de transiciones» es una fila `summary` de 18 px de alto, objetivo pequeño. |
| 5 | Baja | Projects | Inconsistencia de conteo demo: badge de navegación Action Required = 6, KPI «Action Required» = 4, y tres Runs listados en «Requieren tu atención». Si son ámbitos distintos (global vs workspace), debe rotularse; si no, parece un dato incoherente. |
| 6 | Baja | Projects, Action Required, Trace | Mezcla es/en fuera del glosario: «CONNECTED», «ACTIVE PRS», «ACTION REQUIRED» (en tarjeta, ok por glosario), «Integration branch», «Latest:», y enums crudos (PRESENT, NOT_APPLICABLE, CLASS, BOUNDARY, STATE_TRANSITION, `analysisRunId`, `targetCount`). Los enums crudos son técnicos y aceptables en trace; «CONNECTED», «Integration branch» y «Latest» deberían ser «Conectado», «Rama de integración», «Último». Ampliar glosario o traducir. |
| 7 | Info | Projects | «0 Runs esta semana» mientras la actividad más reciente es de hace 12 d: coherente pero conviene confirmar que no es un contador roto. |

## No verificado
- Contraste con herramienta del navegador (se acepta el cálculo del leader: AA ≥ 4.5 para `--text-dim`).
- Zoom al 200 %, reduced motion en ejecución, restauración de foco en diálogos/drawers, lector de pantalla, Context Explorer, Experimental, Retrieval/Run comparison, Inventory.
- Foco visible comprobado solo en el skip link y por CSS; el resto por muestreo de tamaños.
- Aprobación de la revisión humana pendiente (el ux-reviewer no aprueba el corte).
