# Arquitectura

**Contratos compartidos:** SYSTEM-1.1 / INTEROP-1.0

`Browser -> tjc-be-rag-core-api -> tjc-be-test-execution-sandbox`. El frontend nunca llama directamente al Sandbox.

## Asincronía V1

POST inicia operación y responde 202 con id + `pollAfterMs`; la UI consulta status ligero hasta estado terminal y luego obtiene `results`.

## Evolución Sprint 3

WebSockets reemplazan el polling visible para progreso de análisis/generación. Los endpoints HTTP permanecen para carga inicial, resultados y fallback.

## Estado de cliente

Separar estado remoto (projects/versions/runs/results) de estado puramente UI (filtros, paneles, selección). No duplicar en frontend reglas de dominio que pertenecen al Core.

## Experimental mode

Una sección `Modo experimental` contiene inicialmente una sola capacidad: `Comparar RAG vs Agente generalista`. La UI solicita el experimento y visualiza métricas persistidas; no implementa la lógica comparativa localmente.

## Entorno de validación

La evidencia final de empresa requiere adapters `live` conectados a Core y Sandbox. El modo mock no sustituye esa integración ni constituye evidencia experimental.
