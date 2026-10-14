# WI-CONSOLE-035 — implementación del corte (ST-CONSOLE-036)

Modelo: implementer · configurado claude-haiku-5-5 · atendido unknown · esfuerzo low

**Fecha:** 2026-10-13
**Work item:** WI-CONSOLE-035 (W-IN_PROGRESS, alcance aprobado por el usuario).
**Subtarea:** ST-CONSOLE-036.

## Archivos tocados

Producto (todo bajo `app/`):

- `app/src/action-required/RuleTargetSummary.tsx` (nuevo): componentes compartidos `RuleTargetSummary` (dl con Símbolo, Archivo, Tipo, Escenario; valores crudos; null o vacío muestra «sin dato») y `RuleRegistrationNote` (frase fija con el qualifiedName).
- `app/src/action-required/FocusModePage.tsx`: bloque `role="group"` con `aria-label="Destino de la regla"` y encabezado `h3` dentro de `.focus-mode-card`, entre el visualAid/rationale y el `role="status"`; frase fija justo encima de los botones, solo cuando `canAnswer`.
- `app/src/action-required/ActionRequiredPage.tsx`: cada tarjeta muestra `RuleTargetSummary` tras la pregunta. Se quitó el `span.target-ref` de la cabecera porque el símbolo pasa a la dl (evita duplicarlo). El enlace a Focus Mode no cambia.
- `app/src/styles.css`: bloque nuevo `WI-CONSOLE-035` (tokens existentes `--surface-2`, `--muted`, `--accent`, `#eae7f7`; `overflow-wrap: anywhere` para `filePath`).

Pruebas:

- `app/src/action-required/FocusModePage.test.tsx`: import `within` y tipo `FunctionalQuestionSetResponse`; 4 pruebas nuevas (destino en grupo con nombre dentro de la tarjeta; frase fija antes de los botones con «No lo sé» aclarado y botones habilitados; Writer sin frase; campo nulo en live con cast explícito `as unknown as FunctionalQuestionSetResponse` → «sin dato» ×3).
- `app/src/action-required/ActionRequiredPage.test.tsx`: import `within`; 1 prueba nueva (archivo, tipo, escenario y enlace dentro de la tarjeta de CouponPolicy.apply).

No se tocaron: `app/src/api/mockBackend.ts` (las 7 preguntas ya tienen `filePath` y campos no nulos), tipos, cliente HTTP, Core, contratos, `spec/`, `harness/state.json`, `harness/work-items.json`, `tasks.md`. Sin commit.

## Ciclo ROJO → VERDE

Comando (desde `app/`): `node node_modules/vitest/vitest.mjs run --maxWorkers=2 src/action-required/FocusModePage.test.tsx src/action-required/ActionRequiredPage.test.tsx`

**ROJO (antes de implementar), exit 1:** `Tests 4 failed | 27 passed (31)`.

- AR: «cada tarjeta … muestra archivo, tipo y escenario» → no encuentra `CouponPolicy.apply` con selector `dd`.
- FM: «muestra el destino de la regla …» → `Unable to find role="group" and name "Destino de la regla"`.
- FM: «la frase fija …» → `Unable to find … /Tu respuesta se registrará como regla para/`.
- FM: «un campo nulo … «sin dato»» → mismo error de grupo «Destino de la regla».

Nota: la prueba «sin capacidad de respuesta no se muestra la frase» pasó ya en rojo porque es una guarda que hoy se cumple por construcción; no es un fallo de la nueva función, y se mantiene como protección de regresión.

Las pruebas existentes (`findByRole('status')` único, ausencia de `group «Respuesta»` para Writer/Reader, conteos de `.pr-ref`/`.repo-name`, enlaces `href`) pasaron en rojo y siguen pasando en verde.

**VERDE (tras implementar), exit 0:** `Test Files 2 passed (2)`, `Tests 31 passed (31)`.

## Gates (desde `app/`)

| Comando | Resultado |
|---|---|
| `npm run lint` (`eslint .`) | exit 0, sin salida de errores |
| `node node_modules/typescript/bin/tsc -b --noEmit` | exit 0 |
| `node node_modules/vitest/vitest.mjs run --maxWorkers=2` (suite completa) | exit 0; `Test Files 70 passed (70)`, `Tests 777 passed (777)` |
| `npm run build` (`tsc -b && vite build`) | exit 0; aviso no bloqueante de tamaño de chunk (>500 kB), ya existente en el proyecto |

No se arrancó servidor de desarrollo ni se usó el puerto 5174, así que no hay nada que detener. No se usó Core de Render.

## Decisiones de implementación

- Valores crudos del contrato para `kind` y `scenarioKind`, sin mapa de etiquetas en español (decisión de UX pendiente de confirmar; el reporte SDD la dejó como precisión abierta).
- La frase fija solo se muestra con `canAnswer`, y dice explícitamente que «No lo sé» solo registra una abstención (DEC-FK-002). No se deshabilita ningún botón.
- El bloque de destino es visible también para Writer/Reader (es información, no respuesta); la nota de rol y el grupo «Respuesta» no cambian.
- Sin heurísticas de texto, sin lógica de dominio, sin campos nuevos del contrato.

## Qué no hice

- No verifiqué visualmente a 375/768/1024 px ni el contraste con herramientas; el CSS usa tokens existentes y `overflow-wrap: anywhere`, pero la verificación queda para `ux-reviewer` (obligatoria para este WI según su alcance).
- No ejecuté revisión independiente ni pedí veredicto del usuario; eso corresponde al Human Reviewer.
- No añadí la pregunta nula al mock de demo (se cubrió con prueba live con fetch simulado, según la opción recomendada del SDD).
- No toqué `CS-CORE-20261013-001/-002/-003` (no acusados ni resueltos aquí).
- No hice commit, push, PR ni cambios en `spec/`, `harness/state.json` o `harness/work-items.json`.
- Creé `/tmp/unused` por un comando redirigido por error (archivo vacío, fuera del repo); se puede borrar.

## ¿Corte completo?

El corte de producto (código, pruebas, estilos y gates locales) está completo y verde. El WI-CONSOLE-035 **no** está terminado: faltan la revisión `ux-reviewer` (contraste, teclado, 375/768/1024 px, orden de lectura), el veredicto del Human Reviewer y, antes de cerrar, el registro en `state.json`/`work-items.json` que corresponde al leader.
