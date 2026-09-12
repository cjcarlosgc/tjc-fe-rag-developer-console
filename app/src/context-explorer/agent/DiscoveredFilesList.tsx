import { useMemo } from 'react'
import { ErrorState, LoadingState } from '../../ui/Feedback'
import { useDiscoveredFiles } from '../queries'

interface Props {
  traceId: string
  step: number
  onClose: () => void
}

/** HU28: "Mostrar descubiertos" — list_files no dibuja las 146 rutas de una; se consultan paginadas. */
export function DiscoveredFilesList({ traceId, step, onClose }: Props) {
  const query = useDiscoveredFiles(traceId, step)
  const files = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data])

  return <div className="discovered-files" aria-label="Archivos descubiertos">
    <div className="discovered-files-head">
      <strong>Archivos descubiertos</strong>
      <button type="button" className="button secondary" onClick={onClose}>Cerrar</button>
    </div>
    {query.isPending && <LoadingState label="Cargando archivos descubiertos…" />}
    {query.isError && <ErrorState message={query.error.message} onRetry={() => void query.refetch()} />}
    {query.data && <>
      <ul className="discovered-files-list">{files.map((file) => <li key={file.filePath}><code>{file.filePath}</code></li>)}</ul>
      {query.hasNextPage && <div className="run-actions"><button className="button secondary" type="button" disabled={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>{query.isFetchingNextPage ? 'Cargando…' : 'Cargar más'}</button></div>}
    </>}
  </div>
}
