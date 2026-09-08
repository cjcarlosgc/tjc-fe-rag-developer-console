# CHANGELOG

Todos los cambios notables de la línea base SDD se registran aquí. El contenido vigente vive en `spec/`; este archivo no reemplaza la especificación.

## [Unreleased]

- **HU01/HU08-14/HU19 (adapters live: proyectos, generación, experimento):** se conecta el listado de proyectos (`Page<ProjectResponse>` con "Cargar más"), el envío/progreso/resultados de generación (`POST /test-runs` + `GET .../{id}` + `/results` combinados en el mismo view model) y el experimento RAG vs agente generalista contra `INTEROP-1.5` real. Se retira `BASELINE` del vocabulario interno de experimentos (prohibido por contrato; era `GENERALIST_AGENT`) y se corrige `startExperiment`, que enviaba una etiqueta de texto en vez del `targetId` real. Verificado end-to-end contra RAG Core y Test Execution Sandbox reales en local, incluyendo un experimento completo. Descarga de artifacts live sigue PENDING.
- **HU25/HU26 (product experience, entrega parcial):** se agrega `Breadcrumbs` de jerarquía en las 8 páginas internas (reemplaza el enlace único "← Volver"), buscador de proyectos por nombre y filtro de estado en el historial de generaciones, y se consolida el patrón `.list-toolbar`/`.list-search` (antes solo en inventario, ahora compartido). Quedan pendientes dentro de 010: revisión de patrón de tablas/diff/dialogs, la auditoría de accesibilidad (pospuesta por decisión humana) y la verificación manual en navegador (bloqueada por desconexión de herramienta en esta sesión).
- **Checkpoints de planificación (2026-09-06):** `DEC-MET-001` (mutation score/StrykerJS) queda condicionada a completar antes una prueba end-to-end satisfactoria con RAG Core, Test Execution Sandbox y Docker Desktop ejecutándose todos en local; sigue `PENDING`. La auditoría de accesibilidad (`accessibility`, HU25/HU26) se envía deliberadamente al final del backlog, después de navegación/filtros, consolidación visual y adapters live.
- **HU20/HU21/HU22/HU24 (historial, tiempo real y retry manual):** se implementa el historial paginado de generaciones por ProjectVersion, un adapter Socket.IO reutilizable que complementa (sin reemplazar) el polling existente de análisis y de runs, y el reintento manual de un target inválido/fallido con lifecycle de `Idempotency-Key`. El modo demo se amplía a HU20/HU24 (mock stateful); HU21/HU22 quedan fuera del mock porque ese modo no abre transporte de ningún tipo. Adapters live de proyectos, generación, artifacts y experimentos permanecen PENDING, fuera de este cambio.
- **SDD 1.14 / SYSTEM-1.4 / INTEROP-1.5 (solo especificación):** se sincronizan todos los contratos cerrados por Core (historial, WebSockets, retry manual, listados, generación, artefactos y experimento) y se elimina el bloqueo obsoleto de Sprint 3. HU23/autorreparación queda descartada. Developer Console debe generar/reutilizar `Idempotency-Key` en generación, experimento y retry, manejar la restricción pnpm del proyecto y nunca conocer `SANDBOX_SERVICE_TOKEN`. No se modificó código ni configuración.
- **design-system:** se fija la base de tokens (color, tipografía) adaptada de una referencia de estilo inspirada en Superhuman, migrada a tema **oscuro** para no descartar la UI ya implementada y revisada (`app/src/styles.css` recibe el mismo recoloreo, sustituyendo el acento verde-menta anterior por el violeta de marca; contraste WCAG verificado igual o mejor que la versión previa en cada texto). Se excluyen explícitamente los componentes y tokens de landing/marketing (hero, pricing, footer, banda CTA) por no aplicar a una consola técnica; quedan PENDING hasta que se necesite un componente real de la consola.
- **SDD 1.9:** Developer Console deja de tratar `DEC-EXP-002` como bloqueo de HU19: el contrato experimental está aprobado, aunque las rutas de RAG Core continúan pendientes de implementación. No se copian al frontend decisiones internas de embeddings/chunking ni se modifica la UI o los DTO. Se registra además que Docker Desktop local es suficiente para integración/prevalidación durante Sprint 2-4 y que `DEC-INF-001` seguirá PENDING hasta revisar el proveedor remoto después de Sprint 4.
- **SDD 1.8 / SYSTEM-1.3 / INTEROP-1.1:** se fija que Developer Console consume solo RAG Core. El ZIP sigue viajando por `POST /projects/index`; el frontend no accede a Supabase, no recibe credenciales/keys/URLs firmadas del Sandbox y no incorpora `@supabase/supabase-js` por la infraestructura backend. No se modifican rutas implementadas ni decisiones PENDING.
- **SDD 1.7 / SYSTEM-1.2:** se registra la MacBook encendida con Docker Desktop y su VM Linux como entorno temporal aprobado para desarrollo/prevalidación del Sandbox. El destino previsto es una VM Linux remota; `DEC-INF-001` mantiene PENDING la selección de un proveedor preferentemente gratuito y bloquea solo su aprovisionamiento remoto. No se decide exposición temporal, imagen Node, package managers ni condiciones de validación empresarial. INTEROP-1.0 no cambia.
- **SDD 1.6:** se consolida una línea base SDD homologada para los tres repositorios y se formaliza la política Git común: commits por cambio coherente con trazabilidad obligatoria `Refs: HU...`, revisión por work item y revisión consolidada documentada del sprint antes del push. `sddVersion` deja de tratarse como versión local independiente; `SYSTEM-*` e `INTEROP-*` conservan versionado propio. Un push anticipado exige la misma puerta y commit/push siguen requiriendo solicitud humana explícita.
- **Ajuste de revisión SDD 1.6:** se permite que un commit exclusivo `docs(review)` incorpore la evidencia después del veredicto, sujeto a una comprobación final de que no contiene otros cambios. Se corrige además el diagnóstico de `decisionGate` malformado y la validación de espacios finales.
- **SDD 1.5 / SYSTEM-1.1 / INTEROP-1.0:** se incorpora el contrato universal de rutas, DTOs, errores y asincronía. Se fijan listado de proyectos/versiones, `POST /test-runs`, status/resultados, artefactos y transporte experimental. Los adapters y mocks todavía deben migrarse en work items de código; `DEC-EXP-002` permanece PENDING.
- **SDD 1.4 / SYSTEM-1.0:** se incorpora la copia espejo del contrato de los tres componentes, el contexto TypeScript-only y de validación empresarial, y la puerta `decisionGate` acotada por `Blocks`. La comparación usa `GENERALIST_AGENT`; `BASELINE` deja de ser identificador técnico para contratos nuevos. Mutation score/StrykerJS permanece PENDING y el mock queda excluido de toda evidencia real.
- Se aprueba el stack frontend: React, Vite, TypeScript, React Router,
  TanStack Query, Vitest, Testing Library y npm.
