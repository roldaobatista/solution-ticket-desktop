import { apiClient, resolveUnidadeId, USE_MOCK } from './client';
import { Licenca } from '@/types';
import { mockApi } from '../mock-api';
import { mapLicenca } from './mappers';

export async function getLicenca(unidadeId?: string): Promise<Licenca> {
  if (USE_MOCK) return mockApi.getLicenca();
  const uid = resolveUnidadeId(unidadeId);
  const res = await apiClient.get('/licenca/status', { params: uid ? { unidadeId: uid } : {} });
  return mapLicenca(res.data);
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
  return mapLicenca(res.data);
}

export async function ativarLicenca(params: {
  chave: string;
  unidadeId?: string;
}): Promise<Licenca> {
  if (USE_MOCK) return mockApi.ativarLicenca(params.chave);
  const uid = resolveUnidadeId(params.unidadeId);
  const res = await apiClient.post('/licenca/ativar', { chave: params.chave, unidadeId: uid });
  return mapLicenca(res.data);
}
