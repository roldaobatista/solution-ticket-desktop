import { Test } from '@nestjs/testing';
import { RelatoriosService } from './relatorios.service';
import { PrismaService } from '../prisma/prisma.service';

interface PrismaMock {
  ticketPesagem: { findMany: jest.Mock; aggregate: jest.Mock; count: jest.Mock };
  unidade: { findUnique: jest.Mock };
  auditoria: { findMany: jest.Mock };
  usuario: { findMany: jest.Mock };
  passagemPesagem: { groupBy: jest.Mock };
  balanca: { findMany: jest.Mock };
}

function makePrismaMock(): PrismaMock {
  return {
    ticketPesagem: {
      findMany: jest.fn().mockResolvedValue([]),
      aggregate: jest.fn().mockResolvedValue({
        _sum: { pesoLiquidoFinal: 0, totalDescontos: 0, pesoBrutoApurado: 0 },
      }),
      count: jest.fn().mockResolvedValue(0),
    },
    unidade: { findUnique: jest.fn() },
    auditoria: { findMany: jest.fn().mockResolvedValue([]) },
    usuario: { findMany: jest.fn().mockResolvedValue([]) },
    passagemPesagem: { groupBy: jest.fn().mockResolvedValue([]) },
    balanca: { findMany: jest.fn().mockResolvedValue([]) },
  };
}

describe('RelatoriosService', () => {
  let service: RelatoriosService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = makePrismaMock();
    const moduleRef = await Test.createTestingModule({
      providers: [RelatoriosService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(RelatoriosService);
  });

  describe('movimento', () => {
    it('aplica filtro de periodo + statusFECHADO', async () => {
      await service.movimento('2026-04-01', '2026-04-30', 'tenant-1');
      expect(prisma.ticketPesagem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            statusOperacional: 'FECHADO',
            fechadoEm: { gte: expect.any(Date), lte: expect.any(Date) },
          }),
          take: 5000,
        }),
      );
    });

    it('aplica unidadeId quando informado', async () => {
      await service.movimento('2026-04-01', '2026-04-30', 'tenant-1', 'u1');
      expect(prisma.ticketPesagem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ unidadeId: 'u1' }),
        }),
      );
    });

    it('marca truncated quando count excede MAX', async () => {
      prisma.ticketPesagem.count.mockResolvedValue(6000);
      const out = await service.movimento('2026-04-01', '2026-04-30', 'tenant-1');
      expect(out.truncated).toBe(true);
      expect(out.totalTickets).toBe(6000);
    });

    it('extrai totais do aggregate', async () => {
      prisma.ticketPesagem.aggregate.mockResolvedValue({
        _sum: { pesoLiquidoFinal: 1500, totalDescontos: 50, pesoBrutoApurado: 1600 },
      });
      const out = await service.movimento('2026-04-01', '2026-04-30', 'tenant-1');
      expect(out.totalPeso).toBe(1500);
      expect(out.totalDescontos).toBe(50);
      expect(out.totalBruto).toBe(1600);
    });
  });

  describe('pesagensAlteradas', () => {
    it('filtra por status EM_MANUTENCAO no periodo', async () => {
      prisma.ticketPesagem.findMany.mockResolvedValue([{ id: 't1' }]);
      const out = await service.pesagensAlteradas('2026-04-01', '2026-04-30', 'tenant-1', 'u1');
      expect(prisma.ticketPesagem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            statusOperacional: 'EM_MANUTENCAO',
            unidadeId: 'u1',
            atualizadoEm: { gte: expect.any(Date), lte: expect.any(Date) },
          }),
        }),
      );
      expect(out.total).toBe(1);
    });
  });

  describe('pesagensCanceladas', () => {
    it('filtra por status CANCELADO no periodo', async () => {
      await service.pesagensCanceladas('2026-04-01', '2026-04-30', 'tenant-1');
      expect(prisma.ticketPesagem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            statusOperacional: 'CANCELADO',
            canceladoEm: { gte: expect.any(Date), lte: expect.any(Date) },
          }),
        }),
      );
    });
  });

  describe('passagensPorBalanca', () => {
    it('agrega por balanca somando peso e contando passagens', async () => {
      prisma.passagemPesagem.groupBy.mockResolvedValue([
        { balancaId: 'b1', _count: { id: 12 }, _sum: { pesoCapturado: 30000 } },
      ]);
      prisma.balanca.findMany.mockResolvedValue([{ id: 'b1', nome: 'Balanca Norte' }]);
      const out = await service.passagensPorBalanca('2026-04-01', '2026-04-30', 'tenant-1');
      expect(out).toEqual([
        { balancaId: 'b1', balancaNome: 'Balanca Norte', totalPassagens: 12, pesoTotal: 30000 },
      ]);
    });

    it('marca como Desconhecida quando balanca nao existe na tabela', async () => {
      prisma.passagemPesagem.groupBy.mockResolvedValue([
        { balancaId: 'orfa', _count: { id: 1 }, _sum: { pesoCapturado: 100 } },
      ]);
      const out = await service.passagensPorBalanca('2026-04-01', '2026-04-30', 'tenant-1');
      expect(out[0].balancaNome).toBe('Desconhecida');
    });

    it('aplica filtro por unidade no where da passagem e da balanca', async () => {
      await service.passagensPorBalanca('2026-04-01', '2026-04-30', 'tenant-1', 'u1');
      expect(prisma.passagemPesagem.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ balanca: { unidadeId: 'u1', tenantId: 'tenant-1' } }),
        }),
      );
      expect(prisma.balanca.findMany).toHaveBeenCalledWith({
        where: { unidadeId: 'u1', tenantId: 'tenant-1' },
      });
    });
  });
});
