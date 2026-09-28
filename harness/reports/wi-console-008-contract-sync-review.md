# WI-CONSOLE-008 — Revisión de Contract Sync y consumidor

- **Work item:** `WI-CONSOLE-008` / `ST-CONSOLE-010` / `HU12, HU14`.
- **Alcance autorizado:** homologar en Console los contratos vigentes de Core y GitHub Integration y comprobar la compatibilidad del consumidor de Runs. Sin cambios de UI, Sandbox, despliegue ni cutover.
- **Eventos:** `CS-CORE-20260927-003` (`WI-CORE-011`) y `CS-GH-20260927-001` (`WI-GH-007`), importados, revisados y resueltos en Console. Los estados y evidencias están en `harness/contract-sync/inbox/`.
- **Revisiones fuente:** Core `a99b3c315738966d956e9cb08833b2c42a7c85e5`; GitHub Integration `35bd9f2006240ebcd12ce0c3353d3a43bb1c1d0c`. Ambas existen en los repositorios fuente y sus WIs están cerrados.

## Compatibilidad del consumidor Console

- `listAnalysisRuns(projectId)` usa `GET /projects/{projectId}/analysis-runs`; `useAnalysisRuns` conserva `projectId` en el query key y lo entrega a esa función.
- `RunsPage` selecciona el listado del Project cuando la URL contiene `projectId`. Solo usa el listado global cuando no hay `projectId`; renderiza la respuesta sin reconstruir Runs omitidos por Core.
- El cliente Console no llama a `pull-request-head` ni consume `pullRequest.createdAt` del salto privado GitHub Integration→Core. La UI usa las rutas de usuario para App info, discovery, verificación y ramas.
- La revisión contractual independiente final fue aprobada sin bloqueadores de Console. Confirmó hashes, compatibilidad del consumidor y que las referencias vigentes antiguas ya fueron alineadas. La prueba live simulada confirma que, con un Project, se solicita su ruta de Runs y no se usa la global como fallback. El handoff está en `wi-console-008-contract-review-final.md`.
- Pruebas automatizadas y checks del WI: resultados completos en `wi-console-008-implementation.md`.

## Espejos canónicos

| Contrato | Fuente canónica | SHA-256 Console | SHA-256 fuente | Resultado |
| --- | --- | --- | --- | --- |
| `system-contract.md` | Core, `a99b3c3` | `287345915036cb55e3c681d9eaa3995cece16442fde56b24621ac2b663330aad` | `287345915036cb55e3c681d9eaa3995cece16442fde56b24621ac2b663330aad` | idéntico |
| `interoperability-contract.md` | Core, `a99b3c3` | `1f5cc04a7fc73388a49d1c1de4f79f873d0e95edec7db6e102b5f828f6a2f852` | `1f5cc04a7fc73388a49d1c1de4f79f873d0e95edec7db6e102b5f828f6a2f852` | idéntico |
| `github-integration-contract.md` | GitHub Integration, `35bd9f2` | `9c58c9afa1d2bda201b604d82d606a57e86b3244578d14054f2cb5a9a7f5d9b6` | `9c58c9afa1d2bda201b604d82d606a57e86b3244578d14054f2cb5a9a7f5d9b6` | idéntico |

## Hallazgo para los repositorios propietarios

Las fuentes canónicas contienen dos frases de estado ya vencidas que Console preserva deliberadamente para mantener los espejos byte por byte: el SYSTEM de Core dice que `WI-GH-007` implementará la extensión, y el GH contract afirma que `WI-GH-007` aún no está implementado. Ambos WIs figuran `W-DONE`. No afectan DTOs ni compatibilidad del consumidor; Core y GitHub Integration deben corregir sus fuentes si desean actualizar esas frases, y Console volvería a sincronizar si cambian los archivos.

**Resultado:** los espejos coinciden y la compatibilidad está verificada. La revisión contractual está aprobada; WI-CONSOLE-008 queda listo para la revisión independiente del usuario. Las frases de estado vencidas en las fuentes canónicas Core/GH quedan como seguimiento de sus repositorios propietarios; Console las preserva para mantener los espejos idénticos y no afectan la compatibilidad.
