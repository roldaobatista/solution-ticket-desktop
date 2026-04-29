import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { buildPaginated, resolvePaging } from '../common/dto/pagination.dto';
import { CreateFaturaDto } from './dto/create-fatura.dto';
import { UpdateFaturaDto } from './dto/update-fatura.dto';
import { RegistrarPagamentoDto } from './dto/registrar-pagamento.dto';

@Injectable()
export class FaturaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateFaturaDto & { tenantId?: string }, tenantId?: string) {
    const effectiveTenantId = tenantId ?? dto.tenantId!;
    await this.ensureClienteTenant(dto.clienteId, effectiveTenantId);
    if (dto.romaneioId) await this.ensureRomaneioTenant(dto.romaneioId, effectiveTenantId);
    const numero = await this.gerarNumero(effectiveTenantId);

    const fatura = await this.prisma.fatura.create({
      data: {
        numero,
        tenantId: effectiveTenantId,
        romaneioId: dto.romaneioId ?? null,
        clienteId: dto.clienteId,
        dataEmissao: new Date(dto.dataEmissao),
        notaFiscal: dto.notaFiscal ?? null,
        observacao: dto.observacao ?? null,
        totalGeral: dto.totalGeral,
      },
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

      const totalPagamentos = await tx.pagamentoFatura.aggregate({
        where: { faturaId },
        _sum: { valor: true },
      });
      const totalPago = Number(totalPagamentos._sum.valor || 0);
      const totalFatura = Number(fatura.totalGeral);

      let novoStatus = 'ABERTA';
      if (totalPago >= totalFatura) novoStatus = 'BAIXADA';
      else if (totalPago > 0) novoStatus = 'PARCIAL';

      await tx.fatura.update({ where: { id: faturaId, tenantId }, data: { status: novoStatus } });

      return pagamento;
    });
  }

  async listarTipos(tenantId?: string) {
    const where: Prisma.TipoFaturaWhereInput = { ativo: true };
    if (tenantId) where.tenantId = tenantId;
    return this.prisma.tipoFatura.findMany({ where, orderBy: { descricao: 'asc' } });
  }

  async baixarPagamento(pagamentoId: string, tenantId: string, usuarioId?: string) {
    const pagamento = await this.prisma.pagamentoFatura.findFirst({
      where: { id: pagamentoId, fatura: { tenantId } },
    });
    if (!pagamento) throw new NotFoundException('Pagamento nao encontrado');

    const updated = await this.prisma.pagamentoFatura.update({
      where: { id: pagamentoId },
      data: {
        status: 'BAIXADO',
        dataBaixa: new Date(),
        usuarioBaixa: usuarioId ?? null,
      },
    });
    return updated;
  }

  private async gerarNumero(tenantId: string): Promise<string> {
    const count = await this.prisma.fatura.count({ where: { tenantId } });
    return `FAT-${String(count + 1).padStart(6, '0')}`;
  }

  private async ensureClienteTenant(clienteId: string, tenantId: string) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: clienteId, tenantId },
      select: { id: true },
    });
    if (!cliente) throw new ForbiddenException('Cliente nao pertence ao tenant');
  }

  private async ensureRomaneioTenant(romaneioId: string, tenantId: string) {
    const romaneio = await this.prisma.romaneio.findUnique({
      where: { id: romaneioId, tenantId },
      select: { id: true },
    });
    if (!romaneio) throw new ForbiddenException('Romaneio nao pertence ao tenant');
  }
}
