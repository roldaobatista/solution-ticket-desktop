/**
 * Resolve a configuração efetiva de uma balança aplicando a precedência:
 *   1. Override por equipamento (campos `ovr*` em Balanca)
 *   2. Indicador linkado (`Balanca.indicador`)
 *   3. Default seguro (9600,8,N,1, marcador CR, fator 1)
 *
 * Centralizar essa lógica permite que `BalancaConnectionService`,
 * `CaptureRawService` e qualquer caller reutilizem o mesmo cálculo.
 */

import type { Balanca, IndicadorPesagem } from '@prisma/client';
import type { ParserConfig } from './parsers/parser.interface';
import type { SerialConfig, SerialParity, FlowControl } from './presets';

export interface ConfigEfetiva {
  protocolo: 'serial' | 'tcp' | 'modbus-rtu' | 'modbus-tcp';
  endereco: string; // serial: COM3 / TCP: ip:porta / modbus: idem TCP
  serial: SerialConfig;
  parser: ParserConfig;
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
}

export interface ReadConfig {
  mode: 'continuous' | 'polling' | 'manual';
  commandHex: string | null;
  intervalMs: number | null;
  timeoutMs: number;
}

export type ConfigSource = 'balanca' | 'indicador' | 'default';

export interface ConfigEfetivaComOrigens extends ConfigEfetiva {
  sources: Record<string, ConfigSource>;
}

const DEFAULT_SERIAL: SerialConfig = {
  baudRate: 9600,
  dataBits: 8,
  parity: 'N',
  stopBits: 1,
  flowControl: 'NONE',
};

const DEFAULT_READ: ReadConfig = {
  mode: 'continuous',
  commandHex: null,
  intervalMs: null,
  timeoutMs: 2000,
};

function normalizarParity(p: string | null | undefined): SerialParity {
  if (!p) return 'N';
  const u = p.trim().toUpperCase();
  if (u.startsWith('E')) return 'E';
  if (u.startsWith('O')) return 'O';
  return 'N';
}

function normalizarFlow(f: string | null | undefined): FlowControl {
  if (!f) return 'NONE';
  const u = f
    .trim()
    .toUpperCase()
    .replace(/[\/\s]/g, '_');
  if (u.includes('XON')) return 'XON_XOFF';
  if (u.includes('RTS')) return 'RTS_CTS';
  if (u.includes('DTR')) return 'DTR_DSR';
  return 'NONE';
}

function normalizarDataBits(d: number | null | undefined): 7 | 8 {
  return d === 7 ? 7 : 8;
}

function normalizarStopBits(s: number | null | undefined): 1 | 2 {
  return s === 2 ? 2 : 1;
}

function normalizarProtocolo(
  p: string | null | undefined,
): 'serial' | 'tcp' | 'modbus-rtu' | 'modbus-tcp' {
  if (!p) return 'serial';
  const u = p.toLowerCase();
  if (u === 'tcp' || u === 'tcpip' || u === 'ethernet') return 'tcp';
  if (u === 'modbus-tcp') return 'modbus-tcp';
  if (u === 'modbus' || u === 'modbus-rtu') return 'modbus-rtu';
  return 'serial';
}

function normalizarReadMode(mode: string | null | undefined): ReadConfig['mode'] {
  if (mode === 'polling' || mode === 'manual') return mode;
  return 'continuous';
}

function sourceOf(
  balancaValue: unknown,
  indicadorValue: unknown,
  balancaHasOverride = balancaValue !== null && balancaValue !== undefined,
): ConfigSource {
  if (balancaHasOverride) return 'balanca';
  if (indicadorValue !== null && indicadorValue !== undefined) return 'indicador';
  return 'default';
}

export function resolveEffectiveConfig(
  balanca: Balanca,
  indicador: IndicadorPesagem | null,
): ConfigEfetiva {
  return resolveEffectiveConfigWithSources(balanca, indicador);
}

