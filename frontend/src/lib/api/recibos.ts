import { apiClient, resolveTenantId, USE_MOCK } from './client';

export interface Recibo {
  id: string;
  tenantId?: string;
  data: string;
  cedente: string;
  sacado: string;
  valor: number;
  telefone?: string | null;
  celular?: string | null;
  cpf?: string | null;
  endereco?: string | null;
  valorExtenso?: string | null;
  referente?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export async function getRecibos(tenantId?: string): Promise<Recibo[]> {
  if (USE_MOCK) return [];
  const tid = tenantId || resolveTenantId();
  const res = await apiClient.get('/recibos', { params: tid ? { tenantId: tid } : {} });
  const d = res.data;
  return Array.isArray(d) ? d : d?.data || [];
}

export async function getReciboById(id: string): Promise<Recibo> {
  const res = await apiClient.get(`/recibos/${id}`);
  return res.data;
}

export async function createRecibo(data: Partial<Recibo>): Promise<Recibo> {
  const payload = { ...data, tenantId: data.tenantId || resolveTenantId() };
  const res = await apiClient.post('/recibos', payload);
  return res.data;
}

export async function updateRecibo(id: string, data: Partial<Recibo>): Promise<Recibo> {
  const res = await apiClient.patch(`/recibos/${id}`, data);
  return res.data;
}

export async function deleteRecibo(id: string): Promise<void> {
  await apiClient.delete(`/recibos/${id}`);
}

export async function imprimirRecibo(id: string): Promise<void> {
  const res = await apiClient.get(`/recibos/${id}/pdf`, { responseType: 'blob' });
  const blob = new Blob([res.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => window.URL.revokeObjectURL(url), 60000);
}
