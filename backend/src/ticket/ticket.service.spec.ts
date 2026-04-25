import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TicketService - cálculo de fechamento', () => {
  let service: TicketService;
  let prisma: any;

  const baseTicket = {
    id: 'tk1',
    unidadeId: 'u1',
    statusOperacional: 'EM_PESAGEM',
    statusComercial: 'NAO_ROMANEADO',
    fluxoPesagem: 'PF2_BRUTO_TARA',
    modoComercial: 'DESABILITADO',
    taraCadastradaSnapshot: null,
    snapshotComercialVersao: 0,
    passagens: [],
    observacao: null,
    produtoId: 'p1',
    clienteId: 'c1',
  };

  beforeEach(async () => {
    prisma = {
      ticketPesagem: {
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn(),
      },
      passagemPesagem: {
        findMany: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
      },
      descontoPesagem: { findMany: jest.fn().mockResolvedValue([]) },
      auditoria: { create: jest.fn().mockResolvedValue({}) },
      licencaInstalacao: { findFirst: jest.fn().mockResolvedValue(null), update: jest.fn() },
      snapshotComercialTicket: { create: jest.fn().mockResolvedValue({}) },
      tabelaPrecoProdutoCliente: { findFirst: jest.fn().mockResolvedValue(null) },
      tabelaPrecoProduto: { findFirst: jest.fn().mockResolvedValue(null) },
      veiculo: { findUnique: jest.fn() },
    };

    const module = await Test.createTestingModule({
      providers: [TicketService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(TicketService);
  });

  function mockTicket(overrides: any = {}) {
    prisma.ticketPesagem.findUnique.mockResolvedValue({ ...baseTicket, ...overrides });
  }

  it('calcula peso líquido em 2PF (bruto - tara)', async () => {
    mockTicket();
    prisma.passagemPesagem.findMany.mockResolvedValue([
      {
        papelCalculo: 'BRUTO_OFICIAL',
        pesoCapturado: 20000,
        statusPassagem: 'VALIDA',
        sequencia: 1,
      },
      { papelCalculo: 'TARA_OFICIAL', pesoCapturado: 8000, statusPassagem: 'VALIDA', sequencia: 2 },
    ]);
    // Segunda chamada a findOne (no final, retorna o ticket atualizado)
    prisma.ticketPesagem.findUnique
      .mockResolvedValueOnce({ ...baseTicket })
      .mockResolvedValueOnce({ ...baseTicket, pesoLiquidoFinal: 12000 });

    await service.fecharTicket('tk1', {});

    expect(prisma.ticketPesagem.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          pesoBrutoApurado: 20000,
          pesoTaraApurada: 8000,
          pesoLiquidoSemDesconto: 12000,
          pesoLiquidoFinal: 12000,
          statusOperacional: 'FECHADO',
        }),
      }),
    );
  });

  it('aplica descontos sobre o líquido', async () => {
    mockTicket();
    prisma.passagemPesagem.findMany.mockResolvedValue([
      {
        papelCalculo: 'BRUTO_OFICIAL',
        pesoCapturado: 20000,
        statusPassagem: 'VALIDA',
        sequencia: 1,
      },
      { papelCalculo: 'TARA_OFICIAL', pesoCapturado: 8000, statusPassagem: 'VALIDA', sequencia: 2 },
    ]);
    prisma.descontoPesagem.findMany.mockResolvedValue([{ valor: 100 }, { valor: 50 }]);
    prisma.ticketPesagem.findUnique
      .mockResolvedValueOnce({ ...baseTicket })
      .mockResolvedValueOnce({ ...baseTicket });

    await service.fecharTicket('tk1', {});

    expect(prisma.ticketPesagem.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          totalDescontos: 150,
          pesoLiquidoFinal: 11850,
        }),
      }),
    );
  });

  it('usa tara cadastrada quando não há TARA_OFICIAL', async () => {
    mockTicket({ taraCadastradaSnapshot: 7000 });
    prisma.passagemPesagem.findMany.mockResolvedValue([
      {
        papelCalculo: 'BRUTO_OFICIAL',
        pesoCapturado: 18000,
        statusPassagem: 'VALIDA',
        sequencia: 1,
      },
    ]);
    prisma.ticketPesagem.findUnique
      .mockResolvedValueOnce({ ...baseTicket, taraCadastradaSnapshot: 7000 })
      .mockResolvedValueOnce({ ...baseTicket });

    await service.fecharTicket('tk1', {});

    expect(prisma.ticketPesagem.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          pesoBrutoApurado: 18000,
          pesoTaraApurada: 7000,
          pesoLiquidoFinal: 11000,
        }),
      }),
    );
  });

  it('rejeita fechamento quando bruto < tara', async () => {
    mockTicket();
    prisma.passagemPesagem.findMany.mockResolvedValue([
      {
        papelCalculo: 'BRUTO_OFICIAL',
        pesoCapturado: 5000,
        statusPassagem: 'VALIDA',
        sequencia: 1,
      },
      { papelCalculo: 'TARA_OFICIAL', pesoCapturado: 8000, statusPassagem: 'VALIDA', sequencia: 2 },
    ]);
    await expect(service.fecharTicket('tk1', {})).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejeita fechamento sem passagens válidas', async () => {
    mockTicket();
    prisma.passagemPesagem.findMany.mockResolvedValue([]);
    await expect(service.fecharTicket('tk1', {})).rejects.toThrow(/passagens validas/i);
  });

  it('rejeita fechamento sem tara (sem passagem e sem snapshot)', async () => {
    mockTicket();
    prisma.passagemPesagem.findMany.mockResolvedValue([
      {
        papelCalculo: 'BRUTO_OFICIAL',
        pesoCapturado: 18000,
        statusPassagem: 'VALIDA',
        sequencia: 1,
      },
    ]);
    await expect(service.fecharTicket('tk1', {})).rejects.toThrow(/tara/i);
  });

  it('rejeita fechamento quando ticket não está em estado fechavel', async () => {
    mockTicket({ statusOperacional: 'FECHADO' });
    await expect(service.fecharTicket('tk1', {})).rejects.toThrow(/estado/i);
  });
});

