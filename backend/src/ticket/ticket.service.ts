import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { gerarPdf } from '../impressao/templates';
import { ticketComRelacoesArgs } from '../impressao/templates/types';
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

// ============================================================
// STATE MACHINE - Transicoes permitidas por estado atual
// ============================================================
const TRANSICOES_PERMITIDAS: Record<string, string[]> = {
  [StatusOperacional.RASCUNHO]: [StatusOperacional.ABERTO, StatusOperacional.CANCELADO],
  [StatusOperacional.ABERTO]: [StatusOperacional.EM_PESAGEM, StatusOperacional.CANCELADO],
  [StatusOperacional.EM_PESAGEM]: [
    StatusOperacional.AGUARDANDO_PASSAGEM,
    StatusOperacional.FECHADO,
    StatusOperacional.CANCELADO,
  ],
  [StatusOperacional.AGUARDANDO_PASSAGEM]: [
    StatusOperacional.EM_PESAGEM,
    StatusOperacional.FECHADO,
    StatusOperacional.CANCELADO,
  ],
  [StatusOperacional.FECHADO]: [StatusOperacional.EM_MANUTENCAO, StatusOperacional.CANCELADO],
  [StatusOperacional.EM_MANUTENCAO]: [StatusOperacional.FECHADO],
  [StatusOperacional.CANCELADO]: [], // Terminal
};

