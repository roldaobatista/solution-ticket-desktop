/**
 * Cadastros mestre — clientes, transportadoras, motoristas, produtos, veiculos,
 * indicadores, unidades, perfis, usuarios cadastro, armazens, empresas,
 * tipos de veiculo, origens, destinos, tipos de desconto.
 */
import { apiClient, resolveTenantId, USE_MOCK } from './client';
import {
  Cliente,
  Transportadora,
  Motorista,
  Produto,
  Veiculo,
  IndicadorPesagem,
  Armazem,
  Empresa,
  TipoVeiculo,
  Unidade,
  UsuarioCadastro,
  Perfil,
  PaginatedResponse,
} from '@/types';
import { mockApi } from '../mock-api';
import {
  mapCliente,
  mapTransportadora,
  mapMotorista,
  mapProduto,
  mapVeiculo,
  mapArmazem,
  mapEmpresa,
  mapUnidade,
  mapPerfil,
  mapUsuarioCadastro,
  mapOrigem,
  mapDestino,
  mapTipoDesconto,
  mapPaginated,
} from './mappers';

// --- Clientes ---
export async function getClientes(
  page?: number,
  limit?: number,
  search?: string,
): Promise<PaginatedResponse<Cliente>> {
  if (USE_MOCK) return mockApi.getClientes(page, limit, search);
  const res = await apiClient.get('/clientes', { params: { page, limit, search } });
  return mapPaginated(res.data, mapCliente);
}
export async function getClienteById(id: string): Promise<Cliente> {
  if (USE_MOCK) return mockApi.getClienteById(id);
  const res = await apiClient.get(`/clientes/${id}`);
  return mapCliente(res.data);
}
export async function createCliente(data: Partial<Cliente>): Promise<Cliente> {
  if (USE_MOCK) return mockApi.createCliente(data);
  const res = await apiClient.post('/clientes', data);
  return mapCliente(res.data);
}
export async function updateCliente(id: string, data: Partial<Cliente>): Promise<Cliente> {
  if (USE_MOCK) return mockApi.updateCliente(id, data);
  const res = await apiClient.patch(`/clientes/${id}`, data);
  return mapCliente(res.data);
}
export async function deleteCliente(id: string): Promise<void> {
  if (USE_MOCK) return mockApi.deleteCliente(id);
  await apiClient.delete(`/clientes/${id}`);
}

// --- Transportadoras ---
export async function getTransportadoras(
  page?: number,
  limit?: number,
  search?: string,
): Promise<PaginatedResponse<Transportadora>> {
  if (USE_MOCK) return mockApi.getTransportadoras(page, limit, search);
  const res = await apiClient.get('/transportadoras', { params: { page, limit, search } });
  return mapPaginated(res.data, mapTransportadora);
}
export async function createTransportadora(data: Partial<Transportadora>): Promise<Transportadora> {
  if (USE_MOCK) return mockApi.createTransportadora(data);
  const res = await apiClient.post('/transportadoras', data);
  return mapTransportadora(res.data);
}
export async function updateTransportadora(
  id: string,
  data: Partial<Transportadora>,
): Promise<Transportadora> {
  if (USE_MOCK) return mockApi.updateTransportadora(id, data);
  const res = await apiClient.patch(`/transportadoras/${id}`, data);
  return mapTransportadora(res.data);
}
export async function deleteTransportadora(id: string): Promise<void> {
  if (USE_MOCK) return mockApi.deleteTransportadora(id);
  await apiClient.delete(`/transportadoras/${id}`);
}

// --- Motoristas ---
export async function getMotoristas(
  page?: number,
  limit?: number,
  search?: string,
): Promise<PaginatedResponse<Motorista>> {
  if (USE_MOCK) return mockApi.getMotoristas(page, limit, search);
  const res = await apiClient.get('/motoristas', { params: { page, limit, search } });
  return mapPaginated(res.data, mapMotorista);
}
export async function createMotorista(data: Partial<Motorista>): Promise<Motorista> {
  if (USE_MOCK) return mockApi.createMotorista(data);
  const res = await apiClient.post('/motoristas', data);
  return mapMotorista(res.data);
}
export async function updateMotorista(id: string, data: Partial<Motorista>): Promise<Motorista> {
  if (USE_MOCK) return mockApi.updateMotorista(id, data);
  const res = await apiClient.patch(`/motoristas/${id}`, data);
  return mapMotorista(res.data);
}
export async function deleteMotorista(id: string): Promise<void> {
  if (USE_MOCK) return mockApi.deleteMotorista(id);
  await apiClient.delete(`/motoristas/${id}`);
}

