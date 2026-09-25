import { createBrowserRouter } from 'react-router-dom'
import { LoginPage } from './auth/LoginPage'
import { RequireAuth } from './auth/RequireAuth'
import { AppShell } from './ui/AppShell'
import { ProjectDetailPage } from './projects/ProjectDetailPage'
import { ProjectsPage } from './projects/ProjectsPage'
import { InventoryPage } from './inventory/InventoryPage'
import { ExperimentPage } from './experiments/ExperimentPage'
import { AnalysisHistoryPage } from './analysis/AnalysisHistoryPage'
import { ContextExplorerPage } from './context-explorer/ContextExplorerPage'
import { ActionRequiredPage } from './action-required/ActionRequiredPage'
import { FocusModePage } from './action-required/FocusModePage'
import { FunctionalKnowledgeDetailPage } from './action-required/FunctionalKnowledgeDetailPage'
import { FunctionalKnowledgePage } from './action-required/FunctionalKnowledgePage'
import { AnalysisRunDetailPage } from './control-plane/AnalysisRunDetailPage'
import { IntegrationsPage } from './control-plane/IntegrationsPage'
import { RunsPage } from './control-plane/RunsPage'
import { RunComparisonPage } from './run-comparison/RunComparisonPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        path: '/',
        element: <AppShell />,
        children: [
          { index: true, element: <ProjectsPage /> },
          { path: 'action-required', element: <ActionRequiredPage /> },
          { path: 'action-required/:analysisRunId', element: <FocusModePage /> },
          { path: 'analysis-runs', element: <RunsPage /> },
          { path: 'projects/:projectId', element: <ProjectDetailPage /> },
          { path: 'projects/:projectId/runs/:analysisRunId', element: <AnalysisRunDetailPage /> },
          { path: 'projects/:projectId/runs/:analysisRunId/comparison', element: <RunComparisonPage /> },
          { path: 'projects/:projectId/functional-knowledge', element: <FunctionalKnowledgePage /> },
          { path: 'projects/:projectId/functional-knowledge/:knowledgeId', element: <FunctionalKnowledgeDetailPage /> },
          { path: 'projects/:projectId/integrations/github', element: <IntegrationsPage /> },
          { path: 'projects/:projectId/analyses', element: <AnalysisHistoryPage /> },
          { path: 'projects/:projectId/inventory', element: <InventoryPage /> },
          { path: 'projects/:projectId/versions/:projectVersionId/inventory', element: <InventoryPage /> },
          { path: 'projects/:projectId/experimental', element: <ExperimentPage /> },
          { path: 'projects/:projectId/experimental/:experimentId/context', element: <ContextExplorerPage /> },
        ],
      },
    ],
  },
])
