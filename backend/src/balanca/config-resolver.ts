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
  protocolo: 'serial' | 'tcp' | 'modbus';
  endereco: string; // serial: COM3 / TCP: ip:porta / modbus: idem TCP
  serial: SerialConfig;
  parser: ParserConfig;
  atraso: number;
}

const DEFAULT_SERIAL: SerialConfig = {
  baudRate: 9600,
  dataBits: 8,
  parity: 'N',
  stopBits: 1,
  flowControl: 'NONE',
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

function normalizarProtocolo(p: string | null | undefined): 'serial' | 'tcp' | 'modbus' {
  if (!p) return 'serial';
  const u = p.toLowerCase();
  if (u === 'tcp' || u === 'tcpip' || u === 'ethernet') return 'tcp';
  if (u === 'modbus' || u === 'modbus-rtu' || u === 'modbus-tcp') return 'modbus';
  return 'serial';
}

export function resolveEffectiveConfig(
  balanca: Balanca,
  indicador: IndicadorPesagem | null,
): ConfigEfetiva {
  const protocolo = normalizarProtocolo(balanca.protocolo ?? indicador?.protocolo);

  // Endereço — depende do protocolo
  let endereco = '';
  if (protocolo === 'serial') {
    endereco = balanca.porta ?? '';
  } else if (protocolo === 'tcp' || protocolo === 'modbus') {
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

  const atraso = balanca.ovrAtraso ?? indicador?.atraso ?? 0;

  return { protocolo, endereco, serial, parser, atraso };
}
