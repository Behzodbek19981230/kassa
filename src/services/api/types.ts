export interface PaginationMeta {
  currentPage: number
  lastPage: number
  perPage: number
  total: number
}

export interface PaginatedResponse<T> {
  pagination: PaginationMeta
  results: T[]
  filters: unknown
}

export interface ListParams {
  page?: number
  limit?: number
  search?: string
}
