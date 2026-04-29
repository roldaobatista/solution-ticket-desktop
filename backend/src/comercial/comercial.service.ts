import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit');
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateTabelaPrecoProdutoDto,
  UpdateTabelaPrecoProdutoDto,
} from './dto/create-tabela-preco-produto.dto';
import {
  CreateTabelaPrecoClienteDto,
  UpdateTabelaPrecoClienteDto,
} from './dto/create-tabela-preco-cliente.dto';
import { CreateTabelaFreteDto, UpdateTabelaFreteDto } from './dto/create-tabela-frete.dto';
import { CreateTabelaUmidadeDto, UpdateTabelaUmidadeDto } from './dto/create-tabela-umidade.dto';

interface ExtratoMovimento {
  tipo: 'FATURA' | 'PAGAMENTO';
  data: Date;
  descricao: string;
  valor: number;
  documento: string | null;
}

@Injectable()
export class ComercialService {
  constructor(private readonly prisma: PrismaService) {}

  // Tabelas de Preco por Produto
  async createTabelaPrecoProduto(dto: CreateTabelaPrecoProdutoDto, tenantId: string) {
    await this.ensureProdutoTenant(dto.produtoId, tenantId);
    return this.prisma.tabelaPrecoProduto.create({
      data: {
        tenantId,
        produtoId: dto.produtoId,
        valor: dto.valor,
        unidade: dto.unidade,
        vigenciaInicio: new Date(dto.vigenciaInicio),
        vigenciaFim: dto.vigenciaFim ? new Date(dto.vigenciaFim) : null,
        prioridadeResolucao: dto.prioridadeResolucao ?? 0,
        ativo: dto.ativo ?? true,
      },
    });
  }

  async findAllTabelaPrecoProduto(tenantId: string, produtoId?: string) {
    const where: Prisma.TabelaPrecoProdutoWhereInput = { tenantId };
    if (produtoId) where.produtoId = produtoId;
    return this.prisma.tabelaPrecoProduto.findMany({
      where,
      include: { produto: { select: { descricao: true } } },
      orderBy: { vigenciaInicio: 'desc' },
    });
  }

  async updateTabelaPrecoProduto(id: string, dto: UpdateTabelaPrecoProdutoDto, tenantId?: string) {
    const atual = await this.prisma.tabelaPrecoProduto.findUnique({
      where: tenantId ? { id, tenantId } : { id },
    });
    const data: Prisma.TabelaPrecoProdutoUpdateInput = {};
    if (dto.valor !== undefined) data.valor = dto.valor;
    if (dto.unidade !== undefined) data.unidade = dto.unidade;
    if (dto.vigenciaInicio !== undefined) data.vigenciaInicio = new Date(dto.vigenciaInicio);
    if (dto.vigenciaFim !== undefined)
      data.vigenciaFim = dto.vigenciaFim ? new Date(dto.vigenciaFim) : null;
    if (dto.prioridadeResolucao !== undefined) data.prioridadeResolucao = dto.prioridadeResolucao;
    if (dto.ativo !== undefined) data.ativo = dto.ativo;

    const result = await this.prisma.tabelaPrecoProduto.update({
      where: tenantId ? { id, tenantId } : { id },
      data,
    });
    if (atual && dto.valor !== undefined && Number(atual.valor) !== Number(dto.valor)) {
      await this.prisma.historicoPreco.create({
        data: {
          tenantId: atual.tenantId,
          produtoId: atual.produtoId,
          tipo: 'PRODUTO',
          valorAntigo: atual.valor,
          valorNovo: dto.valor,
          usuarioId: dto.usuarioId ?? null,
        },
      });
    }
    return result;
  }

  async deleteTabelaPrecoProduto(id: string) {
    return this.prisma.tabelaPrecoProduto.update({ where: { id }, data: { ativo: false } });
  }

  // Tabelas de Preco por Produto + Cliente
  async createTabelaPrecoCliente(dto: CreateTabelaPrecoClienteDto, tenantId: string) {
    await Promise.all([
      this.ensureProdutoTenant(dto.produtoId, tenantId),
      this.ensureClienteTenant(dto.clienteId, tenantId),
      dto.destinoId ? this.ensureDestinoTenant(dto.destinoId, tenantId) : Promise.resolve(),
    ]);
    return this.prisma.tabelaPrecoProdutoCliente.create({
      data: {
        tenantId,
        produtoId: dto.produtoId,
        clienteId: dto.clienteId,
        destinoId: dto.destinoId ?? null,
        valor: dto.valor,
        unidade: dto.unidade,
        vigenciaInicio: new Date(dto.vigenciaInicio),
        vigenciaFim: dto.vigenciaFim ? new Date(dto.vigenciaFim) : null,
        prioridadeResolucao: dto.prioridadeResolucao ?? 0,
        ativo: dto.ativo ?? true,
      },
    });
  }