- Se incorpora la copia canónica del contrato de RAG Core, distinguiendo operaciones
  implementadas, aprobadas y `PENDING`.
- Se corrigen en SDD los contratos Sprint 1: `currentVersionId`,
  `POST /projects/index`, polling/resultados por `projectVersionId` y
  `x-correlation-id`/`correlationId`.
- Se sincronizan los DTO ya implementados de ProjectVersion, resultados e inventario
  desde RAG Core SDD 1.2, incluido `targetType=CLASS|METHOD|FUNCTION`.
- El modo puntual de generación se alinea con RAG Core: `METHOD` pasa a `TARGET`
  para aceptar métodos y funciones top-level.
- Se aprueba un modo demo stateful seleccionado con `VITE_DATA_SOURCE=mock`,
  visible en la interfaz y desacoplado de los adapters HTTP `live`.
- El modo demo cubre proyectos, indexación, inventario, generación, validación,
  artifacts y comparación RAG vs agente generalista sin presentar sus datos como reales.
- La descarga conjunta del demo produce un ZIP real y la comparación experimental
  explicita deltas absolutos/relativos para tiempo, tokens y costo.
- La comparación experimental sustituye la variante aislada sin contexto por un agente
  generalista que explora el código y obtiene sus propias referencias.
- El proyecto semilla incorpora un historial demostrativo de ProjectVersions
  indexadas y permite consultar el inventario histórico de cada versión sin
  asumir un endpoint live todavía no publicado por RAG Core.

## [1.0.0] - 2026-08-30

- Se crea la línea base SDD del proyecto.
- Se adopta `spec.md + plan.md + tasks.md` por feature.
- Se adopta `CHANGELOG.md` en lugar de enmiendas acumulativas dentro de las specs.
- Se conserva trazabilidad mediante `storyIds` y `sprint`.
- El código fuente se reserva para `app/`.
