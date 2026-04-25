import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ComercialService {
  constructor(private readonly prisma: PrismaService) {}

  // Tabelas de Preco por Produto
  async createTabelaPrecoProduto(data: any) {
    return this.prisma.tabelaPrecoProduto.create({ data });
  }

  async findAllTabelaPrecoProduto(tenantId: string, produtoId?: string) {
    const where: any = { tenantId };
    if (produtoId) where.produtoId = produtoId;
    return this.prisma.tabelaPrecoProduto.findMany({
      where,
      include: { produto: { select: { descricao: true } } },
      orderBy: { vigenciaInicio: 'desc' },
    });
  }

  async updateTabelaPrecoProduto(id: string, data: any) {
    const atual = await this.prisma.tabelaPrecoProduto.findUnique({ where: { id } });
    const result = await this.prisma.tabelaPrecoProduto.update({ where: { id }, data });
    if (atual && data.valor !== undefined && Number(atual.valor) !== Number(data.valor)) {
      await this.prisma.historicoPreco.create({
        data: {
          tenantId: atual.tenantId,
          produtoId: atual.produtoId,
          tipo: 'PRODUTO',
          valorAntigo: atual.valor,
          valorNovo: data.valor,
          usuarioId: data.usuarioId || null,
        },
      });
    }
    return result;
  }

  async deleteTabelaPrecoProduto(id: string) {
    return this.prisma.tabelaPrecoProduto.update({ where: { id }, data: { ativo: false } });
  }

  // Tabelas de Preco por Produto + Cliente
  async createTabelaPrecoCliente(data: any) {
    return this.prisma.tabelaPrecoProdutoCliente.create({ data });
  }

  async findAllTabelaPrecoCliente(tenantId: string, clienteId?: string, produtoId?: string) {
    const where: any = { tenantId };
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

  async updateTabelaPrecoCliente(id: string, data: any) {
    const atual = await this.prisma.tabelaPrecoProdutoCliente.findUnique({ where: { id } });
    const result = await this.prisma.tabelaPrecoProdutoCliente.update({ where: { id }, data });
    if (atual && data.valor !== undefined && Number(atual.valor) !== Number(data.valor)) {
      await this.prisma.historicoPreco.create({
        data: {
          tenantId: atual.tenantId,
          produtoId: atual.produtoId,
          clienteId: atual.clienteId,
          tipo: 'PRODUTO_CLIENTE',
          valorAntigo: atual.valor,
          valorNovo: data.valor,
          usuarioId: data.usuarioId || null,
        },
      });
    }
    return result;
  }

  async getSaldos(tenantId?: string, clienteId?: string) {
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
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
      const nome = (f as any).cliente?.razaoSocial || '';
      const totalPago = f.pagamentos.reduce((s, p) => s + Number(p.valor || 0), 0);
      const prev = mapa.get(cid) || {
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

  async getExtrato(clienteId: string, inicio?: string, fim?: string) {
    const where: any = { clienteId };
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

    const movimentos: any[] = [];
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
          descricao: `Pagamento - ${(p as any).formaPagamento?.descricao || ''}`,
          valor: -Number(p.valor || 0),
          documento: p.numeroDocumento,
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

  async getHistoricoPreco(produtoId?: string, clienteId?: string) {
    const where: any = {};
    if (produtoId) where.produtoId = produtoId;
    if (clienteId) where.clienteId = clienteId;

    return this.prisma.historicoPreco.findMany({
      where,
      orderBy: { ocorridoEm: 'desc' },
    });
  }

  // Tabelas de Frete
  async createTabelaFrete(data: any) {
    return this.prisma.tabelaFrete.create({ data });
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

  async updateTabelaFrete(id: string, data: any) {
    return this.prisma.tabelaFrete.update({ where: { id }, data });
  }

  // Tabelas de Umidade
  async createTabelaUmidade(data: any) {
    return this.prisma.tabelaUmidade.create({ data });
  }

  async findAllTabelaUmidade(tenantId: string, produtoId?: string) {
    const where: any = { tenantId };
    if (produtoId) where.produtoId = produtoId;
    return this.prisma.tabelaUmidade.findMany({
      where,
      include: { produto: { select: { descricao: true } } },
      orderBy: { faixaInicial: 'asc' },
    });
  }

  async updateTabelaUmidade(id: string, data: any) {
    return this.prisma.tabelaUmidade.update({ where: { id }, data });
  }

  // Snapshot comercial de ticket
  async getSnapshot(ticketId: string) {
    return this.prisma.snapshotComercialTicket.findMany({
      where: { ticketId },
      orderBy: { versaoSnapshot: 'desc' },
    });
  }
}
