# WI-CONSOLE-046 — informe de implementación

Modelo: implementer · configurado claude-haiku-5-5 · atendido unknown · esfuerzo low

## Hecho
- Nuevo `app/src/control-plane/useAnalysisRunRealtime.ts`, calcado de `useExperimentRealtime`: con sesión, id no vacío y no mock se suscribe con `subscribeAnalysisRunUpdates(id, refresh, refresh)`; `refresh` invalida solo `controlPlaneKeys.run(id)` (sin escribir el DTO del aviso, sin tocar proposals ni trace). Deps `[id, userId, queryClient]`.
- `AnalysisRunDetailPage.tsx`: llamada al hook tras `useAnalysisRun`, antes de los return tempranos. Sin cambios de JSX, estilos, textos, DTO, rutas ni polling.
- `app/src/api/socket.ts`: solo el comentario de `subscribeAnalysisRunUpdates`.
- Sin polling del Run que preservar; no se añade (el tiempo real es su única actualización en vivo, best effort).
- Segundo consumidor: no existe (rutas hermanas); sin conteo de referencias.
- uiImpact visual: false (sin ux-reviewer).

## Pruebas nuevas (14)
- `useAnalysisRunRealtime.test.tsx` (11): mock, sin sesión, id vacío, suscripción con id, aviso invalida sin escribir DTO, reconciliación, unmount libera una vez, logout, cambio de id, StrictMode con una sola suscripción viva, refetchInterval con fake timers.
- `useAnalysisRunRealtime.socket.test.tsx` (1): socket real con `socket.io-client` simulado; tras desmontar no quedan listeners de `analysis-run:update` y `connect` vuelve al conteo previo.
- `AnalysisRunDetailPage.realtime.test.tsx` (1): archivo nuevo (el existente corre en mock sin AuthContext); la página en live con sesión llama a `subscribeAnalysisRunUpdates` con el id de la ruta y libera al desmontar.

## Gates (todos exit 0)
- `pnpm lint`: limpio.
- `pnpm exec tsc -b --noEmit`: limpio.
- `pnpm test --maxWorkers=4`: 83 archivos, 887 pruebas pasan.
- `pnpm build`: OK (solo aviso de tamaño de chunk previo).
- `pnpm format:check`: OK.
- `pnpm contracts:check`: OK.
