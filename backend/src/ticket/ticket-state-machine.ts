import { BadRequestException } from '@nestjs/common';
import { StatusOperacional } from '../constants/enums';

/**
 * D8: State machine de ticket de pesagem.
 * Transições guardadas por whitelist — nenhuma transição inválida é permitida.
 */
export const TRANSICOES_PERMITIDAS: Record<string, string[]> = {
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

export class TicketStateMachine {
  static validarTransicao(estadoAtual: string, novoEstado: string): void {
    const permitidas = TRANSICOES_PERMITIDAS[estadoAtual] || [];
    if (!permitidas.includes(novoEstado)) {
      throw new BadRequestException(`Transicao de ${estadoAtual} para ${novoEstado} nao permitida`);
    }
  }

  static getSideEffects(novoEstado: string): {
    fechadoEm?: Date;
    canceladoEm?: Date;
    motivoCancelamento?: string;
  } {
    const sideEffects: ReturnType<typeof TicketStateMachine.getSideEffects> = {};
    if (novoEstado === StatusOperacional.FECHADO) {
      sideEffects.fechadoEm = new Date();
    }
    if (novoEstado === StatusOperacional.CANCELADO) {
      sideEffects.canceladoEm = new Date();
      sideEffects.motivoCancelamento = 'Cancelado pelo operador';
    }
    return sideEffects;
  }

  static podeRegistrarPassagem(estado: string): boolean {
    const permitidos: string[] = [
      StatusOperacional.ABERTO,
      StatusOperacional.EM_PESAGEM,
      StatusOperacional.AGUARDANDO_PASSAGEM,
    ];
    return permitidos.includes(estado);
  }

  static podeFechar(estado: string): boolean {
    const permitidos: string[] = [
      StatusOperacional.EM_PESAGEM,
      StatusOperacional.AGUARDANDO_PASSAGEM,
    ];
    return permitidos.includes(estado);
  }
}
