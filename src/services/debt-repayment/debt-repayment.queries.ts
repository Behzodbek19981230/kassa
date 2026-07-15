import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { debtRepaymentService } from '@/services/debt-repayment/debt-repayment.service'
import type {
  DebtRepaymentListParams,
  DebtRepaymentPayload,
} from '@/services/debt-repayment/debt-repayment.types'

const debtRepaymentKeys = {
  all: ['debt-repayments'] as const,
  list: (params?: DebtRepaymentListParams) => ['debt-repayments', 'list', params] as const,
  detail: (id: number) => ['debt-repayments', 'detail', id] as const,
}

export function useDebtRepaymentListQuery(params?: DebtRepaymentListParams) {
  return useQuery({
    queryKey: debtRepaymentKeys.list(params),
    queryFn: () => debtRepaymentService.list(params),
    placeholderData: (prev) => prev,
    enabled: params?.company_id != null,
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: debtRepaymentKeys.all }),
  })
}

export function useUpdateDebtRepaymentMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: DebtRepaymentPayload }) =>
      debtRepaymentService.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: debtRepaymentKeys.all }),
  })
}

export function useDeleteDebtRepaymentMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => debtRepaymentService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: debtRepaymentKeys.all }),
  })
}
