import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TicketService } from './ticket.service';
import { PrismaService } from '../prisma/prisma.service';
import { OutboxService } from '../integracao/outbox/outbox.service';
import { CreateTicketDto } from './dto/create-ticket.dto';

const outboxMock = {
  enqueueInTransaction: jest.fn(),
  makeIdempotencyKey: jest.fn(
    (profileId: string, eventType: string, entityId: string, revision: number) =>
      `${profileId}:${eventType}:${entityId}:${revision}`,
  ),
};

describe('TicketService - cálculo de fechamento', () => {
  let service: TicketService;
  let prisma: {
    ticketPesagem: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
    };
    passagemPesagem: {
      findMany: jest.Mock;
      create: jest.Mock;
      updateMany: jest.Mock;
    };
    balanca: { findFirst: jest.Mock };
    descontoPesagem: { findMany: jest.Mock };
    auditoria: { create: jest.Mock };
    licencaInstalacao: { findFirst: jest.Mock; update: jest.Mock };
    ticketContador: { upsert: jest.Mock };
    integracaoProfile: { findMany: jest.Mock };
    snapshotComercialTicket: { create: jest.Mock };
    tabelaPrecoProdutoCliente: { findFirst: jest.Mock };
    tabelaPrecoProduto: { findFirst: jest.Mock };
    veiculo: { findUnique: jest.Mock; findFirst: jest.Mock };
    unidade: { findFirst: jest.Mock };
    cliente: { findFirst: jest.Mock };
    produto: { findFirst: jest.Mock };
    $transaction: jest.Mock;
  };

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
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn().mockResolvedValue({}),
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn(),
      },
      passagemPesagem: {
        findMany: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
      },
      balanca: { findFirst: jest.fn().mockResolvedValue({ id: 'b1' }) },
      descontoPesagem: { findMany: jest.fn().mockResolvedValue([]) },
      auditoria: { create: jest.fn().mockResolvedValue({}) },
      licencaInstalacao: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'lic-1',
          statusLicenca: 'ATIVA',
          pesagensRestantesTrial: null,
          trialExpiraEm: null,
        }),
        update: jest.fn(),
      },
      ticketContador: {
        upsert: jest.fn().mockResolvedValue({ ultimoNumero: 1 }),
      },
      integracaoProfile: { findMany: jest.fn().mockResolvedValue([]) },
      snapshotComercialTicket: { create: jest.fn().mockResolvedValue({}) },
      tabelaPrecoProdutoCliente: { findFirst: jest.fn().mockResolvedValue(null) },
      tabelaPrecoProduto: { findFirst: jest.fn().mockResolvedValue(null) },
      veiculo: { findUnique: jest.fn(), findFirst: jest.fn().mockResolvedValue({ id: 'v1' }) },
      unidade: { findFirst: jest.fn().mockResolvedValue({ id: 'u1' }) },
      cliente: { findFirst: jest.fn().mockResolvedValue({ id: 'c1' }) },
      produto: { findFirst: jest.fn().mockResolvedValue({ id: 'p1' }) },
      $transaction: jest.fn(),
    };
    // Onda 1: fecharTicket/registrarPassagem usam $transaction. Mock simples
    // que invoca o callback passando o próprio prisma como tx (single-DB).
    prisma.$transaction = jest.fn(async (arg: unknown) => {
      if (typeof arg === 'function') return arg(prisma);
      return Promise.all(arg as Promise<unknown>[]);
    });

    const eventEmitter = { emit: jest.fn() };
    const module = await Test.createTestingModule({
      providers: [
        TicketService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventEmitter2, useValue: eventEmitter },
        { provide: OutboxService, useValue: outboxMock },
      ],
    }).compile();

    service = module.get(TicketService);
  });

  function mockTicket(overrides: Record<string, unknown> = {}) {
    prisma.ticketPesagem.findUnique.mockResolvedValue({ ...baseTicket, ...overrides });
  }

  it('aplica busca textual no backend por numero, placa e cliente', async () => {
    await service.findAll({ search: 'ABC1234' }, 'tenant-1');

    expect(prisma.ticketPesagem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tenant-1',
          OR: expect.arrayContaining([
            { numero: { contains: 'ABC1234' } },
            { veiculoPlaca: { contains: 'ABC1234' } },
            { cliente: { razaoSocial: { contains: 'ABC1234' } } },
          ]),
        }),
      }),
    );
  });

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

    await service.fecharTicket('tk1', {}, 'tenant-1', 'user-1');

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

    await service.fecharTicket('tk1', {}, 'tenant-1', 'user-1');

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
      .mockResolvedValueOnce({ ...baseTicket, taraCadastradaSnapshot: 7000 })
      .mockResolvedValueOnce({ ...baseTicket });

    await service.fecharTicket('tk1', {}, 'tenant-1', 'user-1');

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
    await expect(service.fecharTicket('tk1', {}, 'tenant-1', 'user-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejeita fechamento sem passagens válidas', async () => {
    mockTicket();
    prisma.passagemPesagem.findMany.mockResolvedValue([]);
    await expect(service.fecharTicket('tk1', {}, 'tenant-1', 'user-1')).rejects.toThrow(
      /passagens validas/i,
    );
  });

  it('rejeita fechamento comercial obrigatorio quando nao ha tabela vigente', async () => {
    mockTicket({ modoComercial: 'OBRIGATORIO' });
    prisma.passagemPesagem.findMany.mockResolvedValue([
      {
        papelCalculo: 'BRUTO_OFICIAL',
        pesoCapturado: 20000,
        statusPassagem: 'VALIDA',
        sequencia: 1,
      },
      { papelCalculo: 'TARA_OFICIAL', pesoCapturado: 8000, statusPassagem: 'VALIDA', sequencia: 2 },
    ]);
    prisma.ticketPesagem.findUnique
      .mockResolvedValueOnce({ ...baseTicket, modoComercial: 'OBRIGATORIO' })
      .mockResolvedValueOnce({
        ...baseTicket,
        modoComercial: 'OBRIGATORIO',
        pesoLiquidoFinal: 12000,
      });

    await expect(service.fecharTicket('tk1', {}, 'tenant-1', 'user-1')).rejects.toThrow(
      /preco vigente/i,
    );
  });

  it('busca tabela comercial dentro do tenant do ticket', async () => {
    mockTicket({ modoComercial: 'OBRIGATORIO', tenantId: 'tenant-1' });
    prisma.passagemPesagem.findMany.mockResolvedValue([
      {
        papelCalculo: 'BRUTO_OFICIAL',
        pesoCapturado: 20000,
        statusPassagem: 'VALIDA',
        sequencia: 1,
      },
      { papelCalculo: 'TARA_OFICIAL', pesoCapturado: 8000, statusPassagem: 'VALIDA', sequencia: 2 },
    ]);
    prisma.ticketPesagem.findUnique
      .mockResolvedValueOnce({ ...baseTicket, tenantId: 'tenant-1', modoComercial: 'OBRIGATORIO' })
      .mockResolvedValueOnce({
        ...baseTicket,
        tenantId: 'tenant-1',
        modoComercial: 'OBRIGATORIO',
        pesoLiquidoFinal: 12000,
      })
      .mockResolvedValueOnce({
        ...baseTicket,
        tenantId: 'tenant-1',
        modoComercial: 'OBRIGATORIO',
        pesoLiquidoFinal: 12000,
      });
    prisma.tabelaPrecoProdutoCliente.findFirst.mockResolvedValue({ valor: 0.5 });

    await service.fecharTicket('tk1', {}, 'tenant-1', 'user-1');

    expect(prisma.tabelaPrecoProdutoCliente.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-1' }),
      }),
    );
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
    await expect(service.fecharTicket('tk1', {}, 'tenant-1', 'user-1')).rejects.toThrow(/tara/i);
  });

  it('rejeita fechamento quando ticket não está em estado fechavel', async () => {
    mockTicket({ statusOperacional: 'FECHADO' });
    await expect(service.fecharTicket('tk1', {}, 'tenant-1', 'user-1')).rejects.toThrow(/estado/i);
  });

  it('rejeita passagem quando a balanca nao pertence ao tenant e unidade do ticket', async () => {
    prisma.ticketPesagem.findUnique
      .mockResolvedValueOnce({ unidadeId: 'u1' })
      .mockResolvedValueOnce({
        ...baseTicket,
        passagens: [],
        statusOperacional: 'ABERTO',
        primeiraPassagemEm: null,
      });
    prisma.balanca.findFirst.mockResolvedValue(null);

    await expect(
      service.registrarPassagem(
        'tk1',
        {
          tipoPassagem: 'OFICIAL',
          direcaoOperacional: 'ENTRADA',
          papelCalculo: 'BRUTO_OFICIAL',
          condicaoVeiculo: 'CARREGADO',
          pesoCapturado: 12000,
          balancaId: 'balanca-outra-unidade',
          origemLeitura: 'BALANCA_SERIAL',
        },
        'tenant-1',
        'user-1',
      ),
    ).rejects.toThrow(/balanca/i);

    expect(prisma.passagemPesagem.create).not.toHaveBeenCalled();
  });

  it('enfileira ticket fechado apenas para perfil outbound da mesma empresa/unidade e com payload canonico minimo', async () => {
    const ticketFechado = {
      ...baseTicket,
      tenantId: 'tenant-1',
      statusOperacional: 'EM_PESAGEM',
      unidade: { empresaId: 'empresa-1' },
      cliente: { id: 'c1', nome: 'Cliente A', documento: '123.456.789-09' },
      produto: { id: 'p1', descricao: 'Soja' },
      passagens: [{ sequencia: 1, pesoCapturado: 12000, papelCalculo: 'BRUTO_OFICIAL' }],
      descontos: [],
      pesoLiquidoFinal: 12000,
      valorTotal: 100,
    };
    prisma.passagemPesagem.findMany.mockResolvedValue([
      {
        papelCalculo: 'BRUTO_OFICIAL',
        pesoCapturado: 12000,
        statusPassagem: 'VALIDA',
        sequencia: 1,
      },
      {
        papelCalculo: 'TARA_OFICIAL',
        pesoCapturado: 0,
        statusPassagem: 'VALIDA',
        sequencia: 2,
      },
    ]);
    prisma.ticketPesagem.findUnique
      .mockResolvedValueOnce({ ...ticketFechado })
      .mockResolvedValueOnce({ ...ticketFechado })
      .mockResolvedValueOnce({ ...ticketFechado })
      .mockResolvedValueOnce({ ...ticketFechado });
    prisma.integracaoProfile.findMany.mockResolvedValue([{ id: 'profile-1' }]);

    await service.fecharTicket('tk1', {}, 'tenant-1', 'user-1');

    expect(prisma.integracaoProfile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tenant-1',
          empresaId: 'empresa-1',
          enabled: true,
          syncDirection: { in: ['outbound', 'bidirectional'] },
          connector: { supportedEntities: { contains: 'weighing_ticket' } },
          OR: [{ unidadeId: null }, { unidadeId: 'u1' }],
        }),
      }),
    );
    expect(outboxMock.enqueueInTransaction).toHaveBeenCalledWith(
      prisma,
      expect.objectContaining({
        eventType: 'weighing.ticket.closed',
        payloadCanonical: expect.objectContaining({
          ticket: expect.objectContaining({
            id: 'tk1',
            unidadeId: 'u1',
            clienteId: 'c1',
            produtoId: 'p1',
          }),
          passagens: expect.any(Array),
        }),
      }),
    );
    const payload = outboxMock.enqueueInTransaction.mock.calls[0][1].payloadCanonical;
    expect(JSON.stringify(payload)).not.toContain('123.456.789-09');
  });
});

