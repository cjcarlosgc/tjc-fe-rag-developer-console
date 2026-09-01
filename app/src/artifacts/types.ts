export type ArtifactType = 'CREATED' | 'MODIFIED'
export type DiffLineType = 'CONTEXT' | 'ADDED' | 'REMOVED'

export interface DiffLineViewModel { type: DiffLineType; oldLineNumber?: number; newLineNumber?: number; content: string }
export interface ArtifactViewModel { id: string; runId: string; relativePath: string; artifactType: ArtifactType; valid: boolean; lines: DiffLineViewModel[] }
