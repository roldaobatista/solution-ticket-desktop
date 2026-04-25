import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TiposDescontoService } from './tipos-desconto.service';
import { PrismaService } from '../prisma/prisma.service';

interface PrismaMock {
  tipoDesconto: {
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    count: jest.Mock;
  };
}

function makePrismaMock(): PrismaMock {
  return {
    tipoDesconto: {
      create: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
      count: jest.fn().mockResolvedValue(0),
    },
  };
}

describe('TiposDescontoService', () => {
  let service: TiposDescontoService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = makePrismaMock();
    const moduleRef = await Test.createTestingModule({
      providers: [TiposDescontoService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(TiposDescontoService);
  });

  describe('create', () => {
    it('aplica defaults quando opcionais ausentes', async () => {
      await service.create({ tenantId: 't', descricao: 'Tara' });
      expect(prisma.tipoDesconto.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: 't',
          descricao: 'Tara',
          tipo: 'PERCENTUAL',
          mantem: false,
          calcula: true,
          visivelPE: true,
          ativo: true,
        }),
      });
    });
  });

  describe('findAll', () => {
    it('filtra ativos quando flag verdadeira', async () => {
      await service.findAll('t', true);
      expect(prisma.tipoDesconto.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId: 't', ativo: true } }),
      );
    });

    it('omite ativo quando false', async () => {
      await service.findAll('t');
      expect(prisma.tipoDesconto.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId: 't' } }),
      );
    });
  });

  describe('update', () => {
    it('lanca NotFound quando nao existe', async () => {
      prisma.tipoDesconto.findUnique.mockResolvedValue(null);
      await expect(service.update('x', { descricao: 'novo' })).rejects.toThrow(NotFoundException);
    });

    it('aplica apenas campos fornecidos', async () => {
      prisma.tipoDesconto.findUnique.mockResolvedValue({ id: 't1' });
      await service.update('t1', { descricao: 'novo', valor: 5 });
      expect(prisma.tipoDesconto.update).toHaveBeenCalledWith({
        where: { id: 't1' },
        data: { descricao: 'novo', valor: 5 },
      });
    });
  });

  describe('seedPadrao', () => {
    it('nao recria quando ja existem registros', async () => {
      prisma.tipoDesconto.count.mockResolvedValue(3);
      const out = await service.seedPadrao('t');
      expect(out).toEqual({ criado: false, quantidade: 3 });
      expect(prisma.tipoDesconto.create).not.toHaveBeenCalled();
    });

    it('cria 5 padroes quando vazio', async () => {
      const out = await service.seedPadrao('t');
      expect(out).toEqual({ criado: true, quantidade: 5 });
      expect(prisma.tipoDesconto.create).toHaveBeenCalledTimes(5);
    });
  });
});
