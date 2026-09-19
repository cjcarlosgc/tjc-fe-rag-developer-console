import type { AnalysisRunSummaryResponse } from '../control-plane/types'

/** Un PR "activo" es el HEAD vigente de un PR abierto — no cuenta attempts superseded ni PRs cerrados/mergeados. */
export function isActivePullRequestRun(run: AnalysisRunSummaryResponse): boolean {
  return run.current && run.pullRequest.state === 'OPEN'
}

/** Distinct (proyecto, número de PR) entre runs activos; sirve tanto a nivel workspace como pasando el subset de un proyecto. */
export function countActivePullRequests(runs: AnalysisRunSummaryResponse[]): number {
  const seen = new Set<string>()
  for (const run of runs) {
    if (isActivePullRequestRun(run)) seen.add(`${run.projectId}:${run.pullRequest.number}`)
  }
  return seen.size
}

export function countRunsCreatedSince(runs: AnalysisRunSummaryResponse[], sinceIso: string): number {
  return runs.filter((run) => run.createdAt >= sinceIso).length
}

/** Asume `runs` ya ordenado desc por `createdAt` (como lo devuelve el listado global) — primer match por proyecto. */
export function latestRunByProject(runs: AnalysisRunSummaryResponse[]): Map<string, AnalysisRunSummaryResponse> {
  const map = new Map<string, AnalysisRunSummaryResponse>()
  for (const run of runs) {
    if (!map.has(run.projectId)) map.set(run.projectId, run)
  }
  return map
}
