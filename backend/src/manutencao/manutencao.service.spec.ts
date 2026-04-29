import { NotFoundException } from '@nestjs/common';
import { ManutencaoService } from './manutencao.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ManutencaoService', () => {
  let prisma: {
    solicitacaoAprovacao: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
  };
  let service: ManutencaoService;

  beforeEach(() => {
    prisma = {
      solicitacaoAprovacao: {
        create: jest.fn().mockResolvedValue({ id: 's1' }),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findFirst: jest.fn().mockResolvedValue({
          id: 's1',
          tenantId: 'tenant-1',
          status: 'PENDENTE',
        }),
        update: jest.fn().mockResolvedValue({ id: 's1', status: 'APROVADA' }),
      },
    };
    service = new ManutencaoService(prisma as unknown as PrismaService);
  });

  it('cria solicitacao usando tenant e solicitante do usuario autenticado', async () => {
    await service.criarSolicitacao(
      {
        tipoSolicitacao: 'ALTERAR_TICKET',
        entidadeAlvo: 'ticket_pesagem',
        entidadeId: 'ticket-1',
        solicitanteId: 'body-user',
        motivo: 'corrigir',
      },
      'tenant-1',
      'jwt-user',
    );

    expect(prisma.solicitacaoAprovacao.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-1',
        solicitanteId: 'jwt-user',
      }),
    });
  });

  it('lista somente solicitacoes do tenant autenticado', async () => {
    await service.findAll({}, 'tenant-1');

    expect(prisma.solicitacaoAprovacao.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-1' }) }),
    );
    expect(prisma.solicitacaoAprovacao.count).toHaveBeenCalledWith({
      where: expect.objectContaining({ tenantId: 'tenant-1' }),
    });
  });

  it('aprova usando aprovador do usuario autenticado e tenant no where', async () => {
    await service.aprovar(
      's1',
      { justificativa: 'ok', aprovadorId: 'body-approver' },
      'tenant-1',
      'jwt-approver',
    );

    expect(prisma.solicitacaoAprovacao.findFirst).toHaveBeenCalledWith({
      where: { id: 's1', tenantId: 'tenant-1' },
    });
    expect(prisma.solicitacaoAprovacao.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ aprovadorPrimarioId: 'jwt-approver' }),
      }),
    );
  });

  it('nao encontra solicitacao de outro tenant', async () => {
    prisma.solicitacaoAprovacao.findFirst.mockResolvedValue(null);

    await expect(service.findOne('s1', 'tenant-2')).rejects.toBeInstanceOf(NotFoundException);
  });
});
