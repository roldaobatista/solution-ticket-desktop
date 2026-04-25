import { apiClient, resolveUnidadeId, USE_MOCK } from './client';
import { Licenca } from '@/types';
import { mockApi } from '../mock-api';

export async function getLicenca(unidadeId?: string): Promise<Licenca> {
  if (USE_MOCK) return mockApi.getLicenca();
  const uid = resolveUnidadeId(unidadeId);
  const res = await apiClient.get('/licenca/status', { params: uid ? { unidadeId: uid } : {} });
  return res.data;
}

export async function getLicencaFingerprint(): Promise<{ fingerprint: string }> {
  if (USE_MOCK) return { fingerprint: 'MOCK-FINGERPRINT' };
  const res = await apiClient.get('/licenca/fingerprint');
  return res.data;
}

export async function iniciarTrialLicenca(unidadeId?: string): Promise<Licenca> {
  if (USE_MOCK) return mockApi.getLicenca();
  const uid = resolveUnidadeId(unidadeId);
  const res = await apiClient.post('/licenca/iniciar-trial', uid ? { unidadeId: uid } : {});
  return res.data;
}

export async function ativarLicenca(chave: string): Promise<Licenca> {
  if (USE_MOCK) return mockApi.ativarLicenca(chave);
  const res = await apiClient.post('/licenca/ativar', { chave });
  return res.data;
}
