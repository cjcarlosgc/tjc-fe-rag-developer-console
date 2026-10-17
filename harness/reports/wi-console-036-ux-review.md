Modelo: ux-reviewer · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo low

# WI-CONSOLE-036 (ST-CONSOLE-037) — revisión UX/a11y

**Veredicto: CHANGES_REQUESTED** (un hallazgo medio de honestidad/UX; sin bloqueantes de contraste ni foco).

## Hallazgos
### Medio
1. Con `?experimentId=` inexistente o fallido, la nota role=status sigue diciendo «Esta comparación ya se lanzó: su estado y resultados están abajo…», pero lo de abajo es el bloque de error. Es engañoso, y el botón queda deshabilitado de forma permanente: el único camino para lanzar otra comparación es editar la URL (la nota lo dice, pero no hay enlace/acción). Sugerido: texto distinto cuando `experimentQuery.isError` («No se pudo cargar el experimento indicado en la URL») y/o un enlace «Nuevo experimento» que quite `experimentId`.
### Bajo
2. El botón «Reintentar» del bloque de error renderiza con estilo nativo (fondo rgb(239,239,239), texto negro; contraste 18.26, legible pero fuera de Black Glass). Mismo patrón preexistente del bloque de inicio; confirmar si `.button` aplica dentro de `.structured-error`.
3. La nota de «ya lanzado» persiste incluso en estado terminal; correcto, pero el selector queda habilitado sin efecto. Considerar deshabilitarlo o dejarlo (decisión de producto).
4. Tras «Ver contexto →» y volver por el breadcrumb «Modo experimental», se conserva experimentId y analysisRunId pero se pierde `workspaceId` en la URL (breadcrumbs de la pantalla de contexto: «/» y «/projects/…» sin workspaceId; aparentemente preexistente, no del WI).
5. Hay dos regiones role=status simultáneas mientras corre un experimento (la nota `#experiment-run-note` y `.experiment-progress`). La nota es única y persistente; la de progreso es preexistente. Aceptable.

## Evidencia medida (getComputedStyle, mock, 1024 px)
- Nota de estado (13px): color rgb(188,186,201) sobre rgb(11,11,13) = 10.31:1.
- Hint de constructor (13px): mismo color/fondo = 10.31:1 (AA).
- Bloque de error: título 15.59:1; párrafo rgb(255,180,192) sobre rgb(5,5,6) = 12.17:1; `code` 10.30:1.
- Botón primario: 10.59:1 (deshabilitado opacity .52, exento).
- Foco: select con `:focus-visible` outline solid rgb(201,180,250) (3px).
- Botón «Ejecutar comparación» tiene aria-describedby="experiment-run-note"; la nota es role=status, id único, siempre presente (vacía cuando el botón está habilitado).
- Texto «ya lanzado» tras éxito: «Esta comparación ya se lanzó…» (URL pasó a …&experimentId=exp_demo_2001, botón disabled). Texto «en curso» («Creando comparación… espera…») verificado solo por código: el mock responde demasiado rápido para capturarlo.
- Selector sin preselección de constructor: primera opción createOrder; el constructor DEMO queda al final como «DEMO · DATOS SIMULADOS · Demo::__construct»; al elegirlo aparece «Este target parece un constructor y puede no ser ejecutable…» y el select recibe aria-describedby="experiment-constructor-hint".
- Lanzar el constructor DEMO: bloque role=alert con «No pudimos localizar el target elegido…» y «Correlation ID: demo-correlation-id». Sin «Reintentar» en ese caso (correcto: no es reintentable).
- ?experimentId=exp_nope_999: bloque role=alert «No se pudo cargar el experimento», correlation id y «Reintentar»; sin sondeo en bucle.
- Éxito: «Ver contexto →» (6 enlaces) navega a /experimental/:id/context; breadcrumb «Modo experimental» vuelve a ?experimentId=exp_demo_2001&analysisRunId=… y reabre resultados y evidencia.
- Overflow horizontal: scrollWidth == clientWidth en 375, 768 y 1024 px (probado con el bloque de error; sin elementos fuera de viewport).

## Limitaciones
- El panel del navegador reporta visibilityState=hidden y React Query pausa el sondeo; forcé visibilityState=visible por JS para completar el experimento. Efecto de entorno, no del cambio.
- El select se manipuló por JS (setter nativo + change) porque form_input/teclado no operan el popup nativo; el Tab real hasta el select/botón se verificó solo parcialmente (focus() programático y :focus-visible tras tecla). No se probó lector de pantalla.
- La recarga completa con un id real no es verificable con el mock: el estado del mock vive en memoria y se pierde al recargar (resulta en el bloque de error). La reapertura se verificó vía navegación SPA (breadcrumb).
- /projects/prj_billing_demo/experimental se queda en «Preparando laboratorio…» (proyecto del mock sin versión actual; no relacionado con el cambio, no investigado).
- Cuenta mock; no se usó el Core de Render. Servidor vite propio en :5174 detenido al terminar.

## Ciclo 2

