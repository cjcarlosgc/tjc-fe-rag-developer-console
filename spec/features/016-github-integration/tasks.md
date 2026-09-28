# Subtareas — GitHub Integration (Console)

- [x] **ST-CONSOLE-003 [T-DONE] · WI-CONSOLE-003 · HU01, HU02, HU14, HU16:** adoptar IDs Contract Sync namespaced y sincronizar contratos compartidos con Core y GitHub Integration.
- [x] **ST-CONSOLE-008 [T-DONE] · WI-CONSOLE-003 · HU01, HU02, HU14, HU16:** consumir GitHub Integration para App info, discovery, verificación y ramas con la sesión Supabase; persistir el binding solo en Core usando evidencia firmada breve. Pruebas, revisión UX y visto bueno personal completados; no cambia el cutover.
- [x] **ST-CONSOLE-009 [T-DONE] · WI-CONSOLE-003 · HU01, HU02, HU14, HU16:** completar el ciclo de Contract Sync en el Harness: registrar hora local de importación, permitir `acknowledge`/`resolve` con evidencia y mantener inmutables los snapshots cerrados ante eventos posteriores.
- [ ] **ST-CONSOLE-010 · T-BACKLOGGED · WI-CONSOLE-008 · HU12, HU14:** sincronizar los contratos Core/GitHub Integration sobre el corte temporal PR/binding y verificar que Console sigue consultando Runs por `projectId` sin introducir cambios de UI.
