import { apiClient, USE_MOCK } from './client';
import { mockApi } from '../mock-api';

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

// --- Documentos do ticket ---
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

// --- Erros de impressao ---
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
  const params: Record<string, unknown> = {};
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