@Injectable()
export class TicketService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // CRUD Básico
  // ============================================================

  async create(dto: CreateTicketDto) {
    // Verificar licenciamento da unidade antes de criar ticket
    const licenca = await this.prisma.licencaInstalacao.findFirst({
      where: { unidadeId: dto.unidadeId },
    });

    if (licenca) {
      const statusBloqueantes = ['EXPIRADA', 'BLOQUEADA', 'INVALIDA'];
      if (statusBloqueantes.includes(licenca.statusLicenca)) {
        throw new ForbiddenException(
          `Operação bloqueada: licença da unidade está ${licenca.statusLicenca}. Entre em contato com o suporte.`,
        );
      }

      if (
        licenca.statusLicenca === 'TRIAL' &&
        licenca.pesagensRestantesTrial !== null &&
        licenca.pesagensRestantesTrial <= 0
      ) {
        throw new ForbiddenException(
          'Periodo de trial expirado (limite de pesagens atingido). Ative sua licença para continuar.',
        );
      }
    }

    // Se veiculo informado, captura tara cadastrada
    let taraSnapshot: number | undefined;
    let taraTipo = dto.taraReferenciaTipo;
    if (dto.veiculoId) {
      const veiculo = await this.prisma.veiculo.findUnique({
        where: { id: dto.veiculoId },
      });
      if (veiculo?.taraCadastrada) {
        taraSnapshot = Number(veiculo.taraCadastrada);
        if (!taraTipo) taraTipo = 'CADASTRADA';
      }
    }

    // Determina total de passagens previstas pelo fluxo
    const passagensPrevistas =
      dto.fluxoPesagem === FluxoPesagem.PF1_TARA_REFERENCIADA
        ? 1
        : dto.fluxoPesagem === FluxoPesagem.PF3_COM_CONTROLE
          ? 3
          : 2;

    // B9: PF1 (TARA REFERENCIADA) exige tara conhecida no momento de criar.
    // Sem isto, ticket abriria com tara=0 e o calculo do peso liquido na
    // primeira passagem ficaria incorreto silenciosamente.
    if (dto.fluxoPesagem === FluxoPesagem.PF1_TARA_REFERENCIADA) {
      const taraValida = (taraSnapshot && taraSnapshot > 0) || taraTipo === 'MANUAL';
      if (!taraValida) {
        throw new BadRequestException(
          'Fluxo PF1_TARA_REFERENCIADA exige tara: informe veiculoId com tara cadastrada ' +
            "ou taraReferenciaTipo='MANUAL' com tara informada.",
        );
      }
    }

    // A3.2: count + create em transação única — em SQLite, write lock
    // garante que dois creates concorrentes não reusem o mesmo numero.
    const ticket = await this.prisma.$transaction(async (tx) => {
      const year = new Date().getFullYear();
      const count = await tx.ticketPesagem.count({
        where: {
          unidadeId: dto.unidadeId,
          criadoEm: {
            gte: new Date(year, 0, 1),
            lte: new Date(year, 11, 31, 23, 59, 59),
          },
        },
      });
      const numero = `TK-${year}-${String(count + 1).padStart(4, '0')}`;
      return tx.ticketPesagem.create({
        data: {
          numero,
          tenantId: dto.tenantId,
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

  async findAll(filter: TicketFilterDto) {
    const where: Prisma.TicketPesagemWhereInput = {};

    if (filter.unidadeId) where.unidadeId = filter.unidadeId;
    if (filter.tenantId) where.tenantId = filter.tenantId;
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

  async findOne(id: string) {
    const ticket = await this.prisma.ticketPesagem.findUnique({
      where: { id },
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

  async update(id: string, dto: UpdateTicketDto) {
    const ticket = await this.findOne(id);

    // Nao permite editar ticket FECHADO ou CANCELADO diretamente
    if (
      ticket.statusOperacional === StatusOperacional.FECHADO ||
      ticket.statusOperacional === StatusOperacional.CANCELADO
    ) {
      throw new ForbiddenException('Ticket fechado ou cancelado nao pode ser editado diretamente');
    }

    return this.prisma.ticketPesagem.update({
      where: { id },
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
  }

  // ============================================================
  // STATE MACHINE - Transicao de estados
  // ============================================================

  async transicionarEstado(
    ticketId: string,
    novoEstado: string,
    usuarioId?: string,
    motivo?: string,
  ) {
    const ticket = await this.findOne(ticketId);
    const estadoAtual = ticket.statusOperacional;

    // Verifica se a transicao e permitida
    const permitidas = TRANSICOES_PERMITIDAS[estadoAtual] || [];
    if (!permitidas.includes(novoEstado)) {
      throw new BadRequestException(`Transicao de ${estadoAtual} para ${novoEstado} nao permitida`);
    }

    const updateData: Prisma.TicketPesagemUpdateInput = { statusOperacional: novoEstado };

    // Side effects por transicao
    if (novoEstado === StatusOperacional.FECHADO) {
      updateData.fechadoEm = new Date();
    }
    if (novoEstado === StatusOperacional.CANCELADO) {
      updateData.canceladoEm = new Date();
      updateData.motivoCancelamento = motivo || 'Cancelado pelo operador';
    }

    const updated = await this.prisma.ticketPesagem.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        cliente: true,
        transportadora: true,
        motorista: true,
        veiculo: true,
        produto: true,
        passagens: true,
      },
    });

    // Registra auditoria da transicao
    await this.prisma.auditoria.create({
      data: {
        tenantId: ticket.tenantId, // RD5
        entidade: 'ticket_pesagem',
        entidadeId: ticketId,
        evento: 'ticket.transicao_estado',
        estadoAnterior: JSON.stringify({ statusOperacional: estadoAtual }),
        estadoNovo: JSON.stringify({ statusOperacional: novoEstado }),
        usuarioId: usuarioId || null,
        motivo: motivo || null,
      },
    });

    return updated;
  }

  // ============================================================
  // REGISTRO DE PASSAGEM
  // ============================================================

  async registrarPassagem(ticketId: string, dto: RegistrarPassagemDto) {
    const ticket = await this.findOne(ticketId);

    // Guardas: ticket deve estar em estado que permite passagem
    const estadosPermitidos: string[] = [
      StatusOperacional.ABERTO,
      StatusOperacional.EM_PESAGEM,
      StatusOperacional.AGUARDANDO_PASSAGEM,
    ];
    if (!estadosPermitidos.includes(ticket.statusOperacional)) {
      throw new BadRequestException(
        `Nao e permitido registrar passagem no estado ${ticket.statusOperacional}`,
      );
    }

    // CANCELADO nao pode receber passagens
    if (ticket.statusOperacional === StatusOperacional.CANCELADO) {
      throw new ForbiddenException('Ticket cancelado nao pode receber passagens');
    }

    const proximaSequencia = ticket.passagens.length + 1;
    const totalPassagens = ticket.passagens.length + 1;
    const updateData: Prisma.TicketPesagemUpdateInput = {
      totalPassagensRealizadas: totalPassagens,
      ultimaPassagemEm: new Date(),
    };

    if (!ticket.primeiraPassagemEm) {
      updateData.primeiraPassagemEm = new Date();
    }
    if (ticket.statusOperacional === StatusOperacional.ABERTO) {
      updateData.statusOperacional = StatusOperacional.EM_PESAGEM;
    }

    // B4: cria a passagem e atualiza contadores+estado do ticket atomicamente.
    // Sem isto, falha no update do ticket deixava passagem orfa contabilizada
    // sem refletir nos contadores (causa de "ticket parece em ABERTO mas tem
    // passagem registrada").
    const [passagem] = await this.prisma.$transaction([
      this.prisma.passagemPesagem.create({
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
      }),
      this.prisma.ticketPesagem.update({
        where: { id: ticketId },
        data: updateData,
      }),
    ]);

    return passagem;
  }

  // ============================================================
  // FECHAMENTO DO TICKET - Algoritmo oficial de calculo
  // ============================================================

  async fecharTicket(ticketId: string, dto: FecharTicketDto) {
    const ticket = await this.findOne(ticketId);

    // Guardas: so pode fechar de EM_PESAGEM ou AGUARDANDO_PASSAGEM
    const estadosFechaveis: string[] = [
      StatusOperacional.EM_PESAGEM,
      StatusOperacional.AGUARDANDO_PASSAGEM,
    ];
    if (!estadosFechaveis.includes(ticket.statusOperacional)) {
      throw new BadRequestException(
        `Ticket nao pode ser fechado no estado ${ticket.statusOperacional}`,
      );
    }

    // 1. Carrega apenas passagens VALIDAS
    const passagens = await this.prisma.passagemPesagem.findMany({
      where: { ticketId, statusPassagem: StatusPassagem.VALIDA },
    });

    if (passagens.length === 0) {
      throw new BadRequestException('Ticket nao possui passagens validas para fechamento');
    }

    // 2. Localiza passagem BRUTO_OFICIAL
    const passagemBruto = passagens.find((p) => p.papelCalculo === PapelCalculo.BRUTO_OFICIAL);
    if (!passagemBruto) {
      throw new BadRequestException('Nao existe passagem BRUTO_OFICIAL valida');
    }

    // 3. Localiza passagem TARA_OFICIAL
    const passagemTara = passagens.find((p) => p.papelCalculo === PapelCalculo.TARA_OFICIAL);

    // 4. Se nao existir TARA_OFICIAL, usar tara_cadastrada_snapshot
    let pesoTaraApurada: number;
    if (!passagemTara) {
      if (!ticket.taraCadastradaSnapshot) {
        throw new BadRequestException(
          'Nao existe passagem TARA_OFICIAL nem tara cadastrada de referencia',
        );
      }
      pesoTaraApurada = Number(ticket.taraCadastradaSnapshot);
    } else {
      pesoTaraApurada = Number(passagemTara.pesoCapturado);
    }

    const pesoBrutoApurado = Number(passagemBruto.pesoCapturado);

    // Valida: bruto deve ser maior que tara
    if (pesoBrutoApurado < pesoTaraApurada) {
      throw new BadRequestException(
        `Peso bruto (${pesoBrutoApurado}) nao pode ser menor que a tara (${pesoTaraApurada})`,
      );
    }

    // 5-6. Calculos
    const pesoLiquidoBruto = pesoBrutoApurado - pesoTaraApurada;
    const pesoLiquidoSemDesconto = pesoLiquidoBruto;

    // 7. Aplica descontos
    const descontos = await this.prisma.descontoPesagem.findMany({ where: { ticketId } });
    const totalDescontos = descontos.reduce((sum, d) => sum + Number(d.valor), 0);

    // 8. Peso liquido final
    const pesoLiquidoFinal = pesoLiquidoSemDesconto - totalDescontos;

    if (pesoLiquidoFinal < 0) {
      throw new BadRequestException('Peso liquido final nao pode ser negativo');
    }

    // Atualiza ticket com os calculos
    await this.prisma.ticketPesagem.update({
      where: { id: ticketId },
      data: {
        statusOperacional: StatusOperacional.FECHADO,
        pesoBrutoApurado,
        pesoTaraApurada,
        pesoLiquidoSemDesconto,
        totalDescontos,
        pesoLiquidoFinal,
        fechadoEm: new Date(),
        observacao: dto.observacao || ticket.observacao,
      },
    });

    // Cria snapshot comercial se necessario
    if (ticket.modoComercial !== ModoComercial.DESABILITADO) {
      await this.criarSnapshotComercial(ticketId);
    }

    // Auditoria de fechamento
    await this.prisma.auditoria.create({
      data: {
        tenantId: ticket.tenantId, // RD5
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
        estadoNovo: JSON.stringify({
          statusOperacional: StatusOperacional.FECHADO,
          pesoBrutoApurado,
          pesoTaraApurada,
          pesoLiquidoFinal,
          totalDescontos,
        }),
        usuarioId: dto.usuarioId || null,
      },
    });

    // Decrementar contador de pesagens do trial (se aplicável)
    await this.decrementarPesagemTrial(ticket.unidadeId);

    return this.findOne(ticketId);
  }

  // ============================================================
  // CANCELAMENTO
  // ============================================================

  async cancelarTicket(ticketId: string, dto: CancelarTicketDto) {
    const ticket = await this.findOne(ticketId);

    // CANCELADO eh terminal
    if (ticket.statusOperacional === StatusOperacional.CANCELADO) {
      throw new BadRequestException('Ticket ja esta cancelado');
    }

    // FECHADO precisa de solicitacao de excecao aprovada
    if (ticket.statusOperacional === StatusOperacional.FECHADO) {
      throw new ForbiddenException(
        'Cancelamento de ticket fechado exige solicitacao de excecao aprovada',
      );
    }

    // EM_MANUTENCAO so pode ser cancelado pela propria manutencao
    if (ticket.statusOperacional === StatusOperacional.EM_MANUTENCAO) {
      throw new ForbiddenException(
        'Ticket em manutencao so pode ser cancelado pela propria manutencao',
      );
    }

    // Invalida logicamente as passagens pendentes
    await this.prisma.passagemPesagem.updateMany({
      where: { ticketId, statusPassagem: StatusPassagem.PENDENTE },
      data: { statusPassagem: StatusPassagem.INVALIDADA },
    });

    const updated = await this.transicionarEstado(
      ticketId,
      StatusOperacional.CANCELADO,
      dto.usuarioId,
      dto.motivo,
    );

    return updated;
  }

  // ============================================================
  // MANUTENCAO
  // ============================================================

  async solicitarManutencao(ticketId: string, motivo: string, usuarioId: string) {
    const ticket = await this.findOne(ticketId);

    if (ticket.statusOperacional !== StatusOperacional.FECHADO) {
      throw new BadRequestException('Manutencao so pode ser solicitada para ticket FECHADO');
    }

    // Verifica vinculo comercial
    if (
      ticket.statusComercial === StatusComercial.FATURADO ||
      ticket.statusComercial === StatusComercial.PARCIALMENTE_BAIXADO ||
      ticket.statusComercial === StatusComercial.BAIXADO
    ) {
      throw new ForbiddenException(
        'Ticket com vinculo comercial avancado nao pode sofrer manutencao sem compensacao',
      );
    }

    return this.transicionarEstado(ticketId, StatusOperacional.EM_MANUTENCAO, usuarioId, motivo);
  }

  async concluirManutencao(ticketId: string, usuarioId: string) {
    const ticket = await this.findOne(ticketId);

    if (ticket.statusOperacional !== StatusOperacional.EM_MANUTENCAO) {
      throw new BadRequestException('Ticket nao esta em manutencao');
    }

    return this.transicionarEstado(
      ticketId,
      StatusOperacional.FECHADO,
      usuarioId,
      'Manutencao concluida',
    );
  }

  // ============================================================
  // SNAPSHOT COMERCIAL
  // ============================================================

  private async criarSnapshotComercial(ticketId: string) {
    const ticket = await this.findOne(ticketId);
    const versao = (ticket.snapshotComercialVersao || 0) + 1;

    let valorUnitario: number | null = null;
    let valorTotal: number | null = null;

    if (ticket.pesoLiquidoFinal && ticket.modoComercial !== ModoComercial.DESABILITADO) {
      // Busca preco por produto + cliente
      const precoCliente = await this.prisma.tabelaPrecoProdutoCliente.findFirst({
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
        // Fallback: preco por produto
        const precoProduto = await this.prisma.tabelaPrecoProduto.findFirst({
          where: {
            produtoId: ticket.produtoId,
            ativo: true,
            vigenciaInicio: { lte: new Date() },
            OR: [{ vigenciaFim: null }, { vigenciaFim: { gte: new Date() } }],
          },
          orderBy: { prioridadeResolucao: 'desc' },
        });
        if (precoProduto) {
          valorUnitario = Number(precoProduto.valor);
        }
      }

      if (valorUnitario && ticket.pesoLiquidoFinal) {
        valorTotal = Number(ticket.pesoLiquidoFinal) * valorUnitario;
      }
    }

    await this.prisma.snapshotComercialTicket.create({
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
      await this.prisma.ticketPesagem.update({
        where: { id: ticketId },
        data: {
          snapshotComercialVersao: versao,
          valorUnitario,
          valorTotal,
        },
      });
    }
  }

  // ============================================================
  // HELPERS
  // ============================================================

  private async decrementarPesagemTrial(unidadeId: string) {
    const licenca = await this.prisma.licencaInstalacao.findFirst({
      where: { unidadeId },
    });
    if (!licenca) return;
    if (licenca.statusLicenca !== 'TRIAL') return;
    if (licenca.pesagensRestantesTrial === null || licenca.pesagensRestantesTrial === undefined)
      return;
    if (licenca.pesagensRestantesTrial <= 0) return;
    await this.prisma.licencaInstalacao.update({
      where: { id: licenca.id },
      data: { pesagensRestantesTrial: licenca.pesagensRestantesTrial - 1 },
    });
  }

  async reimprimir(ticketId: string, usuarioId?: string) {
    const ticket = await this.findOne(ticketId);

    // Apenas tickets FECHADOS podem ser reimpressos
    if (ticket.statusOperacional !== StatusOperacional.FECHADO) {
      throw new BadRequestException('Apenas tickets fechados podem ser reimpressos');
    }

    // Auditoria de reimpressao
    await this.prisma.auditoria.create({
      data: {
        tenantId: ticket.tenantId, // RD5
        entidade: 'ticket_pesagem',
        entidadeId: ticketId,
        evento: 'ticket.reimprimir',
        estadoAnterior: JSON.stringify({ statusOperacional: ticket.statusOperacional }),
        estadoNovo: JSON.stringify({ acao: 'reimpressao_solicitada' }),
        usuarioId: usuarioId || null,
      },
    });

    return {
      sucesso: true,
      ticketId,
      numero: ticket.numero,
      mensagem: 'Reimpressao registrada',
    };
  }

  async gerarBilheteIntermediario(ticketId: string): Promise<Buffer> {
    const ticket = await this.prisma.ticketPesagem.findUnique({
      where: { id: ticketId },
      ...ticketComRelacoesArgs,
    });
    if (!ticket) throw new NotFoundException('Ticket não encontrado');
    // Bilhete intermediário: usamos o template 1PF (A5) como base
    return gerarPdf('TICKET001', {
      ticket,
      empresa: ticket.unidade?.empresa,
      unidade: ticket.unidade,
    });
  }

  async getHistorico(ticketId: string) {
    await this.findOne(ticketId);
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
