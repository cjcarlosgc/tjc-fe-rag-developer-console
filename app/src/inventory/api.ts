import { apiRequest } from '../api/client'
import { getDataSource } from '../api/dataSource'
import { mockGetTestInventory } from '../api/mockBackend'
import type { InventoryTargetViewModel, TestInventoryResponse } from './types'

export function getTestInventory(projectVersionId: string, signal?: AbortSignal): Promise<TestInventoryResponse> {
  if (getDataSource() === 'mock') return mockGetTestInventory(projectVersionId)
  return apiRequest<TestInventoryResponse>(`/project-versions/${encodeURIComponent(projectVersionId)}/test-inventory`, { signal })
}

export function toInventoryTargets(response: TestInventoryResponse): InventoryTargetViewModel[] {
  return response.targets.map((target) => ({
    id: target.id,
    filePath: target.filePath,
    symbolName: target.symbolName,
    methodName: target.methodName ?? undefined,
    kind: target.targetType,
    hasExistingTest: target.hasTest,
    testFilePaths: target.testFilePaths,
  }))
}
