import { apiClient, resolveUnidadeId, mesQuery, USE_MOCK } from './client';
import { DashboardKpis, PesagensPorPeriodo, TopClienteVolume, DistribuicaoProduto } from '@/types';
import { mockApi } from '../mock-api';
import {
  mapDashboardKpis,
  mapPesagensPorPeriodo,
  mapStatusBalanca,
  mapTopCliente,
  mapDistribuicaoProduto,
} from './mappers';

export async function getDashboardKpis(unidadeId?: string): Promise<DashboardKpis> {
  if (USE_MOCK) return mockApi.getDashboardKpis();
  const uid = resolveUnidadeId(unidadeId);
  const res = await apiClient.get(`/dashboard/kpis/${uid}`);
  return mapDashboardKpis(res.data);
}

export async function getPesagensPorPeriodo(
  periodo: string,
  unidadeId?: string,
): Promise<PesagensPorPeriodo[]> {
  if (USE_MOCK) return mockApi.getPesagensPorPeriodo(periodo);
  const uid = resolveUnidadeId(unidadeId);
  const res = await apiClient.get(`/dashboard/evolucao-diaria/${uid}`, { params: { periodo } });
  const arr = Array.isArray(res.data) ? res.data : [];
  return arr.map(mapPesagensPorPeriodo);
}

export async function getTicketsPorStatus(
  unidadeId?: string,
): Promise<Array<{ status: string; total: number }>> {
  if (USE_MOCK) return [];
  const uid = resolveUnidadeId(unidadeId);
  const res = await apiClient.get(`/dashboard/tickets-por-status/${uid}`);
  const d = res.data;
  return Array.isArray(d) ? d : d?.data || [];
}

export async function getPesagensPorProduto(
  unidadeId?: string,
): Promise<Array<{ produto: string; total: number }>> {
  if (USE_MOCK) return [];
  const uid = resolveUnidadeId(unidadeId);
  const res = await apiClient.get(`/dashboard/pesagens-por-produto/${uid}`);
  const d = res.data;
  return Array.isArray(d) ? d : d?.data || [];
}

export async function getPesagensPorCliente(
  unidadeId?: string,
): Promise<Array<{ cliente: string; total: number }>> {
  if (USE_MOCK) return [];
  const uid = resolveUnidadeId(unidadeId);
  const res = await apiClient.get(`/dashboard/pesagens-por-cliente/${uid}`);
  const d = res.data;
  return Array.isArray(d) ? d : d?.data || [];
}

export async function getStatusBalancas(
  unidadeId?: string,
): Promise<Array<{ id: string; nome: string; online: boolean }>> {
  if (USE_MOCK) return [];
  const uid = resolveUnidadeId(unidadeId);
  const res = await apiClient.get(`/dashboard/status-balancas/${uid}`);
  const arr = Array.isArray(res.data) ? res.data : [];
  return arr.map(mapStatusBalanca);
}

export async function getTopClientesVolume(periodo = 'mes'): Promise<TopClienteVolume[]> {
  if (USE_MOCK) return mockApi.getTopClientesVolume(periodo);
  const uid = resolveUnidadeId();
  if (!uid) return [];
  const mes = mesQuery(periodo);
  const res = await apiClient.get(`/dashboard/top-clientes/${uid}`, { params: mes ? { mes } : {} });
  const arr = Array.isArray(res.data) ? res.data : [];
  return arr.map(mapTopCliente);
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
  return arr.map(mapDistribuicaoProduto);
}
