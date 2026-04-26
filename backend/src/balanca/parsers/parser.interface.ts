export interface LeituraPeso {
  peso: number;
  // Onda 1.7 (C9): protocolos sem byte de status devem retornar false aqui —
  // o BalancaConnectionService entao avalia via janela movel
  // (toleranciaEstabilidade, janelaEstabilidade) antes de travar peso para ticket.
  // Antes alguns parsers retornavam true hardcoded, permitindo travar peso
  // de caminhao em movimento.
  estavel: boolean;
  bruto: string;
}

export interface ParserConfig {
  parserTipo?: string | null;
  inicioPeso?: number | null;
  tamanhoPeso?: number | null;
  tamanhoString?: number | null;
  marcador?: number | null;
  fator?: number | null;
  invertePeso?: boolean | null;
}

export interface IBalancaParser {
  /**
   * Recebe um buffer de bytes acumulado. Retorna uma leitura se encontrar
   * uma trama completa, ou null se ainda precisa mais bytes.
   * Deve consumir os bytes processados (retornar o buffer restante via ref).
   */
  parse(buffer: Buffer): { leitura: LeituraPeso | null; restante: Buffer };
}
