import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ArmazensService } from './armazens.service';
import { PrismaService } from '../../prisma/prisma.service';

interface PrismaMock {
  armazem: {
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    count: jest.Mock;
  };
}

function makePrismaMock(): PrismaMock {
  return {
    armazem: {
      create: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
      count: jest.fn().mockResolvedValue(0),
    },
  };
}

describe('ArmazensService', () => {
  let service: ArmazensService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = makePrismaMock();
    const moduleRef = await Test.createTestingModule({
      providers: [ArmazensService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(ArmazensService);
  });

  describe('findAll', () => {
    it('aplica tenantId, search e ativo=true por padrao', async () => {
      await service.findAll({ tenantId: 't', search: 'silo' });
      expect(prisma.armazem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: 't', descricao: { contains: 'silo' }, ativo: true },
          skip: 0,
          take: 20,
        }),
      );
    });

    it('respeita ativo=false explicito', async () => {
      await service.findAll({ tenantId: 't', ativo: false });
      expect(prisma.armazem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId: 't', ativo: false } }),
      );
    });

    it('retorna shape paginado com totalPages calculado', async () => {
      prisma.armazem.findMany.mockResolvedValue([{ id: 'a' }]);
      prisma.armazem.count.mockResolvedValue(45);
      const out = await service.findAll({ tenantId: 't', page: 2, limit: 20 });
      expect(out).toEqual({
        data: [{ id: 'a' }],
        total: 45,
        page: 2,
        limit: 20,
        totalPages: 3,
      });
    });
  });

  describe('findOne', () => {
    it('lanca NotFound quando nao existe', async () => {
      prisma.armazem.findUnique.mockResolvedValue(null);
      await expect(service.findOne('xx')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('soft-delete via ativo=false', async () => {
      prisma.armazem.findUnique.mockResolvedValue({ id: 'a' });
      await service.remove('a');
      expect(prisma.armazem.update).toHaveBeenCalledWith({
        where: { id: 'a' },
        data: { ativo: false },
      });
    });
  });
});
