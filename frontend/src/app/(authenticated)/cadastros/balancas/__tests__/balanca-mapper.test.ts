import { mapBalancaPayload } from '@/lib/api/balanca-payload';
import { mapBalanca } from '@/lib/api/mappers';
import { Balanca } from '@/types';

describe('balanca mapper/payload', () => {
  it('mapeia overrides e leitura configuravel para payload backend', () => {
    expect(
      mapBalancaPayload({
        tipoConexao: 'SERIAL',
        baudRate: 4800,
        ovrDataBits: 7,
        ovrParity: 'E',
        ovrStopBits: 2,
        ovrFlowControl: 'NONE',
        ovrParserTipo: 'generic',
        ovrInicioPeso: 1,
        ovrTamanhoPeso: 6,
        ovrMarcador: 13,
        readMode: 'polling',
        readCommandHex: '05',
      }),
    ).toMatchObject({
      protocolo: 'serial',
      baudRate: 4800,
      ovrDataBits: 7,
      ovrParity: 'E',
      readMode: 'polling',
      readCommandHex: '05',
    });
  });

  it('preserva null para limpar overrides', () => {
    expect(
      mapBalancaPayload({
        ovrDataBits: null,
        ovrParity: null,
        readCommandHex: null,
      } as Partial<Balanca>),
    ).toMatchObject({
      ovrDataBits: null,
      ovrParity: null,
      readCommandHex: null,
    });
  });

  it('mapeia resposta backend com indicador incluido e campos novos', () => {
    const mapped = mapBalanca({
      id: 'b1',
      nome: 'Entrada',
      protocolo: 'serial',
      baudRate: 4800,
      ovrDataBits: 7,
      ovrParity: 'E',
      readMode: 'polling',
      readCommandHex: '05',
      indicador: { id: 'i1', fabricante: 'Toledo', modelo: 'C' },
    });

    expect(mapped).toMatchObject({
      baudRate: 4800,
      baud_rate: 4800,
      ovrDataBits: 7,
      ovr_data_bits: 7,
      readMode: 'polling',
      read_command_hex: '05',
      indicador_nome: 'C',
    });
  });
});
