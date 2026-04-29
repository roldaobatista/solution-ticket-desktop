import { apiClient, USE_MOCK } from './client';
import {
  Balanca,
  BalancaStatus,
  LeituraPeso,
  PaginatedResponse,
  TestarConexaoResult,
} from '@/types';
import { mockApi } from '../mock-api';
import { mapBalanca, mapPaginated } from './mappers';

function mapBalancaPayload(data: Partial<Balanca>): Record<string, unknown> {
  const tipo = data.tipoConexao ?? data.tipo_conexao;
  const protocolo =
    data.protocolo ??
    (tipo === 'TCP'
      ? 'tcp'
      : tipo === 'MODBUS_RTU'
        ? 'modbus-rtu'
        : tipo === 'MODBUS_TCP'
          ? 'modbus-tcp'
          : 'serial');
  return Object.fromEntries(
    Object.entries({
      empresaId: data.empresaId ?? data.empresa_id,
      unidadeId: data.unidadeId ?? data.unidade_id,
      indicadorId: data.indicadorId ?? data.indicador_id,
      nome: data.nome,
      protocolo,
      porta: data.porta || undefined,
      enderecoIp: data.enderecoIp ?? data.endereco_ip ?? data.host,
      portaTcp: data.portaTcp ?? data.porta_tcp,
      ativo: data.ativo ?? data.ativa,
      modbusUnitId: data.modbusUnitId ?? data.modbus_unit_id,
      modbusRegister: data.modbusRegister ?? data.modbus_register,
      modbusFunction: data.modbusFunction ?? data.modbus_function,
      modbusByteOrder: data.modbusByteOrder ?? data.modbus_byte_order,
      modbusWordOrder: data.modbusWordOrder ?? data.modbus_word_order,
      modbusSigned: data.modbusSigned ?? data.modbus_signed,
      modbusScale: data.modbusScale ?? data.modbus_scale,
      modbusOffset: data.modbusOffset ?? data.modbus_offset,
    }).filter(([, value]) => value !== undefined && value !== ''),
  );
}

export async function getBalancas(
  page?: number,
  limit?: number,
  search?: string,
): Promise<PaginatedResponse<Balanca>> {
  if (USE_MOCK) return mockApi.getBalancas(page, limit, search);
  const res = await apiClient.get('/balancas', { params: { page, limit, search } });
  return mapPaginated(res.data, mapBalanca);
}

export async function createBalanca(data: Partial<Balanca>): Promise<Balanca> {
  if (USE_MOCK) return mockApi.createBalanca(data);
  const res = await apiClient.post('/balancas', mapBalancaPayload(data));
  return mapBalanca(res.data);
}

export async function updateBalanca(id: string, data: Partial<Balanca>): Promise<Balanca> {
  if (USE_MOCK) return mockApi.updateBalanca(id, data);
  const res = await apiClient.patch(`/balancas/${id}`, mapBalancaPayload(data));
  return mapBalanca(res.data);
}

export async function deleteBalanca(id: string): Promise<void> {
  if (USE_MOCK) return mockApi.deleteBalanca(id);
  await apiClient.delete(`/balancas/${id}`);
}

export async function getBalancaById(id: string): Promise<Balanca> {
  if (USE_MOCK) {
    const list = await mockApi.getBalancas(1, 1000);
    const found = list.data.find((b: { id: string }) => b.id === id);
    if (!found) throw new Error('Balanca nao encontrada');
    return found;
  }
  const res = await apiClient.get(`/balancas/${id}`);
  return mapBalanca(res.data);
}

export async function getBalancaPeso(id: string): Promise<LeituraPeso> {
  if (USE_MOCK) {
    return {
      peso: Math.floor(Math.random() * 50000) + 10000,
      estavel: Math.random() > 0.3,
      timestamp: new Date().toISOString(),
    };
  }
  const res = await apiClient.get(`/balancas/${id}/peso`);
  return res.data;
}

export async function getBalancaStatus(id: string): Promise<BalancaStatus> {
  if (USE_MOCK) {
    return { online: true, erro: null, ultimaLeitura: new Date().toISOString() };
  }
  const res = await apiClient.get(`/balancas/${id}/status`);
  return res.data;
}

export async function testarBalanca(id: string): Promise<TestarConexaoResult> {
  if (USE_MOCK) return { sucesso: true };
  const res = await apiClient.post(`/balancas/${id}/testar`);
  return res.data;
}

export async function conectarBalanca(id: string): Promise<{ sucesso: boolean; erro?: string }> {
  if (USE_MOCK) return { sucesso: true };
  const res = await apiClient.post(`/balancas/${id}/conectar`);
  return res.data;
}

export async function desconectarBalanca(id: string): Promise<{ sucesso: boolean }> {
  if (USE_MOCK) return { sucesso: true };
  const res = await apiClient.post(`/balancas/${id}/desconectar`);
  return res.data;
}

export async function capturarPeso(id: string): Promise<LeituraPeso> {
  if (USE_MOCK) {
    return {
      peso: Math.floor(Math.random() * 50000) + 10000,
      estavel: true,
      timestamp: new Date().toISOString(),
    };
  }
  const res = await apiClient.post(`/balancas/${id}/capturar`);
  return res.data;
}

/**
 * @deprecated Preferir fetchBalancaStreamUrl que busca token SSE curto.
 * Retorna URL base do stream SEM token (segurança).
 */
export function getBalancaStreamUrl(id: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL || '/api';
  return `${base}/balancas/${id}/stream`;
}

export async function fetchBalancaStreamUrl(id: string): Promise<string> {
  const base = process.env.NEXT_PUBLIC_API_URL || '/api';
  let token = '';
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch(`${base}/auth/sse-token`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${sessionStorage.getItem('access_token') || ''}` },
      });
      if (res.ok) {
        const json = await res.json();
        // Backend envelopa em { success, data, timestamp }; token está em data.token
        token = json.data?.token || '';
      }
    } catch {
      // Sem fallback para JWT principal: stream falhará de forma segura
      token = '';
    }
  }
  const qs = token ? `?access_token=${encodeURIComponent(token)}` : '';
  return `${base}/balancas/${id}/stream${qs}`;
}

export async function calibrarBalanca(
  balancaId: string,
  pesoReferencia: number,
  pesoLido: number,
): Promise<Balanca> {
  if (USE_MOCK) {
    const b = (await mockApi.getBalancas(1, 100)).data.find((x) => x.id === balancaId)!;
    return b;
  }
  const res = await apiClient.post(`/balancas/${balancaId}/calibracoes`, {
    tipo: 'SPAN',
    pesoReferencia,
    pesoLido,
  });
  return mapBalanca(res.data);
}
