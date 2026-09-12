import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DiffViewer } from './DiffViewer'
import type { ArtifactViewModel } from './types'

interface Props {
  artifacts: ArtifactViewModel[]
  projectId: string
  onDownload?: (artifact: ArtifactViewModel) => void
  onDownloadAll?: () => void
}

export function ArtifactWorkspace({ artifacts, projectId, onDownload, onDownloadAll }: Props) {
  const [selectedId, setSelectedId] = useState(artifacts[0]?.id ?? null)
  const selected = artifacts.find((artifact) => artifact.id === selectedId)
  if (!artifacts.length) return <div className="empty-state"><div className="empty-icon">{'</>'}</div><h2>Sin artefactos</h2><p>Este run no produjo archivos revisables.</p></div>
  return <div className="artifact-workspace"><aside className="artifact-list" aria-label="Artefactos del run"><div className="artifact-list-head"><strong>{artifacts.length} archivos</strong><button className="button secondary" disabled={!onDownloadAll} title={onDownloadAll ? 'Exportación demostrativa' : 'Contrato de descarga PENDING'} onClick={onDownloadAll}>Descargar lote</button></div>{artifacts.map((artifact) => <button className={selectedId === artifact.id ? 'selected' : ''} type="button" onClick={() => setSelectedId(artifact.id)} key={artifact.id}><span className={`file-status type-${artifact.artifactType.toLowerCase()}`}>{artifact.artifactType === 'CREATED' ? 'A' : 'M'}</span><span><strong>{artifact.relativePath.split('/').at(-1)}</strong><small>{artifact.relativePath}</small></span><i className={artifact.valid ? 'valid-dot' : 'invalid-dot'} aria-label={artifact.valid ? 'Válido' : 'Inválido'} /></button>)}</aside><main className="artifact-detail">{selected && <><div className="artifact-actions"><span>{selected.artifactType === 'MODIFIED' ? 'Comparación con archivo original' : 'Vista del archivo generado'}</span><Link className="button secondary button-link" to={`/projects/${projectId}/runs/${selected.runId}/context?artifactId=${encodeURIComponent(selected.id)}`}>Ver contexto</Link><button className="button secondary" disabled={!onDownload} title={onDownload ? 'Exportación demostrativa' : 'Contrato de descarga PENDING'} onClick={() => onDownload?.(selected)}>Descargar archivo</button></div><DiffViewer artifact={selected} /></>}</main></div>
}
