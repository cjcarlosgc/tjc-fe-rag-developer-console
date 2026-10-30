export type ProjectVersionStatus = 'PENDING' | 'EXTRACTING' | 'ANALYZING' | 'CHUNKING' | 'EMBEDDING' | 'PERSISTING' | 'COMPLETED' | 'FAILED'
export type ProjectLanguage = 'TYPESCRIPT' | 'PHP'
export type TestFramework = 'JEST' | 'VITEST' | 'PHPUNIT'

export interface ProjectVersionResponse {
  id: string
  projectId: string
  status: ProjectVersionStatus
  language: ProjectLanguage
  originalFileName: string | null
  sizeBytes: number | null
  filesProcessed: number | null
  chunksCount: number | null
  failureReason: string | null
  startedAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ProjectVersionResultsResponse {
  id: string
  projectId: string
  status: 'COMPLETED'
  language: ProjectLanguage
  filesProcessed: number
  chunksCount: number
  detectedFramework: TestFramework | null
  targetsTotal: number
  targetsWithTest: number
  targetsMissingTest: number
  completedAt: string | null
}

export interface ProjectVersionSummaryResponse extends ProjectVersionResponse {
  detectedFramework: TestFramework | null
  targetsTotal: number | null
  targetsWithTest: number | null
  targetsMissingTest: number | null
  current: boolean
}

export type WorkspaceKind = 'PERSONAL' | 'ORGANIZATION'
export type WorkspaceRole = 'ADMIN' | 'MEMBER'
export type ProjectRole = 'ADMIN' | 'MAINTAINER' | 'WRITER' | 'READER'

export interface WorkspaceRef {
  kind: WorkspaceKind
  id: string
  login: string | null
}

export interface Workspace extends WorkspaceRef {
  avatarUrl: string | null
  role: WorkspaceRole
}

export interface WorkspaceListResponse {
  items: Workspace[]
}

/** `ProjectResponse` de INTEROP-2.6. El rol es el del usuario actual en ese Project. */
export interface Project {
  id: string
  name: string
  currentVersionId: string | null
  workspace: WorkspaceRef
  role: ProjectRole
  createdAt: string
  updatedAt: string
}

export interface CreateProjectInput {
  name: string
  workspaceId?: string
}

export interface UpdateProjectInput {
  name: string
}

/** `GET /projects?cursor&limit` -> `Page<ProjectResponse>`. */
export interface ProjectListPage {
  items: Project[]
  nextCursor: string | null
}

/** INTEROP-2.25 (§6.17, HU18): captura armada de experimentación de un Project. */
export type ExperimentCaptureStatus = 'ARMED' | 'RESERVED' | 'DISARMED'

export interface ExperimentCaptureResponse {
  captureId: string
  projectId: string
  status: ExperimentCaptureStatus
  armedBy: string
  armedAt: string
  /** Solo en `RESERVED`. */
  reservedAnalysisRunId: string | null
  reservedAt: string | null
  /** Solo en `DISARMED`. */
  disarmedBy: string | null
  disarmedAt: string | null
}

/** `GET /projects/{projectId}/experiment-captures?cursor&limit` -> `Page<ExperimentCaptureResponse>`, la más reciente primero. */
export interface ExperimentCapturePage {
  items: ExperimentCaptureResponse[]
  nextCursor: string | null
}

export interface AnalysisHistoryItem {
  id: string
  projectId: string
  status: ProjectVersionStatus
  language: ProjectLanguage
  originalFileName: string | null
  filesProcessed: number | null
  chunksCount: number | null
  detectedFramework: TestFramework | null
  targetsTotal: number | null
  targetsWithTest: number | null
  targetsMissingTest: number | null
  createdAt: string
  completedAt: string | null
  current: boolean
}
