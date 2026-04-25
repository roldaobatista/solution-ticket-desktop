import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { buildPaginated, resolvePaging } from '../common/dto/pagination.dto';

@Injectable()
export class FaturaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any) {
    const numero = await this.gerarNumero(data.tenantId);

    const fatura = await this.prisma.fatura.create({
      data: {
        numero,
        tenantId: data.tenantId,
        romaneioId: data.romaneioId || null,
        clienteId: data.clienteId,
        dataEmissao: new Date(data.dataEmissao),
        notaFiscal: data.notaFiscal || null,
        observacao: data.observacao || null,
        totalGeral: data.totalGeral,
      },
    });

    return this.findOne(fatura.id);
  }

  async findAll(tenantId: string, clienteId?: string, paging?: { page?: number; limit?: number }) {
    const where: any = { tenantId };
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

  async findOne(id: string) {
    const fatura = await this.prisma.fatura.findUnique({
      where: { id },
      include: {
        cliente: true,
        romaneio: true,
        pagamentos: { include: { formaPagamento: true } },
      },
    });
    if (!fatura) throw new NotFoundException('Fatura nao encontrada');
    return fatura;
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    return this.prisma.fatura.update({ where: { id }, data: { ...data } });
  }

  async registrarPagamento(faturaId: string, data: any) {
    const fatura = await this.findOne(faturaId);

    const pagamento = await this.prisma.pagamentoFatura.create({
      data: {
        faturaId,
        formaPagamentoId: data.formaPagamentoId,
        valor: data.valor,
        dataEmissao: new Date(data.dataEmissao),
        dataVencimento: data.dataVencimento ? new Date(data.dataVencimento) : null,
        numeroDocumento: data.numeroDocumento || null,
        observacao: data.observacao || null,
      },
    });

    // Atualiza status da fatura
    const totalPagamentos = await this.prisma.pagamentoFatura.aggregate({
      where: { faturaId },
      _sum: { valor: true },
    });

    const totalPago = Number(totalPagamentos._sum.valor || 0);
    const totalFatura = Number(fatura.totalGeral);

    let novoStatus = 'ABERTA';
    if (totalPago >= totalFatura) {
      novoStatus = 'BAIXADA';
    } else if (totalPago > 0) {
      novoStatus = 'PARCIAL';
    }

    await this.prisma.fatura.update({
      where: { id: faturaId },
      data: { status: novoStatus },
    });

    return pagamento;
  }

  async listarTipos(tenantId?: string) {
    const where: any = { ativo: true };
    if (tenantId) where.tenantId = tenantId;
    return this.prisma.tipoFatura.findMany({ where, orderBy: { descricao: 'asc' } });
  }

  async baixarPagamento(pagamentoId: string, usuarioId?: string) {
    const pagamento = await this.prisma.pagamentoFatura.findUnique({ where: { id: pagamentoId } });
    if (!pagamento) throw new NotFoundException('Pagamento nao encontrado');

    const updated = await this.prisma.pagamentoFatura.update({
      where: { id: pagamentoId },
      data: {
        status: 'BAIXADO',
        dataBaixa: new Date(),
        usuarioBaixa: usuarioId || null,
      } as any,
    });
    return updated;
  }

  private async gerarNumero(tenantId: string): Promise<string> {
    const count = await this.prisma.fatura.count({ where: { tenantId } });
    return `FAT-${String(count + 1).padStart(6, '0')}`;
  }
}
