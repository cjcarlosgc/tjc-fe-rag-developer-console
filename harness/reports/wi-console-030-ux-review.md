Modelo: ux-reviewer · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo low

# WI-CONSOLE-030 — revisión UX / accesibilidad / honestidad del mock

Método: Browser pane real, `vite --port 5174` con `VITE_DATA_SOURCE=mock VITE_AUTH_MODE=mock` (el `.env` local es `live`; se sobrescribió por variables de entorno, sin tocar archivos). Sin Core de Render. Servidor detenido al terminar. Sin edición de código.

## Veredicto: APPROVED (con hallazgos no bloqueantes)

El alcance (solo datos de mock) cumple: copy unificado, role=alert, rótulos DEMO, contraste y sin desbordes. Los hallazgos son incoherencias menores de datos de demo que conviene corregir en un WI posterior o antes del cierre si el reviewer humano lo prefiere.

## Escenarios

1. **Semilla PHP (`arun_php_pr7`)**: OK. Símbolo PHP elegible; `rcmp_demo_seed_php` Completada; relaciones «Clase declarante», «Mismo namespace», «Referencia completamente calificada» y «Sin relación estructural»; SEM muestra «no aplica»; métricas «no disponible» (no inventa números); «DEMO · DATOS SIMULADOS» y «no es el registro académico» visibles.
2. **`arun_legacy_php_pr3` → 422**: OK. `<p class="inline-error" role="alert">` con el copy unificado «Este proyecto no tiene framework JEST, VITEST o PHPUNIT detectado.» + «Referencia: demo-correlation-id»; no se abre resultado; lista previa vacía. Ver F2 sobre foco.
3. **Projects team-sandbox**: rótulo global «DEMO · DATOS SIMULADOS» en el header; Historial muestra `PHPUNIT` para shop-php-demo y «—» para legacy; Inventario legacy muestra «FRAMEWORK NO DETECTADO». Ver F3/F4/F5.
4. **PR #53 «En cola» / PR #25 «Procesando»**: contraste computado (alfa compuesto sobre fondo real) a 375/768/1024: En cola/Procesando 10.04:1, Success 11.35, Action required 11.16, Infrastructure 10.86, NO VIGENTE 9.95 (todos ≥ 4.5). Sin desborde horizontal (`scrollWidth == innerWidth`, ningún badge/chip recortado) en los tres anchos. Detalle `arun_checkout_pr53` no promete resultados (sin propuestas ni evidencia, trace «aún se procesa»). Ver F1.
5. **409 pr52**: OK. Responder «Sí» muestra `role=alert` «Esta respuesta contradice una regla vigente», regla vigente «sin excepciones por tipo de cliente» vs propuesta; foco movido a la tarjeta (`tabindex=-1`); opciones «Reemplazar regla vigente» / «Mantener la vigente». La pregunta (excepción corporativa fuera de zonas habilitadas) sigue coherente con `shipping.validate.zones` / regla vigente de zonas de envío. Ver F6.

## Hallazgos

| ID | Severidad | Hallazgo |
|---|---|---|
| F1 | Media | Historial de transiciones incoherente en los Runs en curso. `arun_checkout_pr53` (En cola, INTENTOS 0) muestra «Procesando → En cola · Generación completada»; `arun_billing_pr25` muestra «Procesando → Procesando · Generación completada». Un Run en cola no puede haber completado generación; contradice el estado y los 0 intentos. Parece un generador de transiciones sintético que no contempla QUEUED/PROCESSING. |
| F2 | Baja | Tras el 422 el foco queda en `<body>` (el botón pasa a deshabilitado) y el alert no recibe foco; lector de pantalla anuncia por role=alert pero un usuario de teclado pierde posición. Comportamiento previo de `RetrievalComparisonPage` (solo gestiona foco en éxito); no introducido por este WI. Además «Estado de la comparación» sigue diciendo «Elige un símbolo…» con símbolo ya elegido. |
| F3 | Media | Projects `shop-php-demo` y `legacy-php-admin` aparecen «NOT CONNECTED / Sin repositorio vinculado» pero tienen Runs SUCCESS (PR #7 y #3 de `team-sandbox/demo-api`), cuentan «2 PR activos» y «Actividad reciente» con PRs. Un proyecto sin repo no puede tener PRs analizados; el mock se presenta incoherente (honestidad). Además ambos Projects comparten el mismo repo `team-sandbox/demo-api`. «PR activos» cuenta Runs ya SUCCESS. |
| F4 | Baja | Legacy: Historial muestra CON TEST 1 / SIN TEST 3, Inventario muestra CON TEST 2 / SIN TEST 2 (versión `ver_legacy_php_1`). Además un proyecto «sin framework detectado» reporta targets «Con test». |
| F5 | Baja | El lenguaje `PHP` no se muestra en ninguna pantalla; el framework `null` aparece como «—» en Historial sin explicación (solo el Inventario lo dice). |
| F6 | Baja | «Regla propuesta» del 409 repite la pregunta entre comillas como texto de regla, sin reflejar la respuesta «Sí»; y el Run PHP dice «Primer análisis… no había ProjectVersion previo» aunque el Project tiene `ver_shop_php_1`. Cosmético de demo. |
| F7 | Informativa | Run en cola dice «El Run aún se procesa. El trace se actualizará automáticamente», pero en mock el estado nunca cambia; aceptable por el rótulo DEMO. «hace 6 d» para PR en cola/procesando es poco verosímil. |

## filesAffected (a corregir si se actúa)

- `/Users/jean/Tesis/workspaces/tjc-fe-rag-developer-console/app/src/api/mockBackend.ts` (F1 transiciones de QUEUED/PROCESSING, F3 binding/repos PHP, F4 conteos de inventario legacy)
- `/Users/jean/Tesis/workspaces/tjc-fe-rag-developer-console/app/src/retrieval-comparison/RetrievalComparisonPage.tsx` (F2, fuera del alcance de este WI)

## evidence

- JS en página: `getComputedStyle` compuesto, ratios arriba; `document.documentElement.scrollWidth == innerWidth` a 375/768/1024.
- Alert 422: `<p class="inline-error" role="alert">…UNSUPPORTED…</p>`, `document.activeElement === body`.
- 409: `role=alert` + `activeElement.className = panel focus-mode-card`.
- Textos de transiciones y tarjetas copiados de las páginas `/projects/prj_checkout_demo/runs/arun_checkout_pr53`, `/projects/prj_billing_demo/runs/arun_billing_pr25`, `/?workspaceId=2000003`.

## recommendedNextStep

Aprobar el corte para revisión humana. Sugerido (WI de seguimiento o ajuste menor de datos): F1 (generar transiciones coherentes con QUEUED/PROCESSING e intentos) y F3 (vincular los Projects PHP a repos propios o aclarar que son demo sin binding). F2 y F4–F7 pueden registrarse como deuda UX de bajo riesgo.
