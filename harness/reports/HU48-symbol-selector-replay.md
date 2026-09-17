# HU48 — Selector de símbolo y Replay sobre el mismo AnalysisRun

**Estado:** DONE
**Repository:** `tjc-fe-rag-developer-console`

## Contexto

Tras cerrar HU30, se preguntó al usuario con qué seguir; eligió completar los
dos ítems que quedaban pendientes de HU48 en `spec/features/014-analysisrun-experiments/tasks.md`,
ambos dentro del alcance ya aprobado de la historia (sin bloqueo de contrato,
mock-first): el selector de símbolo cuando el `AnalysisRun` tiene más de uno
elegible, y "Replay"/"New comparison" para repetir la comparación sobre el
mismo Run sin perder trials anteriores.

## Cambios

- **`run-comparison/types.ts`**: `findEligibleSymbols(symbols)` devuelve
  todos los símbolos `DIRECTLY_CHANGED` `METHOD`/`FUNCTION` de un Run (antes
  solo existía `findEligibleSymbol`, que ahora es un wrapper —
  `findEligibleSymbols(...)[0] ?? null` — usado donde solo importa si existe
  alguno, p. ej. el CTA "Run comparison →" de `AnalysisRunDetailPage`).
  Nuevo tipo `RunComparisonListPage` (`Page<RunComparisonOperation>`,
  espejo de §6.5 `GET /analysis-runs/{id}/experiments`).
- **`api/mockBackend.ts`**: `mockListRunComparisons(analysisRunId)` — lectura
  pura (no avanza el contador de polls de cada comparación, a diferencia de
  `mockGetRunComparison`) que filtra `runComparisons` por Run.
- **`run-comparison/api.ts`**: `listRunComparisons`, mismo patrón mock/
  `PendingContractError` que el resto.
- **`RunComparisonPage.tsx`** (reescritura): con un único símbolo elegible,
  arranca sola al entrar (comportamiento previo intacto, mismos tests en
  verde sin cambios). Con más de uno, muestra `<select id="comparison-symbol">`
  y no arranca hasta que el usuario elige y confirma. El botón cambia de
  "Iniciar comparación" a "Repetir comparación (Replay)" en cuanto existe al
  menos un trial. Cada trial se renderiza en su propia `TrialCard`, que
  sondea su progreso vía `getRunComparison` de forma independiente —
  arrancar un segundo trial no interfiere con el primero.

## Decisión de diseño: `placeholderData` en vez de `initialData`

Al construir `TrialCard`, usar `initialData: operation` (la snapshot que ya
trae `listRunComparisons`) hacía que React Query tratara esa data como ya
"fresca" — el patrón correcto para mostrar la snapshot conocida mientras la
query real hace su trabajo normal (fetch inicial + `refetchInterval`) es
`placeholderData`, no `initialData`. Se corrigió durante la verificación
manual en navegador.

## Verificación

`tsc -b --noEmit`/lint/build limpios. 302 pruebas en verde (+4): 5 en
`RunComparisonPage.test.tsx` (nuevas: selector con múltiples símbolos sin
auto-arranque, elegir símbolo + iniciar + Replay con dos trials visibles) y
2 en `run-comparison/api.test.ts` (`listRunComparisons` no interfiere con el
polling individual, `PendingContractError` en live).

Recorrido manual en navegador (extensión Claude in Chrome conectada esta
sesión): selector con los 3 símbolos elegibles de `arun_checkout_pr49`
(`OrderService.calculateTotal`, `OrderService.createOrder`,
`formatCurrency`), sin auto-arranque; elegir `OrderService.createOrder` +
"Iniciar comparación" crea el primer trial; "Repetir comparación (Replay)"
crea un segundo trial visible sin reemplazar el primero. El avance de
progreso (`PENDING`→`RUNNING`→`COMPLETED`) no pudo confirmarse visualmente
más allá del primer poll: la pestaña controlada por la extensión reporta
`document.visibilityState: "hidden"`, y `refetchInterval` de React Query no
refresca en segundo plano por defecto (`refetchIntervalInBackground: false`,
comportamiento de librería, no de esta implementación) — verificado con
`console.log` temporal que confirmó cero refetches adicionales pese a
esperar varios segundos. La progresión completa (incluida la finalización
con resultado) sí está cubierta y pasa en la suite de tests, que corre en
jsdom sin esa restricción de visibilidad.

## Fuera de alcance

- Adapter live del listado de comparaciones — sigue `PendingContractError`.
- Selector de "trial" explícito para repetir un símbolo distinto al ya
  elegido en la sesión de la página (el selector permite cambiar de símbolo
  entre trials, cubierto).
- Cancelar un trial en curso — no forma parte del alcance de HU48.
