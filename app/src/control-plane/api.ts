import { getDataSource, PendingContractError } from '../api/dataSource'
import {
  mockCompleteGitHubInstallation,
  mockCreateTestPublication,
  mockDisconnectRepository,
  mockGetAnalysisRun,
  mockGetRepositoryBinding,
  mockGetTestPublication,
  mockListAnalysisRuns,
  mockListTestProposals,
  mockStartGitHubInstallation,
} from '../api/mockBackend'
import type {
  AnalysisRunDetailResponse,
  AnalysisRunListPage,
  AnalysisRunStatus,
  CompleteGitHubInstallationRequest,
  CreateTestPublicationRequest,
  GeneratedTestProposalSetResponse,
  GitHubInstallationSessionResponse,
  ProjectRepositoryBindingResponse,
  TestPublicationAcceptedResponse,
  TestPublicationResponse,
} from './types'

// HU30 — repository binding / GitHub App. RAG Core todavía no publica estas rutas (INTEROP-2.0 §6.8).

export function getRepositoryBinding(projectId: string): Promise<ProjectRepositoryBindingResponse | null> {
  if (getDataSource() === 'mock') return mockGetRepositoryBinding(projectId)
  return Promise.reject(new PendingContractError('el repository binding de un proyecto'))
}

export function startGitHubInstallation(projectId: string): Promise<GitHubInstallationSessionResponse> {
  if (getDataSource() === 'mock') return mockStartGitHubInstallation(projectId)
  return Promise.reject(new PendingContractError('la instalación de la GitHub App'))
}

export function completeGitHubInstallation(projectId: string, input: CompleteGitHubInstallationRequest): Promise<ProjectRepositoryBindingResponse> {
  if (getDataSource() === 'mock') return mockCompleteGitHubInstallation(projectId, input)
  return Promise.reject(new PendingContractError('completar la instalación de la GitHub App'))
}

export function disconnectRepository(projectId: string): Promise<void> {
  if (getDataSource() === 'mock') return mockDisconnectRepository(projectId)
  return Promise.reject(new PendingContractError('desconectar el repository binding'))
}

// HU32 — Analysis Runs por PR/HEAD (INTEROP-2.0 §6.10).

export function listAnalysisRuns(projectId?: string, status?: AnalysisRunStatus): Promise<AnalysisRunListPage> {
  if (getDataSource() === 'mock') return mockListAnalysisRuns(projectId, status)
  return Promise.reject(new PendingContractError('el listado de Analysis Runs'))
}

export function getAnalysisRun(analysisRunId: string): Promise<AnalysisRunDetailResponse> {
  if (getDataSource() === 'mock') return mockGetAnalysisRun(analysisRunId)
  return Promise.reject(new PendingContractError('el detalle de un Analysis Run'))
}

// HU39/HU40 — Checks, propuestas y companion PR (INTEROP-2.0 §6.12).

export function listTestProposals(analysisRunId: string): Promise<GeneratedTestProposalSetResponse> {
  if (getDataSource() === 'mock') return mockListTestProposals(analysisRunId)
  return Promise.reject(new PendingContractError('las propuestas de prueba de un Run'))
}

export function createTestPublication(analysisRunId: string, input: CreateTestPublicationRequest): Promise<TestPublicationAcceptedResponse> {
  if (getDataSource() === 'mock') return mockCreateTestPublication(analysisRunId, input)
  return Promise.reject(new PendingContractError('la publicación de tests vía companion PR'))
}

export function getTestPublication(publicationId: string): Promise<TestPublicationResponse> {
  if (getDataSource() === 'mock') return mockGetTestPublication(publicationId)
  return Promise.reject(new PendingContractError('el estado de una publicación de tests'))
}