  async findAllTabelaPrecoCliente(tenantId: string, clienteId?: string, produtoId?: string) {
    const where: Prisma.TabelaPrecoProdutoClienteWhereInput = { tenantId };
    if (clienteId) where.clienteId = clienteId;
    if (produtoId) where.produtoId = produtoId;
    return this.prisma.tabelaPrecoProdutoCliente.findMany({
      where,
      include: {
        produto: { select: { descricao: true } },
        cliente: { select: { razaoSocial: true } },
      },
      orderBy: { vigenciaInicio: 'desc' },
    });
  }

  async updateTabelaPrecoCliente(id: string, dto: UpdateTabelaPrecoClienteDto, tenantId?: string) {
    const atual = await this.prisma.tabelaPrecoProdutoCliente.findUnique({
      where: tenantId ? { id, tenantId } : { id },
    });
    const data: Prisma.TabelaPrecoProdutoClienteUpdateInput = {};
    if (dto.valor !== undefined) data.valor = dto.valor;
    if (dto.unidade !== undefined) data.unidade = dto.unidade;
    if (dto.vigenciaInicio !== undefined) data.vigenciaInicio = new Date(dto.vigenciaInicio);
    if (dto.vigenciaFim !== undefined)
      data.vigenciaFim = dto.vigenciaFim ? new Date(dto.vigenciaFim) : null;
    if (dto.prioridadeResolucao !== undefined) data.prioridadeResolucao = dto.prioridadeResolucao;
    if (dto.ativo !== undefined) data.ativo = dto.ativo;

    const result = await this.prisma.tabelaPrecoProdutoCliente.update({
      where: tenantId ? { id, tenantId } : { id },
      data,
    });
    if (atual && dto.valor !== undefined && Number(atual.valor) !== Number(dto.valor)) {
      await this.prisma.historicoPreco.create({
        data: {
          tenantId: atual.tenantId,
          produtoId: atual.produtoId,
          clienteId: atual.clienteId,
          tipo: 'PRODUTO_CLIENTE',
          valorAntigo: atual.valor,
          valorNovo: dto.valor,
          usuarioId: dto.usuarioId ?? null,
        },
      });
    }
    return result;
  }

  async getSaldos(tenantId: string, clienteId?: string) {
    const where: Prisma.FaturaWhereInput = { tenantId };
    if (clienteId) where.clienteId = clienteId;

    const faturas = await this.prisma.fatura.findMany({
      where,
      include: {
        cliente: { select: { id: true, razaoSocial: true } },
        pagamentos: true,
      },
    });

    const mapa = new Map<
      string,
      {
        clienteId: string;
        clienteNome: string;
        totalFaturado: number;
        totalPago: number;
        saldo: number;
      }
    >();
    for (const f of faturas) {
      const cid = f.clienteId;
      const nome = f.cliente?.razaoSocial ?? '';
      const totalPago = f.pagamentos.reduce((s, p) => s + Number(p.valor || 0), 0);
      const prev = mapa.get(cid) ?? {
        clienteId: cid,
        clienteNome: nome,
        totalFaturado: 0,
        totalPago: 0,
        saldo: 0,
      };
      prev.totalFaturado += Number(f.totalGeral || 0);
      prev.totalPago += totalPago;
      prev.saldo = prev.totalFaturado - prev.totalPago;
      mapa.set(cid, prev);
    }
    return Array.from(mapa.values());
  }

  async getExtrato(clienteId: string, tenantId: string, inicio?: string, fim?: string) {
    const where: Prisma.FaturaWhereInput = { clienteId, tenantId };
    if (inicio || fim) {
      where.dataEmissao = {};
      if (inicio) where.dataEmissao.gte = new Date(inicio);
      if (fim) where.dataEmissao.lte = new Date(fim);
    }

    const faturas = await this.prisma.fatura.findMany({
      where,
      include: { pagamentos: { include: { formaPagamento: true } } },
      orderBy: { dataEmissao: 'asc' },
    });

    const movimentos: ExtratoMovimento[] = [];
    for (const f of faturas) {
      movimentos.push({
        tipo: 'FATURA',
        data: f.dataEmissao,
        descricao: `Fatura ${f.numero}`,
        valor: Number(f.totalGeral || 0),
        documento: f.numero,
      });
      for (const p of f.pagamentos) {
        movimentos.push({
          tipo: 'PAGAMENTO',
          data: p.dataEmissao,
          descricao: `Pagamento - ${p.formaPagamento?.descricao ?? ''}`,
          valor: -Number(p.valor || 0),
          documento: p.numeroDocumento ?? null,
        });
      }
    }

    movimentos.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

    let saldo = 0;
    return movimentos.map((m) => {
      saldo += m.valor;
      return { ...m, saldo };
    });
  }

