import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { isMockDataSource } from '../api/dataSource'
import { ErrorState, LoadingState } from '../ui/Feedback'
import { getArtifacts } from './api'
import { ArtifactWorkspace } from './ArtifactWorkspace'
import { artifactContent, buildArtifactArchive } from './archive'

function download(name: string, content: BlobPart | Blob, type = 'text/plain;charset=utf-8'): void {
  const url = URL.createObjectURL(content instanceof Blob ? content : new Blob([content], { type }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

export function ArtifactsPage() {
  const { projectId = '', runId = '' } = useParams()
  const artifactsQuery = useQuery({ queryKey: ['runs', runId, 'artifacts'], queryFn: () => getArtifacts(runId) })
  if (artifactsQuery.isPending) return <LoadingState label="Cargando artifacts…" />
  if (artifactsQuery.isError) return <ErrorState message={artifactsQuery.error.message} onRetry={() => void artifactsQuery.refetch()} />
  const demo = isMockDataSource()
  return <section><Link className="back-link" to={`/projects/${projectId}/runs/${runId}`}>← Volver al run</Link><div className="page-heading"><div><p className="eyebrow">Artifacts / Run {runId}</p><h1>Revisar cambios</h1><p>Archivos creados y modificados por la generación.</p></div>{demo && <span className="demo-stamp">MOCK ARTIFACTS</span>}</div>{demo && <div className="contract-note success-note"><span className="contract-glyph">DEMO</span><div><strong>Contenido simulado y descargable</strong><p>Las descargas de esta pantalla son archivos de demostración; no provienen de Object Storage.</p></div></div>}<ArtifactWorkspace artifacts={artifactsQuery.data} onDownload={demo ? (artifact) => download(artifact.relativePath.split('/').at(-1) ?? 'artifact.ts', artifactContent(artifact)) : undefined} onDownloadAll={demo ? () => download(`${runId}-artifacts.zip`, buildArtifactArchive(artifactsQuery.data), 'application/zip') : undefined} /></section>
}
