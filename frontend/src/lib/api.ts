// Infra (axios, interceptors, helpers) extraída para api/client.ts.
// Este arquivo concentra os endpoints por domínio — em migração para api/*.ts.
export { apiClient, toPaginated, resolveUnidadeId, USE_MOCK } from './api/client';
import { apiClient, toPaginated, resolveUnidadeId, USE_MOCK } from './api/client';
import {
  Cliente,
  Transportadora,
  Motorista,
  Produto,
  Veiculo,
  Balanca,
  BalancaStatus,
  LeituraPeso,
  TestarConexaoResult,
  IndicadorPesagem,
  TicketPesagem,
  PassagemPesagem,
  Romaneio,
  Fatura,
  PagamentoFatura,
  Usuario,
  Licenca,
  ConfiguracaoOperacional,
  DashboardKpis,
  PesagensPorPeriodo,
  PaginatedResponse,
  TopClienteVolume,
  DistribuicaoProduto,
  TipoFatura,
  FormaPagamento,
  SaldoCliente,
  ExtratoItem,
  TabelaPrecoProduto,
  TabelaPrecoProdutoCliente,
  HistoricoPreco,
  PesagemAlterada,
  PesagemExcluida,
  MovimentacaoRelatorio,
  FiltroRelatorioValues,
  Armazem,
  Empresa,
  TipoVeiculo,
  Unidade,
  UsuarioCadastro,
  Perfil,
} from '@/types';
import { mockApi } from './mock-api';

// Auth
export async function login(
  email: string,
  senha: string,
): Promise<{ access_token: string; usuario: Usuario }> {
  if (USE_MOCK) return mockApi.login(email, senha);
  const res = await apiClient.post('/auth/login', { email, senha });
  const raw = res.data as {
    accessToken?: string;
    access_token?: string;
    usuario: Usuario & { unidadeId?: string; unidade_id?: string };
  };
  const usuario = raw.usuario;
  // Persiste unidadeId para chamadas que precisam dele na URL
  if (typeof window !== 'undefined' && usuario) {
    const uid = (usuario as any).unidadeId || (usuario as any).unidade_id;
    if (uid) localStorage.setItem('unidade_id', uid);
  }
  return {
    access_token: raw.access_token ?? raw.accessToken ?? '',
    usuario,
  };
}

export async function getMe(): Promise<Usuario> {
  if (USE_MOCK) return mockApi.getMe();
  const res = await apiClient.get('/auth/me');
  const usuario = res.data as Usuario & { unidadeId?: string; unidade_id?: string };
  if (typeof window !== 'undefined' && usuario) {
    const uid = (usuario as any).unidadeId || (usuario as any).unidade_id;
    if (uid) localStorage.setItem('unidade_id', uid);
  }
  return usuario;
}

// Dashboard

export async function getDashboardKpis(unidadeId?: string): Promise<DashboardKpis> {
  if (USE_MOCK) return mockApi.getDashboardKpis();
  const uid = resolveUnidadeId(unidadeId);
  const res = await apiClient.get(`/dashboard/kpis/${uid}`);
  return res.data;
}

export async function getPesagensPorPeriodo(
  periodo: string,
  unidadeId?: string,
): Promise<PesagensPorPeriodo[]> {
  if (USE_MOCK) return mockApi.getPesagensPorPeriodo(periodo);
  const uid = resolveUnidadeId(unidadeId);
  const res = await apiClient.get(`/dashboard/evolucao-diaria/${uid}`, { params: { periodo } });
  return res.data;
}

export async function getTicketsPorStatus(
  unidadeId?: string,
): Promise<Array<{ status: string; total: number }>> {
  if (USE_MOCK) return [];
  const uid = resolveUnidadeId(unidadeId);
  const res = await apiClient.get(`/dashboard/tickets-por-status/${uid}`);
  return res.data;
}

export async function getPesagensPorProduto(
  unidadeId?: string,
): Promise<Array<{ produto: string; total: number }>> {
  if (USE_MOCK) return [];
  const uid = resolveUnidadeId(unidadeId);
  const res = await apiClient.get(`/dashboard/pesagens-por-produto/${uid}`);
  return res.data;
}

export async function getPesagensPorCliente(
  unidadeId?: string,
): Promise<Array<{ cliente: string; total: number }>> {
  if (USE_MOCK) return [];
  const uid = resolveUnidadeId(unidadeId);
  const res = await apiClient.get(`/dashboard/pesagens-por-cliente/${uid}`);
  return res.data;
}

export async function getStatusBalancas(
  unidadeId?: string,
): Promise<Array<{ id: string; nome: string; online: boolean }>> {
  if (USE_MOCK) return [];
  const uid = resolveUnidadeId(unidadeId);
  const res = await apiClient.get(`/dashboard/status-balancas/${uid}`);
  return res.data;
}

// Clientes
export async function getClientes(
  page?: number,
  limit?: number,
  search?: string,
): Promise<PaginatedResponse<Cliente>> {
  if (USE_MOCK) return mockApi.getClientes(page, limit, search);
  const res = await apiClient.get('/clientes', { params: { page, limit, search } });
  return toPaginated(res.data, page ?? 1, limit ?? 10);
}

