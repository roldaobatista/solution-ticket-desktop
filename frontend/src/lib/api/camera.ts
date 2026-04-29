import { apiClient, USE_MOCK } from './client';

export type FotoOrigem = 'WEBCAM' | 'IP_CAMERA' | 'OCR';

export interface FotoTicket {
  id: string;
  ticketId: string;
  passagemId?: string | null;
  caminhoArquivo: string;
  origem: FotoOrigem;
  placaDetectada?: string | null;
  tamanhoBytes: number;
  sha256: string;
  capturadoEm: string;
}

export async function listarFotosTicket(ticketId: string): Promise<FotoTicket[]> {
  if (USE_MOCK) return [];
  const res = await apiClient.get(`/camera/ticket/${ticketId}`);
  return res.data;
}

export async function uploadFoto(
  ticketId: string,
  base64: string,
  origem: FotoOrigem = 'WEBCAM',
  passagemId?: string,
  placaDetectada?: string,
): Promise<FotoTicket> {
  if (USE_MOCK) throw new Error('Upload nao suportado em mock');
  const res = await apiClient.post('/camera/foto', {
    ticketId,
    base64,
    origem,
    passagemId,
    placaDetectada,
  });
  return res.data;
}

export async function excluirFoto(id: string): Promise<{ ok: true }> {
  if (USE_MOCK) return { ok: true };
  const res = await apiClient.delete(`/camera/foto/${id}`);
  return res.data;
}

export async function getFotoRawObjectUrl(id: string): Promise<string> {
  if (USE_MOCK) return '';
  const res = await apiClient.get(`/camera/foto/${id}/raw`, { responseType: 'blob' });
  return URL.createObjectURL(res.data);
}
