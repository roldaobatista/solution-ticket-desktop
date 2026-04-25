import { apiClient, resolveUnidadeId, mesQuery, USE_MOCK } from './client';
import { DashboardKpis, PesagensPorPeriodo, TopClienteVolume, DistribuicaoProduto } from '@/types';
import { mockApi } from '../mock-api';

export async function getDashboardKpis(unidadeId?: string): Promise<DashboardKpis> {
  if (USE_MOCK) return mockApi.getDashboardKpis();
  const uid = resolveUnidadeId(unidadeId);
  const res = await apiClient.get(`/dashboard/kpis/${uid}`);
  return res.data;
}

export async function getPesagensPorPeriodo(
  periodo: string,
  unidadeId?: string,
): Promise<PesagensPorPeriodo[]> {
  if (USE_MOCK) return mockApi.getPesagensPorPeriodo(periodo);
  const uid = resolveUnidadeId(unidadeId);
  const res = await apiClient.get(`/dashboard/evolucao-diaria/${uid}`, { params: { periodo } });
  return res.data;
}

export async function getTicketsPorStatus(
  unidadeId?: string,
): Promise<Array<{ status: string; total: number }>> {
  if (USE_MOCK) return [];
  const uid = resolveUnidadeId(unidadeId);
  const res = await apiClient.get(`/dashboard/tickets-por-status/${uid}`);
  return res.data;
}

export async function getPesagensPorProduto(
  unidadeId?: string,
): Promise<Array<{ produto: string; total: number }>> {
  if (USE_MOCK) return [];
  const uid = resolveUnidadeId(unidadeId);
  const res = await apiClient.get(`/dashboard/pesagens-por-produto/${uid}`);
  return res.data;
}

export async function getPesagensPorCliente(
  unidadeId?: string,
): Promise<Array<{ cliente: string; total: number }>> {
  if (USE_MOCK) return [];
  const uid = resolveUnidadeId(unidadeId);
  const res = await apiClient.get(`/dashboard/pesagens-por-cliente/${uid}`);
  return res.data;
}

export async function getStatusBalancas(
  unidadeId?: string,
): Promise<Array<{ id: string; nome: string; online: boolean }>> {
  if (USE_MOCK) return [];
  const uid = resolveUnidadeId(unidadeId);
  const res = await apiClient.get(`/dashboard/status-balancas/${uid}`);
  return res.data;
}

export async function getTopClientesVolume(periodo = 'mes'): Promise<TopClienteVolume[]> {
  if (USE_MOCK) return mockApi.getTopClientesVolume(periodo);
  const uid = resolveUnidadeId();
  if (!uid) return [];
  const mes = mesQuery(periodo);
  const res = await apiClient.get(`/dashboard/top-clientes/${uid}`, { params: mes ? { mes } : {} });
  const arr = Array.isArray(res.data) ? res.data : [];
  return arr as unknown as TopClienteVolume[];
}

export async function getDistribuicaoProduto(periodo = 'mes'): Promise<DistribuicaoProduto[]> {
  if (USE_MOCK) return mockApi.getDistribuicaoProduto(periodo);
  const uid = resolveUnidadeId();
  if (!uid) return [];
  const mes = mesQuery(periodo);
  const res = await apiClient.get(`/dashboard/distribuicao-produto/${uid}`, {
    params: mes ? { mes } : {},
  });
  const arr = Array.isArray(res.data) ? res.data : [];
  return arr as unknown as DistribuicaoProduto[];
}
