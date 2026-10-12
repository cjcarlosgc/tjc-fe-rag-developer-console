# WI-CONSOLE-023 — adopción de espejos Core

Fecha: 2026-10-11. Fuente: Core `4246685534bfdbb2de631c526cebce6ebb51ac99` (`WI-CORE-039`).

Modelo: leader · configurado gpt-6-luna · atendido unknown · esfuerzo xhigh

## Resultado

Se adoptaron únicamente los espejos canónicos y sus referencias locales. La comparación `git diff --no-index --quiet` contra el contenido de Core en la revisión fuente no produjo diferencias.

| Archivo | SHA-256 Console/Core |
| --- | --- |
| `spec/contracts/system-contract.md` | `4d14f5b2204287bdff88060a51578cc97443e93b34a729059a5427cff67b3f5d` |
| `spec/contracts/github-integration-contract.md` | `dd02c32f89efc463c06165ce9ead785b8afeee782e464c4e6f7b1d4a532a167e` |

`GH-INTEROP-1.6` documenta el HTTP 422 terminal, reconciliación completa, replay de la misma huella y retry corregido serializado. Console no ejecuta esa operación: no se modificó `app/`, UI, API, DTOs, selectores, despliegue ni cutover.

## Verificaciones

- `shasum -a 256` sobre ambos espejos y fuentes Core: iguales.
- `git diff --no-index --quiet` sobre ambos pares: sin diferencias.
- `node harness/validate-work-items.mjs`: pasa al seleccionar el WI.