export async function getClienteById(id: string): Promise<Cliente> {
  if (USE_MOCK) return mockApi.getClienteById(id);
  const res = await apiClient.get(`/clientes/${id}`);
  return res.data;
}

export async function createCliente(data: Partial<Cliente>): Promise<Cliente> {
  if (USE_MOCK) return mockApi.createCliente(data);
  const res = await apiClient.post('/clientes', data);
  return res.data;
}

export async function updateCliente(id: string, data: Partial<Cliente>): Promise<Cliente> {
  if (USE_MOCK) return mockApi.updateCliente(id, data);
  const res = await apiClient.put(`/clientes/${id}`, data);
  return res.data;
}

export async function deleteCliente(id: string): Promise<void> {
  if (USE_MOCK) return mockApi.deleteCliente(id);
  await apiClient.delete(`/clientes/${id}`);
}

// Transportadoras
export async function getTransportadoras(
  page?: number,
  limit?: number,
  search?: string,
): Promise<PaginatedResponse<Transportadora>> {
  if (USE_MOCK) return mockApi.getTransportadoras(page, limit, search);
  const res = await apiClient.get('/transportadoras', { params: { page, limit, search } });
  return toPaginated(res.data, page ?? 1, limit ?? 10);
}

export async function createTransportadora(data: Partial<Transportadora>): Promise<Transportadora> {
  if (USE_MOCK) return mockApi.createTransportadora(data);
  const res = await apiClient.post('/transportadoras', data);
  return res.data;
}

export async function updateTransportadora(
  id: string,
  data: Partial<Transportadora>,
): Promise<Transportadora> {
  if (USE_MOCK) return mockApi.updateTransportadora(id, data);
  const res = await apiClient.put(`/transportadoras/${id}`, data);
  return res.data;
}

export async function deleteTransportadora(id: string): Promise<void> {
  if (USE_MOCK) return mockApi.deleteTransportadora(id);
  await apiClient.delete(`/transportadoras/${id}`);
}

// Motoristas
export async function getMotoristas(
  page?: number,
  limit?: number,
  search?: string,
): Promise<PaginatedResponse<Motorista>> {
  if (USE_MOCK) return mockApi.getMotoristas(page, limit, search);
  const res = await apiClient.get('/motoristas', { params: { page, limit, search } });
  return toPaginated(res.data, page ?? 1, limit ?? 10);
}

export async function createMotorista(data: Partial<Motorista>): Promise<Motorista> {
  if (USE_MOCK) return mockApi.createMotorista(data);
  const res = await apiClient.post('/motoristas', data);
  return res.data;
}

export async function updateMotorista(id: string, data: Partial<Motorista>): Promise<Motorista> {
  if (USE_MOCK) return mockApi.updateMotorista(id, data);
  const res = await apiClient.put(`/motoristas/${id}`, data);
  return res.data;
}

export async function deleteMotorista(id: string): Promise<void> {
  if (USE_MOCK) return mockApi.deleteMotorista(id);
  await apiClient.delete(`/motoristas/${id}`);
}

// Produtos
export async function getProdutos(
  page?: number,
  limit?: number,
  search?: string,
): Promise<PaginatedResponse<Produto>> {
  if (USE_MOCK) return mockApi.getProdutos(page, limit, search);
  const res = await apiClient.get('/produtos', { params: { page, limit, search } });
  return toPaginated(res.data, page ?? 1, limit ?? 10);
}

export async function createProduto(data: Partial<Produto>): Promise<Produto> {
  if (USE_MOCK) return mockApi.createProduto(data);
  const res = await apiClient.post('/produtos', data);
  return res.data;
}

export async function updateProduto(id: string, data: Partial<Produto>): Promise<Produto> {
  if (USE_MOCK) return mockApi.updateProduto(id, data);
  const res = await apiClient.put(`/produtos/${id}`, data);
  return res.data;
}

export async function deleteProduto(id: string): Promise<void> {
  if (USE_MOCK) return mockApi.deleteProduto(id);
  await apiClient.delete(`/produtos/${id}`);
}

// Veiculos
export async function getVeiculos(
  page?: number,
  limit?: number,
  search?: string,
): Promise<PaginatedResponse<Veiculo>> {
  if (USE_MOCK) return mockApi.getVeiculos(page, limit, search);
  const res = await apiClient.get('/veiculos', { params: { page, limit, search } });
  return toPaginated(res.data, page ?? 1, limit ?? 10);
}

export async function createVeiculo(data: Partial<Veiculo>): Promise<Veiculo> {
  if (USE_MOCK) return mockApi.createVeiculo(data);
  const res = await apiClient.post('/veiculos', data);
  return res.data;
}

export async function updateVeiculo(id: string, data: Partial<Veiculo>): Promise<Veiculo> {
  if (USE_MOCK) return mockApi.updateVeiculo(id, data);
  const res = await apiClient.put(`/veiculos/${id}`, data);
  return res.data;
}

