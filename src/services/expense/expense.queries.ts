import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { expenseService } from '@/services/expense/expense.service'
import type { ExpenseListParams, ExpensePayload } from '@/services/expense/expense.types'

const expenseKeys = {
  all: ['expenses'] as const,
  list: (params?: ExpenseListParams) => ['expenses', 'list', params] as const,
}

export function useExpenseListQuery(params?: ExpenseListParams) {
  return useQuery({
    queryKey: expenseKeys.list(params),
    queryFn: () => expenseService.list(params),
    placeholderData: (prev) => prev,
    enabled: params?.company_id != null,
  })
}

export function useCreateExpenseMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ExpensePayload) => expenseService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: expenseKeys.all }),
  })
}

export function useUpdateExpenseMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ExpensePayload }) => expenseService.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: expenseKeys.all }),
  })
}

export function useDeleteExpenseMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => expenseService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: expenseKeys.all }),
  })
}
