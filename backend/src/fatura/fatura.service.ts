import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { buildPaginated, resolvePaging } from '../common/dto/pagination.dto';
import { StatusComercial, StatusOperacional } from '../constants/enums';
import { CreateFaturaDto } from './dto/create-fatura.dto';
import { UpdateFaturaDto } from './dto/update-fatura.dto';
import { RegistrarPagamentoDto } from './dto/registrar-pagamento.dto';

const FATURA_STATUS = {
  ABERTA: 'ABERTA',
  PARCIAL: 'PARCIAL',
  BAIXADA: 'BAIXADA',
  CANCELADA: 'CANCELADA',
} as const;
type FaturaStatus = (typeof FATURA_STATUS)[keyof typeof FATURA_STATUS];

const ROMANEIO_STATUS = {
  FATURADO: 'FATURADO',
  PARCIALMENTE_BAIXADO: 'PARCIALMENTE_BAIXADO',
  BAIXADO: 'BAIXADO',
} as const;

@Injectable()
export class FaturaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateFaturaDto & { tenantId?: string }, tenantId?: string) {
    const effectiveTenantId = tenantId ?? dto.tenantId!;
    const numero = await this.gerarNumero(effectiveTenantId);

    const fatura = await this.prisma.$transaction(async (tx) => {
      await this.ensureClienteTenant(dto.clienteId, effectiveTenantId, tx);
      const romaneioId =
        dto.romaneioId ??
        (dto.ticketIds?.length
          ? await this.criarRomaneioParaFaturaTx(tx, dto, effectiveTenantId)
          : undefined);
      const romaneio = romaneioId
        ? await this.ensureRomaneioTenant(romaneioId, effectiveTenantId, tx)
        : null;

      const criada = await tx.fatura.create({
        data: {
          numero,
          tenantId: effectiveTenantId,
          romaneioId: romaneioId ?? null,
          clienteId: dto.clienteId,
          dataEmissao: new Date(dto.dataEmissao),
          notaFiscal: dto.notaFiscal ?? null,
          observacao: dto.observacao ?? null,
          totalGeral: dto.totalGeral,
        },
      });

      if (romaneio) {
        await tx.romaneio.update({
          where: { id: romaneio.id, tenantId: effectiveTenantId },
          data: { status: ROMANEIO_STATUS.FATURADO },
        });
        await tx.ticketPesagem.updateMany({
          where: {
            id: { in: romaneio.itens.map((item) => item.ticketId) },
            tenantId: effectiveTenantId,
          },
          data: { statusComercial: 'FATURADO' },
        });
      }

      return criada;
    });

