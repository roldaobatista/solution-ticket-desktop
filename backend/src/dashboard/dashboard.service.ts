import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// Onda 4.2: importa enum centralizado em vez de redefinir local — antes
// havia drift garantido entre dashboard e o resto do app.
import { StatusOperacional } from '../constants/enums';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async kpis(unidadeId: string, tenantId: string) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const mesInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    const [
      pesagensHoje,
      pesagensMes,
      pesagensEmAndamento,
      totalPesoHoje,
      totalPesoMes,
      mediaPeso,
      ticketsFechadosHoje,
      ticketsCanceladosHoje,
    ] = await Promise.all([
      this.prisma.ticketPesagem.count({
        where: { unidadeId, tenantId, criadoEm: { gte: hoje } },
      }),
      this.prisma.ticketPesagem.count({
        where: { unidadeId, tenantId, criadoEm: { gte: mesInicio } },
      }),
      this.prisma.ticketPesagem.count({
        where: {
          unidadeId,
          tenantId,
          statusOperacional: {
            in: [StatusOperacional.EM_PESAGEM, StatusOperacional.AGUARDANDO_PASSAGEM],
          },
        },
      }),
      this.prisma.ticketPesagem.aggregate({
        where: {
          unidadeId,
          tenantId,
          statusOperacional: StatusOperacional.FECHADO,
          fechadoEm: { gte: hoje },
        },
        _sum: { pesoLiquidoFinal: true },
      }),
      this.prisma.ticketPesagem.aggregate({
        where: {
          unidadeId,
          tenantId,
          statusOperacional: StatusOperacional.FECHADO,
          fechadoEm: { gte: mesInicio },
        },
        _sum: { pesoLiquidoFinal: true },
      }),
      this.prisma.ticketPesagem.aggregate({
        where: { unidadeId, tenantId, statusOperacional: StatusOperacional.FECHADO },
        _avg: { pesoLiquidoFinal: true },
      }),
      this.prisma.ticketPesagem.count({
        where: {
          unidadeId,
          tenantId,
          statusOperacional: StatusOperacional.FECHADO,
          fechadoEm: { gte: hoje },
        },
      }),
      this.prisma.ticketPesagem.count({
        where: {
          unidadeId,
          tenantId,
          statusOperacional: StatusOperacional.CANCELADO,
          canceladoEm: { gte: hoje },
        },
      }),
    ]);

    return {
      pesagensHoje,
      pesagensMes,
      pesagensEmAndamento,
      totalPesoHoje: Number(totalPesoHoje._sum.pesoLiquidoFinal || 0),
      totalPesoMes: Number(totalPesoMes._sum.pesoLiquidoFinal || 0),
      mediaPeso: Number(mediaPeso._avg.pesoLiquidoFinal || 0),
      ticketsFechadosHoje,
      ticketsCanceladosHoje,
    };
  }

  async ticketsPorStatus(unidadeId: string, tenantId: string) {
    const statuses = Object.values(StatusOperacional);
    const counts = await Promise.all(
      statuses.map((status) =>
        this.prisma.ticketPesagem.count({
          where: { unidadeId, tenantId, statusOperacional: status },
        }),
      ),
    );

    return statuses.map((status, i) => ({
      status,
      quantidade: counts[i],
    }));
  }

  async pesagensPorProduto(unidadeId: string, tenantId: string, dias: number = 30) {
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - dias);

    const tickets = await this.prisma.ticketPesagem.groupBy({
      by: ['produtoId'],
      where: {
        unidadeId,
        tenantId,
        statusOperacional: StatusOperacional.FECHADO,
        fechadoEm: { gte: dataInicio },
      },
      _count: { id: true },
      _sum: { pesoLiquidoFinal: true },
    });

    const produtos = await this.prisma.produto.findMany({ where: { tenantId } });

    return tickets.map((t) => ({
      produtoId: t.produtoId,
      produtoNome: produtos.find((p) => p.id === t.produtoId)?.descricao || 'Desconhecido',
      totalPesagens: t._count.id,
      pesoTotal: Number(t._sum.pesoLiquidoFinal || 0),
    }));
  }

  async pesagensPorCliente(unidadeId: string, tenantId: string, dias: number = 30) {
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - dias);

    const tickets = await this.prisma.ticketPesagem.groupBy({
      by: ['clienteId'],
      where: {
        unidadeId,
        tenantId,
        statusOperacional: StatusOperacional.FECHADO,
        fechadoEm: { gte: dataInicio },
      },
      _count: { id: true },
      _sum: { pesoLiquidoFinal: true },
    });

    const clientes = await this.prisma.cliente.findMany({ where: { tenantId } });

    return tickets.map((t) => ({
      clienteId: t.clienteId,
      clienteNome: clientes.find((c) => c.id === t.clienteId)?.razaoSocial || 'Desconhecido',
      totalPesagens: t._count.id,
      pesoTotal: Number(t._sum.pesoLiquidoFinal || 0),
    }));
  }

  async statusBalancas(unidadeId: string, tenantId: string) {
    const balancas = await this.prisma.balanca.findMany({
      where: { unidadeId, tenantId },
      select: { id: true, nome: true, statusOnline: true, tipoEntradaSaida: true },
    });

    return balancas.map((b) => ({
      ...b,
      status: b.statusOnline ? 'ONLINE' : 'OFFLINE',
    }));
  }

  private mesRange(mes?: string): { inicio: Date; fim: Date } {
    const hoje = new Date();
    let ano = hoje.getFullYear();
    let m = hoje.getMonth();
    if (mes && /^\d{4}-\d{2}$/.test(mes)) {
      const [y, mm] = mes.split('-').map(Number);
      ano = y;
      m = mm - 1;
    }
    const inicio = new Date(ano, m, 1);
    const fim = new Date(ano, m + 1, 1);
    return { inicio, fim };
  }

  async topClientes(unidadeId: string, tenantId: string, mes?: string) {
    const { inicio, fim } = this.mesRange(mes);
    const tickets = await this.prisma.ticketPesagem.groupBy({
      by: ['clienteId'],
      where: {
        unidadeId,
        tenantId,
        statusOperacional: 'FECHADO',
        fechadoEm: { gte: inicio, lt: fim },
      },
      _count: { id: true },
      _sum: { pesoLiquidoFinal: true },
      orderBy: { _sum: { pesoLiquidoFinal: 'desc' } },
      take: 10,
    });

    const clientes = await this.prisma.cliente.findMany({
      where: { id: { in: tickets.map((t) => t.clienteId).filter(Boolean) as string[] }, tenantId },
    });

    return tickets.map((t) => ({
      clienteId: t.clienteId,
      clienteNome: clientes.find((c) => c.id === t.clienteId)?.razaoSocial || 'Desconhecido',
      totalPesagens: t._count.id,
      pesoTotal: Number(t._sum.pesoLiquidoFinal || 0),
    }));
  }

  async distribuicaoProduto(unidadeId: string, tenantId: string, mes?: string) {
    const { inicio, fim } = this.mesRange(mes);
    const tickets = await this.prisma.ticketPesagem.groupBy({
      by: ['produtoId'],
      where: {
        unidadeId,
        tenantId,
        statusOperacional: 'FECHADO',
        fechadoEm: { gte: inicio, lt: fim },
      },
      _count: { id: true },
      _sum: { pesoLiquidoFinal: true },
    });

    const produtos = await this.prisma.produto.findMany({
      where: { id: { in: tickets.map((t) => t.produtoId) }, tenantId },
    });

    const total = tickets.reduce((s, t) => s + Number(t._sum.pesoLiquidoFinal || 0), 0) || 1;

    return tickets.map((t) => ({
      produtoId: t.produtoId,
      produtoNome: produtos.find((p) => p.id === t.produtoId)?.descricao || 'Desconhecido',
      totalPesagens: t._count.id,
      pesoTotal: Number(t._sum.pesoLiquidoFinal || 0),
      percentual: Number(((Number(t._sum.pesoLiquidoFinal || 0) / total) * 100).toFixed(2)),
    }));
  }

  async evolucaoDiaria(unidadeId: string, tenantId: string, dias: number = 7) {
    const resultado = [];
    const hoje = new Date();

    for (let i = dias - 1; i >= 0; i--) {
      const data = new Date(hoje);
      data.setDate(data.getDate() - i);
      data.setHours(0, 0, 0, 0);

      const amanha = new Date(data);
      amanha.setDate(amanha.getDate() + 1);

      const [count, pesoTotal] = await Promise.all([
        this.prisma.ticketPesagem.count({
          where: { unidadeId, tenantId, criadoEm: { gte: data, lt: amanha } },
        }),
        this.prisma.ticketPesagem.aggregate({
          where: {
            unidadeId,
            tenantId,
            statusOperacional: StatusOperacional.FECHADO,
            fechadoEm: { gte: data, lt: amanha },
          },
          _sum: { pesoLiquidoFinal: true },
        }),
      ]);

      resultado.push({
        data: data.toISOString().split('T')[0],
        tickets: count,
        peso: Number(pesoTotal._sum.pesoLiquidoFinal || 0),
      });
    }

    return resultado;
  }
}
