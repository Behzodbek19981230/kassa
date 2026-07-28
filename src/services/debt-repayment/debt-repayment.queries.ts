import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { debtRepaymentService } from '@/services/debt-repayment/debt-repayment.service'
import type {
  DebtRepaymentDraftListParams,
  DebtRepaymentGroupedListParams,
  DebtRepaymentListParams,
  DebtRepaymentPayload,
} from '@/services/debt-repayment/debt-repayment.types'

const debtRepaymentKeys = {
  all: ['debt-repayments'] as const,
  list: (params?: DebtRepaymentListParams) => ['debt-repayments', 'list', params] as const,
  groupedList: (params?: DebtRepaymentGroupedListParams) => ['debt-repayments', 'grouped-list', params] as const,
  draftGroupedList: (params?: DebtRepaymentDraftListParams) =>
    ['debt-repayments', 'draft-grouped-list', params] as const,
  detail: (id: number) => ['debt-repayments', 'detail', id] as const,
}

export function useDebtRepaymentListQuery(params?: DebtRepaymentListParams) {
  return useQuery({
    queryKey: debtRepaymentKeys.list(params),
    queryFn: () => debtRepaymentService.list(params),
    placeholderData: (prev) => prev,
  })
}

export function useDebtRepaymentGroupedListQuery(params?: DebtRepaymentGroupedListParams) {
  return useQuery({
    queryKey: debtRepaymentKeys.groupedList(params),
    queryFn: () => debtRepaymentService.listGrouped(params),
    placeholderData: (prev) => prev,
  })
}

export function useDebtRepaymentDraftGroupedListQuery(params?: DebtRepaymentDraftListParams) {
  return useQuery({
    queryKey: debtRepaymentKeys.draftGroupedList(params),
    queryFn: () => debtRepaymentService.listDraftGrouped(params),
    placeholderData: (prev) => prev,
  })
}

export function useDebtRepaymentQuery(id?: number) {
  return useQuery({
    queryKey: debtRepaymentKeys.detail(id ?? 0),
    queryFn: () => debtRepaymentService.get(id as number),
    enabled: typeof id === 'number',
  })
}

export function useCreateDebtRepaymentMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: DebtRepaymentPayload) => debtRepaymentService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: debtRepaymentKeys.all })
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

export function useUpdateDebtRepaymentMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: DebtRepaymentPayload }) =>
      debtRepaymentService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: debtRepaymentKeys.all })
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

function invalidateAfterDraftAction(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: debtRepaymentKeys.all })
  queryClient.invalidateQueries({ queryKey: ['clients'] })
}

export function useDraftDeleteDebtRepaymentMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => debtRepaymentService.draftDelete(id),
    onSuccess: () => invalidateAfterDraftAction(queryClient),
  })
}

export function useReturnDebtRepaymentMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => debtRepaymentService.returnFromDraft(id),
    onSuccess: () => invalidateAfterDraftAction(queryClient),
  })
}

export function useHardDeleteDebtRepaymentMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => debtRepaymentService.hardDelete(id),
    onSuccess: () => invalidateAfterDraftAction(queryClient),
  })
}
