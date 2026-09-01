import type { InventoryTargetViewModel } from '../inventory/types'

export type GenerationMode = 'TARGET' | 'CLASS_ALL' | 'CLASS_MISSING' | 'PROJECT_MISSING' | 'PROJECT_ALL'

export interface GenerationConfiguration {
  projectId: string
  mode: GenerationMode
  target?: InventoryTargetViewModel
}

export interface GenerationAccepted {
  runId: string
  projectId: string
  projectVersionId: string
  status: 'PENDING'
  pollAfterMs: number
}
