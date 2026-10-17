# WI-CONSOLE-008 — Revisión contractual final

- **Revisor:** `contract-reviewer`.
- **Veredicto:** `APPROVED`.
- **Alcance:** homologación de los espejos SYSTEM, INTEROP y GitHub Integration, y compatibilidad de los consumidores de Console.
- **Bloqueadores de Console:** ninguno.

## Hallazgos

- Los tres espejos coinciden byte a byte con sus fuentes canónicas actuales; los `cmp` finalizaron con código 0.
- Las referencias vigentes a `INTEROP-2.5` y `GH-INTEROP-1.1` fueron alineadas. Las coincidencias restantes en el repositorio son historia de cortes anteriores y se conservan como tales.
- Console consulta Runs mediante `projectId`, renderiza lo que responde Core y no reconstruye Runs omitidos. No consume `pull-request-head` ni `createdAt` del salto privado GitHub Integration→Core.
- Los eventos `CS-CORE-20260927-003` y `CS-GH-20260927-001` describen correctamente el impacto; ambos están `C-RESOLVED` con evidencia.
- La aplicación solo cambia comentarios de versión y una prueba de regresión; no cambian la lógica ni la UI.

## Comparación de fuentes

| Contrato | Comparación | SHA-256 |
| --- | --- | --- |
| SYSTEM Console/Core | idénticos | `287345915036cb55e3c681d9eaa3995cece16442fde56b24621ac2b663330aad` |
| INTEROP Console/Core | idénticos | `1f5cc04a7fc73388a49d1c1de4f79f873d0e95edec7db6e102b5f828f6a2f852` |
| GitHub Integration Console/GH | idénticos | `9c58c9afa1d2bda201b604d82d606a57e86b3244578d14054f2cb5a9a7f5d9b6` |

## Seguimiento para los propietarios

El SYSTEM canónico de Core y el contrato canónico de GitHub Integration aún contienen frases de estado que presentan `WI-GH-007` como pendiente, aunque ya está `W-DONE`. No son incompatibilidades de Console. Se preservan literalmente en los espejos; cualquier corrección corresponde a los repositorios propietarios y requerirá volver a importar el contrato actualizado.

## Recomendación

Registrar esta revisión contractual como aprobada y pasar WI-CONSOLE-008 a revisión independiente del usuario. Este handoff no sustituye ese visto bueno.
