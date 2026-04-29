/**
 * Catálogo de presets de balança — combina serial config + parser config.
 * Baseado nos modelos suportados pela ACBrBAL e tramas reais capturadas
 * em FERRAMENTAS PARA TESTES/BalLog.txt.
 */

import { ParserConfig } from './parsers/parser.interface';

export type SerialParity = 'N' | 'E' | 'O';
export type FlowControl = 'NONE' | 'XON_XOFF' | 'RTS_CTS' | 'DTR_DSR';

export interface SerialConfig {
  baudRate: number;
  dataBits: 7 | 8;
  parity: SerialParity;
  stopBits: 1 | 2;
  flowControl: FlowControl;
}

export interface ReadConfigPreset {
  mode: 'continuous' | 'polling' | 'manual';
  commandHex: string | null;
  intervalMs: number | null;
  timeoutMs: number;
}

export interface PresetBalanca {
  id: string;
  fabricante: string;
  modelo: string;
  parserTipo: string;
  protocolo: 'serial' | 'tcp' | 'modbus';
  serial: SerialConfig;
  parser: ParserConfig;
  read?: ReadConfigPreset;
  exemploTrama?: string;
  notas?: string;
}

const PADRAO_8N1: SerialConfig = {
  baudRate: 9600,
  dataBits: 8,
  parity: 'N',
  stopBits: 1,
  flowControl: 'NONE',
};

const TOLEDO_PROTOCOLO_C: SerialConfig = {
  baudRate: 4800,
  dataBits: 7,
  parity: 'E',
  stopBits: 2,
  flowControl: 'NONE',
};

const READ_CONTINUOUS: ReadConfigPreset = {
  mode: 'continuous',
  commandHex: null,
  intervalMs: null,
  timeoutMs: 2000,
};

const READ_ENQ_POLLING: ReadConfigPreset = {
  mode: 'polling',
  commandHex: '05',
  intervalMs: 500,
  timeoutMs: 2000,
};

