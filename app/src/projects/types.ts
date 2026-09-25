export type ProjectVersionStatus = 'PENDING' | 'EXTRACTING' | 'ANALYZING' | 'CHUNKING' | 'EMBEDDING' | 'PERSISTING' | 'COMPLETED' | 'FAILED'

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
  status: ProjectVersionStatus
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
