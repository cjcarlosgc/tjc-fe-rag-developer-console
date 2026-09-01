export type InventoryTargetKind = 'CLASS' | 'METHOD' | 'FUNCTION'

export interface TestTargetResponse {
  id: string
  filePath: string
  symbolName: string
  methodName: string | null
  targetType: InventoryTargetKind
  hasTest: boolean
  testFilePaths: string[]
}

export interface TestInventoryResponse {
  projectVersionId: string
  detectedFramework: string | null
  targetsTotal: number
  targetsWithTest: number
  targetsMissingTest: number
  targets: TestTargetResponse[]
}

export interface InventoryTargetViewModel {
  id: string
  filePath: string
  symbolName: string
  methodName?: string
  kind: InventoryTargetKind
  hasExistingTest: boolean
  testFilePaths: string[]
}
