# WI-CONSOLE-050 — revisión de Contract Sync

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

Checkpoint `start`: sin eventos relevantes pendientes. Los cuatro eventos históricos sin `scopePaths` (`CS-20260920-003`, `CS-20260921-001`, `CS-20260921-002`, `CS-20260921-003`) se registran como `NOT_RELEVANT` solo para este WI, con motivo y digest en `contractSyncReview`:

- `CS-20260920-003` (lifecycle del binding y borrado lógico): el WI solo cambia una regla CSS de layout, sin bindings ni endpoints.
- `CS-20260921-001` (identidad, workspaces, roles y rutas): sin cambios de autorización ni de rutas.
- `CS-20260921-002` (autenticación y seguridad de binding): sin cambios de login, sesión, tokens ni cliente HTTP.
- `CS-20260921-003` (membresía y eventos organizacionales): sin cambios de visibilidad de Projects ni de Runs.

`contractImpact=false`, `publishesContract=false`: sin DTO, rutas, claves de contrato ni enums; solo CSS y una guarda de prueba.
