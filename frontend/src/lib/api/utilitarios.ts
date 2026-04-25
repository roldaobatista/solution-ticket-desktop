import { apiClient } from './client';

// --- Diagnostico ---
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

// --- Documentos: parse XML NFe/CTe ---
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

// --- Auditoria ---
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

// --- Serial Terminal ---
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
