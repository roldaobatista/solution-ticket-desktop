/**
 * Helpers para chaves de cache do React Query com namespace por tenant.
 *
 * F3: sem prefixo de tenant, dois usuarios em empresas diferentes na mesma
 * sessao do navegador (improvavel mas possivel em dev/QA) compartilham
 * cache. Ainda mais critico em scenarios de troca rapida de empresa.
 *
 * Uso:
 *   const { data } = useQuery({
 *     queryKey: tenantKey('clientes', page, search),
 *     queryFn: () => listarClientes({ page, q: search }),
 *   });
 *
 *   queryClient.invalidateQueries({ queryKey: tenantKey('clientes') });
 */

import { resolveTenantId } from './api/client';

const NO_TENANT = '__no_tenant__';

/**
 * Prefixa a query key com o tenantId atual (resolvido do localStorage).
 * Quando nao ha tenant (login pendente), usa NO_TENANT — garante que
 * caches de antes do login nao vazem para depois.
 */
export function tenantKey(...parts: ReadonlyArray<unknown>): unknown[] {
  const tenant = resolveTenantId() || NO_TENANT;
  return [tenant, ...parts];
}

/**
 * Para chaves explicitas que precisam de outro tenant (ex.: relatorio
 * cross-tenant para superusuario). Use parcimoniosamente.
 */
export function explicitTenantKey(tenantId: string, ...parts: ReadonlyArray<unknown>): unknown[] {
  return [tenantId || NO_TENANT, ...parts];
}
