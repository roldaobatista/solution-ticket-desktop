import { apiClient, USE_MOCK } from './client';
import {
  MovimentacaoRelatorio,
  FiltroRelatorioValues,
  PesagemAlterada,
  PesagemExcluida,
} from '@/types';
import { mockApi } from '../mock-api';

export async function getRelatorioMovimentacao(
  filtros: FiltroRelatorioValues,
): Promise<MovimentacaoRelatorio[]> {
  if (USE_MOCK) return mockApi.getRelatorioMovimentacao(filtros);
  const res = await apiClient.get('/relatorios/movimento', { params: filtros });
  const d = res.data;
  return Array.isArray(d) ? d : d?.data || [];
}

export async function exportarRelatorioMovimentacaoPdf(
  filtros: FiltroRelatorioValues,
  variante: '001' | '002' = '001',
): Promise<Blob> {
  if (USE_MOCK) return mockApi.exportarRelatorioMovimentacaoPdf();
  const res = await apiClient.get('/relatorios/movimento/pdf', {
    params: { ...filtros, variante },
    responseType: 'blob',
  });
  return res.data as Blob;
}

export async function getPesagensAlteradas(
  filtros: FiltroRelatorioValues,
): Promise<PesagemAlterada[]> {
  if (USE_MOCK) return mockApi.getPesagensAlteradas(filtros);
  const res = await apiClient.get('/relatorios/alteradas', { params: filtros });
  const d = res.data;
  return Array.isArray(d) ? d : d?.data || [];
}

export async function exportarRelatorioAlteradasPdf(filtros: FiltroRelatorioValues): Promise<Blob> {
  if (USE_MOCK) return new Blob([], { type: 'application/pdf' });
  const res = await apiClient.get('/relatorios/alteradas/pdf', {
    params: filtros,
    responseType: 'blob',
  });
  return res.data as Blob;
}

export async function getPesagensExcluidas(
  filtros: FiltroRelatorioValues,
): Promise<PesagemExcluida[]> {
  if (USE_MOCK) return mockApi.getPesagensExcluidas(filtros);
  const res = await apiClient.get('/relatorios/canceladas', { params: filtros });
  const d = res.data;
  return Array.isArray(d) ? d : d?.data || [];
}

export async function exportarRelatorioCanceladasPdf(
  filtros: FiltroRelatorioValues,
): Promise<Blob> {
  if (USE_MOCK) return new Blob([], { type: 'application/pdf' });
  const res = await apiClient.get('/relatorios/canceladas/pdf', {
    params: filtros,
    responseType: 'blob',
  });
  return res.data as Blob;
}

export async function getPassagensPorBalanca(filtros: FiltroRelatorioValues): Promise<unknown[]> {
  if (USE_MOCK) return [];
  const res = await apiClient.get('/relatorios/passagens-por-balanca', { params: filtros });
  const d = res.data;
  return Array.isArray(d) ? d : d?.data || [];
}

// --- Relatorios salvos (Gap 4.4) ---
export interface RelatorioSalvo {
  id: string;
  tenantId: string;
  nome: string;
  modulo: string;
  filtros: string;
  criadoEm: string;
  atualizadoEm: string;
}

export async function listarRelatoriosSalvos(modulo?: string): Promise<RelatorioSalvo[]> {
  const res = await apiClient.get('/relatorios-salvos', { params: modulo ? { modulo } : {} });
  return Array.isArray(res.data) ? res.data : res.data?.data || [];
}

export async function criarRelatorioSalvo(
  nome: string,
  modulo: string,
  filtros: FiltroRelatorioValues,
): Promise<RelatorioSalvo> {
  const res = await apiClient.post('/relatorios-salvos', { nome, modulo, filtros });
  return res.data;
}

export async function deletarRelatorioSalvo(id: string): Promise<void> {
  await apiClient.delete(`/relatorios-salvos/${id}`);
}
