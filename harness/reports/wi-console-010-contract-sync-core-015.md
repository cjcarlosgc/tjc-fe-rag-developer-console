# WI-CONSOLE-010 — Contract Sync Core-015

- **Evento:** `CS-CORE-20260927-004`.
- **Fuente:** `core`; `sourceWorkItem: WI-CORE-015`.
- **sourceRevision:** `606006b44c23c0515c73dc21518102bb49edcb8c`.
- **Targets:** `github-integration`, `console`.
- **Scope:** `system-contract.md`, `interoperability-contract.md` y `github-integration-contract.md`.
- **breaking:** `false`.
- **Importación:** recibido desde el outbox Core; el evento local conserva `consumerImportedAt` y lifecycle propio.

El commit fuente existe y los SHA-256 de los tres contratos en ese commit son SYSTEM-2.5 `e0423375f15d0e4c29feac96475292e530902f60742fbd07238a50b3f9f9e13d`, INTEROP-2.6 `1f5cc04a7fc73388a49d1c1de4f79f873d0e95edec7db6e102b5f828f6a2f852` y GH-INTEROP-1.2 `8a80c056359af74dc8b3b704f47efb232eaafb250bd4efb1d923450435a9e9f9`.

Al importar, el evento quedó `C-PENDING`; se acusó recibo con este reporte y luego quedó `C-RESOLVED` tras la copia/verificación de los contratos. Los estados fuente actuales (verificados después de los eventos 005/006) son WI-CORE-015=`W-IN_REVIEW` y WI-GH-008=`W-IN_REVIEW`; el gate externo sigue `G-NOT_RUN` hasta que ambos estén `W-DONE`.
