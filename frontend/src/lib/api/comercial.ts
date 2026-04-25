import { apiClient, USE_MOCK } from './client';
import { TabelaPrecoProduto, TabelaPrecoProdutoCliente, HistoricoPreco } from '@/types';
import { mockApi } from '../mock-api';

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
