import { apiClient, USE_MOCK } from './client';
import { Romaneio, PaginatedResponse } from '@/types';
import { mockApi } from '../mock-api';

export async function getRomaneios(
  page?: number,
  limit?: number,
): Promise<PaginatedResponse<Romaneio>> {
  if (USE_MOCK) return mockApi.getRomaneios(page, limit);
  const res = await apiClient.get('/romaneios', { params: { page, limit } });
  const body = res.data as Romaneio[] | PaginatedResponse<Romaneio>;
  if (Array.isArray(body)) {
    const lim = (limit ?? body.length) || 1;
    return {
      data: body,
      total: body.length,
      page: page ?? 1,
      limit: lim,
      totalPages: lim > 0 ? Math.max(1, Math.ceil(body.length / lim)) : 1,
    };
  }
  return body;
}

export async function createRomaneio(data: Partial<Romaneio>): Promise<Romaneio> {
  if (USE_MOCK) return mockApi.createRomaneio(data);
  const res = await apiClient.post('/romaneios', data);
  return res.data;
}
