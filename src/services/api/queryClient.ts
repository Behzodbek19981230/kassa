import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      // Data is always considered stale, so every page refetches its lists when it is opened
      // (e.g. a new order shows up in the order history right after redirecting there).
      // Cached data is still shown instantly while the refetch runs.
      staleTime: 0,
    },
  },
})
