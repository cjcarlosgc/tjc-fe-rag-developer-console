import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { isMockDataSource } from '../api/dataSource'
import { useProject } from '../projects/queries'
import { Breadcrumbs } from '../ui/Breadcrumbs'
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
  const projectQuery = useProject(projectId)
  const artifactsQuery = useQuery({ queryKey: ['runs', runId, 'artifacts'], queryFn: () => getArtifacts(runId) })
  if (artifactsQuery.isPending) return <LoadingState label="Cargando artifacts…" />
  if (artifactsQuery.isError) return <ErrorState message={artifactsQuery.error.message} onRetry={() => void artifactsQuery.refetch()} />
  const demo = isMockDataSource()
  return <section><Breadcrumbs items={[{ label: 'Proyectos', to: '/' }, { label: projectQuery.data?.name ?? projectId, to: `/projects/${projectId}` }, { label: `Run ${runId}`, to: `/projects/${projectId}/legacy/runs/${runId}` }, { label: 'Artifacts' }]} /><div className="page-heading"><div><p className="eyebrow">Artifacts / Run {runId}</p><h1>Revisar cambios</h1><p>Archivos creados y modificados por la generación.</p></div>{demo && <span className="demo-stamp">MOCK ARTIFACTS</span>}</div>{demo && <div className="contract-note success-note"><span className="contract-glyph">DEMO</span><div><strong>Contenido simulado y descargable</strong><p>Las descargas de esta pantalla son archivos de demostración; no provienen de Object Storage.</p></div></div>}<ArtifactWorkspace artifacts={artifactsQuery.data} projectId={projectId} onDownload={demo ? (artifact) => download(artifact.relativePath.split('/').at(-1) ?? 'artifact.ts', artifactContent(artifact)) : undefined} onDownloadAll={demo ? () => download(`${runId}-artifacts.zip`, buildArtifactArchive(artifactsQuery.data), 'application/zip') : undefined} /></section>
}