describe('TicketService.create - bloqueio por licença', () => {
  let service: TicketService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      ticketPesagem: {
        create: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn(),
      },
      licencaInstalacao: { findFirst: jest.fn() },
      veiculo: { findUnique: jest.fn() },
    };
    const module = await Test.createTestingModule({
      providers: [TicketService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(TicketService);
  });

  it('bloqueia criação quando licença EXPIRADA', async () => {
    prisma.licencaInstalacao.findFirst.mockResolvedValue({
      statusLicenca: 'EXPIRADA',
      pesagensRestantesTrial: null,
    });
    await expect(
      service.create({
        tenantId: 't',
        unidadeId: 'u',
        fluxoPesagem: 'PF2_BRUTO_TARA',
        clienteId: 'c',
        produtoId: 'p',
      } as any),
    ).rejects.toThrow(/bloqueada|EXPIRADA/i);
  });

  it('bloqueia quando trial esgotou pesagens', async () => {
    prisma.licencaInstalacao.findFirst.mockResolvedValue({
      statusLicenca: 'TRIAL',
      pesagensRestantesTrial: 0,
    });
    await expect(
      service.create({
        tenantId: 't',
        unidadeId: 'u',
        fluxoPesagem: 'PF2_BRUTO_TARA',
        clienteId: 'c',
        produtoId: 'p',
      } as any),
    ).rejects.toThrow(/trial/i);
  });
});

describe('TicketService.create - B9 validacao de tara em PF1', () => {
  let service: TicketService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      ticketPesagem: {
        create: jest.fn().mockResolvedValue({ id: 'novo' }),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn().mockResolvedValue({
          id: 'novo',
          numero: 'TKT-1',
          passagens: [],
          descontos: [],
          documentos: [],
          snapshotsComercial: [],
        }),
      },
      licencaInstalacao: { findFirst: jest.fn().mockResolvedValue(null) },
      veiculo: { findUnique: jest.fn() },
    };
    const module = await Test.createTestingModule({
      providers: [TicketService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(TicketService);
  });

  it('rejeita PF1 sem veiculoId nem taraReferenciaTipo MANUAL', async () => {
    await expect(
      service.create({
        tenantId: 't',
        unidadeId: 'u',
        fluxoPesagem: 'PF1_TARA_REFERENCIADA',
        clienteId: 'c',
        produtoId: 'p',
      } as any),
    ).rejects.toThrow(/PF1_TARA_REFERENCIADA exige tara/);
    expect(prisma.ticketPesagem.create).not.toHaveBeenCalled();
  });

  it('rejeita PF1 quando veiculo nao tem tara cadastrada', async () => {
    prisma.veiculo.findUnique.mockResolvedValue({ id: 'v1', taraCadastrada: null });
    await expect(
      service.create({
        tenantId: 't',
        unidadeId: 'u',
        fluxoPesagem: 'PF1_TARA_REFERENCIADA',
        clienteId: 'c',
        produtoId: 'p',
        veiculoId: 'v1',
      } as any),
    ).rejects.toThrow(/exige tara/);
    expect(prisma.ticketPesagem.create).not.toHaveBeenCalled();
  });

  it('aceita PF1 com taraReferenciaTipo=MANUAL (sem veiculo)', async () => {
    await service.create({
      tenantId: 't',
      unidadeId: 'u',
      fluxoPesagem: 'PF1_TARA_REFERENCIADA',
      clienteId: 'c',
      produtoId: 'p',
      taraReferenciaTipo: 'MANUAL',
    } as any);
    expect(prisma.ticketPesagem.create).toHaveBeenCalled();
  });

  it('aceita PF1 com veiculo que tem taraCadastrada > 0', async () => {
    prisma.veiculo.findUnique.mockResolvedValue({ id: 'v1', taraCadastrada: 5000 });
    await service.create({
      tenantId: 't',
      unidadeId: 'u',
      fluxoPesagem: 'PF1_TARA_REFERENCIADA',
      clienteId: 'c',
      produtoId: 'p',
      veiculoId: 'v1',
    } as any);
    expect(prisma.ticketPesagem.create).toHaveBeenCalled();
  });

  it('PF2 nao requer tara (passa sem checagem)', async () => {
    await service.create({
      tenantId: 't',
      unidadeId: 'u',
      fluxoPesagem: 'PF2_BRUTO_TARA',
      clienteId: 'c',
      produtoId: 'p',
    } as any);
    expect(prisma.ticketPesagem.create).toHaveBeenCalled();
  });
});
