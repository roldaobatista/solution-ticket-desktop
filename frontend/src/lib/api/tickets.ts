import { apiClient, toPaginated, USE_MOCK } from './client';
import { TicketPesagem, PassagemPesagem, PaginatedResponse } from '@/types';
import { mockApi } from '../mock-api';

export async function getTickets(
  page?: number,
  limit?: number,
  search?: string,
  statusOperacional?: string,
): Promise<PaginatedResponse<TicketPesagem>> {
  if (USE_MOCK) return mockApi.getTickets(page, limit, search, statusOperacional);
  const res = await apiClient.get('/tickets', {
    params: { page, limit, search, statusOperacional },
  });
  return toPaginated(res.data, page ?? 1, limit ?? 10);
}

export async function getTicketById(id: string): Promise<TicketPesagem> {
  if (USE_MOCK) return mockApi.getTicketById(id);
  const res = await apiClient.get(`/tickets/${id}`);
  return res.data;
}

export async function createTicket(data: Partial<TicketPesagem>): Promise<TicketPesagem> {
  if (USE_MOCK) return mockApi.createTicket(data);
  const res = await apiClient.post('/tickets', data);
  return res.data;
}

export async function fecharTicket(id: string): Promise<TicketPesagem> {
  if (USE_MOCK) return mockApi.fecharTicket(id);
  const res = await apiClient.post(`/tickets/${id}/fechar`);
  return res.data;
}

export async function cancelarTicket(id: string, motivo: string): Promise<TicketPesagem> {
  if (USE_MOCK) return mockApi.cancelarTicket(id, motivo);
  const res = await apiClient.post(`/tickets/${id}/cancelar`, { motivo });
  return res.data;
}

export async function registrarPassagem(
  ticketId: string,
  data: Partial<PassagemPesagem>,
): Promise<PassagemPesagem> {
  if (USE_MOCK) return mockApi.registrarPassagem(ticketId, data);
  const res = await apiClient.post(`/tickets/${ticketId}/passagens`, data);
  return res.data;
}

export async function getTicketsFechados(
  page?: number,
  limit?: number,
  search?: string,
): Promise<PaginatedResponse<TicketPesagem>> {
  if (USE_MOCK) return mockApi.getTickets(page, limit, search, 'FECHADO');
  const res = await apiClient.get('/tickets', {
    params: { page, limit, search, statusOperacional: 'FECHADO' },
  });
  return toPaginated(res.data, page ?? 1, limit ?? 10);
}

export async function solicitarManutencaoTicket(
  id: string,
  data: { motivo: string; camposAlterados?: Record<string, unknown> },
): Promise<TicketPesagem> {
  if (USE_MOCK) return mockApi.getTicketById(id) as Promise<TicketPesagem>;
  const res = await apiClient.post(`/tickets/${id}/manutencao/solicitar`, data);
  return res.data;
}

export async function concluirManutencaoTicket(
  id: string,
  data: { aprovado: boolean; observacao?: string },
): Promise<TicketPesagem> {
  if (USE_MOCK) return mockApi.getTicketById(id) as Promise<TicketPesagem>;
  const res = await apiClient.post(`/tickets/${id}/manutencao/concluir`, data);
  return res.data;
}

export async function updateTicketManutencao(
  id: string,
  data: Partial<TicketPesagem> & { motivo: string },
): Promise<TicketPesagem> {
  if (USE_MOCK) {
    return { ...(await mockApi.getTicketById(id)), ...data } as TicketPesagem;
  }
  return solicitarManutencaoTicket(id, { motivo: data.motivo, camposAlterados: data });
}

export async function reimprimirTicket(id: string): Promise<TicketPesagem> {
  if (USE_MOCK) return mockApi.getTicketById(id) as Promise<TicketPesagem>;
  const res = await apiClient.post(`/tickets/${id}/reimprimir`);
  return res.data;
}

export async function getHistoricoTicket(id: string): Promise<
  Array<{
    id: string;
    ticket_id: string;
    campo: string;
    valor_anterior: string;
    valor_novo: string;
    motivo: string;
    usuario_id: string;
    usuario_nome?: string;
    data_alteracao: string;
  }>
> {
  const res = await apiClient.get(`/tickets/${id}/historico`);
  const d = res.data;
  const arr = Array.isArray(d) ? d : d?.data || [];
  return arr.map((a: Record<string, unknown>) => ({
    id: a.id,
    ticket_id: a.entidadeId,
    campo: a.evento || '',
    valor_anterior: a.estadoAnterior || '',
    valor_novo: a.estadoNovo || '',
    motivo: a.motivo || '',
    usuario_id: a.usuarioId || '',
    usuario_nome: undefined,
    data_alteracao: a.dataHora,
  }));
}
