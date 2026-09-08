# design-system — Plan

## Dependencias

- Constitución y transversales aplicables.

## Diseño técnico

Tokens, typography, spacing, status badges, tables, code/diff blocks, cards, dialogs. Estados no deben depender solo de color.

Base de tokens adoptada (adaptada de una referencia de estilo inspirada en Superhuman; se excluyen componentes de landing/marketing como hero, pricing, footer y banda CTA por no aplicar a una consola técnica).

**Tema: oscuro.** La referencia original definía un tema claro (canvas blanco), pero la consola ya tenía implementado y revisado un tema oscuro (`app/src/styles.css`, HU07 y anteriores). Para no descartar trabajo aprobado, la paleta se migró completa a una variante oscura: se conserva la identidad de marca (índigo/violeta Superhuman) reemplazando el acento verde-menta anterior, y se verificó contraste WCAG AA en cada color de texto contra su fondo real, igualando o superando el contraste de la implementación previa.

### Colores

Nombres de token = variables CSS reales en `app/src/styles.css`.

| Token CSS | Valor | Rol | Origen |
|---|---|---|---|
| `--panel` | `#1b1938` | Fondo de paneles, cards, topbar | doc: `primary` |
| `--border` | `#2c2748` | Borde por defecto | rotado desde el border neutro previo |
| `--muted` | `#bcbac9` | Texto secundario | doc: `on-dark-mute` |
| `--accent` | `#c9b4fa` | Interacción primaria y estado positivo/válido | doc: `surface-violet-soft` |
| `--accent-dark` | `#17083b` | Fondo oscuro para superficies acentuadas (badges, chips) | rotado desde el acento previo |
| `background` (root) | `#0e0c1f` | Fondo de página | doc: `primary-deep` |
| `color` (root) | `#eae7f7` | Texto principal | rotado desde el texto base previo |

El resto de bordes/fondos/textos contextuales de `styles.css` (paneles secundarios, inputs, hover states, glows) se deriva de estos tokens por rotación de matiz hacia la familia índigo/violeta, preservando la luminancia relativa; los pocos casos donde la rotación mecánica bajaba el contraste por debajo del original (p. ej. `line-number`, `stage-rail`, `rag-note`) se ajustaron manualmente para igualar o superar el contraste previo.

**Semántica de estado** (no proviene de la referencia Superhuman; se mantiene sin cambios respecto a la implementación previa):
- Advertencia / demo: familia ámbar (`#e5b968` y variantes contextuales de fondo/borde).
- Error / inválido / eliminado: familia roja (`#f0909b`, `#e5717e`, `#ffb4b4` y variantes contextuales).

`--color-surface-violet-soft` (ya adoptado como `--accent`), `--color-surface-teal-deep` y `--color-surface-teal-mid` (banda CTA de marketing) quedan fuera del alcance actual salvo el primero, que sí se usa.

### Tipografía

Familia aplicada en `app/src/styles.css` (root `font-family`): `'Super Sans VF', Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`; como `Super Sans VF` es propietaria y no está distribuida, el navegador cae a `Inter`/system-ui en la práctica.

| Rol | Tamaño | Interlineado | Tracking | Token |
|---|---|---|---|---|
| heading-lg | 20px | 1.2 | -0.4px | `--text-heading-lg` |
| body-lg | 18px | 1.5 | -0.135px | `--text-body-lg` |
| body-md | 16px | 1.5 | 0 | `--text-body-md` |
| body-strong | 18.72px | 1.5 | 0 | `--text-body-strong` |
| button-md | 16px | 1 | 0 | `--text-button-md` |
| button-cap | 14px | 1 | 0 | `--text-button-cap` |
| caption | 14px | 1.4 | 0 | `--text-caption` |
| micro | 12px | 1.4 | 0 | `--text-micro` |

La escala `display-xxl/xl/lg/md` (64px–22px, pensada para hero editorial) queda fuera del alcance actual: la consola no tiene hero de landing.

### Spacing y forma

| Nombre | Valor | Token |
|---|---|---|
| xxs | 2px | `--spacing-xxs` |
| xs | 4px | `--spacing-xs` |
| sm | 8px | `--spacing-sm` |
| md | 12px | `--spacing-md` |
| lg | 16px | `--spacing-lg` |
| xl | 24px | `--spacing-xl` |
| xxl | 32px | `--spacing-xxl` |

El valor `huge` (64px, usado en padding de banda CTA/footer de marketing) queda fuera del alcance actual.

| Radio | Valor | Token |
|---|---|---|
| xs | 4px | `--radius-xs` |
| sm | 6px | `--radius-sm` |
| md | 8px | `--radius-md` |
| lg | 12px | `--radius-lg` |
| xl | 16px | `--radius-xl` |
| full | 9999px | `--radius-full` |

Densidad: comfortable. Ancho máximo de contenido: 1200px.

### Componentes base adaptados (oscuro)

- **Botón primario (`.button.primary`):** fondo `--accent`, texto oscuro (`#0e0c1f`), radio 8px, min-height 42px, padding `0 16px`.
- **Botón secundario (`.button.secondary`):** fondo panel oscuro, texto principal, borde `--border`.
- **Input de texto (`.field input`):** fondo recesado (más oscuro que `--panel`), texto principal, borde neutro, radio 8px, padding 12px.
- **Card / panel (`.panel`, `.project-card`, `.result-summary`):** fondo `--panel` (o su variante translúcida), borde `--border`, radio 12px, padding 22–28px.
- **Topbar / nav:** fondo de página translúcido con blur, borde inferior `--border`.
- **Badge de estado (`.status-badge`, chips):** texto `--accent` sobre fondo `--accent-dark`.

Tokens, tamaños o componentes fuera de esta lista permanecen PENDING hasta que se necesiten para un componente real de la consola.

## Validación

- Pruebas automatizadas para reglas determinísticas y contratos.
- Casos positivos, negativos y estados terminales relevantes.
- `lint`, `test` y `build` antes de cierre.
