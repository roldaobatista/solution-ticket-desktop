export interface LeituraPeso {
  peso: number;
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
