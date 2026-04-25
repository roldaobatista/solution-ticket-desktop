/**
 * API de indicadores (catálogo CRUD + wizard de protocolo desconhecido).
 */
import { apiClient } from './client';

export interface IndicadorBalanca {
  id: string;
  tenantId: string;
  fabricante?: string | null;
  modelo?: string | null;
  descricao: string;
  protocolo: string;
  parserTipo?: string | null;
  baudrate?: number | null;
  databits?: number | null;
  stopbits?: number | null;
  parity?: string | null;
  flowControl?: string | null;
  inicioPeso?: number | null;
  tamanhoPeso?: number | null;
  tamanhoString?: number | null;
  marcador?: number | null;
  fator?: number | null;
  invertePeso: boolean;
  atraso?: number | null;
  exemploTrama?: string | null;
  notas?: string | null;
  builtin: boolean;
  ativo: boolean;
}

export async function listIndicadores(tenantId: string): Promise<IndicadorBalanca[]> {
  const res = await apiClient.get('/indicadores', { params: { tenantId } });
  return res.data;
}

export async function createIndicador(input: Partial<IndicadorBalanca>): Promise<IndicadorBalanca> {
  const res = await apiClient.post('/indicadores', input);
  return res.data;
}

export async function updateIndicador(
  id: string,
  input: Partial<IndicadorBalanca>,
): Promise<IndicadorBalanca> {
  const res = await apiClient.put(`/indicadores/${id}`, input);
  return res.data;
}

export async function deleteIndicador(id: string): Promise<void> {
  await apiClient.delete(`/indicadores/${id}`);
}

export async function seedBuiltins(
  tenantId: string,
): Promise<{ criados: number; totalPresets: number }> {
  const res = await apiClient.post('/indicadores/seed-builtins', { tenantId });
  return res.data;
}

// === Wizard ===

export interface ByteAnnotation {
  offset: number;
  hex: string;
  decimal: number;
  char: string | null;
  role: string;
}

export async function annotateBytes(
  bytes: string,
): Promise<{ total: number; bytes: ByteAnnotation[] }> {
  const res = await apiClient.post('/indicadores/wizard/annotate-bytes', { bytes });
  return res.data;
}

export async function testarConfig(input: {
  bytes: string;
  parserTipo: string;
  inicioPeso?: number;
  tamanhoPeso?: number;
  marcador?: number;
  fator?: number;
  invertePeso?: boolean;
}) {
  const res = await apiClient.post('/indicadores/wizard/test-config', input);
  return res.data as {
    parserTipo: string;
    bytesAnalisados: number;
    bytesRestantes: number;
    leituras: Array<{ peso: number; estavel: boolean; bruto: string }>;
    sucesso: boolean;
    diagnostico: string;
  };
}

export async function criarFromWizard(input: {
  tenantId: string;
  fabricante: string;
  modelo: string;
  descricao?: string;
  protocolo: 'serial' | 'tcp' | 'modbus';
  serial: {
    baudRate: number;
    dataBits: 7 | 8;
    parity: string;
    stopBits: 1 | 2;
    flowControl: string;
  };
  parserTipo: string;
  inicioPeso?: number;
  tamanhoPeso?: number;
  marcador?: number;
  fator?: number;
  invertePeso?: boolean;
  atraso?: number;
  bytesCapturados?: string;
  notas?: string;
}): Promise<IndicadorBalanca> {
  const res = await apiClient.post('/indicadores/wizard/criar', input);
  return res.data;
}
