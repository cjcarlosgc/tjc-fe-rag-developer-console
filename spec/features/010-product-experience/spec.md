# 010-product-experience — Especificación

**Estado:** aprobado para implementar.
**Historias:** HU25, HU26

## Objetivo

Consolidar toda la aplicación como una consola técnica coherente, oscura y reconocible bajo el nombre **RAG Test Studio**.

## Reglas y comportamiento

- El lenguaje visual vigente es **Black Glass**, definido por la transversal `design-system`: base negra, superficies de vidrio controladas, jerarquía tipográfica editorial y movimiento suave con propósito. Sustituye la dirección parcial anterior basada en paneles azul oscuro/índigo.
- La referencia elaborada en Google Stitch orienta composición, ritmo y acabado visual, pero esta SDD mantiene la autoridad sobre comportamiento, estados, accesibilidad y contratos.
- La homologación abarca login, proyectos, alta/carga ZIP, indexación, versión/inventario, configuración de generación, progreso, resultados, artifacts/diff, historial, experimento, explorador de contexto y estados vacíos/error/loading.
- Filtros para múltiples proyectos/versiones/runs, jerarquía y breadcrumbs claros.
- La densidad informativa prioriza resultados técnicos; el glass, glow y partículas no reducen legibilidad ni esconden controles.
- El nombre visible de la aplicación coincide con el nombre aprobado del proyecto Stitch: `RAG Test Studio`.

## Demo futura de GitHub

- HU26 incluye una trayectoria interactiva mock: alternativa “Continuar con GitHub”, selector de repositorios propios o donde el usuario es colaborador, selección de rama base —`develop` por defecto— y revisión/creación simulada de un PR.
- La rama generada se presenta como `rag-test-studio/{run-slug}`; el destino del PR es `develop` por defecto y puede cambiarse.
- Toda pantalla de ese recorrido mantiene el rótulo `DEMO · GITHUB SIMULADO`. No ejecuta OAuth, no recibe tokens, no consulta GitHub ni crea ramas/PR reales.
- Esta maqueta no está bloqueada por `DEC-GH-001`; esa decisión bloquea exclusivamente la integración real.

## Fuera de alcance

- Integración real con GitHub, vinculación de identidades y efectos sobre repositorios.
- Copiar literalmente Superhuman, Stitch o las imágenes de referencia.
- Usar la maqueta GitHub o datos mock como evidencia empresarial.
