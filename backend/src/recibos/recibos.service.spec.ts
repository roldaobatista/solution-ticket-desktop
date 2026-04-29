import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RecibosService } from './recibos.service';
import { PrismaService } from '../prisma/prisma.service';

interface PrismaMock {
  recibo: {
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    findFirst: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
}

function makePrismaMock(): PrismaMock {
  return {
    recibo: {
      create: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
    },
  };
}

describe('RecibosService', () => {
  let service: RecibosService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = makePrismaMock();
    const moduleRef = await Test.createTestingModule({
      providers: [RecibosService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(RecibosService);
  });

  describe('create', () => {
    it('gera valorExtenso quando ausente e converte data', async () => {
      await service.create(
        {
          tenantId: 'tenant-invasor',
          data: '2026-04-25',
          cedente: 'Cedente',
          sacado: 'Sacado',
          valor: 1234.56,
        } as any,
        'tenant-jwt',
      );
      const arg = prisma.recibo.create.mock.calls[0][0];
      expect(arg.data.tenantId).toBe('tenant-jwt');
      expect(arg.data.valor).toBe(1234.56);
      expect(arg.data.data).toBeInstanceOf(Date);
      expect(arg.data.valorExtenso).toMatch(/mil/i);
    });

    it('preserva valorExtenso quando informado', async () => {
      await service.create(
        {
          tenantId: 'tenant-invasor',
          data: '2026-04-25',
          cedente: 'C',
          sacado: 'S',
          valor: 100,
          valorExtenso: 'cem reais',
        } as any,
        'tenant-jwt',
      );
      expect(prisma.recibo.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ valorExtenso: 'cem reais' }) }),
      );
    });
  });

  describe('findOne', () => {
    it('lanca NotFound quando inexistente', async () => {
      prisma.recibo.findFirst.mockResolvedValue(null);
      await expect(service.findOne('xx', 't')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('recalcula valorExtenso quando valor muda sem extenso explicito', async () => {
      prisma.recibo.findFirst.mockResolvedValue({ id: 'r1', tenantId: 't' });
      await service.update('r1', { valor: 500 }, 't');
      const arg = prisma.recibo.update.mock.calls[0][0];
      expect(arg.data.valor).toBe(500);
      expect(arg.data.valorExtenso).toMatch(/quinhentos/i);
    });

    it('aplica apenas campos fornecidos', async () => {
      prisma.recibo.findFirst.mockResolvedValue({ id: 'r1', tenantId: 't' });
      await service.update('r1', { cedente: 'novo' }, 't');
      expect(prisma.recibo.update).toHaveBeenCalledWith({
        where: { id: 'r1', tenantId: 't' },
        data: { cedente: 'novo' },
      });
    });
  });

  describe('remove', () => {
    it('valida existencia antes de deletar', async () => {
      prisma.recibo.findFirst.mockResolvedValue({ id: 'r1', tenantId: 't' });
      await service.remove('r1', 't');
      expect(prisma.recibo.delete).toHaveBeenCalledWith({ where: { id: 'r1', tenantId: 't' } });
    });
  });

  describe('gerarPdf', () => {
    it('produz Buffer nao vazio', async () => {
      prisma.recibo.findFirst.mockResolvedValue({
        id: 'r1',
        valor: 100,
        cedente: 'C',
        sacado: 'S',
        data: new Date('2026-04-25'),
        valorExtenso: 'cem reais',
      });
      const buf = await service.gerarPdf('r1', 't');
      expect(Buffer.isBuffer(buf)).toBe(true);
      expect(buf.length).toBeGreaterThan(0);
    });
  });
});
