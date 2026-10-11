import { expect, test } from 'vitest'
import { toExperimentOperation, type ExperimentResultsResponse, type ExperimentStatusResponse } from './liveMapping'

const status: ExperimentStatusResponse = {
  id: 'exp-1',
  projectId: 'p-1',
  projectVersionId: 'v-1',
  analysisRunId: 'arun-1',
  symbol: { language: 'TYPESCRIPT', kind: 'METHOD', qualifiedName: 'Order.total', filePath: 'src/orders.ts', changeKind: 'DIRECTLY_CHANGED' },
  status: 'RUNNING',
  completedRepetitions: 3,
  totalRepetitions: 6,
  failureCode: null,
  failureMessage: null,
  startedAt: '2026-09-07T00:00:00.000Z',
  completedAt: null,
}

test('progreso se calcula desde completedRepetitions/totalRepetitions', () => {
  const operation = toExperimentOperation(status, null, 'calculateTotal')
  expect(operation.progress).toBe(50)
  expect(operation.result).toBeUndefined()
})

test('separa las métricas de RAG y GENERALIST_AGENT en baseline/rag', () => {
  const results: ExperimentResultsResponse = {
    experimentId: 'exp-1',
    projectVersionId: 'v-1',
    analysisRunId: 'arun-1',
    symbol: { language: 'TYPESCRIPT', kind: 'METHOD', qualifiedName: 'Order.total', filePath: 'src/orders.ts', changeKind: 'DIRECTLY_CHANGED' },
    repetitionsPerStrategy: 3,
    completedAt: '2026-09-07T00:05:00.000Z',
    strategies: [
      { strategy: 'RAG', validRate: .83, compilationRate: 1, executionRate: .83, passedRate: .83, generationDurationMs: 900, executionDurationMs: 200, totalDurationMs: 1100, inputTokens: 500, outputTokens: 200, totalTokens: 700, estimatedCost: .02, retrievedChunks: 10, selectedChunks: 4, contextTokens: 900, toolCalls: null, filesInspected: null, failures: {} },
      { strategy: 'GENERALIST_AGENT', validRate: .5, compilationRate: .67, executionRate: .5, passedRate: .5, generationDurationMs: 1200, executionDurationMs: 300, totalDurationMs: 1500, inputTokens: 800, outputTokens: 300, totalTokens: 1100, estimatedCost: .03, retrievedChunks: null, selectedChunks: null, contextTokens: null, toolCalls: 5, filesInspected: 3, failures: { COMPILATION: 1 } },
    ],
    repetitions: [
      { repetition: 1, strategy: 'RAG', valid: true, failureType: 'NONE', totalDurationMs: 350, totalTokens: 230, errorSummary: null },
      { repetition: 1, strategy: 'GENERALIST_AGENT', valid: false, failureType: 'COMPILATION', totalDurationMs: 500, totalTokens: 360, errorSummary: 'jest.config.js: Cannot find module ts-jest' },
    ],
  }

  const operation = toExperimentOperation({ ...status, status: 'COMPLETED', completedRepetitions: 6 }, results, 'calculateTotal')

  expect(operation.progress).toBe(100)
  expect(operation.result?.rag).toMatchObject({ strategy: 'RAG', validRate: .83, totalTokens: 700 })
  expect(operation.result?.baseline).toMatchObject({ strategy: 'GENERALIST_AGENT', toolCalls: 5, filesInspected: 3 })
  expect(operation.result?.repetitions).toHaveLength(2)
  expect(operation.result?.repetitions[0]).toMatchObject({ target: 'calculateTotal', strategy: 'RAG', totalDurationMs: 350, executionDurationMs: null, errorSummary: null })
})

const configuredStatus: ExperimentStatusResponse = {
  ...status,
  status: 'COMPLETED',
  completedRepetitions: 6,
  model: { provider: 'OpenAI', model: 'gpt-6-luna', modelVersion: null, reasoningEffort: 'high', temperature: null, maxOutputTokens: 4096 },
  budget: { toolCallCap: 8, contextTokenBudget: 12000, maxDurationMs: 60000 },
  executionProfile: 'sandbox-standard',
  runnerHint: 'runner-x',
  randomizationSeed: 'seed-42',
}

