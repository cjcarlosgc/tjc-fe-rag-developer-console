import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from './ui/AppShell'
import { ProjectDetailPage } from './projects/ProjectDetailPage'
import { ProjectsPage } from './projects/ProjectsPage'
import { InventoryPage } from './inventory/InventoryPage'
import { GenerationPage } from './generation/GenerationPage'
import { RunPage } from './runs/RunPage'
import { ArtifactsPage } from './artifacts/ArtifactsPage'
import { ExperimentPage } from './experiments/ExperimentPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <ProjectsPage /> },
      { path: 'projects/:projectId', element: <ProjectDetailPage /> },
      { path: 'projects/:projectId/inventory', element: <InventoryPage /> },
      { path: 'projects/:projectId/generate', element: <GenerationPage /> },
      { path: 'projects/:projectId/runs/:runId', element: <RunPage /> },
      { path: 'projects/:projectId/runs/:runId/artifacts', element: <ArtifactsPage /> },
      { path: 'projects/:projectId/experimental', element: <ExperimentPage /> },
    ],
  },
])
