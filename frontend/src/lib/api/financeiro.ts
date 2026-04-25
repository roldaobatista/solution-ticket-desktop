import { apiClient, toPaginated, USE_MOCK } from './client';
import {
  Fatura,
  PagamentoFatura,
  TicketPesagem,
  TipoFatura,
  FormaPagamento,
  SaldoCliente,
  ExtratoItem,
  PaginatedResponse,
} from '@/types';
import { mockApi } from '../mock-api';

export async function getFaturas(
  page?: number,
  limit?: number,
): Promise<PaginatedResponse<Fatura>> {
  if (USE_MOCK) return mockApi.getFaturas(page, limit);
  const res = await apiClient.get('/faturas', { params: { page, limit } });
  return toPaginated(res.data, page ?? 1, limit ?? 10);
}

export async function getFaturaById(id: string): Promise<Fatura> {
  if (USE_MOCK) return mockApi.getFaturaById(id);
  const res = await apiClient.get(`/faturas/${id}`);
  return res.data;
}

export async function createFatura(data: {
  cliente_id: string;
  tipo_fatura_id: string;
  tickets_ids: string[];
  observacao?: string;
}): Promise<Fatura> {
  if (USE_MOCK) return mockApi.createFatura(data);
  const res = await apiClient.post('/faturas', data);
  return res.data;
}

export async function cancelarFatura(id: string, motivo: string): Promise<Fatura> {
  if (USE_MOCK) return mockApi.cancelarFatura(id, motivo);
  const res = await apiClient.patch(`/faturas/${id}`, {
    status: 'CANCELADA',
    motivoCancelamento: motivo,
  });
  return res.data;
}

export async function getTicketsPendentesFaturamento(
  cliente_id?: string,
): Promise<TicketPesagem[]> {
  if (USE_MOCK) return mockApi.getTicketsPendentesFaturamento(cliente_id);
  try {
    const res = await apiClient.get('/tickets', {
      params: { status: 'FECHADO', faturado: false, cliente_id, limit: 1000 },
    });
    const d = res.data;
    return Array.isArray(d) ? d : d?.data || [];
  } catch {
    return [];
  }
}

export async function getTiposFatura(): Promise<TipoFatura[]> {
  if (USE_MOCK) return mockApi.getTiposFatura();
  const res = await apiClient.get('/faturas/tipos');
  const d = res.data;
  return Array.isArray(d) ? d : d?.data || [];
}

// --- Pagamentos ---
export async function getPagamentos(
  page = 1,
  limit = 10,
  fatura_id?: string,
): Promise<PaginatedResponse<PagamentoFatura>> {
  if (USE_MOCK) return mockApi.getPagamentos(page, limit, fatura_id);
  if (fatura_id) {
    try {
      const res = await apiClient.get(`/faturas/${fatura_id}`);
      const pagamentos = res.data?.pagamentos || [];
      return {
        data: pagamentos,
        total: pagamentos.length,
        page: 1,
        limit: pagamentos.length || 10,
        totalPages: 1,
      };
    } catch {
      return { data: [], total: 0, page: 1, limit, totalPages: 0 };
    }
  }
  return { data: [], total: 0, page: 1, limit, totalPages: 0 };
}

export async function createPagamento(
  data: Partial<PagamentoFatura> & { fatura_id?: string; faturaId?: string },
): Promise<PagamentoFatura> {
  if (USE_MOCK) return mockApi.createPagamento(data);
  const faturaId = data.faturaId || data.fatura_id;
  if (!faturaId) throw new Error('faturaId e obrigatorio para registrar pagamento');
  const res = await apiClient.post(`/faturas/${faturaId}/pagamentos`, data);
  return res.data;
}

export async function baixarPagamento(id: string): Promise<PagamentoFatura> {
  if (USE_MOCK) return mockApi.baixarPagamento(id);
  const res = await apiClient.post(`/faturas/pagamentos/${id}/baixar`);
  return res.data;
}

export async function getFormasPagamento(): Promise<FormaPagamento[]> {
  if (USE_MOCK) return mockApi.getFormasPagamento();
  const res = await apiClient.get('/formas-pagamento');
  const d = res.data;
  return Array.isArray(d) ? d : d?.data || [];
}

// --- Saldos / extrato ---
export async function getSaldosClientes(cliente_id?: string): Promise<SaldoCliente[]> {
  if (USE_MOCK) return mockApi.getSaldosClientes();
  const res = await apiClient.get('/comercial/saldos', {
    params: cliente_id ? { clienteId: cliente_id } : {},
  });
  const d = res.data;
  return Array.isArray(d) ? d : d?.data || [];
}

export async function getExtratoCliente(
  cliente_id: string,
  inicio?: string,
  fim?: string,
): Promise<ExtratoItem[]> {
  if (USE_MOCK) return mockApi.getExtratoCliente(cliente_id);
  const res = await apiClient.get(`/comercial/extrato/${cliente_id}`, { params: { inicio, fim } });
  const d = res.data;
  return Array.isArray(d) ? d : d?.data || [];
}
