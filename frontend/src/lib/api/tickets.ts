import { apiClient, USE_MOCK } from './client';
import { TicketPesagem, PassagemPesagem, PaginatedResponse } from '@/types';
import { mockApi } from '../mock-api';
import { mapTicket, mapPassagem, mapPaginatedTickets } from './mappers';

type LooseTicketPayload = Partial<TicketPesagem> & Record<string, unknown>;
type LoosePassagemPayload = Partial<PassagemPesagem> & Record<string, unknown>;

function mapCreateTicketPayload(data: LooseTicketPayload): Record<string, unknown> {
  const raw = data as Record<string, unknown>;
  const fluxo = raw.fluxoPesagem ?? raw.fluxo_pesagem;
  const fluxoPesagem =
    fluxo === '1PF_TARA_REFERENCIADA'
      ? 'PF1_TARA_REFERENCIADA'
      : fluxo === '2PF_BRUTO_TARA'
        ? 'PF2_BRUTO_TARA'
        : fluxo;
  return {
    unidadeId: raw.unidadeId ?? raw.unidade_id ?? raw.balanca_id,
    clienteId: raw.clienteId ?? raw.cliente_id,
    produtoId: raw.produtoId ?? raw.produto_id,
    veiculoId: raw.veiculoId ?? raw.veiculo_id,
    veiculoPlaca: raw.veiculoPlaca ?? raw.veiculo_placa,
    motoristaId: raw.motoristaId ?? raw.motorista_id,
    transportadoraId: raw.transportadoraId ?? raw.transportadora_id,
    origemId: raw.origemId ?? raw.origem_id,
    destinoId: raw.destinoId ?? raw.destino_id,
    armazemId: raw.armazemId ?? raw.armazem_id,
    indicadorPesagemId: raw.indicadorPesagemId ?? raw.indicador_pesagem_id,
    notaFiscal: raw.notaFiscal ?? raw.nota_fiscal,
    pesoNf: raw.pesoNf ?? raw.peso_nf,
    observacao: raw.observacao,
    fluxoPesagem: fluxoPesagem ?? 'PF2_BRUTO_TARA',
    taraReferenciaTipo: raw.taraReferenciaTipo ?? raw.tara_referencia_tipo,
    modoComercial: raw.modoComercial ?? raw.modo_comercial,
    taraManual: raw.taraManual ?? raw.tara_manual,
  };
}

function mapPassagemPayload(data: LoosePassagemPayload): Record<string, unknown> {
  const raw = data as Record<string, unknown>;
  const origem = raw.origemLeitura ?? raw.origem_leitura;
  return {
    tipoPassagem:
      raw.tipoPassagem ??
      (raw.tipo_passagem === 'ENTRADA' || raw.tipo_passagem === 'SAIDA'
        ? 'OFICIAL'
        : raw.tipo_passagem),
    direcaoOperacional:
      raw.direcaoOperacional ??
      raw.direcao_operacional ??
      (raw.tipo_passagem === 'SAIDA' ? 'SAIDA' : 'ENTRADA'),
    papelCalculo: raw.papelCalculo ?? raw.papel_calculo,
    condicaoVeiculo:
      raw.condicaoVeiculo ??
      raw.condicao_veiculo ??
      (raw.tipo_passagem === 'SAIDA' ? 'VAZIO' : 'CARREGADO'),
    pesoCapturado: raw.pesoCapturado ?? raw.peso_capturado,
    dataHora: raw.dataHora ?? raw.data_hora,
    balancaId: raw.balancaId ?? raw.balanca_id,
    origemLeitura: origem === 'BALANCA' ? 'BALANCA_SERIAL' : origem,
    indicadorEstabilidade: raw.indicadorEstabilidade ?? raw.indicador_estabilidade,
    sequenceNoDispositivo: raw.sequenceNoDispositivo ?? raw.sequence_no_dispositivo,
    eventIdOrigem: raw.eventIdOrigem ?? raw.event_id_origem,
    observacao: raw.observacao,
  };
}

