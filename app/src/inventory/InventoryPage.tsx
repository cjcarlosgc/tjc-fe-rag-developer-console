import { Link, useNavigate, useParams } from 'react-router-dom'
import { useProject } from '../projects/queries'
import { ErrorState, LoadingState } from '../ui/Feedback'
import { toInventoryTargets } from './api'
import { InventoryView } from './InventoryView'
import { useTestInventory } from './queries'

export function InventoryPage() {
  const { projectId = '', projectVersionId: requestedVersionId } = useParams()
  const navigate = useNavigate()
  const projectQuery = useProject(projectId)
  const projectVersionId = requestedVersionId ?? projectQuery.data?.currentVersionId ?? null
  const inventoryQuery = useTestInventory(projectVersionId)

  if (projectQuery.isPending) return <LoadingState label="Cargando proyecto…" />
  if (projectQuery.isError) return <ErrorState message={projectQuery.error.message} onRetry={() => void projectQuery.refetch()} />

  const historical = Boolean(requestedVersionId && requestedVersionId !== projectQuery.data.currentVersionId)
  return <section><Link className="back-link" to={requestedVersionId ? `/projects/${projectId}/analyses` : `/projects/${projectId}`}>← {requestedVersionId ? 'Volver al historial' : 'Volver al proyecto'}</Link><div className="page-heading"><div><p className="eyebrow">Cobertura existente · {projectVersionId ?? 'sin versión'}</p><h1>Inventario testable</h1><p>Targets detectados por RAG Core, organizados por estado de cobertura.</p></div>{historical && <span className="demo-stamp">SNAPSHOT HISTÓRICO</span>}</div>{historical && <div className="contract-note history-readonly"><span className="contract-glyph">READ</span><div><strong>Inventario de sólo lectura</strong><p>Esta ProjectVersion permanece disponible para análisis; nuevas generaciones usan la versión actual.</p></div></div>}{!projectVersionId ? <div className="empty-inline"><strong>Este proyecto todavía no tiene una versión lista</strong><p>Carga e indexa un ZIP antes de consultar el inventario.</p></div> : inventoryQuery.isPending ? <LoadingState label="Cargando inventario…" /> : inventoryQuery.isError ? <ErrorState message={inventoryQuery.error.message} onRetry={() => void inventoryQuery.refetch()} /> : <><div className="result-summary"><div className="result-title"><h3>Resumen de cobertura</h3><span className="status-badge">{inventoryQuery.data.detectedFramework ?? 'FRAMEWORK NO DETECTADO'}</span></div><dl className="metric-grid"><div><dt>Targets</dt><dd>{inventoryQuery.data.targetsTotal}</dd></div><div><dt>Con test</dt><dd>{inventoryQuery.data.targetsWithTest}</dd></div><div><dt>Sin test</dt><dd>{inventoryQuery.data.targetsMissingTest}</dd></div></dl></div><div className="panel inventory-panel"><InventoryView targets={toInventoryTargets(inventoryQuery.data)} onSelect={historical ? undefined : (target) => navigate(`/projects/${projectId}/generate?targetId=${encodeURIComponent(target.id)}`)} /></div></>}</section>
}
