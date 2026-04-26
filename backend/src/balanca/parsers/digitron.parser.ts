import { IBalancaParser, LeituraPeso, ParserConfig } from './parser.interface';

/**
 * Digitron — protocolo padrão observado em BalLog.txt.
 * Trama: 'D' + peso decimal (3 inteiros + '.' + 3 decimais) + CR
 *   Ex.: D000.318[CR]
 * Em modo 7-bit ASCII vem como [20][STX][STX].318[CR] — coberto pelo GenericParser.
 *
 * Compatível com ACBrBALDigitron.
 */
export class DigitronParser implements IBalancaParser {
  constructor(private config: ParserConfig) {}

  parse(buffer: Buffer): { leitura: LeituraPeso | null; restante: Buffer } {
    const cr = buffer.indexOf(0x0d);
    if (cr < 0) return { leitura: null, restante: buffer };
    const slice = buffer.subarray(0, cr).toString('latin1');
    const restante = buffer.subarray(cr + 1);

    const idx = slice.indexOf('D');
    if (idx < 0) return { leitura: null, restante };
    const body = slice.slice(idx + 1).trim();
    const limpo = body.replace(/[^0-9\-+.]/g, '');
    if (!limpo) return { leitura: null, restante };

    let peso = parseFloat(limpo);
    if (isNaN(peso)) return { leitura: null, restante };
    const fator = this.config.fator ?? 1;
    if (fator > 1) peso = peso / fator;
    if (this.config.invertePeso) peso = -peso;

    // Onda 1.7 (C9): Digitron padrao nao expoe byte de status — service
    // decide via janela movel (estavel:true hardcoded permitia travar
    // peso de caminhao em movimento).
    return { leitura: { peso, estavel: false, bruto: slice }, restante };
  }
}