export async function getTickets(
  page?: number,
  limit?: number,
  search?: string,
  statusOperacional?: string,
  filters?: { dataInicio?: string; dataFim?: string; placa?: string; numero?: string },
): Promise<PaginatedResponse<TicketPesagem>> {
  if (USE_MOCK) return mockApi.getTickets(page, limit, search, statusOperacional);
  const res = await apiClient.get('/tickets', {
    params: { page, limit, search, statusOperacional, ...filters },
  });
  return mapPaginatedTickets(res.data);
}

export async function getTicketById(id: string): Promise<TicketPesagem> {
  if (USE_MOCK) return mockApi.getTicketById(id);
  const res = await apiClient.get(`/tickets/${id}`);
  return mapTicket(res.data);
}

export async function createTicket(data: LooseTicketPayload): Promise<TicketPesagem> {
  if (USE_MOCK) return mockApi.createTicket(data);
  const res = await apiClient.post('/tickets', mapCreateTicketPayload(data));
  return mapTicket(res.data);
}

export async function fecharTicket(id: string): Promise<TicketPesagem> {
  if (USE_MOCK) return mockApi.fecharTicket(id);
  const res = await apiClient.post(`/tickets/${id}/fechar`);
  return mapTicket(res.data);
}

export async function cancelarTicket(id: string, motivo: string): Promise<TicketPesagem> {
  if (USE_MOCK) return mockApi.cancelarTicket(id, motivo);
  const res = await apiClient.post(`/tickets/${id}/cancelar`, { motivo });
  return mapTicket(res.data);
}

export async function registrarPassagem(
  ticketId: string,
  data: LoosePassagemPayload,
): Promise<PassagemPesagem> {
  if (USE_MOCK) return mockApi.registrarPassagem(ticketId, data);
  const res = await apiClient.post(`/tickets/${ticketId}/passagens`, mapPassagemPayload(data));
  return mapPassagem(res.data);
}

export async function adicionarDescontoTicket(
  ticketId: string,
  data: { tipo: string; descricao?: string; valor: number; percentual?: number; origem?: string },
): Promise<unknown> {
  if (USE_MOCK) return { ok: true };
  const res = await apiClient.post(`/tickets/${ticketId}/descontos`, data);
  return res.data;
}

export async function finalizarPesagemOperacional(data: {
  ticket_id?: string;
  ticket?: LooseTicketPayload;
  passagem: LoosePassagemPayload;
  desconto?: {
    tipo: string;
    descricao?: string;
    valor: number;
    percentual?: number;
    origem?: string;
  };
  fechar?: boolean;
  idempotency_key?: string;
}): Promise<TicketPesagem> {
  if (USE_MOCK) {
    const ticket = data.ticket_id
      ? await mockApi.getTicketById(data.ticket_id)
      : await mockApi.createTicket(data.ticket ?? {});
    await mockApi.registrarPassagem(ticket.id, data.passagem);
    if (data.fechar !== false) return mockApi.fecharTicket(ticket.id);
    return ticket;
  }
  const res = await apiClient.post('/tickets/finalizar-pesagem', {
    ticketId: data.ticket_id,
    ticket: data.ticket ? mapCreateTicketPayload(data.ticket) : undefined,
    passagem: mapPassagemPayload(data.passagem),
    desconto: data.desconto,
    fechar: data.fechar,
    idempotencyKey: data.idempotency_key,
  });
  return mapTicket(res.data);
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
  return mapPaginatedTickets(res.data);
}

export async function solicitarManutencaoTicket(
  id: string,
  data: { motivo: string; camposAlterados?: Record<string, unknown> },
): Promise<TicketPesagem> {
  if (USE_MOCK) return mockApi.getTicketById(id) as Promise<TicketPesagem>;
  const res = await apiClient.post(`/tickets/${id}/manutencao/solicitar`, data);
  return mapTicket(res.data);
}

export async function concluirManutencaoTicket(
  id: string,
  data: { aprovado: boolean; observacao?: string },
): Promise<TicketPesagem> {
  if (USE_MOCK) return mockApi.getTicketById(id) as Promise<TicketPesagem>;
  const res = await apiClient.post(`/tickets/${id}/manutencao/concluir`, data);
  return mapTicket(res.data);
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
  return mapTicket(res.data);
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