describe('TicketService.create - bloqueio por licença', () => {
  let service: TicketService;
  let prisma: {
    ticketPesagem: { create: jest.Mock; count: jest.Mock; findUnique: jest.Mock };
    licencaInstalacao: { findFirst: jest.Mock };
    veiculo: { findUnique: jest.Mock; findFirst: jest.Mock };
    unidade: { findFirst: jest.Mock };
    cliente: { findFirst: jest.Mock };
    produto: { findFirst: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      ticketPesagem: {
        create: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn(),
      },
      licencaInstalacao: { findFirst: jest.fn() },
      veiculo: { findUnique: jest.fn(), findFirst: jest.fn().mockResolvedValue({ id: 'v' }) },
      unidade: { findFirst: jest.fn().mockResolvedValue({ id: 'u' }) },
      cliente: { findFirst: jest.fn().mockResolvedValue({ id: 'c' }) },
      produto: { findFirst: jest.fn().mockResolvedValue({ id: 'p' }) },
    };
    const eventEmitter = { emit: jest.fn() };
    const module = await Test.createTestingModule({
      providers: [
        TicketService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventEmitter2, useValue: eventEmitter },
        { provide: OutboxService, useValue: outboxMock },
      ],
    }).compile();
    service = module.get(TicketService);
  });

  it('bloqueia criação quando licença EXPIRADA', async () => {
    prisma.licencaInstalacao.findFirst.mockResolvedValue({
      statusLicenca: 'EXPIRADA',
      pesagensRestantesTrial: null,
    });
    await expect(
      service.create(
        {
          unidadeId: 'u',
          fluxoPesagem: 'PF2_BRUTO_TARA',
          clienteId: 'c',
          produtoId: 'p',
        } as CreateTicketDto,
        't',
      ),
    ).rejects.toThrow(/bloqueada|EXPIRADA/i);
  });

  it('bloqueia quando trial esgotou pesagens', async () => {
    prisma.licencaInstalacao.findFirst.mockResolvedValue({
      statusLicenca: 'TRIAL',
      pesagensRestantesTrial: 0,
    });
    await expect(
      service.create(
        {
          unidadeId: 'u',
          fluxoPesagem: 'PF2_BRUTO_TARA',
          clienteId: 'c',
          produtoId: 'p',
        } as CreateTicketDto,
        't',
      ),
    ).rejects.toThrow(/trial/i);
  });
});

