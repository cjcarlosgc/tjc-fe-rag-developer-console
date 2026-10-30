# WI-CONSOLE-053 (HU18) — revisión independiente

Modelo: reviewer · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Veredicto: APPROVED** (con 1 hallazgo menor no bloqueante).

## Hallazgos

| Sev. | Hallazgo |
|---|---|
| Menor | La invalidación de la lista tras armar con éxito (`useArmExperimentCapture.onSuccess`) no está cubierta: la mutación M6 (sustituirla por `void 0`) deja las 134 pruebas en verde, porque `setQueryData` ya refleja el estado. El criterio dice «la lista se invalida tras armar/desarmar». La invalidación tras 409/404 sí está cubierta (M3 en rojo). No bloquea. |
| Info | `Armada`/`Sin captura armada` y el aviso dependen de `items[0]`; es una decisión documentada (la más reciente manda) y coherente con el criterio. |

Sin hallazgos críticos ni mayores.

## Revisión de correctitud

- Gating: `canManage = hasRole(role,'MAINTAINER')`; Reader y Writer no ven «Armar captura»; el aviso (con «Desarmar» solo para Maintainer+) lo ven todos los roles con captura ARMED.
- Aviso solo cuando `items[0].status === 'ARMED'`; RESERVED/DISARMED/vacío no lo muestran.
- 404 de Core sin soporte (`404` y código distinto de `PROJECT_NOT_FOUND`) solo reemplaza esa sección; la consulta es propia, no bloquea el Project; 4xx sin reintento.
- Badge solo con `experimentCapture` truthy (lista y detalle); el campo es opcional en el tipo y tolera ausencia.
- Mock: estado propio por Project (`experimentCaptures`), rotulado `DEMO · DATOS SIMULADOS`; 409 al armar dos veces, 404 al desarmar sin captura; todos los seeds llevan `experimentCapture: null` salvo `arun_checkout_pr47`; los 1019 tests (conteos existentes) siguen en verde.
- Sin cambios en `run-comparison/speculative` (HU49), ni en realtime/polling, `generated/` o primitives (git status/diff lo confirma; el CSS nuevo usa tokens existentes).
- Pruebas: no usan reloj falso ni real para aserciones (solo formato de fecha del mock); no vacuosas (ver mutaciones).

## Gates reproducidos (Node 22)

| Gate | Resultado |
|---|---|
| `pnpm lint` | exit 0 |
| `pnpm exec tsc -b --noEmit` | exit 0 |
| `pnpm test --maxWorkers=4` | 97 archivos, 1019 pruebas en verde |
| `pnpm build` | exit 0 |
| `pnpm format:check` | exit 0 |
| `pnpm contracts:check` | exit 0 |
| `node scripts/sdd-check.mjs` | SDD check OK |
| `node harness/validate-work-items.mjs` | passed (53 WI) |
| `node harness/validate-harness.mjs` | passed |

## Mutaciones (restauradas; verificadas con cmp contra copias previas)

Suites ejecutadas: projects, RunsPage, AnalysisRunDetailPage, roleGating (134 pruebas).

| # | Mutación | Resultado |
|---|---|---|
| M1 | gating `MAINTAINER` → `WRITER` | ROJO (2 fallos) |
| M2 | aviso/armada con cualquier captura, no solo ARMED | ROJO (3 fallos) |
| M3 | sin invalidación tras 409/404 | ROJO (1 fallo) |
| M4 | badge de la lista siempre visible | ROJO (2 fallos) |
| M5 | 404 sin soporte deja de detectarse | ROJO (3 fallos) |
| M6 | sin invalidación tras armar con éxito | VERDE (sobrevive; hallazgo menor) |

Nota: un `echo` mío creó por error un archivo vacío `app/WRITER`; lo eliminé. El árbol queda con solo los cambios del implementer.
