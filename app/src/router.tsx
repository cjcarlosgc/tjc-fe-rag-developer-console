import { createBrowserRouter } from 'react-router-dom'
import { LoginPage } from './auth/LoginPage'
import { RequestAccessPage } from './auth/RequestAccessPage'
import { RequestPasswordResetPage } from './auth/RequestPasswordResetPage'
import { RequireAuth } from './auth/RequireAuth'
import { AppShell } from './ui/AppShell'
import { ProjectDetailPage } from './projects/ProjectDetailPage'
import { ProjectsPage } from './projects/ProjectsPage'
import { InventoryPage } from './inventory/InventoryPage'
import { GenerationPage } from './generation/GenerationPage'
import { RunPage } from './runs/RunPage'
import { RunHistoryPage } from './runs/RunHistoryPage'
import { ArtifactsPage } from './artifacts/ArtifactsPage'
import { ExperimentPage } from './experiments/ExperimentPage'
import { AnalysisHistoryPage } from './analysis/AnalysisHistoryPage'
import { ContextExplorerPage } from './context-explorer/ContextExplorerPage'
import { ActionRequiredPage } from './action-required/ActionRequiredPage'
import { FocusModePage } from './action-required/FocusModePage'
import { AnalysisRunDetailPage } from './control-plane/AnalysisRunDetailPage'
import { IntegrationsPage } from './control-plane/IntegrationsPage'
import { RunsPage } from './control-plane/RunsPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/reset-password', element: <RequestPasswordResetPage /> },
  { path: '/request-access', element: <RequestAccessPage /> },
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
          { path: 'analysis-runs/:analysisRunId', element: <AnalysisRunDetailPage /> },
          { path: 'projects/:projectId', element: <ProjectDetailPage /> },
          { path: 'projects/:projectId/integrations/github', element: <IntegrationsPage /> },
          { path: 'projects/:projectId/analyses', element: <AnalysisHistoryPage /> },
          { path: 'projects/:projectId/inventory', element: <InventoryPage /> },
          { path: 'projects/:projectId/versions/:projectVersionId/inventory', element: <InventoryPage /> },
          { path: 'projects/:projectId/generate', element: <GenerationPage /> },
          { path: 'projects/:projectId/runs', element: <RunHistoryPage /> },
          { path: 'projects/:projectId/versions/:projectVersionId/runs', element: <RunHistoryPage /> },
          { path: 'projects/:projectId/runs/:runId', element: <RunPage /> },
          { path: 'projects/:projectId/runs/:runId/artifacts', element: <ArtifactsPage /> },
          { path: 'projects/:projectId/runs/:runId/context', element: <ContextExplorerPage /> },
          { path: 'projects/:projectId/experimental', element: <ExperimentPage /> },
          { path: 'projects/:projectId/experimental/:experimentId/context', element: <ContextExplorerPage /> },
        ],
      },
    ],
  },
])
