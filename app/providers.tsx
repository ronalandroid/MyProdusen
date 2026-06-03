"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * App-wide React Query provider.
 *
 * Must be a Client Component. The QueryClient is created once per browser
 * session via useState initializer so it is NOT recreated on every render
 * (recreating it would drop the cache and can cause hydration mismatches).
 *
 * This wraps the whole app in app/layout.tsx so that any client component
 * — including dashboard widgets that call useQuery/useMutation
 * (e.g. EmployeeBeranda) — always has a QueryClient available. Without this
 * provider those hooks throw: "No QueryClient set, use QueryClientProvider".
 */
export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
