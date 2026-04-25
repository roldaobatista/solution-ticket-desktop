import { IBalancaParser, LeituraPeso, ParserConfig } from './parser.interface';

/**
 * Saturno (ACBrBALSaturno).
 * Trama típica: `\x02NNNNNN\x03` (STX + 6 dígitos + ETX) ou `+/-NNNNNN[CR][LF]`.
 * Saturno costuma usar 9600,8,N,1 e enviar peso bruto sem decimais (kg inteiros).
 */
export class SaturnoParser implements IBalancaParser {
  constructor(private config: ParserConfig) {}

  parse(buffer: Buffer): { leitura: LeituraPeso | null; restante: Buffer } {
    // Tenta primeiro STX...ETX
    const stx = buffer.indexOf(0x02);
    const etx = buffer.indexOf(0x03);
    if (stx >= 0 && etx > stx) {
      const body = buffer
        .subarray(stx + 1, etx)
        .toString('ascii')
        .trim();
      const restante = buffer.subarray(etx + 1);
      return this.extrair(body, restante, true);
    }
    // Fallback: linha terminada em LF
    const lf = buffer.indexOf(0x0a);
    if (lf < 0) return { leitura: null, restante: buffer };
    const slice = buffer.subarray(0, lf).toString('ascii').replace(/\r$/, '').trim();
    const restante = buffer.subarray(lf + 1);
    return this.extrair(slice, restante, false);
  }

  private extrair(
    body: string,
    restante: Buffer,
    estavel: boolean,
  ): { leitura: LeituraPeso | null; restante: Buffer } {
    const limpo = body.replace(/[^0-9\-+.]/g, '');
    if (!limpo) return { leitura: null, restante };
    let peso = parseFloat(limpo);
    if (isNaN(peso)) return { leitura: null, restante };
    const fator = this.config.fator ?? 1;
    if (fator > 1) peso = peso / fator;
    if (this.config.invertePeso) peso = -peso;
    return { leitura: { peso, estavel, bruto: body }, restante };
  }
}
