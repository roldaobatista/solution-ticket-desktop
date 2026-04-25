import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { FaturaService } from './fatura.service';
import { PrismaService } from '../prisma/prisma.service';

interface PrismaMock {
  fatura: {
    create: jest.Mock;
    findUnique: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
    update: jest.Mock;
  };
  pagamentoFatura: {
    create: jest.Mock;
    aggregate: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
  };
  tipoFatura: { findMany: jest.Mock };
  $transaction: jest.Mock;
}

function makePrismaMock(): PrismaMock {
  const m: PrismaMock = {
    fatura: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      update: jest.fn(),
    },
    pagamentoFatura: {
      create: jest.fn(),
      aggregate: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    tipoFatura: { findMany: jest.fn().mockResolvedValue([]) },
    $transaction: jest.fn(),
  };
  // $transaction(callback) executa o callback com a propria mock como tx
  m.$transaction.mockImplementation(async (cb: (tx: PrismaMock) => Promise<unknown>) => cb(m));
  return m;
}

describe('FaturaService', () => {
  let service: FaturaService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = makePrismaMock();
    const moduleRef = await Test.createTestingModule({
      providers: [FaturaService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(FaturaService);
  });

  describe('create', () => {
    it('gera numero sequencial e cria fatura', async () => {
      prisma.fatura.count.mockResolvedValueOnce(7); // proximo seq = 8
      prisma.fatura.create.mockResolvedValue({ id: 'f1' });
      prisma.fatura.findUnique.mockResolvedValue({ id: 'f1', numero: 'FAT-000008' });

      const out = await service.create({
        tenantId: 't',
        clienteId: 'c',
        dataEmissao: '2026-04-25',
        totalGeral: 100,
      });

      expect(prisma.fatura.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ numero: 'FAT-000008', tenantId: 't', clienteId: 'c' }),
        }),
      );
      expect(out).toEqual({ id: 'f1', numero: 'FAT-000008' });
    });
  });

  describe('findAll', () => {
    it('aplica filtro de cliente quando informado', async () => {
      await service.findAll('t', 'c1', { page: 2, limit: 10 });
      expect(prisma.fatura.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: 't', clienteId: 'c1' },
          skip: 10,
          take: 10,
        }),
      );
    });

    it('omite clienteId quando nao informado', async () => {
      await service.findAll('t');
      const call = prisma.fatura.findMany.mock.calls[0][0];
      expect(call.where).toEqual({ tenantId: 't' });
    });

    it('shape paginado retorna data/total/page/limit/totalPages', async () => {
      prisma.fatura.findMany.mockResolvedValue([{ id: 'a' }, { id: 'b' }]);
      prisma.fatura.count.mockResolvedValue(45);
      const out = await service.findAll('t', undefined, { page: 1, limit: 20 });
      expect(out).toEqual({
        data: [{ id: 'a' }, { id: 'b' }],
        total: 45,
        page: 1,
        limit: 20,
        totalPages: 3,
      });
    });
  });

  describe('findOne', () => {
    it('lanca NotFound quando fatura inexistente', async () => {
      prisma.fatura.findUnique.mockResolvedValue(null);
      await expect(service.findOne('xx')).rejects.toThrow(NotFoundException);
    });
  });

  describe('registrarPagamento', () => {
    it('cria pagamento + atualiza status BAIXADA quando soma >= total', async () => {
      prisma.fatura.findUnique.mockResolvedValue({ id: 'f1', totalGeral: 100 });
      prisma.pagamentoFatura.create.mockResolvedValue({ id: 'p1', valor: 100 });
      prisma.pagamentoFatura.aggregate.mockResolvedValue({ _sum: { valor: 100 } });

      await service.registrarPagamento('f1', {
        formaPagamentoId: 'fp',
        valor: 100,
        dataEmissao: '2026-04-25',
      });

      expect(prisma.fatura.update).toHaveBeenCalledWith({
        where: { id: 'f1' },
        data: { status: 'BAIXADA' },
      });
    });

    it('marca PARCIAL quando soma < total', async () => {
      prisma.fatura.findUnique.mockResolvedValue({ id: 'f1', totalGeral: 100 });
      prisma.pagamentoFatura.create.mockResolvedValue({ id: 'p1' });
      prisma.pagamentoFatura.aggregate.mockResolvedValue({ _sum: { valor: 50 } });

      await service.registrarPagamento('f1', {
        formaPagamentoId: 'fp',
        valor: 50,
        dataEmissao: '2026-04-25',
      });

      expect(prisma.fatura.update).toHaveBeenCalledWith({
        where: { id: 'f1' },
        data: { status: 'PARCIAL' },
      });
    });

    it('lanca NotFound se fatura nao existe', async () => {
      prisma.fatura.findUnique.mockResolvedValue(null);
      await expect(
        service.registrarPagamento('nope', {
          formaPagamentoId: 'fp',
          valor: 10,
          dataEmissao: '2026-04-25',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('roda dentro de transacao ($transaction chamado)', async () => {
      prisma.fatura.findUnique.mockResolvedValue({ id: 'f1', totalGeral: 100 });
      prisma.pagamentoFatura.create.mockResolvedValue({ id: 'p1' });
      prisma.pagamentoFatura.aggregate.mockResolvedValue({ _sum: { valor: 100 } });
      await service.registrarPagamento('f1', {
        formaPagamentoId: 'fp',
        valor: 100,
        dataEmissao: '2026-04-25',
      });
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('baixarPagamento', () => {
    it('lanca NotFound quando pagamento inexistente', async () => {
      prisma.pagamentoFatura.findUnique.mockResolvedValue(null);
      await expect(service.baixarPagamento('xx')).rejects.toThrow(NotFoundException);
    });

    it('marca BAIXADO + dataBaixa + usuario', async () => {
      prisma.pagamentoFatura.findUnique.mockResolvedValue({ id: 'p1' });
      prisma.pagamentoFatura.update.mockResolvedValue({ id: 'p1', status: 'BAIXADO' });
      await service.baixarPagamento('p1', 'u1');
      expect(prisma.pagamentoFatura.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: expect.objectContaining({ status: 'BAIXADO', usuarioBaixa: 'u1' }),
      });
    });
  });

  describe('listarTipos', () => {
    it('filtra por tenantId quando informado', async () => {
      await service.listarTipos('t');
      expect(prisma.tipoFatura.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { ativo: true, tenantId: 't' } }),
      );
    });

    it('lista globais quando tenantId omitido', async () => {
      await service.listarTipos();
      expect(prisma.tipoFatura.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { ativo: true } }),
      );
    });
  });
});
