import { IBalancaParser, LeituraPeso, ParserConfig } from './parser.interface';

/**
 * Parser configurável baseado no algoritmo do PesoLog.
 * Lê bytes até encontrar o "marcador" (ex: CR=13, LF=10, ":"=58),
 * extrai substring(inicioPeso-1, +tamanhoPeso), aplica fator e inversão.
 */
export class GenericParser implements IBalancaParser {
  constructor(protected config: ParserConfig) {}

  parse(buffer: Buffer): { leitura: LeituraPeso | null; restante: Buffer } {
    const marcador = this.config.marcador ?? 13;
    const idx = buffer.indexOf(marcador);
    if (idx < 0) {
      return { leitura: null, restante: buffer };
    }
    const tramaBytes = buffer.subarray(0, idx);
    const restante = buffer.subarray(idx + 1);
    const trama = tramaBytes.toString('latin1');
    const tamanhoEsperado = this.config.tamanhoString ?? 0;
    if (tamanhoEsperado > 0 && trama.length < tamanhoEsperado - 1) {
      // trama curta demais, descartar
      return { leitura: null, restante };
    }
    const leitura = this.extrairPeso(trama);
    return { leitura, restante };
  }

  protected extrairPeso(trama: string): LeituraPeso | null {
    const inicio = (this.config.inicioPeso ?? 1) - 1;
    const tamanho = this.config.tamanhoPeso ?? 6;
    const fator = this.config.fator ?? 1;
    const invertePeso = this.config.invertePeso ?? false;

    if (trama.length < inicio + tamanho) {
      return null;
    }
    const raw = trama.substring(inicio, inicio + tamanho).trim();
    const limpo = raw.replace(/[^0-9\-+.]/g, '');
    if (!limpo) return null;
    let peso = parseFloat(limpo);
    if (isNaN(peso)) return null;
    if (fator > 1) peso = peso / fator;
    if (invertePeso) peso = -peso;

    // Estabilidade: marcada externamente (5 leituras <2kg). Aqui retorna false.
    return { peso, estavel: false, bruto: trama };
  }
}
