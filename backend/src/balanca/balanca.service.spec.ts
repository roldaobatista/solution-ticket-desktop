import { BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BalancaService } from './balanca.service';

type BalancaPrismaMock = {
  empresa: { findFirst: jest.Mock };
  unidade: { findFirst: jest.Mock };
  indicadorPesagem: { findFirst: jest.Mock };
  balanca: {
    create: jest.Mock;
    findFirst: jest.Mock;
    update: jest.Mock;
  };
};

describe('BalancaService', () => {
  let prisma: BalancaPrismaMock;
  let service: BalancaService;

  beforeEach(() => {
    prisma = {
      empresa: { findFirst: jest.fn().mockResolvedValue({ id: 'empresa-1' }) },
      unidade: { findFirst: jest.fn().mockResolvedValue({ id: 'unidade-1' }) },
      indicadorPesagem: { findFirst: jest.fn().mockResolvedValue({ id: 'indicador-1' }) },
      balanca: {
        create: jest.fn().mockResolvedValue({ id: 'balanca-1' }),
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({ id: 'balanca-1' }),
      },
    };
    service = new BalancaService(prisma as unknown as PrismaService);
  });

  const baseDto = {
    empresaId: 'empresa-1',
    unidadeId: 'unidade-1',
    nome: 'Balanca 1',
  };

  it('exige porta serial para alias rs232', async () => {
    await expect(service.create({ ...baseDto, protocolo: 'rs232' }, 'tenant-1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('checa conflito de porta para alias rs485', async () => {
    prisma.balanca.findFirst.mockResolvedValue({ id: 'b2', nome: 'Balanca 2' });

    await expect(
      service.create({ ...baseDto, protocolo: 'rs485', porta: 'COM3' }, 'tenant-1'),
    ).rejects.toThrow(ConflictException);
  });

  it('exige enderecoIp e portaTcp para alias tcpip', async () => {
    await expect(service.create({ ...baseDto, protocolo: 'tcpip' }, 'tenant-1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('aceita tcpip quando enderecoIp e portaTcp foram informados', async () => {
    await service.create(
      { ...baseDto, protocolo: 'tcpip', enderecoIp: '192.168.0.10', portaTcp: 4001 },
      'tenant-1',
    );

    expect(prisma.balanca.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        protocolo: 'tcp',
        enderecoIp: '192.168.0.10',
        portaTcp: 4001,
        tenantId: 'tenant-1',
      }),
    });
  });

  it('aceita modbus-tcp com enderecoIp e portaTcp sem exigir porta serial', async () => {
    await service.create(
      {
        ...baseDto,
        protocolo: 'modbus-tcp',
        enderecoIp: '192.168.0.20',
        portaTcp: 502,
        modbusUnitId: 1,
        modbusRegister: 0,
      },
      'tenant-1',
    );

    expect(prisma.balanca.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        protocolo: 'modbus-tcp',
        enderecoIp: '192.168.0.20',
        portaTcp: 502,
        modbusUnitId: 1,
        modbusRegister: 0,
      }),
    });
  });

  it('exige porta serial para modbus-rtu', async () => {
    await expect(
      service.create({ ...baseDto, protocolo: 'modbus-rtu' }, 'tenant-1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejeita modbus generico sem transporte explicito', async () => {
    await expect(service.create({ ...baseDto, protocolo: 'modbus' }, 'tenant-1')).rejects.toThrow(
      /modbus-rtu ou modbus-tcp/,
    );
  });

  it('rejeita indicador de outro tenant', async () => {
    prisma.indicadorPesagem.findFirst.mockResolvedValue(null);

    await expect(
      service.create(
        { ...baseDto, indicadorId: '550e8400-e29b-41d4-a716-446655440000' },
        'tenant-1',
      ),
    ).rejects.toThrow('Indicador de pesagem nao pertence ao tenant');
  });

  it('valida update parcial usando estado combinado e conflito global de porta ativa', async () => {
    prisma.balanca.findFirst
      .mockResolvedValueOnce({
        id: 'balanca-1',
        tenantId: 'tenant-1',
        empresaId: 'empresa-1',
        unidadeId: 'unidade-1',
        protocolo: 'serial',
        porta: 'COM3',
        ativo: true,
      })
      .mockResolvedValueOnce({ id: 'balanca-2', nome: 'Balanca 2' });

    await expect(service.update('balanca-1', { porta: 'COM4' }, 'tenant-1')).rejects.toThrow(
      ConflictException,
    );

    expect(prisma.balanca.findFirst).toHaveBeenLastCalledWith({
      where: { porta: 'COM4', ativo: true, NOT: { id: 'balanca-1' } },
      select: { id: true, nome: true },
    });
  });

  it('valida update parcial de TCP com host e porta finais', async () => {
    prisma.balanca.findFirst.mockResolvedValueOnce({
      id: 'balanca-1',
      tenantId: 'tenant-1',
      empresaId: 'empresa-1',
      unidadeId: 'unidade-1',
      protocolo: 'tcp',
      enderecoIp: '192.168.0.10',
      portaTcp: null,
      ativo: true,
    });

    await expect(service.update('balanca-1', { portaTcp: 4001 }, 'tenant-1')).resolves.toEqual({
      id: 'balanca-1',
    });
  });

  it('rejeita update parcial com override serial invalido', async () => {
    prisma.balanca.findFirst.mockResolvedValueOnce({
      id: 'balanca-1',
      tenantId: 'tenant-1',
      empresaId: 'empresa-1',
      unidadeId: 'unidade-1',
      protocolo: 'serial',
      porta: 'COM3',
      ativo: true,
      ovrDataBits: 8,
    });

    await expect(service.update('balanca-1', { ovrDataBits: 9 }, 'tenant-1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('preserva null no update para limpar override', async () => {
    prisma.balanca.findFirst
      .mockResolvedValueOnce({
        id: 'balanca-1',
        tenantId: 'tenant-1',
        empresaId: 'empresa-1',
        unidadeId: 'unidade-1',
        protocolo: 'serial',
        porta: 'COM3',
        ativo: true,
        ovrParity: 'E',
      })
      .mockResolvedValueOnce(null);

    await service.update('balanca-1', { ovrParity: null }, 'tenant-1');

    expect(prisma.balanca.update).toHaveBeenCalledWith({
      where: { id: 'balanca-1', tenantId: 'tenant-1' },
      data: { ovrParity: null },
    });
  });
});
