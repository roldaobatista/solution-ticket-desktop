import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateBalancaDto } from './create-balanca.dto';
import { UpdateBalancaDto } from './update-balanca.dto';

describe('DTO validations — balanca domain', () => {
  describe('CreateBalancaDto', () => {
    const base = () =>
      plainToInstance(CreateBalancaDto, {
        empresaId: '550e8400-e29b-41d4-a716-446655440000',
        unidadeId: '550e8400-e29b-41d4-a716-446655440001',
        nome: 'Balança Principal',
      });

    it('aceita protocolos válidos', async () => {
      const validos = ['serial', 'tcp', 'tcpip', 'modbus', 'modbus-tcp'];
      for (const protocolo of validos) {
        const dto = base();
        dto.protocolo = protocolo;
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });

    it('rejeita protocolo inválido', async () => {
      const dto = base();
      dto.protocolo = 'invalido';
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'protocolo')).toBe(true);
    });

    it('aceita sem protocolo (opcional)', async () => {
      const dto = base();
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('aceita overrides seriais, parser, estabilidade e leitura configuravel', async () => {
      const dto = plainToInstance(CreateBalancaDto, {
        empresaId: '550e8400-e29b-41d4-a716-446655440000',
        unidadeId: '550e8400-e29b-41d4-a716-446655440001',
        nome: 'Balança Principal',
        baudRate: 4800,
        ovrDataBits: 7,
        ovrParity: 'E',
        ovrStopBits: 2,
        ovrFlowControl: 'NONE',
        ovrParserTipo: 'generic',
        ovrInicioPeso: 1,
        ovrTamanhoPeso: 6,
        ovrTamanhoString: 18,
        ovrMarcador: 13,
        ovrFator: 10,
        ovrInvertePeso: true,
        ovrAtraso: 250,
        toleranciaEstabilidade: 2,
        janelaEstabilidade: 5,
        debugMode: true,
        readMode: 'polling',
        readCommandHex: '05',
        readIntervalMs: 500,
        readTimeoutMs: 2000,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('rejeita ranges invalidos de serial e comando hex malformado', async () => {
      const dto = plainToInstance(CreateBalancaDto, {
        empresaId: '550e8400-e29b-41d4-a716-446655440000',
        unidadeId: '550e8400-e29b-41d4-a716-446655440001',
        nome: 'Balança Principal',
        ovrDataBits: 9,
        ovrStopBits: 3,
        readMode: 'polling',
        readCommandHex: '5',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'ovrDataBits')).toBe(true);
      expect(errors.some((e) => e.property === 'ovrStopBits')).toBe(true);
      expect(errors.some((e) => e.property === 'readCommandHex')).toBe(true);
    });
  });

  describe('UpdateBalancaDto', () => {
    it('rejeita protocolo inválido no update', async () => {
      const dto = plainToInstance(UpdateBalancaDto, {
        protocolo: 'bluetooth',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'protocolo')).toBe(true);
    });

    it('aceita protocolo válido no update', async () => {
      const dto = plainToInstance(UpdateBalancaDto, {
        protocolo: 'rs485',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('aceita null no update para limpar overrides e herdar do indicador', async () => {
      const dto = plainToInstance(UpdateBalancaDto, {
        ovrDataBits: null,
        ovrParity: null,
        ovrStopBits: null,
        ovrFlowControl: null,
        ovrParserTipo: null,
        ovrInicioPeso: null,
        ovrTamanhoPeso: null,
        ovrTamanhoString: null,
        ovrMarcador: null,
        ovrFator: null,
        ovrInvertePeso: null,
        ovrAtraso: null,
        readMode: null,
        readCommandHex: null,
        readIntervalMs: null,
        readTimeoutMs: null,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('rejeita campos desconhecidos com whitelist do ValidationPipe global', async () => {
      const dto = plainToInstance(UpdateBalancaDto, {
        ovrParity: 'N',
        campoIntruso: 'x',
      });
      const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
      expect(errors.some((e) => e.property === 'campoIntruso')).toBe(true);
    });
  });
});
