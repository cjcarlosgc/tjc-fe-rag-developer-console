# WI-CONSOLE-011 — Verificación SDD y decision gate

- **WI/ST/HU:** `WI-CONSOLE-011` / `ST-CONSOLE-013` / `HU12, HU14`.
- **Componente/tipo/prioridad/sprint:** `CONSOLE` / `HARNESS` / `P0` / `SMART V3`. Alcance aprobado en `harness/reports/smart-v3-scope-approval.md`.
- **Alcance:** corte documental. Copiar byte a byte SYSTEM-2.6 e INTEROP-2.7 desde Core `ab5142b46addc0bff2c126cf3e8531f5ed111d5c`, actualizar las referencias vigentes al contrato, registrar el cambio en `CHANGELOG.md` y resolver `CS-CORE-20261008-001`.
- **Fuera de alcance:** `app/` (incluidos comentarios de tipos que citan INTEROP-2.6), UI, Core, GitHub Integration, Sandbox, `harness/reports` históricos, snapshots y configuración externa. La adopción funcional corresponde a `WI-CONSOLE-012` a `WI-CONSOLE-020`.

## Decision gate

Se leyeron los campos `Blocks` de SYSTEM-2.6 (fuente Core). Las decisiones nuevas (`DEC-EXP-FK-001`, `DEC-EXP-003`, `DEC-EXP-004`, `DEC-FK-001..004`, `DEC-ORG-003`) están `APROBADO`. Las únicas decisiones abiertas, `DEC-INF-001` (aprovisionamiento remoto del Sandbox) y `DEC-VAL-001` (validación empresarial), no alcanzan este corte documental. `blockingDecisionIds: []`.

## Contract Sync y dependencia externa

`CS-CORE-20261008-001` está importado y `C-ACKNOWLEDGED` (`wi-console-011-contract-sync-acknowledgement.md`). La puerta externa contra `WI-CORE-017` (`W-DONE`) está `G-PASSED` (`wi-console-smart-v3-external-dependency-gate.md`). Checkpoint `start` registrado sin eventos relevantes pendientes. `GH-INTEROP-1.2` no cambia.

## Criterios y riesgos

Los criterios de aceptación del WI son verificables (hashes SHA-256, `git diff`, validadores). Riesgo: la enmienda "Contrato objetivo" en features 013, 014-organizations-access y 014-analysisrun-experiments afirma que la copia sigue siendo INTEROP-2.6; debe retirarse para no contradecir el espejo. Se conserva el resto de esas enmiendas, que describen la adopción futura (WI-CONSOLE-013 a 019).
