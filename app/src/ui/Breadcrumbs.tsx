import { Link, useLocation } from 'react-router-dom'

export interface Crumb {
  label: string
  to?: string
}

/** HU26: jerarquía de navegación consistente (Proyecto > Versión > Run > …) en toda la consola. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const location = useLocation()
  const workspaceId = new URLSearchParams(location.search).get('workspaceId')

  function destination(to: string) {
    if (!workspaceId || !to.startsWith('/')) return to
    const [pathAndSearch, hash = ''] = to.split('#', 2)
    const separator = pathAndSearch.indexOf('?')
    const pathname = separator < 0 ? pathAndSearch : pathAndSearch.slice(0, separator)
    const search = new URLSearchParams(separator < 0 ? '' : pathAndSearch.slice(separator + 1))
    if (!search.has('workspaceId')) search.set('workspaceId', workspaceId)
    return `${pathname}?${search.toString()}${hash ? `#${hash}` : ''}`
  }

  return (
    <nav className="breadcrumbs" aria-label="Ruta de navegación">
      <ol>
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={`${item.label}-${index}`}>
              {item.to && !isLast ? <Link to={destination(item.to)}>{item.label}</Link> : <span aria-current={isLast ? 'page' : undefined}>{item.label}</span>}
              {!isLast && <span className="breadcrumbs-sep" aria-hidden="true">/</span>}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
