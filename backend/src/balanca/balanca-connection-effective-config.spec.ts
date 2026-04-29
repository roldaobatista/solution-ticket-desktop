import { EventEmitter } from 'events';
import { BalancaConnectionService } from './balanca-connection.service';
import { PrismaService } from '../prisma/prisma.service';

const adapter = Object.assign(new EventEmitter(), {
  connect: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
  isOpen: jest.fn(() => true),
});

const createAdapterMock = jest.fn((..._args: unknown[]) => adapter);
const createParserMock = jest.fn((..._args: unknown[]) => ({
  parse: jest.fn(() => ({ leitura: null, restante: Buffer.alloc(0) })),
}));

jest.mock('./adapters/adapter.factory', () => ({
  createAdapter: (...args: unknown[]) => createAdapterMock(...args),
}));

jest.mock('./parsers/parser.factory', () => ({
  createParser: (...args: unknown[]) => createParserMock(...args),
}));

describe('BalancaConnectionService - configuracao efetiva', () => {
  beforeEach(() => {
    createAdapterMock.mockClear();
    createParserMock.mockClear();
    adapter.connect.mockClear();
  });

  it('usa overrides da balanca ao criar adapter e parser', async () => {
    const prisma = {
      balanca: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'b1',
          protocolo: 'serial',
          porta: 'COM7',
          baudRate: null,
          enderecoIp: null,
          portaTcp: null,
          toleranciaEstabilidade: null,
          janelaEstabilidade: null,
          ovrDataBits: 7,
          ovrParity: 'E',
          ovrStopBits: 2,
          ovrFlowControl: 'RTS_CTS',
          ovrInicioPeso: 3,
          ovrTamanhoPeso: 6,
          ovrTamanhoString: null,
          ovrMarcador: 13,
          ovrFator: 10,
          ovrInvertePeso: true,
          ovrAtraso: 250,
          ovrParserTipo: 'generic',
          indicador: {
            protocolo: 'serial',
            baudrate: 9600,
            databits: 8,
            parity: 'N',
            stopbits: 1,
            flowControl: 'NONE',
            inicioPeso: 1,
            tamanhoPeso: 4,
            tamanhoString: null,
            marcador: 10,
            fator: 1,
            invertePeso: false,
            atraso: 0,
            parserTipo: 'toledo',
          },
        }),
      },
    };
    const service = new BalancaConnectionService(prisma as unknown as PrismaService);

    await service.conectar('b1', 'tenant-1');

    expect(createAdapterMock).toHaveBeenCalledWith(
      'serial',
      expect.objectContaining({
        porta: 'COM7',
        databits: 7,
        parity: 'E',
        stopbits: 2,
        flowControl: 'RTS_CTS',
        intervalMs: 250,
      }),
    );
    expect(createParserMock).toHaveBeenCalledWith(
      expect.objectContaining({
        parserTipo: 'generic',
        inicioPeso: 3,
        tamanhoPeso: 6,
        marcador: 13,
        fator: 10,
        invertePeso: true,
      }),
    );
  });
});
