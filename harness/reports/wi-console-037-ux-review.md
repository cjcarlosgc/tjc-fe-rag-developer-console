# WI-CONSOLE-037 · Revisión UX

Modelo: ux-reviewer · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo low

Veredicto: APPROVED

## Método
Vite mock (VITE_DATA_SOURCE=mock + VITE_AUTH_MODE=mock, puerto 5174, detenido al terminar), navegador integrado, sin Core/Render. Nota: con solo DATA_SOURCE=mock el login redirige a GitHub real; hizo falta AUTH_MODE=mock. Pestaña en segundo plano pausa el polling (react-query); se forzó visibilityState para avanzar.

## Verificado
- PENDING→PUBLISHING→PUBLISHED en /runs/arun_checkout_pr45: botón «Publicar 3 propuesta(s)» desaparece al llegar a PUBLISHED; también desaparecen oferta y nota de solo lectura. Estado «Publicación finalizada: PUBLISHED» y nota «Se mergea a la rama…» visibles.
- Foco: el botón tenía foco; al desaparecer, el foco pasa a `.publication-result` (confirmado `document.activeElement`), no se pierde a BODY.
- Contraste computado (fondo rgb 11,11,13): estado/cabecera/nota 10.31:1, strong 16.17:1, badge PUBLISHED 12.74:1, sello DEMO 9.50:1. Todos > 4.5:1.
- Responsive 375/768/1024: scrollWidth == innerWidth, ningún hijo de `.publication-result` desborda.
- Context Explorer (exp_demo_2001 vía mock): alternar lista/grafo, cambiar traza (RAG/Agente rep 1-3), seleccionar nodo; la URL conserva `trace`, `view` y `node` en cada paso y sin pisarse entre escrituras. Back del navegador sale de la pantalla (replace:true, igual que antes).

## Hallazgos
1. [Baja] Ventana previa al refetch (~0,2-0,5 s en mock): cabecera dice «Sin propuestas disponibles para publicar en este Run.» mientras las 3 filas aún muestran badge AVAILABLE; luego pasan a PUBLISHED. Es veraz respecto a la acción (ya no se puede publicar) y no lleva a error; la discrepancia es breve. En Core real el refetch puede tardar más. No bloqueante; opcional: no mostrar badge AVAILABLE cuando publishedNow, o texto «Publicadas en el companion PR».
2. [Baja/informativa] Tras PUBLISHED el texto de cabecera «Sin propuestas disponibles…» no dice que ya se publicaron (eso lo cubre el panel «Companion PR publicado» y los badges). Aceptable.
3. [Info] El outline de `.publication-result:focus-visible` no se computa tras foco programático por clic de ratón; con teclado aparece según :focus-visible. Sin cambio requerido.

## Conclusión
Sin hallazgos Alta/Media. Cambio honesto, accesible y sin regresión en Context Explorer.
