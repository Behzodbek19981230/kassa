import { useQuery } from '@tanstack/react-query'
import { keshbekHistoryService } from '@/services/keshbek-history/keshbek-history.service'
import type { KeshbekHistoryListParams } from '@/services/keshbek-history/keshbek-history.types'

const keshbekHistoryKeys = {
  all: ['keshbek-history'] as const,
  list: (params?: KeshbekHistoryListParams) => ['keshbek-history', 'list', params] as const,
}

export function useKeshbekHistoryListQuery(params?: KeshbekHistoryListParams) {
  return useQuery({
    queryKey: keshbekHistoryKeys.list(params),
    queryFn: () => keshbekHistoryService.list(params),
    placeholderData: (prev) => prev,
  })
}
