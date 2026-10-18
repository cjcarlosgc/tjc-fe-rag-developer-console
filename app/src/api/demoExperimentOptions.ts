/** DEMO · opciones del selector de experimentos (solo con mock): escenarios de B1 y errores de creación. Ids que `startExperiment` reconoce. */
export const DEMO_EXPERIMENT_SELECTOR_OPTIONS: ReadonlyArray<{ id: string; label: string }> = [
  { id: 'demo-scenario-legacy', label: 'DEMO · corrida previa sin datos OE5' },
  { id: 'demo-scenario-mixed-sandbox', label: 'DEMO · Sandbox mixto y configuración parcial' },
  { id: 'demo-scenario-no-evaluable', label: 'DEMO · sin datos evaluables' },
  { id: 'demo-scenario-phpunit', label: 'DEMO · proyecto PHP con PHPUnit' },
  { id: 'demo-scenario-failed-experiment-failed', label: 'DEMO · FAILED EXPERIMENT_FAILED' },
  { id: 'demo-scenario-failed-worker-lost', label: 'DEMO · FAILED EXPERIMENT_WORKER_LOST' },
  { id: 'demo-scenario-failed-unknown', label: 'DEMO · FAILED código desconocido' },
  { id: 'demo-error-reasoning-effort', label: 'DEMO · error 422 REASONING_EFFORT_UNSUPPORTED' },
  { id: 'demo-error-unsupported-project', label: 'DEMO · error 422 UNSUPPORTED_PROJECT' },
  { id: 'demo-error-llm-unavailable', label: 'DEMO · error 503 LLM_PROVIDER_UNAVAILABLE (reintentable)' },
  // WI-CONSOLE-036 B4: símbolo constructor DEMO; al elegirlo, el mock responde 404 UNRESOLVABLE_TARGET. No se preselecciona.
  { id: 'demo-error-unresolvable-target', label: 'DEMO · DATOS SIMULADOS · Demo::__construct' },
]
