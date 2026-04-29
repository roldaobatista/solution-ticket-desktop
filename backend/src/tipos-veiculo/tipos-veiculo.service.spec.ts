import { BadRequestException } from '@nestjs/common';
import { TiposVeiculoService } from './tipos-veiculo.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TiposVeiculoService', () => {
  const prisma = {
    tipoVeiculo: {
      findMany: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeService() {
    return new TiposVeiculoService(prisma as unknown as PrismaService);
  }

  it('nao lista tipos sem tenant do JWT', async () => {
    await expect(makeService().findAll(undefined, 'truck')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.tipoVeiculo.findMany).not.toHaveBeenCalled();
  });

  it('filtra listagem pelo tenant informado pelo JWT', async () => {
    prisma.tipoVeiculo.findMany.mockResolvedValue([]);

    await makeService().findAll('tenant-jwt', 'truck');

    expect(prisma.tipoVeiculo.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tenant-jwt',
          descricao: { contains: 'truck' },
        }),
      }),
    );
  });
});