describe('TicketService.create - B9 validacao de tara em PF1', () => {
  let service: TicketService;
  let prisma: {
    ticketPesagem: { create: jest.Mock; count: jest.Mock; findUnique: jest.Mock };
    unidade: { findFirst: jest.Mock };
    cliente: { findFirst: jest.Mock };
    produto: { findFirst: jest.Mock };
    licencaInstalacao: { findFirst: jest.Mock };
    ticketContador: { upsert: jest.Mock };
    veiculo: { findUnique: jest.Mock; findFirst: jest.Mock };
    $transaction: jest.Mock;
  };

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
      unidade: { findFirst: jest.fn().mockResolvedValue({ id: 'u' }) },
      cliente: { findFirst: jest.fn().mockResolvedValue({ id: 'c' }) },
      produto: { findFirst: jest.fn().mockResolvedValue({ id: 'p' }) },
      licencaInstalacao: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'lic-1',
          statusLicenca: 'ATIVA',
          pesagensRestantesTrial: null,
          trialExpiraEm: null,
        }),
      },
      ticketContador: {
        upsert: jest.fn().mockResolvedValue({ ultimoNumero: 1 }),
      },
      veiculo: { findUnique: jest.fn(), findFirst: jest.fn().mockResolvedValue({ id: 'v' }) },
      $transaction: jest.fn((fn: (tx: typeof prisma) => unknown) => fn(prisma)),
    };
    const eventEmitter = { emit: jest.fn() };
    const module = await Test.createTestingModule({
      providers: [
        TicketService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventEmitter2, useValue: eventEmitter },
        { provide: OutboxService, useValue: outboxMock },
      ],
    }).compile();
    service = module.get(TicketService);
  });

  it('rejeita PF1 sem veiculoId nem taraReferenciaTipo MANUAL', async () => {
    await expect(
      service.create(
        {
          unidadeId: 'u',
          fluxoPesagem: 'PF1_TARA_REFERENCIADA',
          clienteId: 'c',
          produtoId: 'p',
        } as CreateTicketDto,
        't',
      ),
    ).rejects.toThrow(/PF1_TARA_REFERENCIADA exige tara/);
    expect(prisma.ticketPesagem.create).not.toHaveBeenCalled();
  });

  it('rejeita PF1 quando veiculo nao tem tara cadastrada', async () => {
    prisma.veiculo.findUnique.mockResolvedValue({ id: 'v1', taraCadastrada: null });
    await expect(
      service.create(
        {
          unidadeId: 'u',
          fluxoPesagem: 'PF1_TARA_REFERENCIADA',
          clienteId: 'c',
          produtoId: 'p',
          veiculoId: 'v1',
        } as CreateTicketDto,
        't',
      ),
    ).rejects.toThrow(/exige tara/);
    expect(prisma.ticketPesagem.create).not.toHaveBeenCalled();
  });

  it('rejeita PF1 manual sem taraManual positiva', async () => {
    await expect(
      service.create(
        {
          unidadeId: 'u',
          fluxoPesagem: 'PF1_TARA_REFERENCIADA',
          clienteId: 'c',
          produtoId: 'p',
          taraReferenciaTipo: 'MANUAL',
        } as CreateTicketDto,
        't',
      ),
    ).rejects.toThrow(/tara manual/i);
    expect(prisma.ticketPesagem.create).not.toHaveBeenCalled();
  });

  it('aceita PF1 com taraReferenciaTipo=MANUAL e taraManual positiva', async () => {
    await service.create(
      {
        unidadeId: 'u',
        fluxoPesagem: 'PF1_TARA_REFERENCIADA',
        clienteId: 'c',
        produtoId: 'p',
        taraReferenciaTipo: 'MANUAL',
        taraManual: 4200,
      } as CreateTicketDto,
      't',
    );
    expect(prisma.ticketPesagem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          taraCadastradaSnapshot: 4200,
          taraReferenciaTipo: 'MANUAL',
        }),
      }),
    );
  });

  it('aceita PF1 com veiculo que tem taraCadastrada > 0', async () => {
    prisma.veiculo.findFirst.mockResolvedValue({ id: 'v1', taraCadastrada: 5000 });
    await service.create(
      {
        unidadeId: 'u',
        fluxoPesagem: 'PF1_TARA_REFERENCIADA',
        clienteId: 'c',
        produtoId: 'p',
        veiculoId: 'v1',
      } as CreateTicketDto,
      't',
    );
    expect(prisma.ticketPesagem.create).toHaveBeenCalled();
  });

  it('PF2 nao requer tara (passa sem checagem)', async () => {
    await service.create(
      {
        unidadeId: 'u',
        fluxoPesagem: 'PF2_BRUTO_TARA',
        clienteId: 'c',
        produtoId: 'p',
      } as CreateTicketDto,
      't',
    );
    expect(prisma.ticketPesagem.create).toHaveBeenCalled();
  });
});
