# WI-CONSOLE-041 — verificación retroactiva

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**RETROACTIVIDAD DECLARADA.** Este WI se abre y cierra después de ejecutado el trabajo. `implementationAgent: cross` (sesión coordinadora cross, por orden expresa y excepción puntual del usuario, sin WI ni revisión en su momento). Commits regularizados: `a464b61` (ApiError.retryable, ErrorEnvelope tipado desde esquema, generador de tipos, validador Ajv, esquemas espejados) y `99e1ecc` (engines/.nvmrc, CI, `.env.test`). Reportes de origen: `cross-fase2-esquemas-contratos-2026-10-18.md` y `cross-fase3-estabilidad-2026-10-18.md`. El revisor (`reviewer`) es independiente de cross.

## Evidencia reproducida por el leader (Node 22, pnpm 12.14.0, HEAD tras WI-CONSOLE-040)

| Comprobación | Resultado |
|---|---|
| `pnpm contracts:check` (tipos generados == esquemas de `spec/contracts/schemas`, árbol c45e4513…) | OK, sin diferencias |
| `pnpm exec vitest run errorEnvelope.contract.test.ts RunsPage.test.tsx client.test.ts` | 3 archivos, 23/23 |
| `RunsPage.test.tsx` con un `app/.env` temporal hostil (`VITE_DATA_SOURCE=mock`, `VITE_AUTH_MODE=mock`, `VITE_CORE_API_URL=http://localhost:9999/wrong`, borrado después) | 7/7: el test ya no depende del `.env` local (`.env.test` fija las variables) |
| `pnpm lint` / `pnpm exec tsc -b --noEmit` / `pnpm format:check` / `pnpm build` | 0 / 0 / 0 / 0 |
| `pnpm test` completo | 79 archivos, 840/840 |
| `.github/workflows/ci.yml` | validadores SDD/Harness + `pnpm contracts:check`, lint, format, build, test con `pnpm install --frozen-lockfile`. **No se ha ejecutado en GitHub** (solo local), según cross-fase3 |

## Hallazgos de la regularización

1. **Espejo preliminar de INTEROP-2.17 (a464b61):** difería de Core en dos líneas editoriales (§2/§5 y §10). Corregido en WI-CONSOLE-039 (digest `b9ed40dc…`). Sin efecto de código.
2. **Gestor de paquetes dual (99e1ecc):** mantenía `package-lock.json` y `pnpm-lock.yaml` en paralelo. Resuelto en WI-CONSOLE-040 (pnpm único).
3. **Trazabilidad de commits:** `Refs: transversal ... (sin HU)` no cumple la regla `Refs: HU...`; se regulariza con HU01, HU12, HU14 en el WI. Los commits no se reescriben.
4. **Alcance acotado de a464b61:** solo el error envelope se tipa desde esquema; ~130 tipos de respuesta de Core siguen a mano (declarado en cross-fase2). `ApiError.retryable` es aditivo y opcional; `body` se lee como `Partial<ErrorEnvelope>`, tolera campos desconocidos.
5. **Pendientes ajenos a Console** (cross-fase2/3): CORS de Core (`CONSOLE_CORS_ORIGINS`), `phase` opcional en Sandbox (decisión pendiente del usuario), refactors de Core. No se tocan.
