export type AnalysisStatus = 'PENDING' | 'EXTRACTING' | 'ANALYZING' | 'CHUNKING' | 'EMBEDDING' | 'PERSISTING' | 'COMPLETED' | 'FAILED'

export interface AnalysisOperation {
  id: string
  projectId: string
  status: AnalysisStatus
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

export interface AnalysisResult {
  id: string
  projectId: string
  status: 'COMPLETED'
  filesProcessed: number
  chunksCount: number
  detectedFramework: string | null
  targetsTotal: number
  targetsWithTest: number
  targetsMissingTest: number
  completedAt: string | null
}

export interface UploadAccepted {
  projectId: string
  projectVersionId: string
  status: 'PENDING'
  pollAfterMs: number
}

export type WorkspaceKind = 'PERSONAL' | 'ORGANIZATION'
export type WorkspaceRole = 'ADMIN' | 'MEMBER'
export type ProjectRole = 'ADMIN' | 'MAINTAINER' | 'READER'

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

/** `ProjectResponse` de INTEROP-2.4. El rol es el del usuario actual en ese Project. */
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

export interface AnalysisHistoryItem {
  id: string
  projectId: string
  status: AnalysisStatus
  originalFileName: string | null
  filesProcessed: number | null
  chunksCount: number | null
  detectedFramework: string | null
  targetsTotal: number | null
  targetsWithTest: number | null
  targetsMissingTest: number | null
  createdAt: string
  completedAt: string | null
  current: boolean
}