export function resolveEffectiveConfigWithSources(
  balanca: Balanca,
  indicador: IndicadorPesagem | null,
): ConfigEfetivaComOrigens {
  const protocolo = normalizarProtocolo(balanca.protocolo ?? indicador?.protocolo);
  const sources: Record<string, ConfigSource> = {
    protocolo: sourceOf(balanca.protocolo, indicador?.protocolo),
  };

  // Endereço — depende do protocolo
  let endereco = '';
  if (protocolo === 'serial' || protocolo === 'modbus-rtu') {
    endereco = balanca.porta ?? '';
  } else if (protocolo === 'tcp' || protocolo === 'modbus-tcp') {
    const ip = balanca.enderecoIp ?? '';
    const porta = balanca.portaTcp ?? 4001;
    endereco = ip ? `${ip}:${porta}` : '';
  }

  // Serial: equipamento > indicador > default
  const serial: SerialConfig = {
    baudRate: balanca.baudRate ?? indicador?.baudrate ?? DEFAULT_SERIAL.baudRate,
    dataBits: normalizarDataBits(balanca.ovrDataBits ?? indicador?.databits),
    parity: normalizarParity(balanca.ovrParity ?? indicador?.parity),
    stopBits: normalizarStopBits(balanca.ovrStopBits ?? indicador?.stopbits),
    flowControl: normalizarFlow(balanca.ovrFlowControl ?? indicador?.flowControl),
  };
  sources['serial.baudRate'] = sourceOf(balanca.baudRate, indicador?.baudrate);
  sources['serial.dataBits'] = sourceOf(balanca.ovrDataBits, indicador?.databits);
  sources['serial.parity'] = sourceOf(balanca.ovrParity, indicador?.parity);
  sources['serial.stopBits'] = sourceOf(balanca.ovrStopBits, indicador?.stopbits);
  sources['serial.flowControl'] = sourceOf(balanca.ovrFlowControl, indicador?.flowControl);

  // Parser
  const parser: ParserConfig = {
    parserTipo: balanca.ovrParserTipo ?? indicador?.parserTipo ?? 'generic',
    inicioPeso: balanca.ovrInicioPeso ?? indicador?.inicioPeso ?? null,
    tamanhoPeso: balanca.ovrTamanhoPeso ?? indicador?.tamanhoPeso ?? null,
    tamanhoString: balanca.ovrTamanhoString ?? indicador?.tamanhoString ?? null,
    marcador: balanca.ovrMarcador ?? indicador?.marcador ?? 13,
    fator: balanca.ovrFator ?? indicador?.fator ?? 1,
    invertePeso: balanca.ovrInvertePeso ?? indicador?.invertePeso ?? false,
  };
  sources['parser.parserTipo'] = sourceOf(balanca.ovrParserTipo, indicador?.parserTipo);
  sources['parser.inicioPeso'] = sourceOf(balanca.ovrInicioPeso, indicador?.inicioPeso);
  sources['parser.tamanhoPeso'] = sourceOf(balanca.ovrTamanhoPeso, indicador?.tamanhoPeso);
  sources['parser.tamanhoString'] = sourceOf(balanca.ovrTamanhoString, indicador?.tamanhoString);
  sources['parser.marcador'] = sourceOf(balanca.ovrMarcador, indicador?.marcador);
  sources['parser.fator'] = sourceOf(balanca.ovrFator, indicador?.fator);
  sources['parser.invertePeso'] = sourceOf(balanca.ovrInvertePeso, indicador?.invertePeso);

  const atraso = balanca.ovrAtraso ?? indicador?.atraso ?? 0;
  sources.atraso = sourceOf(balanca.ovrAtraso, indicador?.atraso);
  const b = balanca as Balanca & {
    modbusUnitId?: number | null;
    modbusRegister?: number | null;
    modbusFunction?: 'holding' | 'input' | null;
    modbusByteOrder?: 'BE' | 'LE' | null;
    modbusWordOrder?: 'BE' | 'LE' | null;
    modbusSigned?: boolean | null;
    modbusScale?: unknown;
    modbusOffset?: unknown;
    readMode?: string | null;
    readCommandHex?: string | null;
    readIntervalMs?: number | null;
    readTimeoutMs?: number | null;
  };
  const i = indicador as
    | (IndicadorPesagem & {
        readMode?: string | null;
        readCommandHex?: string | null;
        readIntervalMs?: number | null;
        readTimeoutMs?: number | null;
      })
    | null;

  const read: ReadConfig = {
    mode: normalizarReadMode(b.readMode ?? i?.readMode ?? DEFAULT_READ.mode),
    commandHex: b.readCommandHex ?? i?.readCommandHex ?? DEFAULT_READ.commandHex,
    intervalMs: b.readIntervalMs ?? i?.readIntervalMs ?? DEFAULT_READ.intervalMs,
    timeoutMs: b.readTimeoutMs ?? i?.readTimeoutMs ?? DEFAULT_READ.timeoutMs,
  };
  sources['read.mode'] = sourceOf(b.readMode, i?.readMode);
  sources['read.commandHex'] = sourceOf(b.readCommandHex, i?.readCommandHex);
  sources['read.intervalMs'] = sourceOf(b.readIntervalMs, i?.readIntervalMs);
  sources['read.timeoutMs'] = sourceOf(b.readTimeoutMs, i?.readTimeoutMs);

  const modbus = {
    unitId: b.modbusUnitId ?? null,
    register: b.modbusRegister ?? null,
    function: b.modbusFunction ?? null,
    byteOrder: b.modbusByteOrder ?? null,
    wordOrder: b.modbusWordOrder ?? null,
    signed: b.modbusSigned ?? null,
    scale: b.modbusScale == null ? null : Number(b.modbusScale),
    offset: b.modbusOffset == null ? null : Number(b.modbusOffset),
  };

  return { protocolo, endereco, serial, parser, atraso, read, modbus, sources };
}
