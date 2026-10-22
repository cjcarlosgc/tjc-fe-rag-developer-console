# WI-CONSOLE-047 — aprobación de alcance

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Fecha:** 2026-10-21
**Autoriza:** usuario (Human Reviewer), en el chat de Console (vía la sesión coordinadora cross).

## Cita literal

> «(3) el WI de mejoras de UX después de la 1. Continúa en ese orden.»

El punto (1) (conectar `AnalysisRunDetailPage` al tiempo real) cerró como WI-CONSOLE-046 y el punto (2) como WI-CONSOLE-045. Este WI ejecuta el punto (3). El usuario aprobó el alcance que se le propuso en el chat y no lo objetó.

## Origen del alcance

Las seis observaciones vienen del handoff de la sesión coordinadora `[TN]-Cross` y de las «Observaciones no bloqueantes» y «No verificados por ningún revisor» de `harness/reports/wi-console-042-closure.md`. La observación 6 del cierre de WI-042 (`pollAfterMs`) queda fuera: es de polling, no de UX.

## Alcance aprobado (ancla HU01, HU12, HU14; mismo trío que WI-CONSOLE-042)

1. **Objetivos táctiles < 40 px:** enlace de marca (32 px), «Saltar al contenido» (37 px) y pestañas de proyecto (39 px) a un mínimo de 40×40 px sin romper el layout.
2. **Focus Mode a 375 px:** sin scroll horizontal (antes `scrollWidth` 413).
3. **Mezcla es/en fuera del glosario** («CONNECTED», «ACTIVE PRS», «Integration branch», «Latest:», etc.): español con términos de dominio en inglés solo según `spec/transversal/design-system/spec.md` («Idioma y glosario de la interfaz»); se buscan más casos con criterio sin traducir términos de dominio.
4. **Conteos de Action Required del demo de Projects incoherentes (6, 4 y 3):** el mock/demo muestra conteos coherentes entre vistas desde una misma fuente de verdad, sin cambiar contratos.
5. **`VITE_CORE_API_URL` inválida deja la app en blanco:** pantalla/estado de error de configuración en español, claro y accionable, sin romper el modo mock/demo ni exponer secretos.
6. **Verificación de lo no probado antes:** zoom 200 %, reduced motion en ejecución (≤ 120 ms según WI-CONSOLE-006), foco en diálogos (restauración y atrapado) y semántica/roles/nombres accesibles en el árbol de accesibilidad. Pruebas automatizadas donde sea razonable y evidencia manual reproducible en `harness/reports/`; se declara lo que no se pudo probar.

## Fuera de alcance

Tiempo real nuevo o cambios en socket/hooks de realtime; primitives UI nuevas no listadas (si hiciera falta una: `DECISION_REQUIRED` y esa parte se aparca); cambios de DTO, rutas o contratos; ajuste de `reasoningEffortMessage` (WI aparte); `pollAfterMs`. No se reinterpreta la autoridad MAINTAINER/ADMIN sobre Functional Knowledge ni se eliminan los rótulos DEMO. **WI-CONSOLE-005 y WI-CONSOLE-006 siguen `W-PLANNED`**; este WI no los activa ni los fuerza ni cierra su cobertura.

## Reglas

- Una decisión de alcance o arquitectura no cubierta se registra como `DECISION_REQUIRED` y se aparca, sin inventar aprobación.
- Revisión independiente por `reviewer` y `ux-reviewer` (ambos independientes del implementer), máximo 2 ciclos; si se agotan, queda pendiente para el usuario.
- Pruebas con fake timers o reloj inyectado, nunca reloj real. Sin push, PR ni merge; `main` no se toca.
