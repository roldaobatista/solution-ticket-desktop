import { BadRequestException } from '@nestjs/common';
import { TabelaUmidadeService } from './tabela-umidade.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TabelaUmidadeService', () => {
  const prisma = {
    tabelaUmidade: {
      findMany: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeService() {
    return new TabelaUmidadeService(prisma as unknown as PrismaService);
  }

  it('nao lista tabela de umidade sem tenant do JWT', async () => {
    await expect(makeService().findByProduto('produto-1', undefined)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.tabelaUmidade.findMany).not.toHaveBeenCalled();
  });

  it('filtra tabela de umidade por produto e tenant', async () => {
    prisma.tabelaUmidade.findMany.mockResolvedValue([]);

    await makeService().findByProduto('produto-1', 'tenant-1');

    expect(prisma.tabelaUmidade.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { produtoId: 'produto-1', tenantId: 'tenant-1' },
      }),
    );
  });

  it('calcula desconto apenas com tabela do tenant informado', async () => {
    prisma.tabelaUmidade.findMany.mockResolvedValue([
      { faixaInicial: 14, faixaFinal: 20, descontoPercentual: 2 },
    ]);

    await makeService().calcularDesconto('produto-1', 16, 1000, 'tenant-1');

    expect(prisma.tabelaUmidade.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { produtoId: 'produto-1', tenantId: 'tenant-1' },
      }),
    );
  });
});
