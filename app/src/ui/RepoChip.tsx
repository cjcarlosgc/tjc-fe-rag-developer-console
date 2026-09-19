/**
 * Muestra un `owner/repo` de GitHub como una chip con borde, distinta de cómo se
 * muestran las ramas (`<code>` + flecha) en el resto de la app — con el mismo
 * formato "palabra/palabra" ambas podían confundirse a simple vista.
 */
export function RepoChip({ repositoryName }: { repositoryName: string }) {
  const [org, ...rest] = repositoryName.split('/')
  const repo = rest.join('/')
  return (
    <span className="repo-chip">
      <span className="repo-org">{org}</span>
      {repo && <span className="repo-sep">/</span>}
      {repo && <span className="repo-name">{repo}</span>}
    </span>
  )
}
