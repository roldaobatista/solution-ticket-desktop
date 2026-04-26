import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  StatusOperacional,
  StatusComercial,
  FluxoPesagem,
  PapelCalculo,
  StatusPassagem,
  ModoComercial,
} from '../constants/enums';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { TicketFilterDto } from './dto/ticket-filter.dto';
import { RegistrarPassagemDto } from './dto/registrar-passagem.dto';
import { FecharTicketDto } from './dto/fechar-ticket.dto';
import { CancelarTicketDto } from './dto/cancelar-ticket.dto';
import { TicketStateMachine } from './ticket-state-machine';
import { TicketCalculator } from './ticket-calculator';
import { TicketLicenseGuard } from './ticket-license-guard';
import { TicketEventPublisher } from './ticket-event-publisher';

@Injectable()
export class TicketService {
  private readonly licenseGuard: TicketLicenseGuard;
  private readonly eventPublisher: TicketEventPublisher;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.licenseGuard = new TicketLicenseGuard(prisma);
    this.eventPublisher = new TicketEventPublisher(eventEmitter);
  }

  // ============================================================
  // CRUD Básico
  // ============================================================

  async create(dto: CreateTicketDto, tenantId: string) {
    await this.licenseGuard.verificarLicenca(dto.unidadeId);

    let taraSnapshot: number | undefined;
    let taraTipo = dto.taraReferenciaTipo;
    if (dto.veiculoId) {
      const veiculo = await this.prisma.veiculo.findUnique({ where: { id: dto.veiculoId } });
      if (veiculo?.taraCadastrada) {
        taraSnapshot = Number(veiculo.taraCadastrada);
        if (!taraTipo) taraTipo = 'CADASTRADA';
      }
    }

    const passagensPrevistas =
      dto.fluxoPesagem === FluxoPesagem.PF1_TARA_REFERENCIADA
        ? 1
        : dto.fluxoPesagem === FluxoPesagem.PF3_COM_CONTROLE
          ? 3
          : 2;

    if (dto.fluxoPesagem === FluxoPesagem.PF1_TARA_REFERENCIADA) {
      const taraValida = (taraSnapshot && taraSnapshot > 0) || taraTipo === 'MANUAL';
      if (!taraValida) {
        throw new BadRequestException(
          'Fluxo PF1_TARA_REFERENCIADA exige tara: informe veiculoId com tara cadastrada ' +
            "ou taraReferenciaTipo='MANUAL' com tara informada.",
        );
      }
    }

    const ticket = await this.prisma.$transaction(async (tx) => {
      const year = new Date().getFullYear();
      const count = await tx.ticketPesagem.count({
        where: {
          unidadeId: dto.unidadeId,
          criadoEm: { gte: new Date(year, 0, 1), lte: new Date(year, 11, 31, 23, 59, 59) },
        },
      });
      const numero = `TK-${year}-${String(count + 1).padStart(4, '0')}`;
      return tx.ticketPesagem.create({
        data: {
          numero,
          tenantId: tenantId,
          unidadeId: dto.unidadeId,
          statusOperacional: StatusOperacional.ABERTO,
          statusComercial: StatusComercial.NAO_ROMANEADO,
          fluxoPesagem: dto.fluxoPesagem,
          totalPassagensPrevistas: passagensPrevistas,
          totalPassagensRealizadas: 0,
          clienteId: dto.clienteId,
          transportadoraId: dto.transportadoraId || null,
          motoristaId: dto.motoristaId || null,
          veiculoId: dto.veiculoId || null,
          veiculoPlaca: dto.veiculoPlaca || null,
          produtoId: dto.produtoId,
          origemId: dto.origemId || null,
          destinoId: dto.destinoId || null,
          armazemId: dto.armazemId || null,
          indicadorPesagemId: dto.indicadorPesagemId || null,
          notaFiscal: dto.notaFiscal || null,
          pesoNf: dto.pesoNf || null,
          taraCadastradaSnapshot: taraSnapshot || null,
          taraReferenciaTipo: taraTipo || null,
          modoComercial: dto.modoComercial || ModoComercial.DESABILITADO,
          observacao: dto.observacao || null,
          campo1: dto.campo1 || null,
          campo2: dto.campo2 || null,
          abertoEm: new Date(),
        },
        include: {
          cliente: true,
          transportadora: true,
          motorista: true,
          veiculo: true,
          produto: true,
          origem: true,
          destino: true,
          armazem: true,
        },
      });
    });

    return ticket;
  }

  async findAll(filter: TicketFilterDto, tenantId: string) {
    const where: Prisma.TicketPesagemWhereInput = { tenantId };
    if (filter.unidadeId) where.unidadeId = filter.unidadeId;
    if (filter.clienteId) where.clienteId = filter.clienteId;
    if (filter.produtoId) where.produtoId = filter.produtoId;
    if (filter.statusOperacional) where.statusOperacional = filter.statusOperacional;
    if (filter.statusComercial) where.statusComercial = filter.statusComercial;
    if (filter.fluxoPesagem) where.fluxoPesagem = filter.fluxoPesagem;
    if (filter.placa) where.veiculoPlaca = { contains: filter.placa };
    if (filter.numero) where.numero = { contains: filter.numero };
    if (filter.dataInicio || filter.dataFim) {
      where.criadoEm = {};
      if (filter.dataInicio) where.criadoEm.gte = new Date(filter.dataInicio);
      if (filter.dataFim) where.criadoEm.lte = new Date(filter.dataFim);
    }

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.ticketPesagem.findMany({
        where,
        skip,
        take: limit,
        orderBy: { criadoEm: 'desc' },
        include: {
          cliente: { select: { id: true, razaoSocial: true } },
          transportadora: { select: { id: true, nome: true } },
          motorista: { select: { id: true, nome: true } },
          veiculo: { select: { id: true, placa: true } },
          produto: { select: { id: true, descricao: true } },
          destino: { select: { id: true, descricao: true } },
          armazem: { select: { id: true, descricao: true } },
          passagens: { orderBy: { sequencia: 'asc' } },
        },
      }),
      this.prisma.ticketPesagem.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, tenantId: string) {
    const ticket = await this.prisma.ticketPesagem.findUnique({
      where: { id, tenantId },
      include: {
        cliente: true,
        transportadora: true,
        motorista: true,
        veiculo: true,
        produto: true,
        origem: true,
        destino: true,
        armazem: true,
        indicadorPesagem: true,
        passagens: { orderBy: { sequencia: 'asc' } },
        descontos: true,
        documentos: true,
        snapshotsComercial: { orderBy: { versaoSnapshot: 'desc' } },
      },
    });
    if (!ticket) throw new NotFoundException('Ticket nao encontrado');
    return ticket;
  }

  async update(id: string, dto: UpdateTicketDto, tenantId: string) {
    const ticket = await this.findOne(id, tenantId);
    if (
      ticket.statusOperacional === StatusOperacional.FECHADO ||
      ticket.statusOperacional === StatusOperacional.CANCELADO
    ) {
      throw new ForbiddenException('Ticket fechado ou cancelado nao pode ser editado diretamente');
    }

    const updated = await this.prisma.ticketPesagem.update({
      where: { id, tenantId },
      data: { ...dto },
      include: {
        cliente: true,
        transportadora: true,
        motorista: true,
        veiculo: true,
        produto: true,
        destino: true,
        armazem: true,
      },
    });
    this.eventPublisher.emitTicketAtualizado(updated.id, updated.tenantId);
    return updated;
  }

  // ============================================================
  // STATE MACHINE
  // ============================================================

  async transicionarEstado(
    ticketId: string,
    novoEstado: string,
    tenantId: string,
    usuarioId?: string,
    motivo?: string,
  ) {
    const ticket = await this.findOne(ticketId, tenantId);
    TicketStateMachine.validarTransicao(ticket.statusOperacional, novoEstado);

    const sideEffects = TicketStateMachine.getSideEffects(novoEstado);
    const updated = await this.prisma.ticketPesagem.update({
      where: { id: ticketId },
      data: { statusOperacional: novoEstado, ...sideEffects },
      include: {
        cliente: true,
        transportadora: true,
        motorista: true,
        veiculo: true,
        produto: true,
        passagens: true,
      },
    });

    this.eventPublisher.emitStatusComercialAlterado(
      ticketId,
      ticket.tenantId,
      ticket.statusComercial,
      ticket.statusComercial,
    );

    await this.prisma.auditoria.create({
      data: {
        tenantId: ticket.tenantId,
        entidade: 'ticket_pesagem',
        entidadeId: ticketId,
        evento: 'ticket.transicao_estado',
        estadoAnterior: JSON.stringify({ statusOperacional: ticket.statusOperacional }),
        estadoNovo: JSON.stringify({ statusOperacional: novoEstado }),
        usuarioId: usuarioId || null,
        motivo: motivo || null,
      },
    });

    return updated;
  }

  // ============================================================
  // PASSAGEM
  // ============================================================

  async registrarPassagem(ticketId: string, dto: RegistrarPassagemDto, tenantId: string) {
    // C6 (Onda 1): cálculo de sequência DENTRO da $transaction.
    return this.prisma.$transaction(async (tx) => {
      const ticket = await tx.ticketPesagem.findUnique({
        where: { id: ticketId, tenantId },
        include: { passagens: { orderBy: { sequencia: 'desc' }, take: 1 } },
      });
      if (!ticket) throw new NotFoundException(`Ticket ${ticketId} nao encontrado`);

      if (!TicketStateMachine.podeRegistrarPassagem(ticket.statusOperacional)) {
        throw new BadRequestException(
          `Nao e permitido registrar passagem no estado ${ticket.statusOperacional}`,
        );
      }
      if (ticket.statusOperacional === StatusOperacional.CANCELADO) {
        throw new ForbiddenException('Ticket cancelado nao pode receber passagens');
      }

      const ultimaSequencia = ticket.passagens[0]?.sequencia ?? 0;
      const proximaSequencia = ultimaSequencia + 1;

      const updateData: Prisma.TicketPesagemUpdateInput = {
        totalPassagensRealizadas: proximaSequencia,
        ultimaPassagemEm: new Date(),
      };
      if (!ticket.primeiraPassagemEm) updateData.primeiraPassagemEm = new Date();
      if (ticket.statusOperacional === StatusOperacional.ABERTO) {
        updateData.statusOperacional = StatusOperacional.EM_PESAGEM;
      }

      const passagem = await tx.passagemPesagem.create({
        data: {
          ticketId,
          sequencia: proximaSequencia,
          tipoPassagem: dto.tipoPassagem,
          direcaoOperacional: dto.direcaoOperacional,
          papelCalculo: dto.papelCalculo,
          condicaoVeiculo: dto.condicaoVeiculo,
          statusPassagem: StatusPassagem.VALIDA,
          pesoCapturado: dto.pesoCapturado,
          dataHora: dto.dataHora || new Date(),
          balancaId: dto.balancaId,
          usuarioId: dto.usuarioId,
          origemLeitura: dto.origemLeitura,
          indicadorEstabilidade: dto.indicadorEstabilidade || null,
          sequenceNoDispositivo: dto.sequenceNoDispositivo || null,
          eventIdOrigem: dto.eventIdOrigem || null,
          observacao: dto.observacao || null,
        },
      });

      await tx.ticketPesagem.update({ where: { id: ticketId }, data: updateData });
      return passagem;
    });
  }

  // ============================================================
  // FECHAMENTO
  // ============================================================

  async fecharTicket(ticketId: string, dto: FecharTicketDto, tenantId: string) {
    // C5 (Onda 1): fechamento atomico em $transaction unica.
    const result = await this.prisma.$transaction(async (tx) => {
      const ticket = await tx.ticketPesagem.findUnique({ where: { id: ticketId, tenantId } });
      if (!ticket) throw new NotFoundException(`Ticket ${ticketId} nao encontrado`);

      if (!TicketStateMachine.podeFechar(ticket.statusOperacional)) {
        throw new BadRequestException(
          `Ticket nao pode ser fechado no estado ${ticket.statusOperacional}`,
        );
      }

      const passagens = await tx.passagemPesagem.findMany({
        where: { ticketId, statusPassagem: StatusPassagem.VALIDA },
      });
      if (passagens.length === 0) {
        throw new BadRequestException('Ticket nao possui passagens validas para fechamento');
      }

      const descontos = await tx.descontoPesagem.findMany({ where: { ticketId } });
      const calculo = TicketCalculator.calcularFechamento({
        passagensValidas: passagens.map((p) => ({
          papelCalculo: p.papelCalculo,
          pesoCapturado: p.pesoCapturado,
        })),
        taraCadastradaSnapshot: ticket.taraCadastradaSnapshot,
        descontos: descontos.map((d) => ({ valor: d.valor })),
      });

      await tx.ticketPesagem.update({
        where: { id: ticketId },
        data: {
          statusOperacional: StatusOperacional.FECHADO,
          ...calculo,
          fechadoEm: new Date(),
          observacao: dto.observacao || ticket.observacao,
        },
      });

      if (ticket.modoComercial !== ModoComercial.DESABILITADO) {
        await this.criarSnapshotComercialTx(tx, ticketId);
      }

      await tx.auditoria.create({
        data: {
          tenantId: ticket.tenantId,
          entidade: 'ticket_pesagem',
          entidadeId: ticketId,
          evento: 'ticket.fechado',
          estadoAnterior: JSON.stringify({
            statusOperacional: ticket.statusOperacional,
            passagens: passagens.map((p) => ({
              sequencia: p.sequencia,
              papelCalculo: p.papelCalculo,
              peso: p.pesoCapturado,
            })),
          }),
          estadoNovo: JSON.stringify({ statusOperacional: StatusOperacional.FECHADO, ...calculo }),
          usuarioId: dto.usuarioId || null,
        },
      });

      await this.licenseGuard.decrementarPesagemTrial(ticket.unidadeId, tx);

      return { tenantId: ticket.tenantId };
    });

    // After-commit: efeitos colaterais nao-transacionais (eventos de dominio)
    this.eventPublisher.emitTicketFechado(ticketId, result.tenantId);

    return this.findOne(ticketId, tenantId);
  }

  // ============================================================
  // CANCELAMENTO
  // ============================================================

  async cancelarTicket(ticketId: string, dto: CancelarTicketDto, tenantId: string) {
    const ticket = await this.findOne(ticketId, tenantId);

    if (ticket.statusOperacional === StatusOperacional.CANCELADO) {
      throw new BadRequestException('Ticket ja esta cancelado');
    }
    if (ticket.statusOperacional === StatusOperacional.FECHADO) {
      throw new ForbiddenException(
        'Cancelamento de ticket fechado exige solicitacao de excecao aprovada',
      );
    }
    if (ticket.statusOperacional === StatusOperacional.EM_MANUTENCAO) {
      throw new ForbiddenException(
        'Ticket em manutencao so pode ser cancelado pela propria manutencao',
      );
    }

    await this.prisma.passagemPesagem.updateMany({
      where: { ticketId, statusPassagem: StatusPassagem.PENDENTE },
      data: { statusPassagem: StatusPassagem.INVALIDADA },
    });

    return this.transicionarEstado(
      ticketId,
      StatusOperacional.CANCELADO,
      tenantId,
      dto.usuarioId,
      dto.motivo,
    );
  }

  // ============================================================
  // MANUTENCAO
  // ============================================================

  async solicitarManutencao(ticketId: string, motivo: string, usuarioId: string, tenantId: string) {
    const ticket = await this.findOne(ticketId, tenantId);
    if (ticket.statusOperacional !== StatusOperacional.FECHADO) {
      throw new BadRequestException('Manutencao so pode ser solicitada para ticket FECHADO');
    }
    if (
      ticket.statusComercial === StatusComercial.FATURADO ||
      ticket.statusComercial === StatusComercial.PARCIALMENTE_BAIXADO ||
      ticket.statusComercial === StatusComercial.BAIXADO
    ) {
      throw new ForbiddenException(
        'Ticket com vinculo comercial avancado nao pode sofrer manutencao sem compensacao',
      );
    }
    return this.transicionarEstado(
      ticketId,
      StatusOperacional.EM_MANUTENCAO,
      tenantId,
      usuarioId,
      motivo,
    );
  }

  async concluirManutencao(ticketId: string, usuarioId: string, tenantId: string) {
    const ticket = await this.findOne(ticketId, tenantId);
    if (ticket.statusOperacional !== StatusOperacional.EM_MANUTENCAO) {
      throw new BadRequestException('Ticket nao esta em manutencao');
    }
    return this.transicionarEstado(
      ticketId,
      StatusOperacional.FECHADO,
      tenantId,
      usuarioId,
      'Manutencao concluida',
    );
  }

  // ============================================================
  // SNAPSHOT COMERCIAL
  // ============================================================

  /**
   * Versão transacional usada por fecharTicket — reaproveita o tx para garantir
   * atomicidade (Onda 1, C5).
   * Lê o ticket recém-atualizado dentro da própria tx (peso liquido já calculado).
   */
  private async criarSnapshotComercialTx(tx: Prisma.TransactionClient, ticketId: string) {
    const ticket = await tx.ticketPesagem.findUnique({ where: { id: ticketId } });
    if (!ticket) return;
    const versao = (ticket.snapshotComercialVersao || 0) + 1;

    let valorUnitario: number | null = null;
    let valorTotal: number | null = null;

    if (ticket.pesoLiquidoFinal && ticket.modoComercial !== ModoComercial.DESABILITADO) {
      const precoCliente = await tx.tabelaPrecoProdutoCliente.findFirst({
        where: {
          produtoId: ticket.produtoId,
          clienteId: ticket.clienteId,
          ativo: true,
          vigenciaInicio: { lte: new Date() },
          OR: [{ vigenciaFim: null }, { vigenciaFim: { gte: new Date() } }],
        },
        orderBy: { prioridadeResolucao: 'desc' },
      });

      if (precoCliente) {
        valorUnitario = Number(precoCliente.valor);
      } else {
        const precoProduto = await tx.tabelaPrecoProduto.findFirst({
          where: {
            produtoId: ticket.produtoId,
            ativo: true,
            vigenciaInicio: { lte: new Date() },
            OR: [{ vigenciaFim: null }, { vigenciaFim: { gte: new Date() } }],
          },
          orderBy: { prioridadeResolucao: 'desc' },
        });
        if (precoProduto) valorUnitario = Number(precoProduto.valor);
      }

      if (valorUnitario && ticket.pesoLiquidoFinal) {
        valorTotal = Number(ticket.pesoLiquidoFinal) * valorUnitario;
      }
    }

    await tx.snapshotComercialTicket.create({
      data: {
        ticketId,
        modoComercialTicket: ticket.modoComercial,
        precoOrigem: valorUnitario ? 'tabela' : null,
        valorUnitario,
        valorTotalBruto: valorTotal,
        valorTotalLiquido: valorTotal,
        pesoBaseComercial: ticket.pesoLiquidoFinal,
        versaoSnapshot: versao,
        geradoPor: 'sistema',
      },
    });

    if (valorUnitario) {
      await tx.ticketPesagem.update({
        where: { id: ticketId },
        data: { snapshotComercialVersao: versao, valorUnitario, valorTotal },
      });
    }
  }

  // ============================================================
  // REIMPRESSAO / HISTORICO / ESTATISTICAS
  // ============================================================

  async reimprimir(ticketId: string, tenantId: string, usuarioId?: string) {
    const ticket = await this.findOne(ticketId, tenantId);
    if (ticket.statusOperacional !== StatusOperacional.FECHADO) {
      throw new BadRequestException('Apenas tickets fechados podem ser reimpressos');
    }
    await this.prisma.auditoria.create({
      data: {
        tenantId: ticket.tenantId,
        entidade: 'ticket_pesagem',
        entidadeId: ticketId,
        evento: 'ticket.reimprimir',
        estadoAnterior: JSON.stringify({ statusOperacional: ticket.statusOperacional }),
        estadoNovo: JSON.stringify({ acao: 'reimpressao_solicitada' }),
        usuarioId: usuarioId || null,
      },
    });
    return { sucesso: true, ticketId, numero: ticket.numero, mensagem: 'Reimpressao registrada' };
  }

  async getHistorico(ticketId: string, tenantId: string) {
    await this.findOne(ticketId, tenantId);
    return this.prisma.auditoria.findMany({
      where: { entidade: 'ticket_pesagem', entidadeId: ticketId },
      orderBy: { dataHora: 'desc' },
    });
  }

  async getEstatisticas(unidadeId: string) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const [totalHoje, abertos, emPesagem, aguardando, fechadosHoje, canceladosHoje] =
      await Promise.all([
        this.prisma.ticketPesagem.count({ where: { unidadeId, criadoEm: { gte: hoje } } }),
        this.prisma.ticketPesagem.count({
          where: { unidadeId, statusOperacional: StatusOperacional.ABERTO },
        }),
        this.prisma.ticketPesagem.count({
          where: { unidadeId, statusOperacional: StatusOperacional.EM_PESAGEM },
        }),
        this.prisma.ticketPesagem.count({
          where: { unidadeId, statusOperacional: StatusOperacional.AGUARDANDO_PASSAGEM },
        }),
        this.prisma.ticketPesagem.count({
          where: {
            unidadeId,
            statusOperacional: StatusOperacional.FECHADO,
            fechadoEm: { gte: hoje },
          },
        }),
        this.prisma.ticketPesagem.count({
          where: {
            unidadeId,
            statusOperacional: StatusOperacional.CANCELADO,
            canceladoEm: { gte: hoje },
          },
        }),
      ]);
    return { totalHoje, abertos, emPesagem, aguardando, fechadosHoje, canceladosHoje };
  }
}
