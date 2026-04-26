import { apiClient, USE_MOCK } from './client';

export type TipoCalibracao = 'ZERO' | 'SPAN' | 'MULTIPONTO';

export interface Calibracao {
  id: string;
  balancaId: string;
  tipo: TipoCalibracao;
  pesoReferencia: string | number;
  pesoLido: string | number;
  fatorCalculado: string | number;
  observacao?: string | null;
  usuarioId?: string | null;
  realizadoEm: string;
}

export interface StatusCalibracao {
  temCalibracao: boolean;
  vencida: boolean;
  ultimaEm: string | null;
  diasDesde?: number;
}

export async function listarCalibracoes(balancaId: string, limite = 50): Promise<Calibracao[]> {
  if (USE_MOCK) return [];
  const res = await apiClient.get(`/balancas/${balancaId}/calibracoes`, {
    params: { limite },
  });
  return res.data;
}

export async function registrarCalibracao(
  balancaId: string,
  input: {
    tipo: TipoCalibracao;
    pesoReferencia: number;
    pesoLido: number;
    observacao?: string;
  },
): Promise<Calibracao> {
  if (USE_MOCK) throw new Error('Calibracao nao suportada em mock');
  const res = await apiClient.post(`/balancas/${balancaId}/calibracoes`, input);
  return res.data;
}

export async function statusCalibracao(
  balancaId: string,
  diasMaximo = 180,
): Promise<StatusCalibracao> {
  if (USE_MOCK) return { temCalibracao: false, vencida: true, ultimaEm: null };
  const res = await apiClient.get(`/balancas/${balancaId}/calibracoes/status`, {
    params: { diasMaximo },
  });
  return res.data;
}
