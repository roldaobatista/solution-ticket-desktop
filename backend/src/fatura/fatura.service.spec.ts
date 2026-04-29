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
    delete: jest.Mock;
  };
  pagamentoFatura: {
    create: jest.Mock;
    aggregate: jest.Mock;
    findFirst: jest.Mock;
    update: jest.Mock;
  };
  cliente: { findUnique: jest.Mock };
  romaneio: { create: jest.Mock; findUnique: jest.Mock; count: jest.Mock; update: jest.Mock };
  ticketPesagem: { findMany: jest.Mock; updateMany: jest.Mock };
  itemRomaneio: { createMany: jest.Mock };
  formaPagamento: { findUnique: jest.Mock };
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
      delete: jest.fn(),
    },
    pagamentoFatura: {
      create: jest.fn(),
      aggregate: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    cliente: { findUnique: jest.fn().mockResolvedValue({ id: 'c' }) },
    romaneio: {
      create: jest.fn().mockResolvedValue({ id: 'r-auto' }),
      findUnique: jest.fn().mockResolvedValue({ id: 'r' }),
      count: jest.fn().mockResolvedValue(0),
      update: jest.fn().mockResolvedValue({}),
    },
    ticketPesagem: {
      findMany: jest.fn().mockResolvedValue([]),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    itemRomaneio: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
    formaPagamento: { findUnique: jest.fn().mockResolvedValue({ id: 'fp' }) },
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

    it('ao criar fatura de romaneio, marca romaneio e tickets como faturados na mesma transacao', async () => {
      prisma.fatura.count.mockResolvedValueOnce(0);
      prisma.romaneio.findUnique.mockResolvedValue({
        id: 'r1',
        clienteId: 'c',
        itens: [{ ticketId: 'tk1' }, { ticketId: 'tk2' }],
      });
      prisma.fatura.create.mockResolvedValue({ id: 'f1' });
      prisma.fatura.findUnique.mockResolvedValue({ id: 'f1', numero: 'FAT-000001' });

      await service.create({
        tenantId: 't',
        clienteId: 'c',
        romaneioId: 'r1',
        dataEmissao: '2026-04-25',
        totalGeral: 100,
      });

      expect(prisma.romaneio.update).toHaveBeenCalledWith({
        where: { id: 'r1', tenantId: 't' },
        data: { status: 'FATURADO' },
      });
      expect(prisma.ticketPesagem.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['tk1', 'tk2'] }, tenantId: 't' },
        data: { statusComercial: 'FATURADO' },
      });
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('quando recebe ticketIds, cria romaneio transacional antes da fatura', async () => {
      prisma.fatura.count.mockResolvedValueOnce(0);
      prisma.ticketPesagem.findMany.mockResolvedValue([
        {
          id: 'tk1',
          numero: 'TK-1',
          tenantId: 't',
          clienteId: 'c',
          statusOperacional: 'FECHADO',
          statusComercial: 'NAO_ROMANEADO',
          pesoLiquidoFinal: 1200,
        },
      ]);
      prisma.ticketPesagem.updateMany
        .mockResolvedValueOnce({ count: 1 })
        .mockResolvedValueOnce({ count: 1 });
      prisma.romaneio.create.mockResolvedValue({ id: 'r-auto' });
      prisma.romaneio.findUnique.mockResolvedValue({
        id: 'r-auto',
        clienteId: 'c',
        itens: [{ ticketId: 'tk1' }],
      });
      prisma.fatura.create.mockResolvedValue({ id: 'f1' });
      prisma.fatura.findUnique.mockResolvedValue({ id: 'f1', romaneioId: 'r-auto' });

      await service.create({
        tenantId: 't',
        clienteId: 'c',
        dataEmissao: '2026-04-25',
        totalGeral: 100,
        ticketIds: ['tk1'],
      });

      expect(prisma.romaneio.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ tenantId: 't', clienteId: 'c', pesoTotal: 1200 }),
        }),
      );
      expect(prisma.itemRomaneio.createMany).toHaveBeenCalledWith({
        data: [{ romaneioId: 'r-auto', ticketId: 'tk1', sequencia: 1, peso: 1200 }],
      });
      expect(prisma.fatura.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ romaneioId: 'r-auto' }),
        }),
      );
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
    it('cria pagamento pendente sem baixar fatura antes da baixa efetiva', async () => {
      prisma.fatura.findUnique.mockResolvedValue({ id: 'f1', totalGeral: 100 });
      prisma.pagamentoFatura.create.mockResolvedValue({ id: 'p1', valor: 100 });
      prisma.pagamentoFatura.aggregate.mockResolvedValue({ _sum: { valor: null } });

      await service.registrarPagamento('f1', 't', {
        formaPagamentoId: 'fp',
        valor: 100,
        dataEmissao: '2026-04-25',
      });

      expect(prisma.fatura.update).toHaveBeenCalledWith({
        where: { id: 'f1', tenantId: 't' },
        data: { status: 'ABERTA' },
      });
      expect(prisma.pagamentoFatura.aggregate).toHaveBeenCalledWith({
        where: { faturaId: 'f1', status: 'BAIXADO' },
        _sum: { valor: true },
      });
    });

    it('marca PARCIAL somente com pagamentos ja baixados', async () => {
      prisma.fatura.findUnique.mockResolvedValue({ id: 'f1', totalGeral: 100 });
      prisma.pagamentoFatura.create.mockResolvedValue({ id: 'p1' });
      prisma.pagamentoFatura.aggregate.mockResolvedValue({ _sum: { valor: 50 } });

      await service.registrarPagamento('f1', 't', {
        formaPagamentoId: 'fp',
        valor: 50,
        dataEmissao: '2026-04-25',
      });

      expect(prisma.fatura.update).toHaveBeenCalledWith({
        where: { id: 'f1', tenantId: 't' },
        data: { status: 'PARCIAL' },
      });
    });

    it('lanca NotFound se fatura nao existe', async () => {
      prisma.fatura.findUnique.mockResolvedValue(null);
      await expect(
        service.registrarPagamento('nope', 't', {
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
      await service.registrarPagamento('f1', 't', {
        formaPagamentoId: 'fp',
        valor: 100,
        dataEmissao: '2026-04-25',
      });
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('baixarPagamento', () => {
    it('lanca NotFound quando pagamento inexistente', async () => {
      prisma.pagamentoFatura.findFirst.mockResolvedValue(null);
      await expect(service.baixarPagamento('xx', 't')).rejects.toThrow(NotFoundException);
    });

    it('marca BAIXADO + dataBaixa + usuario e recalcula fatura', async () => {
      prisma.pagamentoFatura.findFirst.mockResolvedValue({
        id: 'p1',
        faturaId: 'f1',
        fatura: { id: 'f1', totalGeral: 100, romaneioId: null },
      });
      prisma.pagamentoFatura.update.mockResolvedValue({ id: 'p1', status: 'BAIXADO' });
      prisma.pagamentoFatura.aggregate.mockResolvedValue({ _sum: { valor: 100 } });
      await service.baixarPagamento('p1', 't', 'u1');
      expect(prisma.pagamentoFatura.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: expect.objectContaining({ status: 'BAIXADO', usuarioBaixa: 'u1' }),
      });
      expect(prisma.fatura.update).toHaveBeenCalledWith({
        where: { id: 'f1', tenantId: 't' },
        data: { status: 'BAIXADA' },
      });
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('propaga baixa parcial para romaneio e tickets', async () => {
      prisma.pagamentoFatura.findFirst.mockResolvedValue({
        id: 'p1',
        faturaId: 'f1',
        fatura: {
          id: 'f1',
          tenantId: 't',
          totalGeral: 100,
          romaneioId: 'r1',
          romaneio: { itens: [{ ticketId: 'tk1' }, { ticketId: 'tk2' }] },
        },
      });
      prisma.pagamentoFatura.update.mockResolvedValue({ id: 'p1', status: 'BAIXADO' });
      prisma.pagamentoFatura.aggregate.mockResolvedValue({ _sum: { valor: 40 } });

      await service.baixarPagamento('p1', 't', 'u1');

      expect(prisma.romaneio.update).toHaveBeenCalledWith({
        where: { id: 'r1', tenantId: 't' },
        data: { status: 'PARCIALMENTE_BAIXADO' },
      });
      expect(prisma.ticketPesagem.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['tk1', 'tk2'] }, tenantId: 't' },
        data: { statusComercial: 'PARCIALMENTE_BAIXADO' },
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
