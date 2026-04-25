import { BadRequestException } from '@nestjs/common';

export interface FechamentoInput {
  passagensValidas: Array<{ papelCalculo: string; pesoCapturado: number | string | unknown }>;
  taraCadastradaSnapshot: number | string | null | unknown;
  descontos: Array<{ valor: number | string | unknown }>;
}

export interface FechamentoResult {
  pesoBrutoApurado: number;
  pesoTaraApurada: number;
  pesoLiquidoSemDesconto: number;
  totalDescontos: number;
  pesoLiquidoFinal: number;
}

/**
 * D9: Cálculo oficial de fechamento de ticket de pesagem.
 * Responsabilidade única: receber dados brutos e retornar valores calculados.
 */
export class TicketCalculator {
  static calcularFechamento(input: FechamentoInput): FechamentoResult {
    const bruto = input.passagensValidas.find((p) => p.papelCalculo === 'BRUTO_OFICIAL');
    if (!bruto) {
      throw new BadRequestException('Nao existe passagem BRUTO_OFICIAL valida');
    }

    const taraPassagem = input.passagensValidas.find((p) => p.papelCalculo === 'TARA_OFICIAL');

    let pesoTaraApurada: number;
    if (!taraPassagem) {
      if (!input.taraCadastradaSnapshot) {
        throw new BadRequestException(
          'Nao existe passagem TARA_OFICIAL nem tara cadastrada de referencia',
        );
      }
      pesoTaraApurada = Number(input.taraCadastradaSnapshot);
    } else {
      pesoTaraApurada = Number(taraPassagem.pesoCapturado);
    }

    const pesoBrutoApurado = Number(bruto.pesoCapturado);

    if (pesoBrutoApurado < pesoTaraApurada) {
      throw new BadRequestException(
        `Peso bruto (${pesoBrutoApurado}) nao pode ser menor que a tara (${pesoTaraApurada})`,
      );
    }

    const pesoLiquidoSemDesconto = pesoBrutoApurado - pesoTaraApurada;
    const totalDescontos = input.descontos.reduce((sum, d) => sum + Number(d.valor), 0);
    const pesoLiquidoFinal = pesoLiquidoSemDesconto - totalDescontos;

    if (pesoLiquidoFinal < 0) {
      throw new BadRequestException('Peso liquido final nao pode ser negativo');
    }

    return {
      pesoBrutoApurado,
      pesoTaraApurada,
      pesoLiquidoSemDesconto,
      totalDescontos,
      pesoLiquidoFinal,
    };
  }
}
