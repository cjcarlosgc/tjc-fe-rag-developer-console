import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AnalysisSymbolResponse } from '../control-plane/types'
import { getRetrievalComparison, getRetrievalComparisonResults, listRetrievalComparisons, startRetrievalComparison } from './api'
import { isTerminalRetrievalStatus, type RetrievalComparisonStatusResponse } from './types'

/**
 * Intervalo de polling cuando la respuesta 202 no trae `pollAfterMs` utilizable (ausente, 0 o negativo). Es un fallback
 * de cliente documentado, no un dato del contrato. Solo se usa mientras la comparación no está en estado terminal.
 */
export const RETRIEVAL_FALLBACK_POLL_MS = 1000

export const retrievalComparisonKeys = {
  list: (analysisRunId: string) => ['retrieval-comparisons', 'analysis-run', analysisRunId] as const,
  detail: (retrievalComparisonId: string) => ['retrieval-comparisons', retrievalComparisonId] as const,
  results: (retrievalComparisonId: string) => ['retrieval-comparisons', retrievalComparisonId, 'results'] as const,
}

/** Previas del Run: `Page<RetrievalComparisonStatusResponse>` por cursor opaco, sin reemplazar las anteriores. */
export function useRetrievalComparisons(analysisRunId: string) {
  return useInfiniteQuery({
    queryKey: retrievalComparisonKeys.list(analysisRunId),
    queryFn: ({ pageParam }) => listRetrievalComparisons(analysisRunId, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: Boolean(analysisRunId),
  })
}

/**
 * Estado de una comparación. `pollAfterMs` viene de la respuesta 202 de `POST` y se usa como intervalo.
 * Se detiene en `COMPLETED`/`FAILED` y ante cualquier error (p. ej. 404 de una comparación que ya no es visible).
 * En modo test el intervalo es corto para no esperar en las pruebas.
 */
export function useRetrievalComparison(retrievalComparisonId: string | null, pollAfterMs?: number) {
  const interval = pollAfterMs && pollAfterMs > 0 ? pollAfterMs : RETRIEVAL_FALLBACK_POLL_MS
  return useQuery({
    queryKey: retrievalComparisonKeys.detail(retrievalComparisonId ?? ''),
    queryFn: () => getRetrievalComparison(retrievalComparisonId!),
    enabled: Boolean(retrievalComparisonId),
    refetchInterval: (query) => {
      if (query.state.error) return false
      const status = query.state.data?.status
      if (status && isTerminalRetrievalStatus(status)) return false
      return import.meta.env.MODE === 'test' ? 10 : interval
    },
  })
}

/** Resultados: solo se habilita cuando el estado ya es `COMPLETED` (en `FAILED` no hay resultados que pedir). */
export function useRetrievalComparisonResults(retrievalComparisonId: string | null, status: RetrievalComparisonStatusResponse['status'] | undefined) {
  return useQuery({
    queryKey: retrievalComparisonKeys.results(retrievalComparisonId ?? ''),
    queryFn: () => getRetrievalComparisonResults(retrievalComparisonId!),
    enabled: Boolean(retrievalComparisonId) && status === 'COMPLETED',
  })
}

export interface StartRetrievalComparisonInput {
  symbol: AnalysisSymbolResponse
  idempotencyKey: string
}

/** Inicia la comparación. La key la genera la página por acción lógica (`useIdempotencyKeys`) y se reutiliza en reintentos. */
export function useStartRetrievalComparison(analysisRunId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ symbol, idempotencyKey }: StartRetrievalComparisonInput) => startRetrievalComparison(analysisRunId, symbol, idempotencyKey),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: retrievalComparisonKeys.list(analysisRunId) }),
  })
}
