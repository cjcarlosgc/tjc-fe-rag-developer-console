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

export interface Project {
  id: string
  name: string
  currentVersionId: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateProjectInput {
  name: string
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
