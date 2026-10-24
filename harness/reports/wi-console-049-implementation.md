# WI-CONSOLE-049 — implementación

Modelo: implementer · configurado claude-haiku-5-5 · atendido unknown · esfuerzo low

Corte único. Tabla de decisiones por uso (conservar/cambiar/motivo, con los usos de objetivo específico/OE y de «objetivos táctiles» marcados como CONSERVAR): `harness/reports/wi-console-049-sdd-verification.md`, sección 2. En la UI no hay usos de OE; «objetivos táctiles» (`--target-min`, nombres de test CSS), «Implementación objetivo» y `## Objetivo` de las specs se conservan.

## Aplicado

- `target`/`targets`: Inventario («Buscar target», «Sin targets coincidentes», cabecera «Target», «Targets detectados…», `dt` «Targets»), Historial de análisis, Context Explorer (estado, badge, fallback, eyebrow y `aria-label` «Detalle del target»), Experimento («Target experimental», «Tabla de repeticiones por target», cabecera «Target»), Trace operativo («Target: …», «Sin targets»), Functional Knowledge detalle (`dt` «Target», valor `targetRef`).
- `changeset`: Trace operativo (`<h3>Changeset</h3>`), detalle de Run («Changeset grande: …») y el summary demo de `mockBackend`.
- `chunks`: «Chunks» (Historial de análisis, panel lateral RAG) y «N chunks» (comparación de Experimento).
- `Functional Knowledge`: títulos de ruta («Functional Knowledge», «Regla de Functional Knowledge»), vacío de la página, nota de condiciones experimentales y mensaje demo de conflicto.
- Conservado: «recuperación», «discrepancia de comportamiento», `ranking`/`Ranking` (caption `Candidatos por ranking del modo …` en minúscula, convención documentada), «Fragmento de código» (`CODE_FRAGMENT`), «Destino de la regla», identificadores, DTOs, rutas, enums y rótulos DEMO.
- Spec del glosario (`spec/transversal/design-system/spec.md`) con los términos y la convención de concordancia/plural; cita de la nota de condiciones en `spec/features/014-analysisrun-experiments/spec.md`. `spec/contracts/` no se toca (el contrato conserva «conocimiento funcional aplicable»: divergencia de copy aceptada).
- `ui/glossary.test.ts`: se quitan Target/Changeset/Chunks/Buscar target de FORBIDDEN_VISIBLE; se añaden prohibiciones de residuos en español en fuentes no-test; MUST_CONTAIN con los términos permitidos y un test por archivo; mutación comprobada (reintroducir «Buscar objetivo» hace fallar la guarda).

## Gates (reproducidos por el leader)

`pnpm lint`, `pnpm exec tsc -b --noEmit`, `pnpm build`, `pnpm format:check`, `pnpm contracts:check` con exit 0; `pnpm test --maxWorkers=4`: 94 archivos, 959 pruebas. Sin timers nuevos ni reloj real.

## Pendientes

Verificación visual (1280/375 px) a cargo del ux-reviewer; «Destino de la regla» fuera del glosario aprobado.
