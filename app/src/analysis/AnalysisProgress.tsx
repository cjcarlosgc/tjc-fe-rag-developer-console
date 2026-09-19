import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { projectKeys } from '../projects/queries'
import { getAnalysisResult } from './api'
import { analysisErrorMessage } from './errors'
import { useAnalysisOperation } from './useAnalysisOperation'
import { ConstellationIcon, Spinner } from '../ui/Loaders'

interface Props { projectVersionId: string; initialPollAfterMs: number }

const stageLabels: Record<string, string> = { PENDING: 'En espera', EXTRACTING: 'Extrayendo snapshot', ANALYZING: 'Analizando estructura', CHUNKING: 'Segmentando código', EMBEDDING: 'Generando embeddings', PERSISTING: 'Persistiendo índice', COMPLETED: 'Análisis completo', FAILED: 'Análisis fallido' }
const stageOrder = ['PENDING', 'EXTRACTING', 'ANALYZING', 'CHUNKING', 'EMBEDDING', 'PERSISTING', 'COMPLETED']

export function AnalysisProgress({ projectVersionId, initialPollAfterMs }: Props) {
  const queryClient = useQueryClient()
  const operationQuery = useAnalysisOperation(projectVersionId, initialPollAfterMs)
  const operation = operationQuery.data
  const resultQuery = useQuery({
    queryKey: ['project-versions', projectVersionId, 'results'],
    queryFn: ({ signal }) => getAnalysisResult(projectVersionId, signal),
    enabled: operation?.status === 'COMPLETED',
  })

  useEffect(() => {
    if (resultQuery.data) {
      void queryClient.invalidateQueries({ queryKey: projectKeys.detail(resultQuery.data.projectId) })
    }
  }, [queryClient, resultQuery.data])

  if (operationQuery.isError) return <div className="structured-error" role="alert"><strong>Se perdió el seguimiento del análisis</strong><p>{analysisErrorMessage(operationQuery.error)}</p><button className="button secondary" onClick={() => void operationQuery.refetch()}>Reconectar</button></div>
  if (!operation) return <div className="analysis-progress" role="status"><div className="progress-header"><ConstellationIcon /> Conectando con ProjectVersion…</div></div>
  if (operation.status === 'FAILED') return <div className="structured-error" role="alert"><strong>INDEXING_FAILED</strong><p>{operation.failureReason ?? 'RAG Core no pudo completar el análisis de esta versión.'}</p></div>
  const currentIndex = stageOrder.indexOf(operation.status)
  return <div className="operation-stack"><div className="analysis-progress" aria-live="polite"><div className="progress-header">{operation.status !== 'COMPLETED' && <ConstellationIcon />}<div><span className="live-indicator" /><strong>{stageLabels[operation.status]}</strong><p>ProjectVersion <code>{projectVersionId}</code></p></div><span className="progress-value">{operation.status === 'COMPLETED' ? 'READY' : 'LIVE'}</span></div><ol className="stage-rail" aria-label="Etapas de indexación">{stageOrder.map((stage, index) => <li className={index < currentIndex ? 'done' : index === currentIndex ? 'active' : ''} key={stage}><span />{stageLabels[stage]}</li>)}</ol></div>{operation.status === 'COMPLETED' && resultQuery.isPending && <div className="feedback" role="status"><Spinner />Cargando resumen del análisis…</div>}{operation.status === 'COMPLETED' && resultQuery.isError && <div className="structured-error" role="alert"><strong>No se pudo cargar el resumen</strong><p>{analysisErrorMessage(resultQuery.error)}</p><button className="button secondary" onClick={() => void resultQuery.refetch()}>Reintentar</button></div>}{resultQuery.data && <div className="result-summary"><div className="result-title"><h3>Resumen de ProjectVersion</h3><span className="status-badge">{resultQuery.data.status}</span></div><dl className="metric-grid"><div><dt>Framework</dt><dd>{resultQuery.data.detectedFramework ?? 'No detectado'}</dd></div><div><dt>Archivos</dt><dd>{resultQuery.data.filesProcessed}</dd></div><div><dt>Chunks</dt><dd>{resultQuery.data.chunksCount}</dd></div><div><dt>Targets</dt><dd>{resultQuery.data.targetsTotal}</dd></div><div><dt>Con test</dt><dd>{resultQuery.data.targetsWithTest}</dd></div><div><dt>Sin test</dt><dd>{resultQuery.data.targetsMissingTest}</dd></div></dl>{resultQuery.data.completedAt && <p className="completion-time">Completado: {new Date(resultQuery.data.completedAt).toLocaleString('es-PE')}</p>}</div>}</div>
}
