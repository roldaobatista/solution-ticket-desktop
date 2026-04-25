'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

/**
 * Defaults gerais para react-query.
 * - staleTime curto (30s) para refletir alteracoes recentes do operador.
 * - refetchOnWindowFocus true: voltando da impressora/balanca, dados atualizam.
 * - retry: 1 em queries (1 retry com backoff) e false em mutations
 *   (evita duplicar create/update por engano).
 *
 * F8 (pesagem em tempo real): paginas que precisam de polling devem
 * passar staleTime:0 e refetchInterval explicitos no useQuery local —
 * nao mexer aqui no default global.
 */
export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            refetchOnWindowFocus: true,
            retry: 1,
          },
          mutations: {
            retry: false,
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
