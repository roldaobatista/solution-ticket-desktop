import { Test } from '@nestjs/testing';
import { ComercialService } from './comercial.service';
import { PrismaService } from '../prisma/prisma.service';

interface PrismaMock {
  tabelaPrecoProduto: {
    create: jest.Mock;
    findUnique: jest.Mock;
    findMany: jest.Mock;
    update: jest.Mock;
  };
  tabelaPrecoProdutoCliente: {
    create: jest.Mock;
    findUnique: jest.Mock;
    findMany: jest.Mock;
    update: jest.Mock;
  };
  tabelaFrete: { create: jest.Mock; findMany: jest.Mock; update: jest.Mock };
  tabelaUmidade: { create: jest.Mock; findMany: jest.Mock; update: jest.Mock };
  historicoPreco: { create: jest.Mock; findMany: jest.Mock };
  fatura: { findMany: jest.Mock };
  snapshotComercialTicket: { findMany: jest.Mock };
}

function makePrismaMock(): PrismaMock {
  return {
    tabelaPrecoProduto: {
      create: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({}),
    },
    tabelaPrecoProdutoCliente: {
      create: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({}),
    },
    tabelaFrete: {
      create: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({}),
    },
    tabelaUmidade: {
      create: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({}),
    },
    historicoPreco: {
      create: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
    },
    fatura: { findMany: jest.fn().mockResolvedValue([]) },
    snapshotComercialTicket: { findMany: jest.fn().mockResolvedValue([]) },
  };
}

describe('ComercialService', () => {
  let service: ComercialService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = makePrismaMock();
    const moduleRef = await Test.createTestingModule({
      providers: [ComercialService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(ComercialService);
  });

  describe('createTabelaPrecoProduto', () => {
    it('converte vigenciaInicio para Date, aplica defaults e ignora tenantId do DTO', async () => {
      await service.createTabelaPrecoProduto(
        {
          tenantId: 'tenant-invasor',
          produtoId: 'p',
          valor: 10,
          unidade: 'kg',
          vigenciaInicio: '2026-04-01',
        } as any,
        'tenant-jwt',
      );
      expect(prisma.tabelaPrecoProduto.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: 'tenant-jwt',
          produtoId: 'p',
          valor: 10,
          vigenciaInicio: expect.any(Date),
          vigenciaFim: null,
          prioridadeResolucao: 0,
          ativo: true,
        }),
      });
    });
  });

  describe('updateTabelaPrecoProduto', () => {
    it('grava historicoPreco quando valor muda', async () => {
      prisma.tabelaPrecoProduto.findUnique.mockResolvedValue({
        id: 'p1',
        tenantId: 't',
        produtoId: 'p',
        valor: 10,
      });
      await service.updateTabelaPrecoProduto('p1', { valor: 12, usuarioId: 'u1' }, 't');
      expect(prisma.historicoPreco.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tipo: 'PRODUTO',
          valorAntigo: 10,
          valorNovo: 12,
          usuarioId: 'u1',
        }),
      });
    });

    it('nao grava historicoPreco quando valor nao muda', async () => {
      prisma.tabelaPrecoProduto.findUnique.mockResolvedValue({
        id: 'p1',
        tenantId: 't',
        produtoId: 'p',
        valor: 10,
      });
      await service.updateTabelaPrecoProduto('p1', { unidade: 'ton' }, 't');
      expect(prisma.historicoPreco.create).not.toHaveBeenCalled();
    });
  });

  describe('findAllTabelaPrecoProduto', () => {
    it('aplica filtro produtoId quando informado', async () => {
      await service.findAllTabelaPrecoProduto('t', 'p1');
      expect(prisma.tabelaPrecoProduto.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId: 't', produtoId: 'p1' } }),
      );
    });
  });

  describe('updateTabelaPrecoCliente', () => {
    it('grava historicoPreco com clienteId quando valor muda', async () => {
      prisma.tabelaPrecoProdutoCliente.findUnique.mockResolvedValue({
        id: 'pc1',
        tenantId: 't',
        produtoId: 'p',
        clienteId: 'c',
        valor: 5,
      });
      await service.updateTabelaPrecoCliente('pc1', { valor: 7 }, 't');
      expect(prisma.historicoPreco.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tipo: 'PRODUTO_CLIENTE',
          clienteId: 'c',
          valorAntigo: 5,
          valorNovo: 7,
        }),
      });
    });
  });

  describe('getSaldos', () => {
    it('agrupa faturas por cliente computando saldo', async () => {
      prisma.fatura.findMany.mockResolvedValue([
        {
          clienteId: 'c1',
          totalGeral: 100,
          cliente: { id: 'c1', razaoSocial: 'Cliente X' },
          pagamentos: [{ valor: 30 }],
        },
        {
          clienteId: 'c1',
          totalGeral: 50,
          cliente: { id: 'c1', razaoSocial: 'Cliente X' },
          pagamentos: [],
        },
      ]);
      const out = await service.getSaldos('t', 'c1');
      expect(out).toEqual([
        {
          clienteId: 'c1',
          clienteNome: 'Cliente X',
          totalFaturado: 150,
          totalPago: 30,
          saldo: 120,
        },
      ]);
    });
  });

  describe('getExtrato', () => {
    it('intercala fatura e pagamento e mantem saldo corrente', async () => {
      prisma.fatura.findMany.mockResolvedValue([
        {
          numero: 'F-1',
          dataEmissao: new Date('2026-04-01'),
          totalGeral: 100,
          pagamentos: [
            {
              dataEmissao: new Date('2026-04-10'),
              valor: 40,
              numeroDocumento: 'D-1',
              formaPagamento: { descricao: 'Pix' },
            },
          ],
        },
      ]);
      const out = await service.getExtrato('c1', 't');
      expect(out).toHaveLength(2);
      expect(out[0]).toMatchObject({ tipo: 'FATURA', valor: 100, saldo: 100 });
      expect(out[1]).toMatchObject({ tipo: 'PAGAMENTO', valor: -40, saldo: 60 });
    });

    it('aplica filtro de periodo quando inicio/fim informado', async () => {
      await service.getExtrato('c1', 't', '2026-04-01', '2026-04-30');
      expect(prisma.fatura.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            clienteId: 'c1',
            tenantId: 't',
            dataEmissao: { gte: expect.any(Date), lte: expect.any(Date) },
          }),
        }),
      );
    });
  });

  describe('createTabelaFrete', () => {
    it('aceita campos opcionais como null e ignora tenantId do DTO', async () => {
      await service.createTabelaFrete(
        {
          tenantId: 'tenant-invasor',
          valor: 50,
          vigenciaInicio: '2026-04-01',
        } as any,
        'tenant-jwt',
      );
      expect(prisma.tabelaFrete.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: 'tenant-jwt',
          produtoId: null,
          clienteId: null,
          destinoId: null,
          faixaPesoInicial: null,
          faixaPesoFinal: null,
        }),
      });
    });
  });

  describe('createTabelaUmidade', () => {
    it('persiste faixas e desconto', async () => {
      await service.createTabelaUmidade(
        {
          tenantId: 'tenant-invasor',
          produtoId: 'p',
          faixaInicial: 12,
          faixaFinal: 14,
          descontoPercentual: 1.5,
          vigenciaInicio: '2026-04-01',
        } as any,
        'tenant-jwt',
      );
      expect(prisma.tabelaUmidade.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: 'tenant-jwt',
          faixaInicial: 12,
          faixaFinal: 14,
          descontoPercentual: 1.5,
          ativo: true,
        }),
      });
    });
  });
});