const resultsWith27: ExperimentResultsResponse = {
  experimentId: 'exp-1',
  projectVersionId: 'v-1',
  analysisRunId: 'arun-1',
  symbol: { language: 'TYPESCRIPT', kind: 'METHOD', qualifiedName: 'Order.total', filePath: 'src/orders.ts', changeKind: 'DIRECTLY_CHANGED' },
  repetitionsPerStrategy: 3,
  completedAt: '2026-09-07T00:05:00.000Z',
  strategies: [
    { strategy: 'RAG', validRate: 1, compilationRate: 1, executionRate: 1, passedRate: 1, generationDurationMs: 1, executionDurationMs: 1, totalDurationMs: 2, inputTokens: null, outputTokens: null, totalTokens: null, estimatedCost: null, retrievedChunks: null, selectedChunks: null, contextTokens: null, toolCalls: null, filesInspected: null, failures: {} },
    { strategy: 'GENERALIST_AGENT', validRate: 0, compilationRate: 0, executionRate: 0, passedRate: 0, generationDurationMs: 1, executionDurationMs: 1, totalDurationMs: 2, inputTokens: null, outputTokens: null, totalTokens: null, estimatedCost: null, retrievedChunks: null, selectedChunks: null, contextTokens: null, toolCalls: null, filesInspected: null, failures: {} },
  ],
  repetitions: [
    { repetition: 1, strategy: 'RAG', valid: true, failureType: 'NONE', totalDurationMs: 350, totalTokens: null, errorSummary: null, pairId: 'pair-1', pairPosition: 1, attempt: 2, technicallyEvaluable: false },
    { repetition: 1, strategy: 'GENERALIST_AGENT', valid: false, failureType: 'INFRASTRUCTURE', totalDurationMs: 500, totalTokens: null, errorSummary: null },
  ],
}

test('mapea la configuración INTEROP-2.7 a la operación y al view model', () => {
  const operation = toExperimentOperation(configuredStatus, resultsWith27, 'calculateTotal')
  expect(operation.configuration).toEqual({
    model: { provider: 'OpenAI', model: 'gpt-6-luna', modelVersion: null, reasoningEffort: 'high', temperature: null, maxOutputTokens: 4096 },
    budget: { toolCallCap: 8, contextTokenBudget: 12000, maxDurationMs: 60000 },
    executionProfile: 'sandbox-standard',
    runnerHint: 'runner-x',
    randomizationSeed: 'seed-42',
  })
  expect(operation.result?.configuration).toEqual(operation.configuration)
})

test('mapea pairId, pairPosition, attempt y technicallyEvaluable por repetición', () => {
  const operation = toExperimentOperation(configuredStatus, resultsWith27, 'calculateTotal')
  expect(operation.result?.repetitions[0]).toMatchObject({ pairId: 'pair-1', pairPosition: 1, attempt: 2, technicallyEvaluable: false })
})

test('sin campos INTEROP-2.7 la configuración queda null y las repeticiones en null, nunca en cero', () => {
  const operation = toExperimentOperation({ ...status, status: 'COMPLETED', completedRepetitions: 6 }, resultsWith27, 'calculateTotal')
  expect(operation.configuration).toBeNull()
  expect(operation.result?.configuration).toBeNull()
  expect(operation.result?.repetitions[1]).toMatchObject({ pairId: null, pairPosition: null, attempt: null, technicallyEvaluable: null })
  expect(operation.result?.repetitions[1].attempt).not.toBe(0)
})

test('configuración parcial: cada campo ausente queda null por separado, sin perder el resto del bloque', () => {
  const partial = { ...configuredStatus, budget: { toolCallCap: 8, contextTokenBudget: 12000, maxDurationMs: undefined } } as unknown as ExperimentStatusResponse
  const operation = toExperimentOperation(partial, resultsWith27, 'calculateTotal')
  expect(operation.configuration?.budget).toEqual({ toolCallCap: 8, contextTokenBudget: 12000, maxDurationMs: null })
  expect(operation.configuration?.model?.provider).toBe('OpenAI')
  expect(operation.configuration?.executionProfile).toBe('sandbox-standard')
})

test('corrida previa con model, budget, executionProfile, runnerHint y randomizationSeed en null: configuración null, sin valores inventados', () => {
  const legacy: ExperimentStatusResponse = { ...status, status: 'COMPLETED', completedRepetitions: 6, model: null, budget: null, executionProfile: null, runnerHint: null, randomizationSeed: null }
  const operation = toExperimentOperation(legacy, resultsWith27, 'calculateTotal')
  expect(operation.configuration).toBeNull()
  expect(operation.result?.configuration).toBeNull()
})

