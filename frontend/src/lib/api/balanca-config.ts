/**
 * Endpoints de configuração de balança (presets + auto-detect + serial options).
 * Domínio separado do `lib/api.ts` — primeiro caso da migração endpoint-a-endpoint.
 */

import { apiClient } from './client';

export type SerialParity = 'N' | 'E' | 'O';
export type FlowControl = 'NONE' | 'XON_XOFF' | 'RTS_CTS' | 'DTR_DSR';

export interface SerialConfig {
  baudRate: number;
  dataBits: 7 | 8;
  parity: SerialParity;
  stopBits: 1 | 2;
  flowControl: FlowControl;
}

export interface ParserConfig {
  parserTipo?: string;
  inicioPeso?: number;
  tamanhoPeso?: number;
  tamanhoString?: number;
  marcador?: number;
  fator?: number;
  invertePeso?: boolean;
}

export interface PresetBalanca {
  id: string;
  fabricante: string;
  modelo: string;
  parserTipo: string;
  protocolo: 'serial' | 'tcp' | 'modbus';
  serial: SerialConfig;
  parser: ParserConfig;
  read?: ReadConfig;
  exemploTrama?: string;
  notas?: string;
}

export interface ReadConfig {
  mode: 'continuous' | 'polling' | 'manual';
  commandHex: string | null;
  intervalMs: number | null;
  timeoutMs: number;
}

export interface SerialOptions {
  baudRate: number[];
  dataBits: number[];
  parity: SerialParity[];
  stopBits: number[];
  flowControl: FlowControl[];
}

export interface CandidatoDetectado {
  presetId: string;
  fabricante: string;
  modelo: string;
  parserTipo: string;
  serial: SerialConfig;
  confianca: number;
  leituraExemplo: { peso: number; estavel: boolean; bruto: string };
}

export interface AutoDetectResponse {
  bytesAnalisados: number;
  candidatos: CandidatoDetectado[];
}

export async function getPresetsBalanca(): Promise<PresetBalanca[]> {
  const res = await apiClient.get('/balanca/config/presets');
  return res.data;
}

export async function getSerialOptions(): Promise<SerialOptions> {
  const res = await apiClient.get('/balanca/config/serial-options');
  return res.data;
}

export async function autoDetectProtocolo(
  bytes: string,
  encoding: 'hex' | 'base64' = 'hex',
): Promise<AutoDetectResponse> {
  const res = await apiClient.post('/balanca/config/auto-detect', { bytes, encoding });
  return res.data;
}

export interface CaptureRawRequest {
  protocolo: 'serial' | 'tcp';
  endereco: string;
  serial?: SerialConfig;
  durationMs?: number;
  enviarEnq?: boolean;
  commandHex?: string;
  commandIntervalMs?: number;
}

export async function captureRaw(req: CaptureRawRequest): Promise<{
  bytes: string;
  count: number;
  durationMs: number;
}> {
  const res = await apiClient.post('/balanca/config/capture-raw', req);
  return res.data;
}

export async function captureAndDetect(
  req: CaptureRawRequest,
): Promise<AutoDetectResponse & { durationMs: number; aviso?: string }> {
  const res = await apiClient.post('/balanca/config/capture-and-detect', req);
  return res.data;
}

export interface DispositivoEncontrado {
  ip: string;
  porta: number;
  rttMs: number;
}

export async function descobrirNaRede(opts: {
  cidr?: string;
  portas?: number[];
  timeoutMs?: number;
}): Promise<DispositivoEncontrado[]> {
  const res = await apiClient.post('/balanca/config/discover', opts);
  return res.data;
}

export interface EffectiveConfigResponse {
  protocolo: 'serial' | 'tcp' | 'modbus-rtu' | 'modbus-tcp';
  endereco: string;
  serial: SerialConfig;
  parser: ParserConfig & { tamanhoString?: number | null };
  atraso: number;
  read: ReadConfig;
  modbus: {
    unitId: number | null;
    register: number | null;
    function: 'holding' | 'input' | null;
    byteOrder: 'BE' | 'LE' | null;
    wordOrder: 'BE' | 'LE' | null;
    signed: boolean | null;
    scale: number | null;
    offset: number | null;
  };
  sources: Record<string, 'balanca' | 'indicador' | 'default'>;
}

export async function getBalancaEffectiveConfig(
  balancaId: string,
): Promise<EffectiveConfigResponse> {
  const res = await apiClient.get(`/balancas/${balancaId}/effective-config`);
  return res.data;
}

export async function testParserOnBytes(input: {
  bytes: string;
  parserTipo: string;
  inicioPeso?: number;
  tamanhoPeso?: number;
  tamanhoString?: number;
  marcador?: number;
  fator?: number;
  invertePeso?: boolean;
}): Promise<{
  leituras: Array<{ peso: number; estavel: boolean; bruto: string }>;
  bytesRestantes: number;
}> {
  const res = await apiClient.post('/balanca/config/test-parser-on-bytes', input);
  return res.data;
}
