import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TabelaUmidadeService {
  constructor(private readonly prisma: PrismaService) {}

  async findByProduto(produtoId: string) {
    return this.prisma.tabelaUmidade.findMany({
      where: { produtoId },
      orderBy: { faixaInicial: 'asc' },
    });
  }

  async create(dto: Prisma.TabelaUmidadeUncheckedCreateInput) {
    return this.prisma.tabelaUmidade.create({ data: dto });
  }

  async update(id: string, dto: Prisma.TabelaUmidadeUncheckedUpdateInput) {
    return this.prisma.tabelaUmidade.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    return this.prisma.tabelaUmidade.delete({ where: { id } });
  }

  /**
   * Calcula desconto por umidade baseado na tabela do produto.
   * Regra: para cada 0.5% acima do padrão, aplica o percentual de desconto da faixa.
   */
  async calcularDesconto(produtoId: string, umidadeMedida: number, pesoLiquido: number) {
    const tabela = await this.findByProduto(produtoId);
    if (!tabela || tabela.length === 0) {
      return {
        descontoKg: 0,
        descontoPercentual: 0,
        umidadePadrao: 14,
        observacao: 'Tabela de umidade não configurada para este produto',
      };
    }

    // Buscar umidade padrão (primeira faixa ou campo do produto)
    const umidadePadrao = Number(tabela[0]?.faixaInicial ?? 14);

    if (umidadeMedida <= umidadePadrao) {
      return {
        descontoKg: 0,
        descontoPercentual: 0,
        umidadePadrao,
        umidadeMedida,
        observacao: 'Umidade dentro do padrão',
      };
    }

    // Encontrar faixa correspondente
    const faixa = tabela.find(
      (f) => umidadeMedida >= Number(f.faixaInicial) && umidadeMedida <= Number(f.faixaFinal),
    );
    if (!faixa) {
      // Usar última faixa se exceder
      const ultima = tabela[tabela.length - 1];
      const descontoPercentual = Number(ultima.descontoPercentual);
      const descontoKg = Math.round((pesoLiquido * descontoPercentual) / 100);
      return {
        descontoKg,
        descontoPercentual,
        umidadePadrao,
        umidadeMedida,
        faixa: ultima,
        observacao: 'Umidade acima da última faixa configurada',
      };
    }

    const descontoPercentual = Number(faixa.descontoPercentual);
    const descontoKg = Math.round((pesoLiquido * descontoPercentual) / 100);

    return {
      descontoKg,
      descontoPercentual,
      umidadePadrao,
      umidadeMedida,
      faixa,
      pesoLiquidoAposDesconto: pesoLiquido - descontoKg,
      observacao: `Desconto aplicado: ${descontoPercentual}% (faixa ${Number(faixa.faixaInicial)}% - ${Number(faixa.faixaFinal)}%)`,
    };
  }
}
