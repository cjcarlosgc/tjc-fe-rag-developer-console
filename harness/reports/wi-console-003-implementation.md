# WI-CONSOLE-003 — Evidencia de implementación

**Fecha:** 2026-09-26
**Estado:** evidencia de implementación y checks locales registrada. El WI permanece `W-IN_PROGRESS`; no es una aprobación ni un cierre.

## Resultado comprobado en fuente

- Console usa GitHub Integration solo para App info, discovery, verificación de acceso y ramas, enviando sesión Supabase y provider token efímero solo donde se necesita. No envía credenciales de servicio al navegador.
- Projects/workspaces, decisión de dominio y persistencia del binding, RAG y análisis siguen pasando por Core. Al persistir, Console envía la evidencia opaca/firma corta emitida tras la autorización síncrona Core↔Integration; no envía `installationId` ni rol autoritativo.
- El fallback de `configureUrl`, errores de consulta/reintento y estado de ramas fueron ajustados. El aviso de error y CTA desaparecen al quedar activo el binding.
- Contract Sync conserva `sourceWorkItem` namespaced, compatibilidad con datos legacy, timestamps de importación locales y comandos `acknowledge`/`resolve` con evidencia. Los snapshots completados ignoran eventos importados después de su cierre, sin excluirlos de WIs activos.
- `CS-GH-20260926-001` está importado en Console como `C-PENDING`; la sincronización del contrato y los checks de interoperabilidad del WI aún requieren el ciclo consumidor. No lo reconocí ni resolví.
- No se modificó Sandbox ni se realizó deploy/configuración externa/cutover.

## Verificación reproducible

- Console: `npm run test -- --no-file-parallelism` — 53 archivos, 424/424 pruebas; `npm run lint` y `npm run build` pasaron. Vite conserva una advertencia no bloqueante de bundle JavaScript >500 KB.
- Harness Console: `node scripts/sdd-check.mjs`, `node harness/validate-work-items.mjs`, `node harness/validate-harness.mjs` y `node harness/validate-completions.mjs` pasaron.
- Las pruebas del Harness cubren importación idempotente, `consumerImportedAt`, transiciones con evidencia y preservación/invalidez temporal de snapshots.
- El agente `console_ux_review` aprobó revisión UX estática y los tests lifecycle relevantes. Se intentó iniciar Console local en modo mock (`127.0.0.1:5173`), pero CUA reportó que `iab` y Chrome no están disponibles; no se inspeccionó visualmente la UI ni el responsive. El servidor local se detuvo. Esta evidencia no sustituye tu visto bueno ni cambia gates.

## Pendiente

La revisión técnica delegada de la frontera multi-repositorio no encontró hallazgos de código en Console; detectó una frase heredada de discovery en el contrato espejo, ya corregida y comprobada idéntica entre los tres repos. La UX se revisó estáticamente; la inspección visual quedó bloqueada por la ausencia de navegador, y ninguna sustituye tu visto bueno personal. `independentReviewPassed` y los demás gates de cierre siguen `G-NOT_RUN`; `CS-GH-20260926-001` permanece `C-PENDING`. No pasar a `W-DONE`, no hacer push ni declarar deploy/cutover.
