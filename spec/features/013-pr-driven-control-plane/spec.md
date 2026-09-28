# 013 — Control plane PR-driven

**Estado:** aprobado como comportamiento objetivo; aceptación de cada HU requiere evidencia propia.
**Historias:** HU01, HU02, HU07–HU09, HU12–HU16
**Contrato operativo:** SYSTEM-2.5 / INTEROP-2.5 / GH-INTEROP-1.1.

## Objetivo

Permitir al usuario autorizado seguir un repositorio vinculado y cada `AnalysisRun` por PR/HEAD, responder contexto faltante, revisar evidencia y publicar propuestas mediante companion PR sin duplicar reglas de Core.

## Navegación y estados

- Navegación: Projects, Runs, Action Required, Experiments e Integrations/GitHub. Un Project muestra binding, `integrationBranch`, PR/HEAD, Runs y Checks; no presenta carga manual de código.
- Focus Mode es una ruta dedicada que muestra una pregunta adaptativa, evidencia acotada, `No lo sé` y retorno interno seguro. `UNKNOWN` no crea conocimiento autoritativo.
- El detalle del Run muestra estado, historial disponible, cambios, contexto y propuestas. Distingue datos reales de simulación, resultados `ACTION_REQUIRED`, `BEHAVIORAL_MISMATCH`, fallo técnico, baseline roto, cambio irrelevante y Run obsoleto.
- La revisión de pruebas presenta contenido y diff de propuestas vigentes. Publicar exige solicitud humana, freshness y autorización; nunca promete escritura directa a la feature branch, auto-merge ni autorepair.
- GitHub OAuth mediante Supabase Auth autentica a la persona. Para App info, discovery, verificación GitHub y ramas, Console llama a las rutas de usuario de GitHub Integration con la sesión Supabase; el provider token OAuth solo se transmite a Integration cuando hace falta y no se persiste ni reenvía a Core. Core conserva Projects/workspaces, autorización de dominio, persistencia de bindings, RAG y análisis; Integration conserva la automatización GitHub App.

## Mock y live

Los adapters `mock|live` respetan el mismo contrato INTEROP-2.5. La demo se rotula y jamás se presenta como evidencia de integración o del experimento. Fixtures pueden ilustrar success, action required, mismatch, HEAD nuevo, tests suficientes, baseline fallido, fallo técnico, cambios no relevantes y publicación stale; una pantalla mock no prueba que el backend cubra el caso. Cualquier campo o capacidad especulativa sin contrato aprobado se marca pendiente o se elimina, no se infiere desde fixtures.

## Seguridad

No exponer secretos de GitHub App, token del Sandbox, keys de Storage ni URLs firmadas internas. En el flujo directo de GitHub Integration, el provider token OAuth se usa en memoria para discovery o verificación de un repositorio nuevo, nunca se persiste ni se registra y no se reenvía a Core. La compatibilidad temporal de las rutas Core antiguas puede recibirlo y reenviarlo a Integration. Core determina autorización, clasificación, suficiencia, impacto y freshness; la UI presenta esos resultados. Un recurso no visible no revela existencia por mensaje o estado.

## Casos operativos

Ver `spec/operational-cases.md`: OC01–OC15 están catalogados para formalización P2, happy paths primero. Subcasos, aceptación y evidencia se enlazan por subtarea/WI; el catálogo no significa cobertura completa.
