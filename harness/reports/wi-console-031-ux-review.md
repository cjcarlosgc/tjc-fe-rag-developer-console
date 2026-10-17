# WI-CONSOLE-031 · Revisión UX / accesibilidad / honestidad de mocks

Modelo: ux-reviewer · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo low

Veredicto: APPROVED (con 2 observaciones menores no bloqueantes)

Método: lectura del diff de FocusModePage.tsx, queries.ts, errors.ts, mockBackend.ts, pruebas (FocusModePage.test.tsx l.296-334) y styles.css. No se arrancó navegador.

## Verificado
- Copy: coincide con el texto fijado («Esta pregunta ya no aplica. El Run cambió o ya fue contestada; actualizamos el contexto pendiente.»); tono no culpabilizante, sin Correlation ID ni reintento.
- Foco/lectores: contenedor `role="status"` con `tabIndex={-1}` y foco por efecto al fijarse `obsoleteQuestionId`. Al ser la pregunta retirada del DOM, el foco no se pierde. La prueba comprueba el foco. Otros errores (403, ANALYSIS_RUN_NOT_FOUND) conservan alert y no muestran este aviso.
- Sin callejón sin salida: el enlace «Volver» (`returnTo` saneado) y las migas Action Required siempre están presentes; tras el refresco se muestra la siguiente pregunta o el panel «Sin preguntas pendientes en este Run».
- Honestidad del mock: rótulo `DEMO · DATOS SIMULADOS` presente; el mock devuelve 404 FUNCTIONAL_QUESTION_NOT_FOUND con mensaje «demo», alineado con INTEROP-2.9 §6.11.
- Sin reintento: se limpia la clave de idempotencia y la pregunta obsoleta no se vuelve a ofrecer aunque el refresco la devuelva.

## Hallazgos
1. (Menor, no bloqueante) La clase `focus-mode-obsolete` no tiene CSS: se ve como `.panel` genérico, consistente con otros paneles pero sin diferenciarse de ellos (sin icono/borde de aviso). Aceptable; si se desea, estilarla como `.success-note`/`.contract-note` (borde sólido `--border-subtle`, texto `--muted`) para coherencia con el panel «Sin preguntas pendientes» que aparece justo debajo.
2. (Menor, no bloqueante) El aviso no tiene estilo `:focus-visible` propio (la tarjeta sí: `.focus-mode-card:focus-visible`, styles.css l.396). El foco programático puede mostrar el outline del UA; recomendable añadir `.focus-mode-obsolete:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }`.
3. (Informativo) Si tras el refresco aparece una pregunta distinta, el aviso permanece visible hasta la siguiente mutación: es el comportamiento deseado (explica por qué cambió la pregunta). Un lector de pantalla anuncia el status solo una vez.
4. (Informativo) Con el panel vacío tras la obsolescencia aparecen dos mensajes consecutivos (aviso + «Este Run no tiene una pregunta vigente — puede que el HEAD haya cambiado…»); es redundante pero coherente y no confuso.

Sin cambios de código realizados.
