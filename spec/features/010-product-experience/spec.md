# 010-product-experience — Especificación

**Estado:** aprobado para implementar.
**Historias:** soporte visual transversal de HU01–HU18; no constituye una HU adicional.

## Objetivo

Consolidar toda la aplicación como una consola técnica coherente, oscura y reconocible bajo el nombre **RAG Test Studio**.

## Reglas y comportamiento

- El lenguaje visual vigente es **Black Glass**, definido por la transversal `design-system`: base negra, superficies de vidrio controladas, jerarquía tipográfica editorial y movimiento suave con propósito. Sustituye la dirección parcial anterior basada en paneles azul oscuro/índigo.
- La referencia elaborada en Google Stitch orienta composición, ritmo y acabado visual, pero esta SDD mantiene la autoridad sobre comportamiento, estados, accesibilidad y contratos.
- La homologación abarca login, Projects, Integrations/GitHub, Runs, Action Required, review/publicación, Experiments, explorador de contexto y estados vacíos/error/loading. Los componentes visuales y de estado reutilizables se reaplican a estas superficies PR-driven.
- Filtros para múltiples proyectos/versiones/runs, jerarquía y breadcrumbs claros.
- La densidad informativa prioriza resultados técnicos; el glass, glow y partículas no reducen legibilidad ni esconden controles.
- El nombre visible de la aplicación coincide con el nombre aprobado del proyecto Stitch: `RAG Test Studio`.

## Demo del flujo PR-driven

- La demo vigente representa discovery, validación de App, selección de rama, RepositoryBinding, PR/HEAD y AnalysisRun conforme al contrato actual. Se rotula y no produce efectos externos.

## Fuera de alcance

- Integración real con GitHub, vinculación de identidades y efectos sobre repositorios.
- Copiar literalmente Superhuman, Stitch o las imágenes de referencia.
- Usar la maqueta GitHub o datos mock como evidencia empresarial.