const PRESETS_BALANCA_BASE: PresetBalanca[] = [
  // ============= TOLEDO =============
  {
    id: 'toledo-protocolo-c',
    fabricante: 'Toledo',
    modelo: 'Indicador (Protocolo C - request/response)',
    parserTipo: 'toledo-c',
    protocolo: 'serial',
    serial: TOLEDO_PROTOCOLO_C,
    parser: { parserTipo: 'toledo-c', fator: 100 },
    read: READ_ENQ_POLLING,
    exemploTrama: '[STX]i2  00010000000[CR][ENQ]',
    notas: 'Cliente envia ENQ (0x05) e indicador responde. Status "2"=estável, "0"=movimento.',
  },
  {
    id: 'toledo-9091',
    fabricante: 'Toledo',
    modelo: '9091 (Protocolo B - streaming)',
    parserTipo: 'toledo',
    protocolo: 'serial',
    serial: PADRAO_8N1,
    parser: { parserTipo: 'toledo' },
    exemploTrama: '[STX] + status + 6 dígitos peso + [CR]',
  },
  {
    id: 'toledo-2090',
    fabricante: 'Toledo',
    modelo: '2090',
    parserTipo: 'toledo-2090',
    protocolo: 'serial',
    serial: PADRAO_8N1,
    parser: { parserTipo: 'toledo-2090' },
    exemploTrama: '[STX] + 6 dígitos peso + [CR][LF]',
  },
  {
    id: 'toledo-2180',
    fabricante: 'Toledo',
    modelo: '2180/8530',
    parserTipo: 'toledo-2180',
    protocolo: 'serial',
    serial: PADRAO_8N1,
    parser: { parserTipo: 'toledo-2180' },
    exemploTrama: '[STX] + status + 6 dígitos + [CR][LF]',
  },
  {
    id: 'toledo-eth',
    fabricante: 'Toledo',
    modelo: 'Indicador via Ethernet (Protocolo C sobre TCP)',
    parserTipo: 'toledo-c',
    protocolo: 'tcp',
    serial: PADRAO_8N1,
    parser: { parserTipo: 'toledo-c', fator: 100 },
    read: READ_ENQ_POLLING,
    notas: 'Mesma trama do Protocolo C, mas sobre TCP/IP. Porta padrão Toledo: 4001.',
  },

  // ============= FILIZOLA =============
  {
    id: 'filizola-padrao',
    fabricante: 'Filizola',
    modelo: 'Padrão (compatível Toledo)',
    parserTipo: 'filizola',
    protocolo: 'serial',
    serial: PADRAO_8N1,
    parser: { parserTipo: 'filizola' },
    exemploTrama: '[STX] + status + 6 dígitos + [CR]',
  },
  {
    id: 'filizola-at',
    fabricante: 'Filizola',
    modelo: 'Variante "@" (request/response)',
    parserTipo: 'filizola-at',
    protocolo: 'serial',
    serial: PADRAO_8N1,
    parser: { parserTipo: 'filizola-at' },
    read: READ_ENQ_POLLING,
    exemploTrama: '@002.448[CR]',
    notas: 'Capturado em log real (BalLog.txt). Cliente envia ENQ → resposta @PESO[CR].',
  },

  // ============= DIGITRON =============
  {
    id: 'digitron-padrao',
    fabricante: 'Digitron',
    modelo: 'Padrão (formato D)',
    parserTipo: 'digitron',
    protocolo: 'serial',
    serial: PADRAO_8N1,
    parser: { parserTipo: 'digitron' },
    exemploTrama: 'D000.318[CR]',
  },
  {
    id: 'digitron-7bit',
    fabricante: 'Digitron',
    modelo: '7 bits / paridade par',
    parserTipo: 'generic',
    protocolo: 'serial',
    serial: { ...PADRAO_8N1, dataBits: 7, parity: 'E' },
    parser: { parserTipo: 'generic', inicioPeso: 4, tamanhoPeso: 4, marcador: 13 },
    exemploTrama: '[20][STX][STX].318[CR]',
  },

  // ============= MT-SICS =============
  {
    id: 'mettler-sics',
    fabricante: 'Mettler Toledo',
    modelo: 'MT-SICS',
    parserTipo: 'sics',
    protocolo: 'serial',
    serial: PADRAO_8N1,
    parser: { parserTipo: 'sics' },
    exemploTrama: 'S S     12.345 kg[CR][LF]',
  },

  // ============= MODBUS =============
  {
    id: 'modbus-rtu',
    fabricante: 'Genérico',
    modelo: 'Modbus RTU',
    parserTipo: 'modbus',
    protocolo: 'modbus',
    serial: { ...PADRAO_8N1, baudRate: 19200 },
    parser: { parserTipo: 'modbus' },
    notas: 'Holding registers — endereço configurável por fabricante (ALFA 3102 etc).',
  },

  // ============= URANO =============
  {
    id: 'urano-padrao',
    fabricante: 'Urano',
    modelo: 'Padrão (US series)',
    parserTipo: 'urano',
    protocolo: 'serial',
    serial: PADRAO_8N1,
    parser: { parserTipo: 'urano' },
    exemploTrama: '[STX] NN PESO ,UNI [ETX]',
  },
  {
    id: 'urano-pop',
    fabricante: 'Urano',
    modelo: 'POP (Plus / streaming)',
    parserTipo: 'urano-pop',
    protocolo: 'serial',
    serial: PADRAO_8N1,
    parser: { parserTipo: 'urano-pop' },
    exemploTrama: 'PESO[CR][LF]',
  },

  // ============= SATURNO =============
  {
    id: 'saturno',
    fabricante: 'Saturno',
    modelo: 'Indicador',
    parserTipo: 'saturno',
    protocolo: 'serial',
    serial: PADRAO_8N1,
    parser: { parserTipo: 'saturno' },
    exemploTrama: '[STX]NNNNNN[ETX]',
  },
  {
    id: 'saturno-tcp',
    fabricante: 'Saturno',
    modelo: 'Indicador via TCP/IP (USR-TCP232)',
    parserTipo: 'saturno',
    protocolo: 'tcp',
    serial: PADRAO_8N1,
    parser: { parserTipo: 'saturno' },
    notas: 'Conversor serial-TCP USR-TCP232-M4 (utilitário Saturno na pasta de testes).',
  },

  // ============= A&D / TCS / FTS =============
  {
    id: 'afts',
    fabricante: 'A&D',
    modelo: 'FTS series',
    parserTipo: 'afts',
    protocolo: 'serial',
    serial: PADRAO_8N1,
    parser: { parserTipo: 'afts' },
    exemploTrama: 'ST,GS,+   12.345 kg[CR][LF]',
    notas: 'Compatível com Cubas/TCS. Status ST=stable, US=unstable, OL=overload.',
  },
  {
    id: 'tcs',
    fabricante: 'TCS',
    modelo: 'Indicador (compat. A&D)',
    parserTipo: 'tcs',
    protocolo: 'serial',
    serial: PADRAO_8N1,
    parser: { parserTipo: 'tcs' },
  },

  // ============= LÍDER =============
  {
    id: 'lider',
    fabricante: 'Líder',
    modelo: '8528 / 9000 (compat. Toledo)',
    parserTipo: 'toledo',
    protocolo: 'serial',
    serial: PADRAO_8N1,
    parser: { parserTipo: 'toledo' },
    notas: 'Líder usa protocolo similar ao Toledo Protocolo B.',
  },

  // ============= MAGNA =============
  {
    id: 'magna',
    fabricante: 'Magna',
    modelo: 'Indicador',
    parserTipo: 'generic',
    protocolo: 'serial',
    serial: PADRAO_8N1,
    parser: { parserTipo: 'generic', inicioPeso: 1, tamanhoPeso: 8, marcador: 13 },
    exemploTrama: 'PESO[CR]',
  },

  // ============= LUCAS TÉCNICA =============
  {
    id: 'lucastec',
    fabricante: 'Lucas Técnica',
    modelo: 'Streaming',
    parserTipo: 'generic',
    protocolo: 'serial',
    serial: PADRAO_8N1,
    parser: { parserTipo: 'generic', inicioPeso: 1, tamanhoPeso: 6, marcador: 13 },
  },

  // ============= MAGELLAN / DATALOGIC =============
  {
    id: 'magellan',
    fabricante: 'Magellan/Datalogic',
    modelo: 'Scanner balança integrado',
    parserTipo: 'generic',
    protocolo: 'serial',
    serial: { ...PADRAO_8N1, baudRate: 9600, parity: 'O' },
    parser: { parserTipo: 'generic', inicioPeso: 1, tamanhoPeso: 5, marcador: 13 },
  },

  // ============= RINNERT =============
  {
    id: 'rinnert',
    fabricante: 'Rinnert',
    modelo: 'Indicador',
    parserTipo: 'generic',
    protocolo: 'serial',
    serial: PADRAO_8N1,
    parser: { parserTipo: 'generic', inicioPeso: 1, tamanhoPeso: 6, marcador: 13 },
  },

  // ============= LIBRATEK =============
  {
    id: 'libratek',
    fabricante: 'Libratek',
    modelo: 'Indicador',
    parserTipo: 'generic',
    protocolo: 'serial',
    serial: PADRAO_8N1,
    parser: { parserTipo: 'generic', inicioPeso: 1, tamanhoPeso: 7, marcador: 13 },
  },

  // ============= MICHELETTI =============
  {
    id: 'micheletti',
    fabricante: 'Micheletti',
    modelo: 'Indicador',
    parserTipo: 'generic',
    protocolo: 'serial',
    serial: PADRAO_8N1,
    parser: { parserTipo: 'generic', inicioPeso: 1, tamanhoPeso: 6, marcador: 10 },
  },

  // ============= ALFA =============
  {
    id: 'alfa-3102',
    fabricante: 'Alfa',
    modelo: '3102 (Modbus RTU)',
    parserTipo: 'modbus',
    protocolo: 'modbus',
    serial: { ...PADRAO_8N1, baudRate: 19200 },
    parser: { parserTipo: 'modbus' },
  },

  // ============= MULLER =============
  {
    id: 'muller',
    fabricante: 'Muller',
    modelo: 'CRM 80000 / similar',
    parserTipo: 'generic',
    protocolo: 'serial',
    serial: PADRAO_8N1,
    parser: { parserTipo: 'generic', inicioPeso: 1, tamanhoPeso: 6, marcador: 13 },
  },

  // ============= GENÉRICA CONFIGURÁVEL =============
  {
    id: 'generica-cr',
    fabricante: 'Genérica',
    modelo: 'Configurável (terminador CR)',
    parserTipo: 'generic',
    protocolo: 'serial',
    serial: PADRAO_8N1,
    parser: { parserTipo: 'generic', inicioPeso: 1, tamanhoPeso: 6, marcador: 13 },
  },
  {
    id: 'generica-lf',
    fabricante: 'Genérica',
    modelo: 'Configurável (terminador LF)',
    parserTipo: 'generic',
    protocolo: 'serial',
    serial: PADRAO_8N1,
    parser: { parserTipo: 'generic', inicioPeso: 1, tamanhoPeso: 6, marcador: 10 },
  },
  {
    id: 'generica-tcp',
    fabricante: 'Genérica',
    modelo: 'TCP/IP universal (qualquer balança via conversor serial-Ethernet)',
    parserTipo: 'generic',
    protocolo: 'tcp',
    serial: PADRAO_8N1,
    parser: { parserTipo: 'generic', inicioPeso: 1, tamanhoPeso: 6, marcador: 13 },
    notas:
      'Para balanças com IP fixo via conversores como USR-TCP232, MOXA NPort, Lantronix XPort. Configurar IP/porta na balança e usar este preset com parser que case com a trama original.',
  },
];

export const PRESETS_BALANCA: PresetBalanca[] = PRESETS_BALANCA_BASE.map((preset) => ({
  ...preset,
  read: preset.read ?? READ_CONTINUOUS,
}));

/** Combinações comuns de baud/data/parity/stop oferecidas na UI. */
export const SERIAL_OPTIONS = {
  baudRate: [1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200],
  dataBits: [7, 8],
  parity: ['N', 'E', 'O'] as SerialParity[],
  stopBits: [1, 2],
  flowControl: ['NONE', 'XON_XOFF', 'RTS_CTS', 'DTR_DSR'] as FlowControl[],
};

export function buscarPreset(id: string): PresetBalanca | undefined {
  return PRESETS_BALANCA.find((p) => p.id === id);
}
