import type { FailureType } from '../runs/types'

export type ExperimentStrategy = 'BASELINE' | 'RAG'
export interface StrategyMetrics { strategy: ExperimentStrategy; validRate: number; compilationRate: number; executionRate: number; passedRate: number; totalDurationMs: number; totalTokens: number; estimatedCost: number; failures: Partial<Record<FailureType, number>>; retrievedChunks?: number; selectedChunks?: number; contextTokens?: number }
export interface RepetitionResult { target: string; repetition: 1 | 2 | 3; strategy: ExperimentStrategy; valid: boolean; failureType: FailureType; durationMs: number; totalTokens: number }
export interface ExperimentResultViewModel { baseline: StrategyMetrics; rag: StrategyMetrics; repetitions: RepetitionResult[] }

export type ExperimentStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
export interface ExperimentAccepted { experimentId: string; status: 'PENDING'; pollAfterMs: number }
export interface ExperimentOperation { id: string; status: ExperimentStatus; progress: number; result?: ExperimentResultViewModel }
