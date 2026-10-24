# Fase 4 — UI/UX y código de Console (ejecutada desde la sesión cross)

Fecha: 2026-10-18. Ejecutada por la sesión cross por orden expresa del usuario (excepción puntual «desde cross»), sin WI ni `ux-reviewer`. Commits en `feature/jean`, sin push. Una parte del trabajo corresponde a `WI-CONSOLE-005` y `WI-CONSOLE-006`, que siguen `W-PLANNED` hasta su revisión.

## Qué cambia

### Diseño
- **Tokens** (`app/src/styles/base.css`, `:root`): texto, advertencia, peligro, familias tipográficas, espaciado, radios, tamaño mínimo de objetivo (40 px), borde fuerte, y `color-scheme: dark` (controles nativos y barras de desplazamiento en tema oscuro). Se sustituyeron 97 reglas con colores y fuentes literales.
- **CSS dividido** en 9 archivos por área (`app/src/styles/`), con el orden de la cascada intacto, formateado con Prettier, y 8 reglas sin uso eliminadas.
- **Primitives:** `StatusBadge`, `EmptyState` y `PageHeader`. Se migraron 24 insignias, 10 estados vacíos y 4 encabezados cuyo marcado coincidía exactamente.

### Accesibilidad
- `--text-dim` pasa de #716f82 (3.4 a 4.2:1, fallaba AA) a #8a8799 (4.8 a 5.8:1). Los bordes de controles usan `--border-strong` (≥3.26:1).
- Foco visible en todos los botones, selects, `summary`, roles `button` y filas-botón.
- Objetivos de 40 px en la navegación, los segmentados, los selectores de target, las píldoras de señal y la barra del grafo.
- Enlace «Saltar al contenido», estado activo (`aria-current`) en la navegación, título de documento por ruta, página 404 dentro del shell y `errorElement` en español.
- Plugin `eslint-plugin-jsx-a11y`.

### Idioma
- Glosario en `spec/transversal/design-system/spec.md`: interfaz en español y términos de dominio en inglés (`Project`, `Run`, `Action Required`, `PR`, `HEAD`, `RAG`, `Sandbox`...). Los estados de `AnalysisRun` están en español; «Proyectos» y «Projects» se unifican en «Projects». La pantalla de GitHub muestra `DEMO · GITHUB SIMULADO`, como pide la spec.

### Datos y código
- `mockBackend` sale del bundle principal (carga diferida): 1092 kB → 987 kB, y un chunk aparte de 108 kB solo en modo demo. `ExperimentPage` ya no importa el backend simulado.
- Sondeo centralizado (`api/polling.ts`): respeta y acota `pollAfterMs` y concentra el atajo de pruebas, que estaba repartido en 9 ramas `MODE === 'test'`.
- `VITE_CORE_API_URL` se valida (`api/baseUrl.ts`) y las variables de autenticación están tipadas.
- Prettier configurado y aplicado a todo `app/src` (139 archivos, solo formato): desaparece la línea de 5137 caracteres de `ExperimentPage`.
- `ConstellationIcon` pasa a su propio módulo.

## No se hizo
- **Primitives `Button`, `Field`, `SegmentedControl` y `ProgressBar`**, y la migración de los 11 encabezados y 4 estados vacíos de marcado propio.
- **Partir las páginas grandes** (`IntegrationsPage`, `ProjectsPage`, `AnalysisRunDetailPage`, `RetrievalComparisonPage`).
- **Tiempo real por WebSocket:** `api/socket.ts` tiene infraestructura y 12 tests, pero ninguna pantalla se suscribe. Decidir si se conecta o se retira es del usuario.
- **Un solo lockfile:** Console conserva `package-lock.json` y `pnpm-lock.yaml`; su spec dice npm. Se mantienen sincronizados porque no se sabe con cuál despliega.
- **Revisión del `ux-reviewer`** y una auditoría de contraste con herramientas de navegador (se comprobó a mano el contraste de los tokens y se revisaron en el navegador login, Projects, Runs, la 404 y el enlace de salto).

## Verificación local
lint, `tsc -b`, build, `prettier --check` y 840 tests pasan (antes 806 y 1 fallaba).
