import { BadRequestException, ConflictException } from '@nestjs/common';
import { BalancaService } from './balanca.service';

describe('BalancaService', () => {
  let prisma: any;
  let service: BalancaService;

  beforeEach(() => {
    prisma = {
      empresa: { findFirst: jest.fn().mockResolvedValue({ id: 'empresa-1' }) },
      unidade: { findFirst: jest.fn().mockResolvedValue({ id: 'unidade-1' }) },
      balanca: {
        create: jest.fn().mockResolvedValue({ id: 'balanca-1' }),
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };
    service = new BalancaService(prisma);
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
});