// --- Produtos ---
export async function getProdutos(
  page?: number,
  limit?: number,
  search?: string,
): Promise<PaginatedResponse<Produto>> {
  if (USE_MOCK) return mockApi.getProdutos(page, limit, search);
  const res = await apiClient.get('/produtos', { params: { page, limit, search } });
  return mapPaginated(res.data, mapProduto);
}
export async function createProduto(data: Partial<Produto>): Promise<Produto> {
  if (USE_MOCK) return mockApi.createProduto(data);
  const res = await apiClient.post('/produtos', data);
  return mapProduto(res.data);
}
export async function updateProduto(id: string, data: Partial<Produto>): Promise<Produto> {
  if (USE_MOCK) return mockApi.updateProduto(id, data);
  const res = await apiClient.patch(`/produtos/${id}`, data);
  return mapProduto(res.data);
}
export async function deleteProduto(id: string): Promise<void> {
  if (USE_MOCK) return mockApi.deleteProduto(id);
  await apiClient.delete(`/produtos/${id}`);
}

// --- Veiculos ---
export async function getVeiculos(
  page?: number,
  limit?: number,
  search?: string,
): Promise<PaginatedResponse<Veiculo>> {
  if (USE_MOCK) return mockApi.getVeiculos(page, limit, search);
  const res = await apiClient.get('/veiculos', { params: { page, limit, search } });
  return mapPaginated(res.data, mapVeiculo);
}
export async function createVeiculo(data: Partial<Veiculo>): Promise<Veiculo> {
  if (USE_MOCK) return mockApi.createVeiculo(data);
  const res = await apiClient.post('/veiculos', data);
  return mapVeiculo(res.data);
}
export async function updateVeiculo(id: string, data: Partial<Veiculo>): Promise<Veiculo> {
  if (USE_MOCK) return mockApi.updateVeiculo(id, data);
  const res = await apiClient.patch(`/veiculos/${id}`, data);
  return mapVeiculo(res.data);
}
export async function deleteVeiculo(id: string): Promise<void> {
  if (USE_MOCK) return mockApi.deleteVeiculo(id);
  await apiClient.delete(`/veiculos/${id}`);
}

