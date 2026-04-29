import type { Balanca, IndicadorPesagem } from '@prisma/client';
import { resolveEffectiveConfig, resolveEffectiveConfigWithSources } from './config-resolver';

const baseBalanca = {
  id: 'b1',
  protocolo: 'serial',
  porta: 'COM3',
  baudRate: 9600,
  enderecoIp: null,
  portaTcp: null,
  ovrDataBits: null,
  ovrParity: null,
  ovrStopBits: null,
  ovrFlowControl: null,
  ovrInicioPeso: null,
  ovrTamanhoPeso: null,
  ovrTamanhoString: null,
  ovrMarcador: null,
  ovrFator: null,
  ovrInvertePeso: null,
  ovrAtraso: null,
  ovrParserTipo: null,
  readMode: null,
  readCommandHex: null,
  readIntervalMs: null,
  readTimeoutMs: null,
} as unknown as Balanca;

const indToledo = {
  parserTipo: 'toledo',
  baudrate: 4800,
  databits: 7,
  stopbits: 2,
  parity: 'E',
  flowControl: 'NONE',
  inicioPeso: 3,
  tamanhoPeso: 6,
  tamanhoString: 9,
  marcador: 13,
  fator: 1,
  invertePeso: false,
  atraso: 100,
  protocolo: 'serial',
  readMode: 'continuous',
  readCommandHex: null,
  readIntervalMs: null,
  readTimeoutMs: 2000,
} as unknown as IndicadorPesagem;

describe('resolveEffectiveConfig', () => {
  it('aplica defaults seguros sem indicador', () => {
    const cfg = resolveEffectiveConfig(baseBalanca, null);
    expect(cfg.protocolo).toBe('serial');
    expect(cfg.endereco).toBe('COM3');
    expect(cfg.serial).toMatchObject({ baudRate: 9600, dataBits: 8, parity: 'N', stopBits: 1 });
    expect(cfg.parser.parserTipo).toBe('generic');
    expect(cfg.parser.marcador).toBe(13);
    expect(cfg.read).toMatchObject({ mode: 'continuous', commandHex: null, timeoutMs: 2000 });
  });

  it('herda config do indicador', () => {
    const cfg = resolveEffectiveConfig(baseBalanca, indToledo);
    expect(cfg.serial).toMatchObject({ dataBits: 7, parity: 'E', stopBits: 2 });
    expect(cfg.parser.parserTipo).toBe('toledo');
    expect(cfg.atraso).toBe(100);
  });

  it('resolve modo request-response e comando de leitura por override da balanca', () => {
    const cfg = resolveEffectiveConfigWithSources(
      {
        ...baseBalanca,
        readMode: 'polling',
        readCommandHex: '05',
        readIntervalMs: 500,
        readTimeoutMs: 2000,
      } as unknown as Balanca,
      { ...indToledo, readMode: 'continuous', readCommandHex: null } as unknown as IndicadorPesagem,
    );
    expect(cfg.read).toMatchObject({
      mode: 'polling',
      commandHex: '05',
      intervalMs: 500,
      timeoutMs: 2000,
    });
  });

  it('informa origem dos campos efetivos', () => {
    const cfg = resolveEffectiveConfigWithSources(
      {
        ...baseBalanca,
        ovrParity: 'O',
        readMode: null,
      } as unknown as Balanca,
      { ...indToledo, readMode: 'polling', readCommandHex: '05' } as unknown as IndicadorPesagem,
    );
    expect(cfg.sources['serial.parity']).toBe('balanca');
    expect(cfg.sources['read.mode']).toBe('indicador');
    expect(cfg.sources['read.commandHex']).toBe('indicador');
  });

  it('override do equipamento prevalece sobre indicador', () => {
    const balOverride = {
      ...baseBalanca,
      ovrParserTipo: 'toledo-c',
      ovrInicioPeso: 2,
      ovrFator: 100,
    };
    const cfg = resolveEffectiveConfig(balOverride, indToledo);
    expect(cfg.parser.parserTipo).toBe('toledo-c');
    expect(cfg.parser.inicioPeso).toBe(2);
    expect(cfg.parser.fator).toBe(100);
    // Não-overridden segue do indicador
    expect(cfg.serial.parity).toBe('E');
  });

  it('endereço para TCP combina ip+porta', () => {
    const balTcp = {
      ...baseBalanca,
      protocolo: 'tcp',
      enderecoIp: '192.168.1.50',
      portaTcp: 4001,
    };
    const cfg = resolveEffectiveConfig(balTcp, null);
    expect(cfg.protocolo).toBe('tcp');
    expect(cfg.endereco).toBe('192.168.1.50:4001');
  });

  it('normaliza parity legado (none/even/odd)', () => {
    const indLegacy = { ...indToledo, parity: 'even', flowControl: 'hardware' };
    const cfg = resolveEffectiveConfig(baseBalanca, indLegacy);
    expect(cfg.serial.parity).toBe('E');
  });
});
