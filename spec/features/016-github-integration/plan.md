# Plan — GitHub Integration (Console)

1. Adoptar `CS-CONSOLE-YYYYMMDD-NNN` para eventos nuevos; aceptar/importar los namespaces `CS-CORE-*`, `CS-SANDBOX-*` y `CS-GH-*`, además de IDs históricos simples anteriores al corte sin reescribirlos. Los eventos nuevos incluyen `sourceWorkItem`.
2. Llamar directamente a Integration para App info, discovery, verificación GitHub y ramas; enviar provider token solo en discovery y verificación de repositorio nuevo. Core conserva Projects/workspaces, persistencia de binding, autorización, RAG y análisis.
3. Para crear binding, solicitar desde Integration autorización Core-firmada y breve, y presentarla opaca al endpoint Core de persistencia; no enviar installationId ni rol desde el navegador.
4. Mantener Core discovery/verify/branches por compatibilidad hasta probar el consumidor directo; sincronizar SYSTEM-2.5, INTEROP-2.5 y GH-INTEROP-1.1.
5. No declarar integración desplegada ni modificar Sandbox, scope OAuth, configuración externa o cutover.
6. Mantener el Harness reproducible: importaciones idempotentes con `consumerImportedAt`, transiciones con evidencia y snapshots cerrados inmunes a eventos posteriores.

Si Core cambia su contrato público en otro corte, se abre un WI Console separado por Contract Sync y aprobación de alcance; no se anticipan endpoints ni cambios de producto aquí.