// --- Indicadores ---
const INDICADORES_MOCK: IndicadorPesagem[] = [
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

/**
 * Lista plana de indicadores (read-only, com fallback para presets em USE_MOCK).
 * Use este para popular dropdowns/selects.
 *
 * Para CRUD completo (criar, editar, calibrar, anotar bytes) e tipo
 * `IndicadorBalanca`, ver `frontend/src/lib/api/indicador.ts`.
 */
export async function getIndicadores(): Promise<IndicadorPesagem[]> {
  if (USE_MOCK) return INDICADORES_MOCK;
  const res = await apiClient.get('/indicadores');
  return res.data?.data || res.data;
}

/** @deprecated Alias historico — prefira `getIndicadores`. */
export async function getIndicadoresList(): Promise<IndicadorPesagem[]> {
  if (USE_MOCK) return INDICADORES_MOCK;
  const res = await apiClient.get('/indicadores');
  return Array.isArray(res.data) ? res.data : res.data?.data || [];
}

// --- Unidades (select) ---
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

// --- Armazens ---
const EMPTY_PAGE = { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };

export async function getArmazens(
  page = 1,
  limit = 10,
  search?: string,
): Promise<PaginatedResponse<Armazem>> {
  if (USE_MOCK) return { ...EMPTY_PAGE, page, limit } as PaginatedResponse<Armazem>;
  const res = await apiClient.get('/armazens', { params: { page, limit, search } });
  const d = res.data;
  if (Array.isArray(d)) {
    return {
      data: d.map(mapArmazem),
      total: d.length,
      page: 1,
      limit: d.length || 10,
      totalPages: 1,
    };
  }
  return mapPaginated(d, mapArmazem);
}
export async function createArmazem(data: Partial<Armazem>): Promise<Armazem> {
  const res = await apiClient.post('/armazens', data);
  return mapArmazem(res.data);
}
export async function updateArmazem(id: string, data: Partial<Armazem>): Promise<Armazem> {
  const res = await apiClient.patch(`/armazens/${id}`, data);
  return mapArmazem(res.data);
}
export async function deleteArmazem(id: string): Promise<void> {
  await apiClient.delete(`/armazens/${id}`);
}

// --- Empresa ---
export async function getEmpresas(
  _page = 1,
  _limit = 10,
  _search?: string,
): Promise<PaginatedResponse<Empresa>> {
  if (USE_MOCK) return { ...EMPTY_PAGE } as PaginatedResponse<Empresa>;
  try {
    const res = await apiClient.get('/empresa');
    const d = res.data;
    const arr = Array.isArray(d) ? d : d ? [d] : [];
    return {
      data: arr.map(mapEmpresa),
      total: arr.length,
      page: 1,
      limit: arr.length || 10,
      totalPages: 1,
    };
  } catch {
    return { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
  }
}
export async function createEmpresa(data: Partial<Empresa>): Promise<Empresa> {
  const res = await apiClient.post('/empresa', data);
  return mapEmpresa(res.data);
}
export async function updateEmpresa(id: string, data: Partial<Empresa>): Promise<Empresa> {
  const res = await apiClient.patch(`/empresa/${id}`, data);
  return mapEmpresa(res.data);
}
export async function deleteEmpresa(id: string): Promise<void> {
  await apiClient.delete(`/empresa/${id}`);
}

// --- Tipos Veiculo ---
export async function getTiposVeiculo(
  page = 1,
  limit = 10,
  search?: string,
): Promise<PaginatedResponse<TipoVeiculo>> {
  if (USE_MOCK) return { ...EMPTY_PAGE, page, limit } as PaginatedResponse<TipoVeiculo>;
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

// --- Unidades CRUD ---
export async function getUnidadesPaginated(
  _page = 1,
  _limit = 10,
  _search?: string,
): Promise<PaginatedResponse<Unidade>> {
  const res = await apiClient.get('/empresa/unidades/list');
  const d = res.data;
  const arr = Array.isArray(d) ? d : d?.data || [];
  return {
    data: arr.map(mapUnidade),
    total: arr.length,
    page: 1,
    limit: arr.length || 10,
    totalPages: 1,
  };
}
export async function createUnidade(data: Partial<Unidade>): Promise<Unidade> {
  const res = await apiClient.post('/empresa/unidades', data);
  return mapUnidade(res.data);
}
export async function updateUnidade(id: string, data: Partial<Unidade>): Promise<Unidade> {
  const res = await apiClient.patch(`/empresa/unidades/${id}`, data);
  return mapUnidade(res.data);
}
export async function deleteUnidade(id: string): Promise<void> {
  await apiClient.delete(`/empresa/unidades/${id}`);
}

// --- Usuarios cadastro + Perfis ---
export async function getUsuariosCadastro(
  page = 1,
  limit = 10,
  search?: string,
): Promise<PaginatedResponse<UsuarioCadastro>> {
  const res = await apiClient.get('/users', { params: { page, limit, search } });
  const d = res.data;
  if (Array.isArray(d)) {
    return {
      data: d.map(mapUsuarioCadastro),
      total: d.length,
      page: 1,
      limit: d.length || 10,
      totalPages: 1,
    };
  }
  return mapPaginated(d, mapUsuarioCadastro);
}
export async function createUsuarioCadastro(
  data: Partial<UsuarioCadastro>,
): Promise<UsuarioCadastro> {
  const res = await apiClient.post('/users', data);
  return mapUsuarioCadastro(res.data);
}
export async function updateUsuarioCadastro(
  id: string,
  data: Partial<UsuarioCadastro>,
): Promise<UsuarioCadastro> {
  const res = await apiClient.patch(`/users/${id}`, data);
  return mapUsuarioCadastro(res.data);
}
export async function deleteUsuarioCadastro(id: string): Promise<void> {
  await apiClient.delete(`/users/${id}`);
}
export async function getPerfis(): Promise<Perfil[]> {
  const res = await apiClient.get('/perfis');
  const d = res.data;
  const arr = Array.isArray(d) ? d : d?.data || [];
  return arr.map(mapPerfil);
}
export async function getPerfilById(id: string): Promise<Perfil> {
  const res = await apiClient.get(`/perfis/${id}`);
  return mapPerfil(res.data);
}
export async function createPerfil(
  data: Partial<Perfil> & {
    permissoes?: Array<{ modulo: string; acao: string; concedido?: boolean }>;
  },
): Promise<Perfil> {
  const res = await apiClient.post('/perfis', data);
  return mapPerfil(res.data);
}
export async function updatePerfil(
  id: string,
  data: Partial<Perfil> & {
    permissoes?: Array<{ modulo: string; acao: string; concedido?: boolean }>;
  },
): Promise<Perfil> {
  const res = await apiClient.patch(`/perfis/${id}`, data);
  return mapPerfil(res.data);
}
export async function deletePerfil(id: string): Promise<void> {
  await apiClient.delete(`/perfis/${id}`);
}

// --- Origens ---
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
  if (USE_MOCK) return { ...EMPTY_PAGE, page, limit } as PaginatedResponse<Origem>;
  const tid = resolveTenantId();
  const res = await apiClient.get('/origens', {
    params: { page, limit, search, tenantId: tid || undefined },
  });
  return mapPaginated(res.data, mapOrigem);
}
export async function createOrigem(data: Partial<Origem>): Promise<Origem> {
  const payload = { ...data, tenantId: data.tenantId || resolveTenantId() };
  const res = await apiClient.post('/origens', payload);
  return mapOrigem(res.data);
}
export async function updateOrigem(id: string, data: Partial<Origem>): Promise<Origem> {
  const res = await apiClient.patch(`/origens/${id}`, data);
  return mapOrigem(res.data);
}
export async function deleteOrigem(id: string): Promise<void> {
  await apiClient.delete(`/origens/${id}`);
}

// --- Destinos ---
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
  if (USE_MOCK) return { ...EMPTY_PAGE, page, limit } as PaginatedResponse<Destino>;
  const tid = resolveTenantId();
  const res = await apiClient.get('/destinos', {
    params: { page, limit, search, tenantId: tid || undefined },
  });
  return mapPaginated(res.data, mapDestino);
}
export async function createDestino(data: Partial<Destino>): Promise<Destino> {
  const payload = { ...data, tenantId: data.tenantId || resolveTenantId() };
  const res = await apiClient.post('/destinos', payload);
  return mapDestino(res.data);
}
export async function updateDestino(id: string, data: Partial<Destino>): Promise<Destino> {
  const res = await apiClient.patch(`/destinos/${id}`, data);
  return mapDestino(res.data);
}
export async function deleteDestino(id: string): Promise<void> {
  await apiClient.delete(`/destinos/${id}`);
}

// --- Tipos de Desconto ---
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
  if (USE_MOCK) return [];
  const tid = tenantId || resolveTenantId();
  const res = await apiClient.get('/tipos-desconto', { params: tid ? { tenantId: tid } : {} });
  const d = res.data;
  const arr = Array.isArray(d) ? d : d?.data || [];
  return arr.map(mapTipoDesconto);
}
export async function getTipoDescontoById(id: string): Promise<TipoDesconto> {
  const res = await apiClient.get(`/tipos-desconto/${id}`);
  return mapTipoDesconto(res.data);
}
export async function createTipoDesconto(data: Partial<TipoDesconto>): Promise<TipoDesconto> {
  const payload = { ...data, tenantId: data.tenantId || resolveTenantId() };
  const res = await apiClient.post('/tipos-desconto', payload);
  return mapTipoDesconto(res.data);
}
export async function updateTipoDesconto(
  id: string,
  data: Partial<TipoDesconto>,
): Promise<TipoDesconto> {
  const res = await apiClient.patch(`/tipos-desconto/${id}`, data);
  return mapTipoDesconto(res.data);
}
export async function deleteTipoDesconto(id: string): Promise<void> {
  await apiClient.delete(`/tipos-desconto/${id}`);
}