**Veredicto: CHANGES_REQUESTED** (el hallazgo MEDIO queda corregido en código y en test, pero no es alcanzable en el navegador).

Verificado en mock (puerto 5174, 1024 px) con `/projects/prj_checkout_demo/experimental?workspaceId=1000001&analysisRunId=arun_checkout_pr53&experimentId=nope-404`:
- `getExperiment('nope-404')` lanza `ApiError` («No existe el experimento demo…»), pero la UI nunca llega al estado de error: tras 35 s sigue mostrando `.experiment-progress` («Preparando experimento… 0%») y la nota antigua «Esta comparación ya se lanzó: su estado y resultados están abajo…». No aparece `.structured-error` ni «Iniciar otra comparación».
- Causa probable: `main.tsx` fija `retry: 1` y `ExperimentPage` define `refetchInterval` 560 ms mientras `status !== 'error'`; el sondeo reinicia el ciclo de reintento y la query queda en `pending` (los tests pasan porque el entorno de test no reintenta de la misma forma). Sugerido: `retry: false` (o `retry` acotado a no-404) en esta query, o tratar `failureCount > 0`/`isRefetchError` como error en el render y en `refetchInterval`.
- Lectura de código: el botón «Iniciar otra comparación» borra `experimentId` con `replace`, conserva `analysisRunId` y el botón principal depende solo de `experimentId`, por lo que lógicamente se rehabilita; el texto de la nota para `isError` es «No se pudo cargar el experimento de la URL; reintenta o inicia otra comparación.». Contraste, foco visible y 375 px del botón nuevo NO pudieron medirse en navegador por lo anterior (reutiliza `.button`, mismo estilo que «Reintentar»).
- Pendiente tras corregir: repetir la verificación en navegador (nota, contraste, foco por teclado, activación, 375 px).

## Ciclo 3

Modelo: ux-reviewer · claude-sonnet-5-5

**Veredicto: APPROVED** (con hallazgos bajos no bloqueantes).

Entorno: el vite de :5174 corre contra datos/auth LIVE (`app/.env`; el login redirige a GitHub real), por lo que NO se usó. Se arrancó un vite propio en :5191 con `VITE_DATA_SOURCE=mock VITE_AUTH_MODE=mock` (detenido al terminar), login mock y `/projects/prj_checkout_demo/experimental?workspaceId=1000001&analysisRunId=arun_checkout_pr53&experimentId=nope-404`, sin forzar visibilidad.

### Verificado en navegador real (mock)
- Con `document.visibilityState=hidden` y `hasFocus()=false` (sin forzar), el bloque `role=alert` («No se pudo cargar el experimento», Correlation ID, «Reintentar», «Iniciar otra comparación») ya estaba presente en la primera lectura a ~2,8 s de la carga (antes, en ciclo 2, no llegaba tras 35 s). No se midió con visibilidad forzada a visible: no hizo falta.
- Nota `#experiment-run-note`: «No se pudo cargar el experimento de la URL; reintenta o inicia otra comparación.»; «Ejecutar comparación» deshabilitado.
- Contraste: botón «Iniciar otra comparación» rgb(0,0,0) sobre rgb(239,239,239) = 18,26:1 (16 px, alto 42 px); párrafo del error 12,17:1.
- Teclado: Tab desde «Reintentar» llega a «Iniciar otra comparación» con `:focus-visible` y outline rgb(201,180,250) solid 3px, offset 2px.
- Activación (Enter): la URL pasa a `…?workspaceId=1000001&analysisRunId=arun_checkout_pr53` sin experimentId (analysisRunId conservado); el bloque de error desaparece, la nota queda vacía y «Ejecutar comparación» vuelve a habilitarse.
- Overflow horizontal: scrollWidth == clientWidth y 0 elementos fuera de viewport a 375, 768 y 1024 px (bloque de error visible). Viewport restaurado a desktop.

### Hallazgos (bajos, no bloqueantes)
1. Ambos botones del bloque de error («Reintentar», «Iniciar otra comparación») usan `.button` con aspecto nativo claro (fondo rgb(239,239,239)), fuera de Black Glass; legible (18,26:1). Ya reportado en ciclo 1 (hallazgo 2); no empeora.
2. Tras activar «Iniciar otra comparación» el botón desaparece y el foco cae a `BODY` (el siguiente Tab reinicia desde el principio). Sugerido: mover el foco a «Ejecutar comparación» o al selector de target.
3. Según lo observado, al activar el botón el valor de la URL quedó sin `workspaceId` (la URL de partida lo traía). No se investigó si el contexto de workspace se conserva por otra vía ni si es preexistente.

### Limitaciones
- No se midió el tiempo con precisión de bucle: los temporizadores del panel oculto se estrangulan (un bucle de 15 s excedió 45 s); el ~2,8 s es la primera lectura posible, no un mínimo.
- Teclado verificado con una tecla Tab real tras `focus()` programático en «Reintentar»; no se recorrió toda la página con Tab. Sin lector de pantalla.
- Cuenta/datos mock; no se usó el Core de Render. «Reintentar» no se activó (mock siempre falla con el mismo 404).
