# Arquitectura

**Contratos compartidos:** SYSTEM-1.4 / INTEROP-1.5

`Browser -> tjc-be-rag-core-api -> tjc-be-test-execution-sandbox`. El frontend nunca llama directamente al Sandbox.

El upload vigente permanece `POST /projects/index` con `multipart/form-data`: el navegador entrega el ZIP a RAG Core y Core lo almacena en Supabase Storage. Frontend no conoce bucket, key, signed URL del Sandbox ni credenciales de Supabase/DB.

## Asincronía V1

POST inicia operación y responde 202 con id + `pollAfterMs`; la UI consulta status ligero hasta estado terminal y luego obtiene `results`. Para generar, experimentar o reintentar, la UI crea un UUID por acción lógica, lo envía como `Idempotency-Key` y lo reutiliza en retries de red. Una nueva acción intencional usa otro UUID.

## Evolución Sprint 3

WebSockets reemplazan el polling visible para progreso de análisis/generación. Los endpoints HTTP permanecen para carga inicial, resultados y fallback.

HU23 y la autorreparación automática vía LLM están descartadas. La UI ofrece solo el reintento manual desde cero de HU24 cuando un target terminó `INVALID`/`FAILED` y Core lo permite.

## Estado de cliente

Separar estado remoto (projects/versions/runs/results) de estado puramente UI (filtros, paneles, selección). No duplicar en frontend reglas de dominio que pertenecen al Core.

## Experimental mode

Una sección `Modo experimental` contiene inicialmente una sola capacidad: `Comparar RAG vs Agente generalista`. La UI solicita el experimento y visualiza métricas persistidas; no implementa la lógica comparativa localmente.

## Entorno de validación

La evidencia final de empresa requiere adapters `live` conectados a Core; Core orquesta el Sandbox. El modo mock no sustituye esa integración ni constituye evidencia experimental.

Para desarrollo y prevalidación durante Sprint 2-4, el Sandbox puede estar disponible desde la MacBook del desarrollador mientras permanezca encendida y Docker Desktop mantenga activa su VM Linux. El destino previsto es una VM Linux remota, pero `DEC-INF-001` mantiene PENDING el proveedor preferentemente gratuito y posterga su selección hasta después de Sprint 4. La forma de acceso al Sandbox es configuración del Core y no habilita al navegador a llamarlo directamente.

El frontend no conoce `SANDBOX_SERVICE_TOKEN` ni construye el Bearer Core↔Sandbox. Debe comunicar que los repositorios ejecutables en V1 requieren TypeScript, Jest/Vitest y `pnpm-lock.yaml`, y presentar `UNSUPPORTED_PACKAGE_MANAGER` como incompatibilidad accionable.