  /**
   * Onda 5.4: extrato em PDF (paridade com PesoLog).
   * Reaproveita getExtrato para coletar movimentos e gera PDF com pdfkit.
   * Layout simples: cabecalho com cliente e periodo + tabela de movimentos
   * + linha de saldo final.
   */
  async gerarExtratoPdf(
    clienteId: string,
    tenantId: string,
    inicio?: string,
    fim?: string,
  ): Promise<Buffer> {
    const cliente = await this.prisma.cliente.findFirst({ where: { id: clienteId, tenantId } });
    if (!cliente) throw new NotFoundException('Cliente nao encontrado');

    const movimentos = await this.getExtrato(clienteId, tenantId, inicio, fim);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Cabecalho
      doc.fontSize(16).text('Extrato de Cliente', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10);
      doc.text(
        `Cliente: ${cliente.razaoSocial}${cliente.documento ? ` (${cliente.documento})` : ''}`,
      );
      const periodoInicio =
        inicio ||
        (movimentos[0]?.data ? new Date(movimentos[0].data).toLocaleDateString('pt-BR') : '-');
      const periodoFim =
        fim ||
        (movimentos[movimentos.length - 1]?.data
          ? new Date(movimentos[movimentos.length - 1].data).toLocaleDateString('pt-BR')
          : '-');
      doc.text(`Periodo: ${periodoInicio} a ${periodoFim}`);
      doc.moveDown(1);

      // Cabecalho da tabela
      const colData = 40;
      const colTipo = 110;
      const colDesc = 175;
      const colDoc = 360;
      const colValor = 430;
      const colSaldo = 500;
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('Data', colData, doc.y, { continued: false });
      const linhaY = doc.y - 12;
      doc.text('Tipo', colTipo, linhaY);
      doc.text('Descricao', colDesc, linhaY);
      doc.text('Documento', colDoc, linhaY);
      doc.text('Valor', colValor, linhaY, { width: 60, align: 'right' });
      doc.text('Saldo', colSaldo, linhaY, { width: 60, align: 'right' });
      doc.font('Helvetica').moveDown(0.5);
      doc.moveTo(40, doc.y).lineTo(560, doc.y).stroke();
      doc.moveDown(0.3);

      // Linhas
      const fmt = (v: number) =>
        v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      for (const m of movimentos) {
        const y = doc.y;
        doc.text(new Date(m.data).toLocaleDateString('pt-BR'), colData, y, { width: 65 });
        doc.text(m.tipo, colTipo, y, { width: 60 });
        doc.text(m.descricao, colDesc, y, { width: 180 });
        doc.text(m.documento || '-', colDoc, y, { width: 65 });
        doc.text(fmt(m.valor), colValor, y, { width: 60, align: 'right' });
        doc.text(fmt(m.saldo), colSaldo, y, { width: 60, align: 'right' });
        doc.moveDown(0.5);
      }

      if (movimentos.length === 0) {
        doc.moveDown(1).text('Nenhuma movimentacao no periodo.', { align: 'center' });
      } else {
        doc.moveDown(0.5);
        doc.moveTo(40, doc.y).lineTo(560, doc.y).stroke();
        doc.moveDown(0.5);
        const saldoFinal = movimentos[movimentos.length - 1].saldo;
        doc
          .font('Helvetica-Bold')
          .text(`Saldo final: R$ ${fmt(saldoFinal)}`, 40, doc.y, { align: 'right' });
      }

      doc.end();
    });
  }

  async getHistoricoPreco(tenantId: string, produtoId?: string, clienteId?: string) {
    const where: Prisma.HistoricoPrecoWhereInput = { tenantId };
    if (produtoId) where.produtoId = produtoId;
    if (clienteId) where.clienteId = clienteId;

    return this.prisma.historicoPreco.findMany({
      where,
      orderBy: { ocorridoEm: 'desc' },
    });
  }

  // Tabelas de Frete
  async createTabelaFrete(dto: CreateTabelaFreteDto, tenantId: string) {
    await Promise.all([
      dto.produtoId ? this.ensureProdutoTenant(dto.produtoId, tenantId) : Promise.resolve(),
      dto.clienteId ? this.ensureClienteTenant(dto.clienteId, tenantId) : Promise.resolve(),
      dto.destinoId ? this.ensureDestinoTenant(dto.destinoId, tenantId) : Promise.resolve(),
    ]);
    return this.prisma.tabelaFrete.create({
      data: {
        tenantId,
        produtoId: dto.produtoId ?? null,
        clienteId: dto.clienteId ?? null,
        destinoId: dto.destinoId ?? null,
        faixaPesoInicial: dto.faixaPesoInicial ?? null,
        faixaPesoFinal: dto.faixaPesoFinal ?? null,
        valor: dto.valor,
        vigenciaInicio: new Date(dto.vigenciaInicio),
        vigenciaFim: dto.vigenciaFim ? new Date(dto.vigenciaFim) : null,
        prioridadeResolucao: dto.prioridadeResolucao ?? 0,
        ativo: dto.ativo ?? true,
      },
    });
  }

  async findAllTabelaFrete(tenantId: string) {
    return this.prisma.tabelaFrete.findMany({
      where: { tenantId },
      include: {
        produto: { select: { descricao: true } },
        destino: { select: { descricao: true } },
      },
      orderBy: { vigenciaInicio: 'desc' },
    });
  }

  async updateTabelaFrete(id: string, dto: UpdateTabelaFreteDto, tenantId?: string) {
    const data: Prisma.TabelaFreteUpdateInput = {};
    if (dto.faixaPesoInicial !== undefined) data.faixaPesoInicial = dto.faixaPesoInicial;
    if (dto.faixaPesoFinal !== undefined) data.faixaPesoFinal = dto.faixaPesoFinal;
    if (dto.valor !== undefined) data.valor = dto.valor;
    if (dto.vigenciaInicio !== undefined) data.vigenciaInicio = new Date(dto.vigenciaInicio);
    if (dto.vigenciaFim !== undefined)
      data.vigenciaFim = dto.vigenciaFim ? new Date(dto.vigenciaFim) : null;
    if (dto.prioridadeResolucao !== undefined) data.prioridadeResolucao = dto.prioridadeResolucao;
    if (dto.ativo !== undefined) data.ativo = dto.ativo;
    return this.prisma.tabelaFrete.update({
      where: tenantId ? { id, tenantId } : { id },
      data,
    });
  }

  // Tabelas de Umidade
  async createTabelaUmidade(dto: CreateTabelaUmidadeDto, tenantId: string) {
    await this.ensureProdutoTenant(dto.produtoId, tenantId);
    return this.prisma.tabelaUmidade.create({
      data: {
        tenantId,
        produtoId: dto.produtoId,
        faixaInicial: dto.faixaInicial,
        faixaFinal: dto.faixaFinal,
        descontoPercentual: dto.descontoPercentual,
        vigenciaInicio: new Date(dto.vigenciaInicio),
        vigenciaFim: dto.vigenciaFim ? new Date(dto.vigenciaFim) : null,
        ativo: dto.ativo ?? true,
      },
    });
  }

  async findAllTabelaUmidade(tenantId: string, produtoId?: string) {
    const where: Prisma.TabelaUmidadeWhereInput = { tenantId };
    if (produtoId) where.produtoId = produtoId;
    return this.prisma.tabelaUmidade.findMany({
      where,
      include: { produto: { select: { descricao: true } } },
      orderBy: { faixaInicial: 'asc' },
    });
  }

  async updateTabelaUmidade(id: string, dto: UpdateTabelaUmidadeDto, tenantId?: string) {
    const data: Prisma.TabelaUmidadeUpdateInput = {};
    if (dto.faixaInicial !== undefined) data.faixaInicial = dto.faixaInicial;
    if (dto.faixaFinal !== undefined) data.faixaFinal = dto.faixaFinal;
    if (dto.descontoPercentual !== undefined) data.descontoPercentual = dto.descontoPercentual;
    if (dto.vigenciaInicio !== undefined) data.vigenciaInicio = new Date(dto.vigenciaInicio);
    if (dto.vigenciaFim !== undefined)
      data.vigenciaFim = dto.vigenciaFim ? new Date(dto.vigenciaFim) : null;
    if (dto.ativo !== undefined) data.ativo = dto.ativo;
    return this.prisma.tabelaUmidade.update({
      where: tenantId ? { id, tenantId } : { id },
      data,
    });
  }

  // Snapshot comercial de ticket
  async getSnapshot(ticketId: string, tenantId: string) {
    return this.prisma.snapshotComercialTicket.findMany({
      where: { ticketId, ticket: { tenantId } },
      orderBy: { versaoSnapshot: 'desc' },
    });
  }

  private async ensureProdutoTenant(produtoId: string, tenantId: string) {
    const produto = await this.prisma.produto.findFirst({
      where: { id: produtoId, tenantId },
      select: { id: true },
    });
    if (!produto) throw new ForbiddenException('Produto nao pertence ao tenant');
  }

  private async ensureClienteTenant(clienteId: string, tenantId: string) {
    const cliente = await this.prisma.cliente.findFirst({
      where: { id: clienteId, tenantId },
      select: { id: true },
    });
    if (!cliente) throw new ForbiddenException('Cliente nao pertence ao tenant');
  }

  private async ensureDestinoTenant(destinoId: string, tenantId: string) {
    const destino = await this.prisma.destino.findFirst({
      where: { id: destinoId, tenantId },
      select: { id: true },
    });
    if (!destino) throw new ForbiddenException('Destino nao pertence ao tenant');
  }
}
