import { apiClient, resolveUnidadeId, USE_MOCK } from './client';
import { ConfiguracaoOperacional } from '@/types';
import { mockApi } from '../mock-api';

export async function getConfiguracao(unidadeId?: string): Promise<ConfiguracaoOperacional> {
  if (USE_MOCK) return mockApi.getConfiguracao();
  const uid = resolveUnidadeId(unidadeId);
  if (uid) {
    const res = await apiClient.get(`/configuracoes/unidade/${uid}`);
    return res.data;
  }
  const res = await apiClient.get('/configuracoes');
  return res.data;
}

export async function updateConfiguracao(
  data: Partial<ConfiguracaoOperacional> & { id?: string },
): Promise<ConfiguracaoOperacional> {
  if (USE_MOCK) return mockApi.updateConfiguracao(data);
  if (data.id) {
    const res = await apiClient.patch(`/configuracoes/${data.id}`, data);
    return res.data;
  }
  const res = await apiClient.post('/configuracoes', data);
  return res.data;
}