    return this.findOne(fatura.id, effectiveTenantId);
  }

  async findAll(tenantId: string, clienteId?: string, paging?: { page?: number; limit?: number }) {
    const where: Prisma.FaturaWhereInput = { tenantId };
    if (clienteId) where.clienteId = clienteId;
    const { page, limit, skip } = resolvePaging(paging ?? {});

    const [data, total] = await Promise.all([
      this.prisma.fatura.findMany({
        where,
        skip,
        take: limit,
        include: {
          cliente: { select: { id: true, razaoSocial: true } },
          romaneio: { select: { numero: true } },
          pagamentos: true,
          _count: { select: { pagamentos: true } },
        },
        orderBy: { criadoEm: 'desc' },
      }),
      this.prisma.fatura.count({ where }),
    ]);

    return buildPaginated(data, total, page, limit);
  }

  async findOne(id: string, tenantId?: string) {
    const fatura = await this.prisma.fatura.findUnique({
      where: tenantId ? { id, tenantId } : { id },
      include: {
        cliente: true,
        romaneio: true,
        pagamentos: { include: { formaPagamento: true } },
      },
    });
    if (!fatura) throw new NotFoundException('Fatura nao encontrada');
    return fatura;
  }

  async update(id: string, tenantId: string, dto: UpdateFaturaDto) {
    await this.findOne(id, tenantId);
    const data: Prisma.FaturaUpdateInput = {};
    if (dto.notaFiscal !== undefined) data.notaFiscal = dto.notaFiscal;
    if (dto.observacao !== undefined) data.observacao = dto.observacao;
    if (dto.totalGeral !== undefined) data.totalGeral = dto.totalGeral;
    if (dto.dataEmissao !== undefined) data.dataEmissao = new Date(dto.dataEmissao);
    return this.prisma.fatura.update({ where: { id, tenantId }, data });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.fatura.delete({ where: { id, tenantId } });
  }

  async cancelar(id: string, tenantId: string, motivo: string, usuarioId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const fatura = await tx.fatura.findUnique({
        where: { id, tenantId },
        include: { romaneio: { include: { itens: { select: { ticketId: true } } } } },
      });
      if (!fatura) throw new NotFoundException('Fatura nao encontrada');
      if (fatura.status === FATURA_STATUS.BAIXADA) {
        throw new ForbiddenException('Fatura baixada exige estorno antes do cancelamento');
      }
      if (fatura.status === FATURA_STATUS.CANCELADA) return fatura;

      const updated = await tx.fatura.update({
        where: { id, tenantId },
        data: {
          status: FATURA_STATUS.CANCELADA,
          observacao: [fatura.observacao, `Cancelada: ${motivo}`].filter(Boolean).join('\n'),
        },
      });

      if (fatura.romaneioId && fatura.romaneio?.itens.length) {
        await tx.romaneio.update({
          where: { id: fatura.romaneioId, tenantId },
          data: { status: 'ABERTO' },
        });
        await tx.ticketPesagem.updateMany({
          where: { id: { in: fatura.romaneio.itens.map((i) => i.ticketId) }, tenantId },
          data: { statusComercial: StatusComercial.NAO_ROMANEADO },
        });
      }

      await tx.auditoria.create({
        data: {
          entidade: 'fatura',
          entidadeId: id,
          evento: 'fatura.cancelada',
          tenantId,
          usuarioId: usuarioId || null,
          motivo,
          estadoAnterior: JSON.stringify({ status: fatura.status }),
          estadoNovo: JSON.stringify({ status: FATURA_STATUS.CANCELADA }),
        },
      });
      return updated;
    });
  }

  async registrarPagamento(faturaId: string, tenantId: string, dto: RegistrarPagamentoDto) {
    // B4: encapsula create-pagamento + recalculo-total + update-status numa
    // unica transacao. Sem isto, dois pagamentos concorrentes podiam ler
    // soma desatualizada e gravar status divergente do total real.
    return this.prisma.$transaction(async (tx) => {
      const fatura = await tx.fatura.findUnique({ where: { id: faturaId, tenantId } });
      if (!fatura) throw new NotFoundException('Fatura nao encontrada');
      const formaPagamento = await tx.formaPagamento.findUnique({
        where: { id: dto.formaPagamentoId, tenantId },
        select: { id: true },
      });
      if (!formaPagamento)
        throw new ForbiddenException('Forma de pagamento nao pertence ao tenant');

      const pagamento = await tx.pagamentoFatura.create({
        data: {
          faturaId,
          formaPagamentoId: dto.formaPagamentoId,
          valor: dto.valor,
          dataEmissao: new Date(dto.dataEmissao),
          dataVencimento: dto.dataVencimento ? new Date(dto.dataVencimento) : null,
          numeroDocumento: dto.numeroDocumento ?? null,
          observacao: dto.observacao ?? null,
        },
      });

      await this.recalcularStatusFaturaTx(tx, faturaId, tenantId, Number(fatura.totalGeral));

      return pagamento;
    });
  }

  async listarTipos(tenantId?: string) {
    const where: Prisma.TipoFaturaWhereInput = { ativo: true };
    if (tenantId) where.tenantId = tenantId;
    return this.prisma.tipoFatura.findMany({ where, orderBy: { descricao: 'asc' } });
  }

  async baixarPagamento(pagamentoId: string, tenantId: string, usuarioId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const pagamento = await tx.pagamentoFatura.findFirst({
        where: { id: pagamentoId, fatura: { tenantId } },
        include: {
          fatura: {
            include: {
              romaneio: { include: { itens: { select: { ticketId: true } } } },
            },
          },
        },
      });
      if (!pagamento) throw new NotFoundException('Pagamento nao encontrado');

      const updated = await tx.pagamentoFatura.update({
        where: { id: pagamentoId },
        data: {
          status: 'BAIXADO',
          dataBaixa: new Date(),
          usuarioBaixa: usuarioId ?? null,
        },
      });

      const novoStatus = await this.recalcularStatusFaturaTx(
        tx,
        pagamento.faturaId,
        tenantId,
        Number(pagamento.fatura.totalGeral),
      );
      await this.propagateStatusComercialTx(tx, pagamento.fatura, tenantId, novoStatus);
      return updated;
    });
  }

  private async gerarNumero(tenantId: string): Promise<string> {
    const count = await this.prisma.fatura.count({ where: { tenantId } });
    return `FAT-${String(count + 1).padStart(6, '0')}`;
  }

  private async ensureClienteTenant(
    clienteId: string,
    tenantId: string,
    tx: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    const cliente = await tx.cliente.findUnique({
      where: { id: clienteId, tenantId },
      select: { id: true },
    });
    if (!cliente) throw new ForbiddenException('Cliente nao pertence ao tenant');
  }

  private async ensureRomaneioTenant(
    romaneioId: string,
    tenantId: string,
    tx: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    const romaneio = await tx.romaneio.findUnique({
      where: { id: romaneioId, tenantId },
      include: { itens: { select: { ticketId: true } } },
    });
    if (!romaneio) throw new ForbiddenException('Romaneio nao pertence ao tenant');
    return romaneio;
  }

  private async recalcularStatusFaturaTx(
    tx: Prisma.TransactionClient,
    faturaId: string,
    tenantId: string,
    totalFatura: number,
  ) {
    const totalPagamentos = await tx.pagamentoFatura.aggregate({
      where: { faturaId, status: 'BAIXADO' },
      _sum: { valor: true },
    });
    const totalPago = Number(totalPagamentos._sum.valor || 0);

    let novoStatus: FaturaStatus = FATURA_STATUS.ABERTA;
    if (totalPago >= totalFatura) novoStatus = FATURA_STATUS.BAIXADA;
    else if (totalPago > 0) novoStatus = FATURA_STATUS.PARCIAL;

    await tx.fatura.update({ where: { id: faturaId, tenantId }, data: { status: novoStatus } });
    return novoStatus;
  }

  private async propagateStatusComercialTx(
    tx: Prisma.TransactionClient,
    fatura: {
      romaneioId: string | null;
      romaneio?: { itens: Array<{ ticketId: string }> } | null;
    },
    tenantId: string,
    statusFatura: string,
  ) {
    if (!fatura.romaneioId || !fatura.romaneio) return;
    if (statusFatura === FATURA_STATUS.ABERTA) return;

    const statusComercial =
      statusFatura === FATURA_STATUS.BAIXADA ? 'BAIXADO' : 'PARCIALMENTE_BAIXADO';
    const statusRomaneio =
      statusFatura === FATURA_STATUS.BAIXADA
        ? ROMANEIO_STATUS.BAIXADO
        : ROMANEIO_STATUS.PARCIALMENTE_BAIXADO;
    const ticketIds = fatura.romaneio.itens.map((item) => item.ticketId);

    await tx.romaneio.update({
      where: { id: fatura.romaneioId, tenantId },
      data: { status: statusRomaneio },
    });
    if (ticketIds.length) {
      await tx.ticketPesagem.updateMany({
        where: { id: { in: ticketIds }, tenantId },
        data: { statusComercial },
      });
    }
  }

  private async criarRomaneioParaFaturaTx(
    tx: Prisma.TransactionClient,
    dto: CreateFaturaDto,
    tenantId: string,
  ) {
    const ticketIds = dto.ticketIds ?? [];
    const tickets = await tx.ticketPesagem.findMany({
      where: { id: { in: ticketIds }, tenantId, clienteId: dto.clienteId },
    });

    if (tickets.length !== ticketIds.length) {
      throw new ForbiddenException('Um ou mais tickets nao pertencem ao tenant/cliente da fatura');
    }

    let pesoTotal = 0;
    const itens: Prisma.ItemRomaneioCreateManyInput[] = [];
    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      if (ticket.statusOperacional !== StatusOperacional.FECHADO) {
        throw new ForbiddenException(`Ticket ${ticket.numero} precisa estar FECHADO`);
      }
      if (ticket.statusComercial !== StatusComercial.NAO_ROMANEADO) {
        throw new ForbiddenException(`Ticket ${ticket.numero} ja possui vinculo comercial`);
      }
      if (!ticket.pesoLiquidoFinal) {
        throw new ForbiddenException(`Ticket ${ticket.numero} nao possui peso liquido final`);
      }
      pesoTotal += Number(ticket.pesoLiquidoFinal);
      itens.push({
        romaneioId: '',
        ticketId: ticket.id,
        sequencia: i + 1,
        peso: ticket.pesoLiquidoFinal,
      });
    }

    const count = await tx.romaneio.count({ where: { tenantId } });
    const romaneio = await tx.romaneio.create({
      data: {
        numero: `ROM-${String(count + 1).padStart(6, '0')}`,
        tenantId,
        clienteId: dto.clienteId,
        periodoInicio: new Date(dto.dataEmissao),
        periodoFim: new Date(dto.dataEmissao),
        observacao: dto.observacao ?? null,
        pesoTotal,
      },
    });

    await tx.itemRomaneio.createMany({
      data: itens.map((item) => ({ ...item, romaneioId: romaneio.id })),
    });
    const updated = await tx.ticketPesagem.updateMany({
      where: {
        id: { in: ticketIds },
        tenantId,
        statusComercial: StatusComercial.NAO_ROMANEADO,
      },
      data: { statusComercial: StatusComercial.ROMANEADO },
    });
    if (updated.count !== ticketIds.length) {
      throw new ForbiddenException('Um ou mais tickets foram vinculados por outro processo');
    }

    return romaneio.id;
  }
}
