# 013 — Control plane PR-driven

**Estado:** aprobado como comportamiento objetivo; aceptación de cada HU requiere evidencia propia.
**Historias:** HU01, HU02, HU07–HU09, HU12–HU16
**Contrato operativo:** SYSTEM-2.5 / INTEROP-2.6 / GH-INTEROP-1.2.

## Objetivo

Permitir al usuario autorizado seguir un repositorio vinculado y cada `AnalysisRun` por PR/HEAD, responder contexto faltante, revisar evidencia y publicar propuestas mediante companion PR sin duplicar reglas de Core.

## Navegación y estados

- Navegación: Projects, Runs, Action Required, Experiments e Integrations/GitHub. Un Project muestra binding, `integrationBranch`, PR/HEAD, Runs y Checks; no presenta carga manual de código.
- Focus Mode es una ruta dedicada que muestra una pregunta adaptativa, evidencia acotada, `No lo sé` y retorno interno seguro. `UNKNOWN` no crea conocimiento autoritativo.
- El detalle del Run muestra estado, historial disponible, cambios, contexto y propuestas. Distingue datos reales de simulación, resultados `ACTION_REQUIRED`, `BEHAVIORAL_MISMATCH`, fallo técnico, baseline roto, cambio irrelevante y Run obsoleto.
- La revisión de pruebas presenta contenido y diff de propuestas vigentes. Publicar exige solicitud humana, freshness y autorización; nunca promete escritura directa a la feature branch, auto-merge ni autorepair.
- GitHub OAuth mediante Supabase Auth autentica a la persona. Para App info, discovery, verificación GitHub y ramas, Console llama a las rutas de usuario de GitHub Integration con la sesión Supabase; el provider token OAuth solo se transmite a Integration cuando hace falta y no se persiste ni reenvía a Core. Core conserva Projects/workspaces, autorización de dominio, persistencia de bindings, RAG y análisis; Integration conserva la automatización GitHub App.

## Mock y live

Los adapters `mock|live` respetan el mismo contrato INTEROP-2.6. La demo se rotula y jamás se presenta como evidencia de integración o del experimento. Fixtures pueden ilustrar success, action required, mismatch, HEAD nuevo, tests suficientes, baseline fallido, fallo técnico, cambios no relevantes y publicación stale; una pantalla mock no prueba que el backend cubra el caso. Cualquier campo o capacidad especulativa sin contrato aprobado se marca pendiente o se elimina, no se infiere desde fixtures.

## Seguridad

No exponer secretos de GitHub App, token del Sandbox, keys de Storage ni URLs firmadas internas. En el flujo directo de GitHub Integration, el provider token OAuth se usa en memoria para discovery o verificación de un repositorio nuevo, nunca se persiste ni se registra y no se reenvía a Core. La compatibilidad temporal de las rutas Core antiguas puede recibirlo y reenviarlo a Integration. Core determina autorización, clasificación, suficiencia, impacto y freshness; la UI presenta esos resultados. Un recurso no visible no revela existencia por mensaje o estado.

## Alineación SMART V3 (SDD 2026-10-08; implementación pendiente)

Contrato objetivo: SYSTEM-2.6 / INTEROP-2.7 (canónico en Core, `WI-CORE-017`). Console lo adopta en `WI-CONSOLE-011`; hasta entonces su copia sigue siendo INTEROP-2.6 y nada de lo descrito se presenta como live.

- **`UNKNOWN` (`WI-CONSOLE-013`).** «No lo sé» es una abstención auditada (`DEC-FK-002`): la pregunta sigue pendiente y el Run sigue en `ACTION_REQUIRED`. Console muestra la abstención registrada (quién, rol y cuándo, según `abstention`) y nunca presenta «resuelto», «continuando» ni «todas las preguntas respondidas» como consecuencia. Solo Maintainer o Admin pueden registrarla; Console oculta o deshabilita la acción para Writer y Reader pero deja que `403 PROJECT_ROLE_INSUFFICIENT` de Core sea la autoridad. La acción nunca se decide en el navegador.
- **Functional Knowledge (`WI-CONSOLE-015`).** Puede haber varias reglas `ACTIVE` por target, una por escenario; Console las agrupa por `scenarioKind` y no asume una regla por target. Muestra procedencia (`confirmedByUserId`, `confirmedRole`, `originHeadSha`, `source`, `sourceRef`) cuando existe y «sin procedencia registrada» para reglas históricas. Console no calcula ni edita `scenarioKey`. El panel especulativo `context-explorer/speculative/contextProvenance.ts` se reemplaza por datos live o se retira.
- **Trace operativo (`WI-CONSOLE-016`).** El detalle del Run muestra los nueve enlaces con su estado `PRESENT`/`NOT_APPLICABLE` y los identificadores `retrieval_id`, `context_id` y `execution_id` que entrega Core; no inventa identificadores ni veredictos «CUMPLE/NO CUMPLE». Es distinto del Context Explorer experimental.
- **Evidencia (`WI-CONSOLE-017`).** Console descarga los paquetes de evidencia JSON versionados que expone Core; no es el registro académico de evidencia. Un mock se rotula `DEMO · DATOS SIMULADOS` y nunca se ofrece como evidencia científica ni empresarial.
- **Prueba rota de `RunsPage` (`WI-CONSOLE-012`).** El reporte previo «arreglar la prueba rota de `RunsPage`» no se reproduce hoy: en `51b11e7`, `app/src/control-plane/RunsPage.test.tsx` pasa (6/6) y la suite completa también (53 archivos, 428 pruebas). El WI primero busca una reproducción (reintentos, zona horaria y fecha) y registra comando y mensaje exactos; si no reproduce, se cierra con esa evidencia y sin cambios de código.

## Casos operativos

Ver `spec/operational-cases.md`: OC01–OC15 están catalogados para formalización P2, happy paths primero. Subcasos, aceptación y evidencia se enlazan por subtarea/WI; el catálogo no significa cobertura completa.
