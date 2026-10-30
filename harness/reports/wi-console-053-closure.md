# WI-CONSOLE-053 — cierre

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Estado:** W-DONE (commits locales en `feature/jean`, sin push; el push espera el despliegue de Core, orden Core → Console). Espeja INTEROP-2.25 (`b2f3845296451bd3e593c00cb1e5955029f3d77ef4d69d1fd9326d07f1fdb651`) desde Core `55bf4241431329a50db4ab85676b68c5888c01b8`; SYSTEM-2.16, GH-INTEROP-1.9 y schemas sin cambio; `generated/` sin cambio. HU18: sección «Captura de experimentación» en el Project, aviso persistente, badge «Reservado para experimentación» en lista y detalle del Run, mock DEMO.

Contract Sync: `CS-CORE-20261030-001` y `CS-CORE-20261026-001` resueltos (el del 30 subsume al del 26; lo pendiente del 26 lo cubrió WI-CONSOLE-052). Cuatro checkpoints grabados. Cuatro eventos históricos NOT_RELEVANT con digest.

Revisiones (ciclo 1, sin cambios pedidos): contract-reviewer APPROVED; reviewer APPROVED (9 gates reproducidos; 5 de 6 mutaciones ROJAS); ux-reviewer APPROVED (1280 y 375 px sin desborde; botones de 42 px). Capturas: `wi-console-053-captura-01..07.png` (01 sin armar, 02 armada 1280, 03 armada 375, 04 lista con badge, 05 detalle 1280, 06 detalle 375, 07 Reader 375).

Pendientes: (1) la invalidación de la lista tras armar con éxito no tiene prueba (la mutación sobrevive; `setQueryData` ya cubre el estado). (2) Observaciones UX menores: `aria-describedby` del botón Desarmar hacia el aviso; enlace «ver el Run reservado» de 16 px en 1280; texto repetido «Sin captura armada»/«Sin capturas armadas.» para Reader y Writer. (3) «Armar captura» también existe en el panel especulativo HU49 (mock) de la página de Experimento: coexiste y confunde poco; WI aparte para rotularlo como simulación o retirarlo. (4) No probado contra Core desplegado ni en navegador real con foco de teclado fuera de jsdom y Chrome headless. (5) Push, PR y merge tras el despliegue de Core.