test('una configuración con algunos null conserva los campos informados', () => {
  const mixed: ExperimentStatusResponse = { ...status, status: 'COMPLETED', completedRepetitions: 6, model: { provider: 'OpenAI', model: 'gpt-6-luna' }, budget: null, executionProfile: 'p', runnerHint: null, randomizationSeed: null }
  const operation = toExperimentOperation(mixed, resultsWith27, 'calculateTotal')
  expect(operation.configuration).toMatchObject({ budget: null, executionProfile: 'p', runnerHint: null, randomizationSeed: null })
})

test('corrida previa con executionDurationMs null: el guion se conserva como null y nunca se convierte en 0', () => {
  const operation = toExperimentOperation({ ...status, status: 'COMPLETED', completedRepetitions: 6 }, resultsWith27, 'calculateTotal')
  expect(operation.result?.repetitions[1]).toMatchObject({ executionDurationMs: null, generationDurationMs: null, totalDurationMs: 500 })
  expect(operation.result?.repetitions[0].executionDurationMs).toBeNull()
})

test('executionDurationMs numérico tras llamada fallida al Sandbox se mapea tal cual, incluso pequeño', () => {
  const withExecution: ExperimentResultsResponse = {
    ...resultsWith27,
    repetitions: [
      { repetition: 1, strategy: 'RAG', valid: false, failureType: 'INFRASTRUCTURE', generationDurationMs: 300, executionDurationMs: 7, totalDurationMs: 307, totalTokens: null, errorSummary: null, pairId: 'pair-1', pairPosition: 1, attempt: 2, technicallyEvaluable: false },
      { repetition: 2, strategy: 'RAG', valid: false, failureType: 'COMPILATION', executionDurationMs: null, totalDurationMs: 400, totalTokens: null, errorSummary: null },
    ],
  }
  const operation = toExperimentOperation(configuredStatus, withExecution, 'calculateTotal')
  expect(operation.result?.repetitions[0]).toMatchObject({ executionDurationMs: 7, totalDurationMs: 307 })
  expect(operation.result?.repetitions[1].executionDurationMs).toBeNull()
})

test('tasas y medias null de una estrategia se mapean como null y los contadores de evaluabilidad se conservan', () => {
  const noEval: ExperimentResultsResponse = {
    ...resultsWith27,
    strategies: [
      { ...resultsWith27.strategies[0] },
      { ...resultsWith27.strategies[1], validRate: null, compilationRate: null, executionRate: null, passedRate: null, generationDurationMs: null, executionDurationMs: null, totalDurationMs: null, evaluableRepetitions: 0, nonEvaluableRepetitions: 3 },
    ],
  }
  const operation = toExperimentOperation(configuredStatus, noEval, 'calculateTotal')
  expect(operation.result?.baseline).toMatchObject({ validRate: null, passedRate: null, totalDurationMs: null, executionDurationMs: null, evaluableRepetitions: 0, nonEvaluableRepetitions: 3 })
  expect(operation.result?.baseline.validRate).not.toBe(0)
  expect(operation.result?.rag.evaluableRepetitions).toBeUndefined()
})

test('un experimento FAILED mapea failureCode y failureMessage sin descartarlos', () => {
  const failed = toExperimentOperation({ ...status, status: 'FAILED', failureCode: 'EXPERIMENT_WORKER_LOST', failureMessage: 'worker caído' }, null, 'calculateTotal')
  expect(failed).toMatchObject({ status: 'FAILED', failureCode: 'EXPERIMENT_WORKER_LOST', failureMessage: 'worker caído', result: undefined })
})

test('un código desconocido se conserva como cadena abierta', () => {
  const unknown = toExperimentOperation({ ...status, status: 'FAILED', failureCode: 'DEMO_UNKNOWN_FAILURE', failureMessage: null }, null, 'calculateTotal')
  expect(unknown.failureCode).toBe('DEMO_UNKNOWN_FAILURE')
  expect(unknown.failureMessage).toBeNull()
})

test('los nulos internos de modelo se preservan como null, nunca como 0', () => {
  const operation = toExperimentOperation({ ...configuredStatus, model: { provider: 'OpenAI', model: 'gpt-6-luna' } }, resultsWith27, 'calculateTotal')
  expect(operation.configuration?.model).toEqual({ provider: 'OpenAI', model: 'gpt-6-luna', modelVersion: null, reasoningEffort: null, temperature: null, maxOutputTokens: null })
})
