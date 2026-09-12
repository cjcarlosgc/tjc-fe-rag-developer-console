import { createBrowserRouter } from 'react-router-dom'
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

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <ProjectsPage /> },
      { path: 'projects/:projectId', element: <ProjectDetailPage /> },
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
    ],
  },
])
