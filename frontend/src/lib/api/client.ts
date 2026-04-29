/**
 * Infra do cliente HTTP — axios instance, interceptors, helpers.
 * Endpoints por domínio (auth, tickets, financeiro etc.) continuam
 * em `lib/api.ts` por enquanto e serão migrados endpoint-a-endpoint
 * para `lib/api/<dominio>.ts` em sprints subsequentes.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

function generateTraceId(): string {
  // W3C trace-context: 00-<32-hex-trace-id>-<16-hex-parent-id>-01
  const traceId = Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join('');
  const parentId = Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join('');
  return `00-${traceId}-${parentId}-01`;
}

export const USE_MOCK = process.env.NEXT_PUBLIC_ENABLE_LOCAL_MOCKS === 'true';

export const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      // S4: token em sessionStorage (renovado por aba/janela) reduz superfície XSS
      const token = sessionStorage.getItem('access_token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers.traceparent = generateTraceId();
    return config;
  },
  (error) => Promise.reject(error),
);

// Desembrulha envelope { success, data, timestamp } do backend NestJS.
apiClient.interceptors.response.use(
  (response) => {
    const body = response.data;
    if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
      response.data = (body as { data: unknown }).data;
    }
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('access_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

/** Adapta arrays planos do backend para o formato PaginatedResponse usado nas páginas. */
export function toPaginated<T>(
  body: unknown,
  page?: number,
  limit?: number,
): { data: T[]; total: number; page: number; limit: number; totalPages: number } {
  const calcPages = (total: number, lim: number) =>
    lim > 0 ? Math.max(1, Math.ceil(total / lim)) : 1;

  if (Array.isArray(body)) {
    const lim = (limit ?? body.length) || 1;
    return {
      data: body as T[],
      total: body.length,
      page: page ?? 1,
      limit: lim,
      totalPages: calcPages(body.length, lim),
    };
  }
  const obj = body as {
    data?: T[];
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
  if (obj && typeof obj === 'object' && Array.isArray(obj.data)) {
    const total = obj.total ?? obj.data.length;
    const lim = (obj.limit ?? limit ?? obj.data.length) || 1;
    return {
      data: obj.data,
      total,
      page: obj.page ?? page ?? 1,
      limit: lim,
      totalPages: obj.totalPages ?? calcPages(total, lim),
    };
  }
  const lim = limit ?? 10;
  return { data: [], total: 0, page: page ?? 1, limit: lim, totalPages: 1 };
}

/**
 * Resolve unidadeId quando não passado explicitamente.
 * RS4: Zustand store em memoria (era localStorage). Reduz superficie XSS.
 */
export function resolveUnidadeId(unidadeId?: string): string {
  if (unidadeId) return unidadeId;
  if (typeof window === 'undefined') return '';
  // Import dinamico para evitar ciclo de modulos.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getUnidadeId } = require('../../stores/unidade.store');
  return getUnidadeId();
}

/** Compatibilidade legada: endpoints novos devem obter tenant apenas do JWT. */
export function resolveTenantId(): string {
  return '';
}

/** Aceita 'mes', 'YYYY-MM' ou data ISO; retorna YYYY-MM ou undefined. */
export function mesQuery(periodo: string): string | undefined {
  if (!periodo || periodo === 'mes') return undefined;
  if (/^\d{4}-\d{2}$/.test(periodo)) return periodo;
  const d = new Date(periodo);
  if (!isNaN(d.getTime())) return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  return undefined;
}

const PAYLOAD_KEY_MAP: Record<string, string> = {
  armazem_padrao_id: 'armazemPadraoId',
  balanca_id: 'balancaId',
  cliente_id: 'clienteId',
  codigo_integracao: 'codigoIntegracao',
  codigo_interno: 'codigoInterno',
  data_emissao: 'dataEmissao',
  data_fim: 'periodoFim',
  data_inicio: 'periodoInicio',
  data_vencimento: 'dataVencimento',
  forma_pagamento_id: 'formaPagamentoId',
  motorista_id: 'motoristaId',
  numero_documento: 'numeroDocumento',
  permite_fracionado: 'permiteFracionado',
  peso_nf: 'pesoNf',
  produto_id: 'produtoId',
  razao_social: 'razaoSocial',
  romaneio_id: 'romaneioId',
  tara_cadastrada: 'taraCadastrada',
  tickets_ids: 'ticketIds',
  tipo_operacao: 'tipoOperacao',
  transportadora_id: 'transportadoraId',
  veiculo_id: 'veiculoId',
};

function camelizeKey(key: string): string {
  return PAYLOAD_KEY_MAP[key] ?? key.replace(/_([a-z])/g, (_, char: string) => char.toUpperCase());
}

export function toApiPayload<T extends Record<string, unknown>>(input: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(input)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [camelizeKey(key), value]),
  );
}
