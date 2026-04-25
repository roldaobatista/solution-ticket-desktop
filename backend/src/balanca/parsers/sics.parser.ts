import { IBalancaParser, LeituraPeso, ParserConfig } from './parser.interface';

/**
 * MT-SICS (Mettler Toledo).
 * Resposta típica de comando S ou SI:
 *   "S S     12.345 kg\r\n"  -> S = estavel
 *   "S D     12.345 kg\r\n"  -> D = dinamico (instavel)
 *   "S +     12.345 kg\r\n"  -> I / range
 * Campos separados por espaços.
 */
export class SicsParser implements IBalancaParser {
  constructor(private config: ParserConfig) {}

  parse(buffer: Buffer): { leitura: LeituraPeso | null; restante: Buffer } {
    const idx = buffer.indexOf(0x0a); // LF terminador CRLF
    if (idx < 0) return { leitura: null, restante: buffer };
    const linhaBytes = buffer.subarray(0, idx);
    const restante = buffer.subarray(idx + 1);
    const linha = linhaBytes.toString('latin1').replace(/\r$/, '').trim();
    const tokens = linha.split(/\s+/);
    if (tokens.length < 3 || tokens[0] !== 'S') {
      return { leitura: null, restante };
    }
    const statusTok = tokens[1];
    const estavel = statusTok === 'S';
    const pesoNum = parseFloat(tokens[2]);
    if (isNaN(pesoNum)) return { leitura: null, restante };
    let peso = pesoNum;
    if (this.config.invertePeso) peso = -peso;
    return { leitura: { peso, estavel, bruto: linha }, restante };
  }
}
