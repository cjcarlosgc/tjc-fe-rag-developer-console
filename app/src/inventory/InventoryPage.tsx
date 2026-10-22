import { useParams } from 'react-router-dom'
import { useProject } from '../projects/queries'
import { Breadcrumbs } from '../ui/Breadcrumbs'
import { ErrorState, LoadingState } from '../ui/Feedback'
import { toInventoryTargets } from './api'
import { InventoryView } from './InventoryView'
import { useTestInventory } from './queries'
import { StatusBadge } from '../ui/StatusBadge'
import { EmptyState } from '../ui/EmptyState'

export function InventoryPage() {
  const { projectId = '', projectVersionId: requestedVersionId } = useParams()
  const projectQuery = useProject(projectId)
  const projectVersionId = requestedVersionId ?? projectQuery.data?.currentVersionId ?? null
  const inventoryQuery = useTestInventory(projectVersionId)

  if (projectQuery.isPending) return <LoadingState label="Cargando Project…" />
  if (projectQuery.isError) return <ErrorState message={projectQuery.error.message} onRetry={() => void projectQuery.refetch()} />

  const historical = Boolean(requestedVersionId && requestedVersionId !== projectQuery.data.currentVersionId)
  const project = projectQuery.data
  return (
    <section>
      <Breadcrumbs
        items={
          requestedVersionId
            ? [
                { label: 'Projects', to: '/' },
                { label: project.name, to: `/projects/${projectId}` },
                { label: 'Historial de análisis', to: `/projects/${projectId}/analyses` },
                { label: 'Inventario' },
              ]
            : [{ label: 'Projects', to: '/' }, { label: project.name, to: `/projects/${projectId}` }, { label: 'Inventario' }]
        }
      />
      <div className="page-heading">
        <div>
          <p className="eyebrow">Cobertura existente · {projectVersionId ?? 'sin versión'}</p>
          <h1>Inventario testable</h1>
          <p>Objetivos detectados por RAG Core, organizados por estado de cobertura.</p>
        </div>
        {historical && <span className="demo-stamp">INSTANTÁNEA HISTÓRICA</span>}
      </div>
      {historical && (
        <div className="contract-note history-readonly">
          <span className="contract-glyph">READ</span>
          <div>
            <strong>Inventario de solo lectura</strong>
            <p>Esta ProjectVersion permanece disponible como evidencia; el inventario es de consulta.</p>
          </div>
        </div>
      )}
      {!projectVersionId ? (
        <EmptyState
          title="Este Project todavía no tiene una instantánea disponible"
          description="El historial comienza cuando un PR vinculado produce un análisis."
        />
      ) : inventoryQuery.isPending ? (
        <LoadingState label="Cargando inventario…" />
      ) : inventoryQuery.isError ? (
        <ErrorState message={inventoryQuery.error.message} onRetry={() => void inventoryQuery.refetch()} />
      ) : (
        <>
          <div className="result-summary">
            <div className="result-title">
              <h3>Resumen de cobertura</h3>
              <StatusBadge>{inventoryQuery.data.detectedFramework ?? 'FRAMEWORK NO DETECTADO'}</StatusBadge>
            </div>
            <dl className="metric-grid">
              <div>
                <dt>Objetivos</dt>
                <dd>{inventoryQuery.data.targetsTotal}</dd>
              </div>
              <div>
                <dt>Con pruebas</dt>
                <dd>{inventoryQuery.data.targetsWithTest}</dd>
              </div>
              <div>
                <dt>Sin pruebas</dt>
                <dd>{inventoryQuery.data.targetsMissingTest}</dd>
              </div>
            </dl>
          </div>
          <div className="panel inventory-panel">
            <InventoryView targets={toInventoryTargets(inventoryQuery.data)} />
          </div>
        </>
      )}
    </section>
  )
}
