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
  });
});
