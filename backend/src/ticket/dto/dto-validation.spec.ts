import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateTicketDto } from './create-ticket.dto';
import { RegistrarPassagemDto } from './registrar-passagem.dto';
import { AdicionarDescontoDto } from './adicionar-desconto.dto';

describe('DTO validations — ticket domain', () => {
  describe('CreateTicketDto', () => {
    const base = () =>
      plainToInstance(CreateTicketDto, {
        unidadeId: '550e8400-e29b-41d4-a716-446655440000',
        fluxoPesagem: 'PF2_BRUTO_TARA',
        clienteId: '550e8400-e29b-41d4-a716-446655440001',
        produtoId: '550e8400-e29b-41d4-a716-446655440002',
      });

    it('aceita pesoNf positivo', async () => {
      const dto = base();
      dto.pesoNf = 15000.5;
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('aceita pesoNf zero', async () => {
      const dto = base();
      dto.pesoNf = 0;
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('rejeita pesoNf negativo', async () => {
      const dto = base();
      dto.pesoNf = -100;
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'pesoNf')).toBe(true);
    });

    it('rejeita pesoNf string', async () => {
      const dto = base();
      (dto as unknown as { pesoNf: string }).pesoNf = 'invalido';
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'pesoNf')).toBe(true);
    });

    it('aceita sem pesoNf (opcional)', async () => {
      const dto = base();
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('RegistrarPassagemDto', () => {
    const base = () =>
      plainToInstance(RegistrarPassagemDto, {
        tipoPassagem: 'OFICIAL',
        direcaoOperacional: 'ENTRADA',
        papelCalculo: 'BRUTO_OFICIAL',
        condicaoVeiculo: 'CARREGADO',
        pesoCapturado: 35000,
        balancaId: '550e8400-e29b-41d4-a716-446655440000',
        origemLeitura: 'BALANCA_SERIAL',
      });

    it('aceita pesoCapturado positivo', async () => {
      const dto = base();
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('aceita pesoCapturado zero', async () => {
      const dto = base();
      dto.pesoCapturado = 0;
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('rejeita pesoCapturado negativo', async () => {
      const dto = base();
      dto.pesoCapturado = -500;
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'pesoCapturado')).toBe(true);
    });
  });

  describe('AdicionarDescontoDto', () => {
    const base = () =>
      plainToInstance(AdicionarDescontoDto, {
        tipo: 'UMIDADE',
        valor: 100.5,
      });

    it('aceita valor positivo', async () => {
      const dto = base();
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('aceita valor zero', async () => {
      const dto = base();
      dto.valor = 0;
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('rejeita valor negativo', async () => {
      const dto = base();
      dto.valor = -50;
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'valor')).toBe(true);
    });
  });
});
