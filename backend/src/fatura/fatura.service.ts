import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { buildPaginated, resolvePaging } from '../common/dto/pagination.dto';
import { CreateFaturaDto } from './dto/create-fatura.dto';
import { UpdateFaturaDto } from './dto/update-fatura.dto';
import { RegistrarPagamentoDto } from './dto/registrar-pagamento.dto';

@Injectable()
export class FaturaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateFaturaDto) {
    const numero = await this.gerarNumero(dto.tenantId);

    const fatura = await this.prisma.fatura.create({
      data: {
        numero,
        tenantId: dto.tenantId,
        romaneioId: dto.romaneioId ?? null,
        clienteId: dto.clienteId,
        dataEmissao: new Date(dto.dataEmissao),
        notaFiscal: dto.notaFiscal ?? null,
        observacao: dto.observacao ?? null,
        totalGeral: dto.totalGeral,
      },
    });

    return this.findOne(fatura.id);
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

  async update(id: string, dto: UpdateFaturaDto) {
    await this.findOne(id);
    const data: Prisma.FaturaUpdateInput = {};
    if (dto.notaFiscal !== undefined) data.notaFiscal = dto.notaFiscal;
    if (dto.observacao !== undefined) data.observacao = dto.observacao;
    if (dto.totalGeral !== undefined) data.totalGeral = dto.totalGeral;
    if (dto.dataEmissao !== undefined) data.dataEmissao = new Date(dto.dataEmissao);
    return this.prisma.fatura.update({ where: { id }, data });
  }

  async registrarPagamento(faturaId: string, dto: RegistrarPagamentoDto) {
    // B4: encapsula create-pagamento + recalculo-total + update-status numa
    // unica transacao. Sem isto, dois pagamentos concorrentes podiam ler
    // soma desatualizada e gravar status divergente do total real.
    return this.prisma.$transaction(async (tx) => {
      const fatura = await tx.fatura.findUnique({ where: { id: faturaId } });
      if (!fatura) throw new NotFoundException('Fatura nao encontrada');

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

      await tx.fatura.update({ where: { id: faturaId }, data: { status: novoStatus } });

      return pagamento;
    });
  }

  async listarTipos(tenantId?: string) {
    const where: Prisma.TipoFaturaWhereInput = { ativo: true };
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
        usuarioBaixa: usuarioId ?? null,
      },
    });
    return updated;
  }

  private async gerarNumero(tenantId: string): Promise<string> {
    const count = await this.prisma.fatura.count({ where: { tenantId } });
    return `FAT-${String(count + 1).padStart(6, '0')}`;
  }
}
