/**
 * Infra do cliente HTTP — axios instance, interceptors, helpers.
 * Endpoints por domínio (auth, tickets, financeiro etc.) continuam
 * em `lib/api.ts` por enquanto e serão migrados endpoint-a-endpoint
 * para `lib/api/<dominio>.ts` em sprints subsequentes.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== 'false';

export const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
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
        localStorage.removeItem('access_token');
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

/** Resolve unidadeId do localStorage quando não passado explicitamente. */
export function resolveUnidadeId(unidadeId?: string): string {
  if (unidadeId) return unidadeId;
  if (typeof window !== 'undefined') return localStorage.getItem('unidade_id') || '';
  return '';
}
