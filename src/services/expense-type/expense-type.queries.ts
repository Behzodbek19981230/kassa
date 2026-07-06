import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { expenseTypeService } from '@/services/expense-type/expense-type.service'
import type { ExpenseTypeListParams, ExpenseTypePayload } from '@/services/expense-type/expense-type.types'

const expenseTypeKeys = {
  all: ['expense-types'] as const,
  list: (params?: ExpenseTypeListParams) => ['expense-types', 'list', params] as const,
}

export function useExpenseTypeListQuery(params?: ExpenseTypeListParams) {
  return useQuery({
    queryKey: expenseTypeKeys.list(params),
    queryFn: () => expenseTypeService.list(params),
    placeholderData: (prev) => prev,
  })
}

export function useCreateExpenseTypeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ExpenseTypePayload) => expenseTypeService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: expenseTypeKeys.all }),
  })
}

export function useUpdateExpenseTypeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ExpenseTypePayload }) =>
      expenseTypeService.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: expenseTypeKeys.all }),
  })
}

export function useDeleteExpenseTypeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => expenseTypeService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: expenseTypeKeys.all }),
  })
}
