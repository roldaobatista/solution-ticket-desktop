import { IBalancaParser, LeituraPeso, ParserConfig } from './parser.interface';

/**
 * Toledo 2180/8530 (streaming).
 * Trama típica: STX + status(1) + peso(6) + CR + LF
 * Status: bit0 = movimento (0=estavel, 1=movimento).
 *
 * Compatível com ACBrBALToledo2180.
 */
export class Toledo2180Parser implements IBalancaParser {
  constructor(private config: ParserConfig) {}

  parse(buffer: Buffer): { leitura: LeituraPeso | null; restante: Buffer } {
    const lf = buffer.indexOf(0x0a);
    if (lf < 0) return { leitura: null, restante: buffer };
    const slice = buffer.subarray(0, lf).toString('latin1').replace(/\r$/, '');
    const restante = buffer.subarray(lf + 1);

    const start = slice.indexOf('\x02');
    if (start < 0) return { leitura: null, restante };
    const body = slice.slice(start + 1);
    if (body.length < 7) return { leitura: null, restante };

    const status = body.charCodeAt(0);
    const estavel = (status & 0x01) === 0;
    const limpo = body
      .slice(1, 7)
      .trim()
      .replace(/[^0-9\-]/g, '');
    if (!limpo) return { leitura: null, restante };
    let peso = parseInt(limpo, 10);
    if (isNaN(peso)) return { leitura: null, restante };
    const fator = this.config.fator ?? 1;
    if (fator > 1) peso = peso / fator;
    if (this.config.invertePeso) peso = -peso;

    return { leitura: { peso, estavel, bruto: slice }, restante };
  }
}
