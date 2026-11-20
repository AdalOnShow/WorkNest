import { QueryClient } from '@tanstack/react-query'

export function getContext() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Serve cached data for 30s when navigating back and forth instead of
        // refetching on every mount. Mutations still invalidate their keys,
        // and the notification bell keeps its own polling interval.
        staleTime: 30_000,
        // A failed request is usually a permission or not-found error from a
        // server function; retry once, not three times.
        retry: 1,
      },
    },
  })

  return {
    queryClient,
  }
}
export default function TanstackQueryProvider() {}
