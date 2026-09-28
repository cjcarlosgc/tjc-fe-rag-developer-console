# Contract Sync consumidor — CS-GH-20260926-001

**Fecha:** 2026-09-26  
**WI consumidor:** WI-CONSOLE-003 (W-IN_PROGRESS)  
**Evento importado:** C-PENDING antes de esta resolución  
**Alcance:** aceptar técnicamente las cuatro capacidades de usuario servidas por GitHub Integration, sin cerrar ni aprobar el WI.

## Verificación

- El contrato GH-INTEROP-1.1 de Core, Console y GitHub Integration coincide byte por byte. SHA-256: 0c5622cc7f334192ee06086ffe5ac926769f266f99d33683b49b18956946c794.
- Console usa Integration solo para App info, discovery, verificación de acceso y ramas. Workspaces/Projects, autorización de dominio y persistencia de bindings permanecen en Core.
- La sesión Supabase se transmite solo para la autorización prevista; el token OAuth de proveedor se limita al discovery y no se envía a Core.
- Validación fresca desde app/: npm run test -- --no-file-parallelism (424/424), npm run lint, npm run build y git diff --check pasaron. Build conserva una advertencia no bloqueante de chunk >500 KB.

## Resultado y límite

La acción técnica solicitada por el evento está implementada y verificada para Console. Contract Sync quedó en C-ACKNOWLEDGED y luego C-RESOLVED mediante el CLI, usando este reporte como evidencia. El checkpoint dinámico before-review devuelve cero eventos relevantes pendientes e incluye CS-GH-20260926-001 como resuelto. Esto no aprueba la revisión independiente ni UX, no cierra WI-CONSOLE-003, ni autoriza deploy o cutover; esos checks permanecen pendientes.
