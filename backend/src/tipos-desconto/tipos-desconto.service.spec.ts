import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TiposDescontoService } from './tipos-desconto.service';
import { PrismaService } from '../prisma/prisma.service';

interface PrismaMock {
  tipoDesconto: {
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    findFirst: jest.Mock;
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
      findFirst: jest.fn(),
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
    it('aplica defaults e ignora tenantId do DTO', async () => {
      await service.create({ tenantId: 'tenant-invasor', descricao: 'Tara' }, 'tenant-jwt');
      expect(prisma.tipoDesconto.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: 'tenant-jwt',
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
      prisma.tipoDesconto.findFirst.mockResolvedValue(null);
      await expect(service.update('x', { descricao: 'novo' }, 't')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('valida ownership pelo tenant antes de atualizar', async () => {
      prisma.tipoDesconto.findFirst.mockResolvedValue({ id: 't1', tenantId: 'tenant-jwt' });
      await service.update('t1', { descricao: 'novo', valor: 5 }, 'tenant-jwt');
      expect(prisma.tipoDesconto.findFirst).toHaveBeenCalledWith({
        where: { id: 't1', tenantId: 'tenant-jwt' },
      });
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
