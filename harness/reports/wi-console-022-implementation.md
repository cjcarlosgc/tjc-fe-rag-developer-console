# WI-CONSOLE-022 — Implementación documental

Modelo: leader · configurado gpt-6-luna · atendido unknown · esfuerzo xhigh

Se verificó que los espejos locales coinciden byte por byte con Core
`7789f54fe0bc65faf37576f8562e844d826e98ac`:

- SYSTEM-2.7: `50d9dcc03f2af0337c3b11824df8a2c9fdee4c189e8df84bccea3e85cc827f76`.
- INTEROP-2.8: `755c3357ca047ede9fb318a40a594cc68a63fc63f2b9f4c58af93c28f51a8d90`.
- GH-INTEROP-1.5: `fbbda9603c0ac4f881287a713603246e69c7518875b3d8a2e0631842cedf37bc`.

`CS-CORE-20261011-001` se adopta sin selector de Project/aplicación ni cambio
de DTO/UI: cada Project conserva un repositorio y `projectRoot` solo sería
informativo en una vista técnica ya existente. `CS-CORE-20261011-004` tampoco
requiere cambio de Console; su implementación de coordinación durable pertenece
a GitHub Integration. No se modificó `app/`.