export async function deleteVeiculo(id: string): Promise<void> {
  if (USE_MOCK) return mockApi.deleteVeiculo(id);
  await apiClient.delete(`/veiculos/${id}`);
}

// Balancas
export async function getBalancas(
  page?: number,
  limit?: number,
  search?: string,
): Promise<PaginatedResponse<Balanca>> {
  if (USE_MOCK) return mockApi.getBalancas(page, limit, search);
  const res = await apiClient.get('/balancas', { params: { page, limit, search } });
  return toPaginated(res.data, page ?? 1, limit ?? 10);
}

export async function createBalanca(data: Partial<Balanca>): Promise<Balanca> {
  if (USE_MOCK) return mockApi.createBalanca(data);
  const res = await apiClient.post('/balancas', data);
  return res.data;
}

export async function updateBalanca(id: string, data: Partial<Balanca>): Promise<Balanca> {
  if (USE_MOCK) return mockApi.updateBalanca(id, data);
  const res = await apiClient.put(`/balancas/${id}`, data);
  return res.data;
}

export async function deleteBalanca(id: string): Promise<void> {
  if (USE_MOCK) return mockApi.deleteBalanca(id);
  await apiClient.delete(`/balancas/${id}`);
}

export async function getBalancaById(id: string): Promise<Balanca> {
  if (USE_MOCK) {
    const list = await mockApi.getBalancas(1, 1000);
    const found = list.data.find((b: any) => b.id === id);
    if (!found) throw new Error('Balanca nao encontrada');
    return found;
  }
  const res = await apiClient.get(`/balancas/${id}`);
  return res.data;
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
  if (USE_MOCK) {
    return { sucesso: true };
  }
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

// Indicadores de Pesagem
export async function getIndicadores(): Promise<IndicadorPesagem[]> {
  if (USE_MOCK) {
    return [
      {
        id: 'ind1',
        modelo: 'Alfa 3100',
        fabricante: 'Toledo',
        parserTipo: 'TOLEDO',
        baudrate: 9600,
        databits: 8,
        stopbits: 1,
        parity: 'N',
        fator: 1,
        invertePeso: false,
      },
      {
        id: 'ind2',
        modelo: '9091',
        fabricante: 'Filizola',
        parserTipo: 'FILIZOLA',
        baudrate: 9600,
        databits: 8,
        stopbits: 1,
        parity: 'N',
        fator: 1,
        invertePeso: false,
      },
      {
        id: 'ind3',
        modelo: 'MIC-3',
        fabricante: 'Micro Sensores',
        parserTipo: 'MIC3',
        baudrate: 4800,
        databits: 8,
        stopbits: 1,
        parity: 'N',
        fator: 1,
        invertePeso: false,
      },
    ];
  }
  const res = await apiClient.get('/indicadores');
  return res.data?.data || res.data;
}

// Unidades (para select)
export async function getUnidades(): Promise<Array<{ id: string; nome: string }>> {
  if (USE_MOCK) {
    return [
      { id: 'un1', nome: 'Unidade Matriz' },
      { id: 'un2', nome: 'Unidade Filial' },
    ];
  }
  const res = await apiClient.get('/empresa/unidades/list');
  const d = res.data;
  return Array.isArray(d) ? d : d?.data || [];
}

export function getBalancaStreamUrl(id: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL || '/api';
  return `${base}/balancas/${id}/stream`;
}

// Tickets
export async function getTickets(
  page?: number,
  limit?: number,
  search?: string,
  status?: string,
): Promise<PaginatedResponse<TicketPesagem>> {
  if (USE_MOCK) return mockApi.getTickets(page, limit, search, status);
  const res = await apiClient.get('/tickets', { params: { page, limit, search, status } });
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

// Romaneios
export async function getRomaneios(
  page?: number,
  limit?: number,
): Promise<PaginatedResponse<Romaneio>> {
  if (USE_MOCK) return mockApi.getRomaneios(page, limit);
  const res = await apiClient.get('/romaneios', { params: { page, limit } });
  const body = res.data as Romaneio[] | PaginatedResponse<Romaneio>;
  // Backend retorna array plano - adapta para formato paginado esperado
  if (Array.isArray(body)) {
    const lim = (limit ?? body.length) || 1;
    return {
      data: body,
      total: body.length,
      page: page ?? 1,
      limit: lim,
      totalPages: lim > 0 ? Math.max(1, Math.ceil(body.length / lim)) : 1,
    };
  }
  return body;
}

export async function createRomaneio(data: Partial<Romaneio>): Promise<Romaneio> {
  if (USE_MOCK) return mockApi.createRomaneio(data);
  const res = await apiClient.post('/romaneios', data);
  return res.data;
}

// Faturas
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

// Licenca
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

// Configuracao
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

// Manutencao de Ticket (usa /tickets?status=FECHADO + /tickets/:id/manutencao/*)
export async function getTicketsFechados(
  page?: number,
  limit?: number,
  search?: string,
): Promise<PaginatedResponse<TicketPesagem>> {
  if (USE_MOCK) return mockApi.getTickets(page, limit, search, 'FECHADO');
  const res = await apiClient.get('/tickets', {
    params: { page, limit, search, status: 'FECHADO' },
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

// Mantido para compatibilidade; redireciona para solicitar
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
  // Mapeia Auditoria -> formato usado no frontend
  return arr.map((a: any) => ({
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

// Calibracao
export async function calibrarBalanca(
  balancaId: string,
  pesoReferencia: number,
  pesoLido: number,
): Promise<Balanca> {
  if (USE_MOCK) {
    const b = (await mockApi.getBalancas(1, 100)).data.find((x) => x.id === balancaId)!;
    return b;
  }
  const res = await apiClient.post(`/balancas/${balancaId}/calibrar`, {
    peso_referencia: pesoReferencia,
    peso_lido: pesoLido,
  });
  return res.data;
}

// Impressao
export interface TemplateTicket {
  id: string;
  nome: string;
  descricao: string;
  formato: string;
  implementado: boolean;
}

export async function listarTemplatesTicket(): Promise<TemplateTicket[]> {
  if (USE_MOCK) {
    return [
      {
        id: 'TICKET002',
        nome: 'A4 - 2 Passagens (Padrao)',
        descricao: 'Bruto/Tara',
        formato: 'A4',
        implementado: true,
      },
      {
        id: 'TICKET004',
        nome: 'Cupom 80mm',
        descricao: 'Cupom',
        formato: 'Cupom',
        implementado: true,
      },
    ];
  }
  const res = await apiClient.get('/impressao/templates');
  return res.data;
}

/** URL absoluta para o PDF (útil para <iframe src> ou download). */
export function getTicketPdfUrl(id: string, template?: string): string {
  const base = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '');
  const qs = template ? `?template=${encodeURIComponent(template)}` : '';
  return `${base}/impressao/ticket/${id}${qs}`;
}

export async function getTicketImpressao(
  id: string,
  layout: string,
): Promise<{ html?: string; layout: string; pdfUrl?: string }> {
  if (USE_MOCK) {
    const t = await mockApi.getTicketById(id);
    return {
      layout,
      html: `<div style="padding:20px;font-family:sans-serif"><h1>Ticket ${t.numero}</h1><p>Cliente: ${t.cliente_nome || '-'}</p><p>Placa: ${t.veiculo_placa}</p><p>Produto: ${t.produto_nome || '-'}</p><p>Peso Liquido: ${t.peso_liquido_final || 0} kg</p></div>`,
    };
  }
  return { layout, pdfUrl: getTicketPdfUrl(id, layout) };
}

// Documentos do ticket
export interface DocumentoTicket {
  id: string;
  ticketId: string;
  tipo: string;
  numero?: string | null;
  arquivoUrl?: string | null;
  observacao?: string | null;
  criadoEm: string;
}

export async function listarDocumentosTicket(ticketId: string): Promise<DocumentoTicket[]> {
  if (USE_MOCK) return [];
  const res = await apiClient.get(`/tickets/${ticketId}/documentos`);
  return res.data;
}

export async function uploadDocumentoTicket(
  ticketId: string,
  arquivo: File,
  tipo = 'ANEXO',
  numero?: string,
  observacao?: string,
): Promise<DocumentoTicket> {
  if (USE_MOCK) throw new Error('Upload não suportado em mock');
  const fd = new FormData();
  fd.append('arquivo', arquivo);
  fd.append('tipo', tipo);
  if (numero) fd.append('numero', numero);
  if (observacao) fd.append('observacao', observacao);
  const res = await apiClient.post(`/tickets/${ticketId}/documentos`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function excluirDocumentoTicket(id: string): Promise<void> {
  if (USE_MOCK) return;
  await apiClient.delete(`/tickets/documentos/${id}`);
}

export function getDocumentoDownloadUrl(id: string): string {
  const base = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '');
  return `${base}/tickets/documentos/${id}/download`;
}

// Erros de impressão
export interface ErroImpressao {
  id: string;
  ticketId?: string | null;
  template?: string | null;
  tipo: string;
  mensagem: string;
  stack?: string | null;
  tentativas: number;
  resolvido: boolean;
  resolvidoEm?: string | null;
  criadoEm: string;
}

export async function listarErrosImpressao(resolvido?: boolean): Promise<ErroImpressao[]> {
  if (USE_MOCK) return [];
  const params: any = {};
  if (resolvido !== undefined) params.resolvido = resolvido;
  const res = await apiClient.get('/impressao/erros', { params });
  return res.data;
}

export async function reimprimirErro(id: string): Promise<{ ok: boolean; erro?: string }> {
  if (USE_MOCK) return { ok: true };
  const res = await apiClient.post(`/impressao/erros/${id}/reimprimir`);
  return res.data;
}

export async function resolverErroImpressao(id: string): Promise<void> {
  if (USE_MOCK) return;
  await apiClient.post(`/impressao/erros/${id}/resolver`);
}

// Dashboard extras
function mesQuery(periodo: string): string | undefined {
  // Aceita 'mes', 'YYYY-MM' ou data ISO; retorna YYYY-MM ou undefined
  if (!periodo || periodo === 'mes') return undefined;
  if (/^\d{4}-\d{2}$/.test(periodo)) return periodo;
  const d = new Date(periodo);
  if (!isNaN(d.getTime())) return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  return undefined;
}

export async function getTopClientesVolume(periodo = 'mes'): Promise<TopClienteVolume[]> {
  if (USE_MOCK) return mockApi.getTopClientesVolume(periodo);
  const uid = resolveUnidadeId();
  if (!uid) return [];
  const mes = mesQuery(periodo);
  const res = await apiClient.get(`/dashboard/top-clientes/${uid}`, { params: mes ? { mes } : {} });
  const arr = Array.isArray(res.data) ? res.data : [];
  return arr as unknown as TopClienteVolume[];
}

export async function getDistribuicaoProduto(periodo = 'mes'): Promise<DistribuicaoProduto[]> {
  if (USE_MOCK) return mockApi.getDistribuicaoProduto(periodo);
  const uid = resolveUnidadeId();
  if (!uid) return [];
  const mes = mesQuery(periodo);
  const res = await apiClient.get(`/dashboard/distribuicao-produto/${uid}`, {
    params: mes ? { mes } : {},
  });
  const arr = Array.isArray(res.data) ? res.data : [];
  return arr as unknown as DistribuicaoProduto[];
}

// Faturas (create/cancelar)
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
  // TODO: backend expoe apenas PATCH /faturas/:id; enviamos cancelamento como patch
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
  // TODO: endpoint /comercial/tickets-pendentes nao existe no backend. Usa /tickets filtrado.
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

// Pagamentos
export async function getPagamentos(
  page = 1,
  limit = 10,
  fatura_id?: string,
): Promise<PaginatedResponse<PagamentoFatura>> {
  if (USE_MOCK) return mockApi.getPagamentos(page, limit, fatura_id);
  // TODO: endpoint /fatura/pagamentos global nao existe. Se fatura_id informado, podemos listar via fatura detalhada.
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

// Saldos
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

// Ajuste de preco
export async function getTabelaPrecoProdutos(): Promise<TabelaPrecoProduto[]> {
  if (USE_MOCK) return mockApi.getTabelaPrecoProdutos();
  const res = await apiClient.get('/comercial/preco-produto');
  const d = res.data;
  return Array.isArray(d) ? d : d?.data || [];
}

export async function getTabelaPrecoProdutoCliente(
  cliente_id?: string,
): Promise<TabelaPrecoProdutoCliente[]> {
  if (USE_MOCK) return mockApi.getTabelaPrecoProdutoCliente(cliente_id);
  const res = await apiClient.get('/comercial/preco-cliente', { params: { cliente_id } });
  const d = res.data;
  return Array.isArray(d) ? d : d?.data || [];
}

export async function ajustarPrecoProduto(
  produto_id: string,
  preco: number,
  motivo?: string,
): Promise<TabelaPrecoProduto> {
  if (USE_MOCK) return mockApi.ajustarPrecoProduto(produto_id, preco, motivo);
  // Backend usa PATCH /comercial/preco-produto/:id para atualizar
  const res = await apiClient.patch(`/comercial/preco-produto/${produto_id}`, { preco, motivo });
  return res.data;
}

export async function ajustarPrecoCliente(
  produto_id: string,
  cliente_id: string,
  preco: number,
  motivo?: string,
): Promise<TabelaPrecoProdutoCliente> {
  if (USE_MOCK) return mockApi.ajustarPrecoCliente(produto_id, cliente_id, preco, motivo);
  // Backend: POST /comercial/preco-cliente (cria ou atualiza)
  const res = await apiClient.post('/comercial/preco-cliente', {
    produtoId: produto_id,
    clienteId: cliente_id,
    preco,
    motivo,
  });
  return res.data;
}

export async function getHistoricoPreco(
  produto_id?: string,
  cliente_id?: string,
): Promise<HistoricoPreco[]> {
  if (USE_MOCK) return mockApi.getHistoricoPreco(produto_id, cliente_id);
  const res = await apiClient.get('/comercial/precos/historico', {
    params: { produtoId: produto_id, clienteId: cliente_id },
  });
  const d = res.data;
  return Array.isArray(d) ? d : d?.data || [];
}

// Relatorios
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

// ===== Cadastros extras (Armazens, Empresas, TiposVeiculo, Unidades, Usuarios, Perfis) =====

// Armazens
export async function getArmazens(
  page = 1,
  limit = 10,
  search?: string,
): Promise<PaginatedResponse<Armazem>> {
  const res = await apiClient.get('/armazens', { params: { page, limit, search } });
  const d = res.data;
  if (Array.isArray(d)) {
    return { data: d, total: d.length, page: 1, limit: d.length || 10, totalPages: 1 };
  }
  return d;
}
export async function createArmazem(data: Partial<Armazem>): Promise<Armazem> {
  const res = await apiClient.post('/armazens', data);
  return res.data;
}
export async function updateArmazem(id: string, data: Partial<Armazem>): Promise<Armazem> {
  const res = await apiClient.put(`/armazens/${id}`, data);
  return res.data;
}
export async function deleteArmazem(id: string): Promise<void> {
  await apiClient.delete(`/armazens/${id}`);
}

// Empresa (singular no backend — retorna a empresa logada). Expoe como lista com 1 item p/ nao quebrar UI de tabela.
export async function getEmpresas(
  _page = 1,
  _limit = 10,
  _search?: string,
): Promise<PaginatedResponse<Empresa>> {
  try {
    const res = await apiClient.get('/empresa');
    const d = res.data;
    const arr = Array.isArray(d) ? d : d ? [d] : [];
    return { data: arr, total: arr.length, page: 1, limit: arr.length || 10, totalPages: 1 };
  } catch {
    return { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
  }
}
export async function createEmpresa(data: Partial<Empresa>): Promise<Empresa> {
  const res = await apiClient.post('/empresa', data);
  return res.data;
}
export async function updateEmpresa(id: string, data: Partial<Empresa>): Promise<Empresa> {
  const res = await apiClient.patch(`/empresa/${id}`, data);
  return res.data;
}
export async function deleteEmpresa(id: string): Promise<void> {
  await apiClient.delete(`/empresa/${id}`);
}

// Tipos de Veiculo
export async function getTiposVeiculo(
  page = 1,
  limit = 10,
  search?: string,
): Promise<PaginatedResponse<TipoVeiculo>> {
  const res = await apiClient.get('/tipos-veiculo', { params: { search } });
  const d = res.data;
  const arr = Array.isArray(d) ? d : d?.data || [];
  return { data: arr, total: arr.length, page, limit, totalPages: 1 };
}
export async function createTipoVeiculo(data: Partial<TipoVeiculo>): Promise<TipoVeiculo> {
  const res = await apiClient.post('/tipos-veiculo', data);
  return res.data;
}
export async function updateTipoVeiculo(
  id: string,
  data: Partial<TipoVeiculo>,
): Promise<TipoVeiculo> {
  const res = await apiClient.patch(`/tipos-veiculo/${id}`, data);
  return res.data;
}
export async function deleteTipoVeiculo(id: string): Promise<void> {
  await apiClient.delete(`/tipos-veiculo/${id}`);
}

// Unidades (CRUD completo) — backend usa /empresa/unidades
export async function getUnidadesPaginated(
  _page = 1,
  _limit = 10,
  _search?: string,
): Promise<PaginatedResponse<Unidade>> {
  const res = await apiClient.get('/empresa/unidades/list');
  const d = res.data;
  const arr = Array.isArray(d) ? d : d?.data || [];
  return { data: arr, total: arr.length, page: 1, limit: arr.length || 10, totalPages: 1 };
}
export async function createUnidade(data: Partial<Unidade>): Promise<Unidade> {
  const res = await apiClient.post('/empresa/unidades', data);
  return res.data;
}
export async function updateUnidade(id: string, data: Partial<Unidade>): Promise<Unidade> {
  const res = await apiClient.patch(`/empresa/unidades/${id}`, data);
  return res.data;
}
export async function deleteUnidade(id: string): Promise<void> {
  await apiClient.delete(`/empresa/unidades/${id}`);
}

// Usuarios (cadastro) — backend usa /users
export async function getUsuariosCadastro(
  page = 1,
  limit = 10,
  search?: string,
): Promise<PaginatedResponse<UsuarioCadastro>> {
  const res = await apiClient.get('/users', { params: { page, limit, search } });
  const d = res.data;
  if (Array.isArray(d)) {
    return { data: d, total: d.length, page: 1, limit: d.length || 10, totalPages: 1 };
  }
  return d;
}
export async function createUsuarioCadastro(
  data: Partial<UsuarioCadastro>,
): Promise<UsuarioCadastro> {
  const res = await apiClient.post('/users', data);
  return res.data;
}
export async function updateUsuarioCadastro(
  id: string,
  data: Partial<UsuarioCadastro>,
): Promise<UsuarioCadastro> {
  const res = await apiClient.patch(`/users/${id}`, data);
  return res.data;
}
export async function deleteUsuarioCadastro(id: string): Promise<void> {
  await apiClient.delete(`/users/${id}`);
}
export async function getPerfis(): Promise<Perfil[]> {
  const res = await apiClient.get('/perfis');
  const d = res.data;
  return Array.isArray(d) ? d : d?.data || [];
}

export async function getPerfilById(id: string): Promise<Perfil> {
  const res = await apiClient.get(`/perfis/${id}`);
  return res.data;
}

export async function createPerfil(
  data: Partial<Perfil> & {
    permissoes?: Array<{ modulo: string; acao: string; concedido?: boolean }>;
  },
): Promise<Perfil> {
  const res = await apiClient.post('/perfis', data);
  return res.data;
}

export async function updatePerfil(
  id: string,
  data: Partial<Perfil> & {
    permissoes?: Array<{ modulo: string; acao: string; concedido?: boolean }>;
  },
): Promise<Perfil> {
  const res = await apiClient.patch(`/perfis/${id}`, data);
  return res.data;
}

export async function deletePerfil(id: string): Promise<void> {
  await apiClient.delete(`/perfis/${id}`);
}

// Indicadores (lista completa somente-leitura)
export async function getIndicadoresList(): Promise<IndicadorPesagem[]> {
  if (USE_MOCK) {
    return [
      {
        id: 'ind1',
        modelo: 'Alfa 3100',
        fabricante: 'Toledo',
        parserTipo: 'TOLEDO',
        baudrate: 9600,
        databits: 8,
        stopbits: 1,
        parity: 'N',
        fator: 1,
        invertePeso: false,
      },
      {
        id: 'ind2',
        modelo: '9091',
        fabricante: 'Filizola',
        parserTipo: 'FILIZOLA',
        baudrate: 9600,
        databits: 8,
        stopbits: 1,
        parity: 'N',
        fator: 1,
        invertePeso: false,
      },
      {
        id: 'ind3',
        modelo: 'MIC-3',
        fabricante: 'Micro Sensores',
        parserTipo: 'MIC3',
        baudrate: 4800,
        databits: 8,
        stopbits: 1,
        parity: 'N',
        fator: 1,
        invertePeso: false,
      },
    ];
  }
  const res = await apiClient.get('/indicadores');
  return Array.isArray(res.data) ? res.data : res.data?.data || [];
}

// ===== Recibos =====
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

function resolveTenantId(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('tenant_id') || localStorage.getItem('empresa_id') || '';
  }
  return '';
}

export async function getRecibos(tenantId?: string): Promise<Recibo[]> {
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

// ===== Tipos de Desconto =====
export type TipoDescontoTipo = 'PERCENTUAL' | 'FIXO';

export interface TipoDesconto {
  id: string;
  tenantId?: string;
  descricao: string;
  tipo: TipoDescontoTipo;
  teto?: number | null;
  carencia?: number | null;
  valor: number;
  visivelPE: boolean;
  visivelPS: boolean;
  visivelPortaria: boolean;
  visivelApontamento: boolean;
  visivelPosApontamento: boolean;
  calcula: boolean;
  mantem: boolean;
  ativo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export async function getTiposDesconto(tenantId?: string): Promise<TipoDesconto[]> {
  const tid = tenantId || resolveTenantId();
  const res = await apiClient.get('/tipos-desconto', { params: tid ? { tenantId: tid } : {} });
  const d = res.data;
  return Array.isArray(d) ? d : d?.data || [];
}

export async function getTipoDescontoById(id: string): Promise<TipoDesconto> {
  const res = await apiClient.get(`/tipos-desconto/${id}`);
  return res.data;
}

export async function createTipoDesconto(data: Partial<TipoDesconto>): Promise<TipoDesconto> {
  const payload = { ...data, tenantId: data.tenantId || resolveTenantId() };
  const res = await apiClient.post('/tipos-desconto', payload);
  return res.data;
}

export async function updateTipoDesconto(
  id: string,
  data: Partial<TipoDesconto>,
): Promise<TipoDesconto> {
  const res = await apiClient.patch(`/tipos-desconto/${id}`, data);
  return res.data;
}

export async function deleteTipoDesconto(id: string): Promise<void> {
  await apiClient.delete(`/tipos-desconto/${id}`);
}

// Origens
export interface Origem {
  id: string;
  tenantId: string;
  descricao: string;
  clienteId?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  uf?: string | null;
  ativo: boolean;
}

export async function getOrigens(
  page = 1,
  limit = 20,
  search = '',
): Promise<PaginatedResponse<Origem>> {
  const tid = resolveTenantId();
  const res = await apiClient.get('/origens', {
    params: { page, limit, search, tenantId: tid || undefined },
  });
  return toPaginated(res.data, page ?? 1, limit ?? 10);
}
export async function createOrigem(data: Partial<Origem>): Promise<Origem> {
  const payload = { ...data, tenantId: data.tenantId || resolveTenantId() };
  const res = await apiClient.post('/origens', payload);
  return res.data;
}
export async function updateOrigem(id: string, data: Partial<Origem>): Promise<Origem> {
  const res = await apiClient.patch(`/origens/${id}`, data);
  return res.data;
}
export async function deleteOrigem(id: string): Promise<void> {
  await apiClient.delete(`/origens/${id}`);
}

// Destinos
export interface Destino {
  id: string;
  tenantId: string;
  descricao: string;
  clienteId?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  uf?: string | null;
  ativo: boolean;
}

export async function getDestinos(
  page = 1,
  limit = 20,
  search = '',
): Promise<PaginatedResponse<Destino>> {
  const tid = resolveTenantId();
  const res = await apiClient.get('/destinos', {
    params: { page, limit, search, tenantId: tid || undefined },
  });
  return toPaginated(res.data, page ?? 1, limit ?? 10);
}
export async function createDestino(data: Partial<Destino>): Promise<Destino> {
  const payload = { ...data, tenantId: data.tenantId || resolveTenantId() };
  const res = await apiClient.post('/destinos', payload);
  return res.data;
}
export async function updateDestino(id: string, data: Partial<Destino>): Promise<Destino> {
  const res = await apiClient.patch(`/destinos/${id}`, data);
  return res.data;
}
export async function deleteDestino(id: string): Promise<void> {
  await apiClient.delete(`/destinos/${id}`);
}

// Utilitarios: diagnostico e logs
export interface DiagnosticoSistema {
  sistema: {
    node: string;
    electron?: string | null;
    os: string;
    ram: string;
    ramLivre?: string;
    uptimeS?: number;
    platform?: string;
  };
  banco: {
    caminho: string | null;
    tamanhoKb: number;
    ultimaEscritaIso: string | null;
    erro?: string;
  };
  licenca: {
    status: string;
    fingerprint?: string | null;
    diasRestantes?: number | null;
    unidadeId?: string;
    erro?: string;
  };
  geradoEm?: string;
}
export async function getDiagnostico(): Promise<DiagnosticoSistema> {
  const res = await apiClient.get('/utilitarios/diagnostico');
  return res.data;
}
export async function getLogsRecentes(
  n = 50,
): Promise<{ caminho: string | null; existe: boolean; linhas: string[]; erro?: string }> {
  const res = await apiClient.get('/utilitarios/logs/recentes', { params: { n } });
  return res.data;
}

// Documentos: parse XML NFe/CTe
export interface DocumentoParseado {
  tipo: 'NFe' | 'CTe';
  chave: string | null;
  emissorCnpj: string | null;
  emissorNome: string | null;
  destinatarioCnpj: string | null;
  destinatarioNome: string | null;
  pesoBruto: number | null;
  pesoLiquido: number | null;
  valorTotal: number | null;
  numero?: string | null;
  serie?: string | null;
  dataEmissao?: string | null;
}
export async function parseXmlDocumento(xml: string): Promise<DocumentoParseado> {
  const res = await apiClient.post('/documentos/parse-xml', { xml });
  return res.data;
}
export async function vincularDocumentoTicket(payload: {
  ticketId?: string;
  numeroTicket?: string;
  chave: string;
  tipo: string;
}) {
  const res = await apiClient.post('/documentos/vincular-ticket', payload);
  return res.data;
}

// Auditoria: feed recentes
export interface AuditoriaEntry {
  id: string;
  entidade: string;
  entidadeId: string;
  evento: string;
  usuarioId?: string | null;
  motivo?: string | null;
  dataHora: string;
}
export async function getAuditoriaRecentes(limit = 20): Promise<AuditoriaEntry[]> {
  const res = await apiClient.get('/auditoria/recentes', { params: { limit } });
  const data = res.data;
  return Array.isArray(data) ? data : data?.data || [];
}

// ===== Serial Terminal (Gap 4.1) =====
export interface SerialPortInfo {
  path: string;
  manufacturer?: string | null;
  serialNumber?: string | null;
  pnpId?: string | null;
  vendorId?: string | null;
  productId?: string | null;
}

export async function listarPortasSeriais(): Promise<SerialPortInfo[]> {
  const res = await apiClient.get('/utilitarios/serial/portas');
  return res.data;
}

export async function abrirSessaoSerial(cfg: {
  porta: string;
  baudrate?: number;
  databits?: number;
  parity?: string;
  stopbits?: number;
}): Promise<{ sessionId: string }> {
  const res = await apiClient.post('/utilitarios/serial/sessao', cfg);
  return res.data;
}

export async function enviarSerial(
  sessionId: string,
  data: string,
  formato: 'ASCII' | 'HEX',
): Promise<{ enviado: number }> {
  const res = await apiClient.post(`/utilitarios/serial/sessao/${sessionId}/enviar`, {
    data,
    formato,
  });
  return res.data;
}

export async function lerBufferSerial(
  sessionId: string,
): Promise<{ ascii: string; hex: string; bytes: number }> {
  const res = await apiClient.get(`/utilitarios/serial/sessao/${sessionId}/buffer`);
  return res.data;
}

export async function encerrarSessaoSerial(sessionId: string): Promise<void> {
  await apiClient.delete(`/utilitarios/serial/sessao/${sessionId}`);
}

// ===== Relatorios Salvos (Gap 4.4) =====
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
  filtros: any,
): Promise<RelatorioSalvo> {
  const res = await apiClient.post('/relatorios-salvos', { nome, modulo, filtros });
  return res.data;
}

export async function deletarRelatorioSalvo(id: string): Promise<void> {
  await apiClient.delete(`/relatorios-salvos/${id}`);
}

// ===== Change password + reset (Gap 4.6) =====
export async function changePassword(
  senhaAtual: string,
  novaSenha: string,
): Promise<{ ok: boolean }> {
  const res = await apiClient.post('/auth/change-password', { senhaAtual, novaSenha });
  return res.data;
}

export async function requestPasswordReset(email: string): Promise<{ ok: boolean }> {
  const res = await apiClient.post('/auth/request-password-reset', { email });
  return res.data;
}

export async function resetPassword(token: string, novaSenha: string): Promise<{ ok: boolean }> {
  const res = await apiClient.post('/auth/reset-password', { token, novaSenha });
  return res.data;
}
